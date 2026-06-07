import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import BrainPanel from '@/components/troubleshoot/BrainPanel';
import { getSession, setSession, getSettings } from '@/lib/sessionStore';
import { generateNextDynamicStep, runDecisionEngine } from '@/lib/decisionEngine';
import { playAction, playSuccess } from '@/lib/sounds';
import { base44 } from '@/api/base44Client';
import { ArrowLeft, History, SlidersHorizontal, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getUI } from '@/lib/uiTranslations';
import { recordSuccessfulStep } from '@/lib/experienceEngine';
import brainNeon from '@/assets/brain-neon.png';

const pageStyle = {
  background: `
    radial-gradient(circle at 10% 62%, rgba(0,245,230,0.22) 0%, transparent 28%),
    radial-gradient(circle at 92% 55%, rgba(255,20,150,0.28) 0%, transparent 34%),
    linear-gradient(135deg, #02040a 0%, #070615 42%, #0c102e 65%, #09020d 100%)
  `,
  minHeight: '100vh',
};

function cleanTitle(step) {
  const raw = String(step?.title || step?.instruction || step?.body || step?.stepId || 'Schritt').trim();
  return raw
    .replace(/^Ich prüfe gerade\s*[„"']?/i, '')
    .replace(/[„"']$/g, '')
    .replace(/[.]+$/g, '')
    .trim();
}


function topicLabel(topic, lang = 'de') {
  const labels = {
    de: {
      usb: 'USB',
      wifi: 'Wi-Fi',
      firmware: 'Firmware',
      software: 'ScanSnap Home',
      ocr: 'OCR',
      windows: 'Windows',
      device_manager: 'Geräte-Manager',
      unknown: 'diese Spur',
    },
    en: {
      usb: 'USB',
      wifi: 'Wi-Fi',
      firmware: 'firmware',
      software: 'ScanSnap Home',
      ocr: 'OCR',
      windows: 'Windows',
      device_manager: 'Device Manager',
      unknown: 'this path',
    }
  };
  return labels[lang]?.[topic] || labels.de[topic] || topic;
}

function topicOfStep(step) {
  const text = `${step?.route || ''} ${step?.stepId || ''} ${step?.title || ''} ${step?.instruction || ''} ${step?.body || ''}`.toLowerCase();

  if (/wlan|wi-fi|wifi|router|network|netzwerk|ip|dhcp|cloud/.test(text)) return 'wifi';
  if (/geräte-manager|device manager|usb-stack|usb stack/.test(text)) return 'device_manager';
  if (/firmware|recovery|top sensor|empty arm|update/.test(text)) return 'firmware';
  if (/ocr|texterkennung|image processing/.test(text)) return 'ocr';
  if (/sfc|dism|windows-system|systemintegrität|integrity/.test(text)) return 'windows';
  if (/sshome|cleanup|bereinigung|neu installieren|reinstall|scansnap home/.test(text)) return 'software';
  if (/usb|direkt|direct|anschluss|kabel|cable/.test(text)) return 'usb';
  return 'unknown';
}

function detectTopicShift(steps, index) {
  if (!Array.isArray(steps) || index <= 0 || !steps[index] || !steps[index - 1]) return null;
  const from = topicOfStep(steps[index - 1]);
  const to = topicOfStep(steps[index]);
  if (!from || !to || from === 'unknown' || to === 'unknown' || from === to) return null;
  return { from, to };
}

function detectiveQuestion(name, shift, lang = 'de') {
  const n = (name || '').trim();
  const to = topicLabel(shift?.to || 'unknown', lang);
  const from = topicLabel(shift?.from || 'unknown', lang);

  if (lang !== 'de') {
    const prefix = n ? `${n}, ` : '';
    if (shift?.to === 'wifi') return `${prefix}this looks like a possible Wi-Fi path. Shall we check that lead for a moment?`;
    if (shift?.to === 'firmware') return `${prefix}there may be a firmware lead here. Shall we follow it?`;
    if (shift?.to === 'device_manager') return `${prefix}before we guess, shall we check what Windows actually sees?`;
    return `${prefix}we may have a new lead: ${to}. Shall we check it?`;
  }

  const prefix = n ? `${n}, ` : '';
  if (shift?.to === 'wifi') return `${prefix}lass uns kurz die Wi-Fi-Spur prüfen. Vielleicht liegt der Fehler eher in der Verbindung.`;
  if (shift?.to === 'firmware') return `${prefix}hier taucht eine Firmware-Spur auf. Sollen wir dieser Richtung nachgehen?`;
  if (shift?.to === 'device_manager') return `${prefix}bevor wir raten, schauen wir kurz, was Windows wirklich sieht.`;
  if (shift?.to === 'windows') return `${prefix}das könnte in Richtung Windows-System gehen. Sollen wir diese Spur prüfen?`;
  if (shift?.to === 'software') return `${prefix}vielleicht sitzt der Fehler eher in ScanSnap Home. Wollen wir dort nachsehen?`;
  if (shift?.to === 'ocr') return `${prefix}das sieht nach einer OCR-Spur aus. Sollen wir dort weitermachen?`;
  return `${prefix}wir wechseln gerade von ${from} zu ${to}. Sollen wir diese Spur prüfen?`;
}

function quietStepHint(step, index, lang = 'de') {
  const topic = topicOfStep(step);
  const text = `${step?.title || ''} ${step?.instruction || ''}`.toLowerCase();

  // Most steps deliberately stay quiet. Only speak when it adds value.
  if (lang !== 'de') {
    if (index === 0 && topic === 'usb') return 'This is the cleanest first check.';
    if (topic === 'device_manager') return 'This tells us what Windows can actually see.';
    if (topic === 'firmware') return 'This step should be done carefully and only via direct USB.';
    return '';
  }

  if (index === 0 && topic === 'usb') return 'Wir starten mit dem einfachsten Check.';
  if (topic === 'device_manager') return 'Hier reicht ein kurzer Blick – dann wissen wir deutlich mehr.';
  if (topic === 'firmware') return 'Diesen Schritt bitte ruhig und sauber durchführen.';
  if (/recovery|top sensor|empty arm/.test(text)) return 'Das ist ein sensibler Schritt. Nimm dir dafür ruhig einen Moment.';
  return '';
}


export default function Troubleshoot() {
  const navigate = useNavigate();
  const [session, setLocalSession] = useState(getSession());
  const [showBrain, setShowBrain] = useState(false);
  const [acceptedTopicShifts, setAcceptedTopicShifts] = useState({});

  const { steps, currentStepIndex, problem, rootCause, issueType, status, kbEntry } = session;

  const settings = getSettings();
  const language = (settings.emailLanguage || 'de').toLowerCase();
  const ui = getUI(language);

  const brain = useMemo(
    () => runDecisionEngine(session, kbEntry || null, language),
    [session, kbEntry, language]
  );

  useEffect(() => {
    if (!steps || steps.length === 0) navigate('/');
  }, [steps, navigate]);

  const updateSession = (data) => {
    const updated = setSession(data);
    setLocalSession(updated);
  };

  const goPreviousStep = () => {
    if (currentStepIndex <= 0) return;
    const newIndex = currentStepIndex - 1;
    const updatedSteps = steps.map((step, index) => {
      if (index >= newIndex) {
        return {
          ...step,
          status: 'pending',
          result: '',
          note: '',
          timestamp: null,
        };
      }
      return step;
    });
    updateSession({
      steps: updatedSteps,
      currentStepIndex: newIndex,
      status: 'troubleshooting',
    });
  };

  const handleStepResult = async (result, note = '') => {
    const updatedSteps = [...steps];
    updatedSteps[currentStepIndex] = {
      ...updatedSteps[currentStepIndex],
      status: result,
      note,
      timestamp: new Date().toISOString(),
    };

    const performedSteps = [
      ...(session.performedSteps || []),
      {
        title: (updatedSteps[currentStepIndex].title && updatedSteps[currentStepIndex].title !== 'Step')
          ? updatedSteps[currentStepIndex].title
          : (updatedSteps[currentStepIndex].instruction || updatedSteps[currentStepIndex].body || updatedSteps[currentStepIndex].stepId || 'Nicht benannter Schritt'),
        status: result,
        note: note || '',
        timestamp: new Date().toISOString(),
      }
    ];

    if (result === 'solved') {
      playSuccess();
      recordSuccessfulStep({ ...session, steps: updatedSteps }, updatedSteps[currentStepIndex]);
      updateSession({ steps: updatedSteps, performedSteps, status: 'solved' });
      try {
        await base44.entities.SolvedCase.create({
          problem,
          device: session.device || 'Unknown',
          os: session.os || 'Unknown',
          connection_type: session.connectionType || 'Unknown',
          issue_type: issueType,
          root_cause: rootCause,
          steps: updatedSteps,
          solution_step_index: currentStepIndex,
          solved: true,
        });
      } catch {}
      setTimeout(() => navigate('/final'), 500);
      return;
    }

    if (result === 'waiting_customer') {
      playAction();
      updateSession({ steps: updatedSteps, performedSteps, status: 'waiting_customer' });
      setTimeout(() => navigate('/final'), 300);
      return;
    }

    playAction();
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < updatedSteps.length) {
      updateSession({ steps: updatedSteps, performedSteps, currentStepIndex: nextIndex, status: 'troubleshooting' });
    } else {
      const currentSession = { ...getSession(), steps: updatedSteps };
      const dynamicStep = generateNextDynamicStep(currentSession, kbEntry);
      if (dynamicStep) {
        const withDynamic = [...updatedSteps, dynamicStep];
        updateSession({ steps: withDynamic, performedSteps, currentStepIndex: withDynamic.length - 1, status: 'troubleshooting' });
      } else {
        updateSession({ steps: updatedSteps, performedSteps, status: 'exhausted' });
        setTimeout(() => navigate('/final'), 300);
      }
    }
  };

  if (!steps || steps.length === 0) return null;

  const currentStep = steps[currentStepIndex];
  const isWaiting = status === 'waiting_customer';
  const isActive = status === 'troubleshooting' || isWaiting;
  const stepTitle = cleanTitle(currentStep);
  const stepInstruction = String(currentStep?.instruction || currentStep?.body || '').trim();
  const personName = session?.supporterName || '';
  const topicShift = detectTopicShift(steps, currentStepIndex);
  const showTopicShiftPrompt = !!topicShift && !acceptedTopicShifts[currentStepIndex];
  const stepHint = quietStepHint(currentStep, currentStepIndex, language);
  const stepDots = steps.length > 1 ? steps.map((s, i) => ({
    isDone: ['solved', 'not_solved', 'not_possible', 'skipped', 'waiting_customer', 'blocked'].includes(s.status),
    isCurrent: i === currentStepIndex,
    isFailed: ['not_solved', 'not_possible'].includes(s.status),
  })) : [];

  return (
    <div style={pageStyle} className="pt-8 pb-8 px-5">
      <div className="max-w-3xl mx-auto space-y-5 pt-4">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-1.5 text-sm text-white/30 hover:text-white/60 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {ui.back || 'Zurück'}
          </button>
          <div className="flex items-center gap-2">
            {(session.model || session.device) && (
              <span className="text-[10px] font-bold text-primary/60 tracking-wider uppercase">
                {(session.model || session.device).toUpperCase()}
              </span>
            )}
            <Link to="/history">
              <button className="p-1.5 rounded-lg text-white/20 hover:text-white/50 transition-colors">
                <History className="w-4 h-4" />
              </button>
            </Link>
            <button
              onClick={() => setShowBrain((b) => !b)}
              className={`p-1.5 rounded-lg transition-colors ${showBrain ? 'text-primary/60' : 'text-white/20 hover:text-white/40'}`}
              title="Technical Analysis"
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>
          </div>
        </div>

        {stepDots.length > 1 && (
          <div className="flex items-center gap-1.5 px-1">
            {stepDots.map((dot, i) => (
              <div
                key={i}
                className={`rounded-full transition-all duration-300 ${
                  dot.isCurrent  ? 'w-5 h-1.5 bg-primary' :
                  dot.isFailed   ? 'w-1.5 h-1.5 bg-secondary/50' :
                  dot.isDone     ? 'w-1.5 h-1.5 bg-primary/40' :
                  'w-1.5 h-1.5 bg-white/10'
                }`}
              />
            ))}
          </div>
        )}

        {isActive && currentStepIndex > 0 && (
          <button
            onClick={goPreviousStep}
            className="flex items-center gap-1.5 text-xs text-white/35 hover:text-white/65 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            {language === 'de' ? 'Vorheriger Schritt' : 'Previous step'}
          </button>
        )}

        {isActive && currentStep && (
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStepIndex}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -18 }}
              transition={{ duration: 0.25 }}
              className="px-3 py-8 md:px-8 md:py-10"
            >
              <div className="text-center max-w-3xl mx-auto">
                {showTopicShiftPrompt ? (
                  <div className="min-h-[560px] flex flex-col items-center justify-center">
                    <p className="text-[11px] uppercase tracking-[0.28em] text-primary/70 mb-5">
                      {language === 'de' ? 'Neue Spur erkannt' : 'New lead detected'}
                    </p>
                    <h1 className="text-3xl md:text-5xl font-semibold text-white leading-tight">
                      {topicLabel(topicShift.to, language)}
                    </h1>
                    <p className="mt-7 text-xl md:text-2xl text-white/88 leading-relaxed max-w-2xl">
                      {detectiveQuestion(personName, topicShift, language)}
                    </p>

                    <motion.img
                      src={brainNeon}
                      alt="Support Brain"
                      className="mt-14 w-72 md:w-96 object-contain"
                      animate={{ y: [0, -26, 8, -18, 0], x: [0, 6, -5, 4, 0], rotate: [0, -1.5, 1.2, -0.8, 0], scale: [1, 1.055, 1.015, 1.04, 1] }}
                      transition={{ duration: 4.8, repeat: Infinity, ease: 'easeInOut' }}
                      style={{
                        mixBlendMode: 'screen',
                        opacity: 0.92,
                        WebkitMaskImage: 'radial-gradient(ellipse at center, black 0%, black 42%, rgba(0,0,0,0.82) 55%, rgba(0,0,0,0.35) 72%, transparent 94%)',
                        maskImage: 'radial-gradient(ellipse at center, black 0%, black 42%, rgba(0,0,0,0.82) 55%, rgba(0,0,0,0.35) 72%, transparent 94%)',
                        filter: 'brightness(1.04) contrast(1.08) drop-shadow(0 0 54px rgba(45,212,191,0.82)) drop-shadow(0 0 120px rgba(236,72,153,0.62)) drop-shadow(0 0 175px rgba(80,110,255,0.44))'
                      }}
                    />

                    <div className="mt-12 flex flex-wrap items-center justify-center gap-x-10 gap-y-4 text-lg">
                      <button
                        onClick={() => setAcceptedTopicShifts(prev => ({ ...prev, [currentStepIndex]: true }))}
                        className="text-primary hover:text-primary/80 transition-colors"
                      >
                        {language === 'de' ? 'Ja, Spur prüfen' : 'Yes, check this lead'}
                      </button>
                      <button
                        onClick={goPreviousStep}
                        className="text-white/70 hover:text-white transition-colors"
                      >
                        {language === 'de' ? 'Nein, zurück' : 'No, go back'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <h1 className="text-3xl md:text-5xl font-semibold text-white leading-tight">
                      {stepTitle}
                    </h1>

                    {stepHint && (
                      <p className="mt-6 text-lg md:text-xl text-white/82 leading-relaxed">
                        {stepHint}
                      </p>
                    )}

                    {stepInstruction && (
                      <div className="mt-8 px-2 py-2 text-white/92 text-lg md:text-xl leading-relaxed">
                        {stepInstruction}
                      </div>
                    )}

                    <motion.button
                      onClick={() => handleStepResult('not_solved')}
                      className="group mt-16 relative inline-flex items-center justify-center bg-transparent border-0 p-0 rounded-full focus:outline-none"
                      title={language === 'de' ? 'Nächsten Schritt öffnen' : 'Open next step'}
                      animate={{ y: [0, -30, 10, -20, 0], x: [0, 7, -6, 4, 0], rotate: [0, -1.8, 1.4, -1, 0], scale: [1, 1.065, 1.015, 1.045, 1] }}
                      transition={{ duration: 4.6, repeat: Infinity, ease: 'easeInOut' }}
                    >
                      <span
                        aria-hidden="true"
                        className="absolute inset-[-18%] rounded-full blur-3xl opacity-70"
                        style={{
                          background: 'radial-gradient(ellipse at center, rgba(45,212,191,0.30) 0%, rgba(236,72,153,0.22) 42%, transparent 72%)'
                        }}
                      />
                      <img
                        src={brainNeon}
                        alt="Continue"
                        className="w-72 md:w-96 object-contain opacity-95 transition-transform duration-300 group-hover:scale-110"
                        style={{
                          mixBlendMode: 'screen',
                          opacity: 0.92,
                          WebkitMaskImage: 'radial-gradient(ellipse at center, black 0%, black 42%, rgba(0,0,0,0.82) 55%, rgba(0,0,0,0.35) 72%, transparent 94%)',
                          maskImage: 'radial-gradient(ellipse at center, black 0%, black 42%, rgba(0,0,0,0.82) 55%, rgba(0,0,0,0.35) 72%, transparent 94%)',
                          filter: 'brightness(1.04) contrast(1.08) drop-shadow(0 0 58px rgba(45,212,191,0.86)) drop-shadow(0 0 130px rgba(236,72,153,0.62)) drop-shadow(0 0 185px rgba(85,105,255,0.45))'
                        }}
                      />
                    </motion.button>

                    <div className="mt-12 flex flex-wrap items-center justify-center gap-x-9 gap-y-3 text-lg">
                      <button
                        onClick={() => handleStepResult('solved')}
                        className="text-primary hover:text-primary/80 transition-colors"
                      >
                        {language === 'de' ? 'Hat geholfen' : 'Solved'}
                      </button>
                      <button
                        onClick={() => handleStepResult('not_possible')}
                        className="text-white/70 hover:text-white transition-colors"
                      >
                        {language === 'de' ? 'Nicht möglich' : 'Not possible'}
                      </button>
                      <button
                        onClick={() => handleStepResult('waiting_customer')}
                        className="text-amber-400 hover:text-amber-300 transition-colors"
                      >
                        {language === 'de' ? 'Warte auf Rückmeldung' : 'Waiting for reply'}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        )}

        {isWaiting && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <Button
              onClick={() => navigate('/final')}
              className="w-full bg-white/5 hover:bg-white/10 text-white/60 border border-white/10 h-11"
              variant="outline"
            >
              <ArrowRight className="w-4 h-4 mr-2" />
              {ui.generate_email || 'Build Customer Email & Summary'}
            </Button>
          </motion.div>
        )}

        <AnimatePresence>
          {showBrain && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <BrainPanel brain={brain} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
