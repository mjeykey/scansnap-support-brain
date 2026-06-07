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

function stepIntro(name, lang) {
  const n = (name || '').trim();
  const copy = {
    de: n ? `${n}, wie wäre es, wenn wir jetzt diesen Schritt zuerst sauber durchführen?` : 'Wie wäre es, wenn wir jetzt diesen Schritt zuerst sauber durchführen?',
    en: n ? `${n}, how about we go through this step carefully first?` : 'How about we go through this step carefully first?',
  };
  return copy[lang] || copy.de;
}

function stepEncouragement(step, lang) {
  const text = `${step?.title || ''} ${step?.instruction || ''}`.toLowerCase();
  if (lang !== 'de') {
    return 'This helps narrow the issue down quickly and brings us closer to the right solution.';
  }
  if (/usb/.test(text)) return 'Das grenzt den Fehler schnell ein — und wenn dieser Test klappt, sind wir der Lösung schon ein gutes Stück näher.';
  if (/geräte-manager|device manager/.test(text)) return 'Damit sehen wir schnell, ob Windows den Scanner überhaupt korrekt erkennt — das ist für die weitere Analyse sehr wertvoll.';
  if (/firmware/.test(text)) return 'So erkennen wir früh, ob eher die Firmware oder die Verbindung die Ursache ist.';
  if (/wlan|wifi|wi-fi|router/.test(text)) return 'Damit erkennen wir schnell, ob die Ursache eher im Netzwerk oder direkt am Scanner liegt.';
  return 'So können wir den Fehler sauber eingrenzen und den nächsten Schritt deutlich gezielter auswählen.';
}

export default function Troubleshoot() {
  const navigate = useNavigate();
  const [session, setLocalSession] = useState(getSession());
  const [showBrain, setShowBrain] = useState(false);

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
              className="rounded-[34px] px-7 py-8 md:px-10 md:py-10 shadow-[0_25px_80px_rgba(0,0,0,0.35)]"
              style={{
                background: 'linear-gradient(180deg, rgba(10,8,34,0.94) 0%, rgba(8,6,28,0.92) 100%)'
              }}
            >
              <div className="text-center max-w-2xl mx-auto">
                <h1 className="text-3xl md:text-4xl font-semibold text-white leading-tight">
                  {stepTitle}
                </h1>
                <p className="mt-5 text-lg text-white/90 leading-relaxed">
                  {stepIntro(personName, language)}
                </p>

                {stepInstruction && (
                  <div className="mt-6 rounded-[24px] bg-white/[0.05] px-6 py-5 text-white/92 text-lg leading-relaxed">
                    {stepInstruction}
                  </div>
                )}

                <p className="mt-6 text-primary text-xl leading-relaxed">
                  {stepEncouragement(currentStep, language)}
                </p>

                <button
                  onClick={() => handleStepResult('not_solved')}
                  className="group mt-8 inline-flex items-center justify-center rounded-full focus:outline-none"
                  title={language === 'de' ? 'Nächsten Schritt öffnen' : 'Open next step'}
                >
                  <img
                    src={brainNeon}
                    alt="Continue"
                    className="w-40 md:w-48 object-contain opacity-95 transition-transform duration-200 group-hover:scale-105"
                    style={{
                      filter: 'drop-shadow(0 0 28px rgba(45,212,191,0.55)) drop-shadow(0 0 54px rgba(236,72,153,0.35))',
                      mixBlendMode: 'screen'
                    }}
                  />
                </button>

                <div className="mt-7 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-lg">
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
