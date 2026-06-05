import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import BrainPanel from '@/components/troubleshoot/BrainPanel';
import brainNeon from '@/assets/brain-neon.png';
import { getSession, setSession, getSettings } from '@/lib/sessionStore';
import { generateNextDynamicStep, runDecisionEngine } from '@/lib/decisionEngine';
import { playAction, playSuccess } from '@/lib/sounds';
import { base44 } from '@/api/base44Client';
import { ArrowLeft, History, CheckCircle2, AlertTriangle, SlidersHorizontal, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getUI } from '@/lib/uiTranslations';
import { recordSuccessfulStep } from '@/lib/experienceEngine';


function advisorIntro(session, lang) {
  const name = session?.supporterName || '';
  const model = session?.model || session?.device || 'Scanner';
  const connection = session?.connectionType || '';

  const copy = {
    de: { title: `Hallo ${name || ''}`.trim(), text: `Ich habe ${model} erkannt${connection ? ` und die Verbindung ${connection} berücksichtigt` : ''}. Ich prüfe jetzt die Wissensdatenbank und führe dich Schritt für Schritt durch den passendsten Lösungspfad.` },
    en: { title: `Hello ${name || ''}`.trim(), text: `I detected ${model}${connection ? ` and considered the ${connection} connection` : ''}. I will check the knowledge base and guide you step by step through the most relevant path.` },
    pt: { title: `Olá ${name || ''}`.trim(), text: `Identifiquei ${model}${connection ? ` e considerei a ligação ${connection}` : ''}. Vou consultar a base de conhecimento e orientar-te passo a passo pelo caminho mais adequado.` },
    es: { title: `Hola ${name || ''}`.trim(), text: `He identificado ${model}${connection ? ` y he tenido en cuenta la conexión ${connection}` : ''}. Voy a consultar la base de conocimiento y guiarte paso a paso por el camino más adecuado.` },
    fr: { title: `Bonjour ${name || ''}`.trim(), text: `J’ai identifié ${model}${connection ? ` et pris en compte la connexion ${connection}` : ''}. Je vais consulter la base de connaissances et te guider étape par étape.` },
    it: { title: `Ciao ${name || ''}`.trim(), text: `Ho identificato ${model}${connection ? ` e considerato la connessione ${connection}` : ''}. Consulto la knowledge base e ti guido passo dopo passo.` },
    nl: { title: `Hallo ${name || ''}`.trim(), text: `Ik heb ${model} herkend${connection ? ` en de verbinding ${connection} meegenomen` : ''}. Ik controleer de kennisbank en begeleid je stap voor stap.` },
    ja: { title: `こんにちは ${name || ''}`.trim(), text: `${model} を認識しました${connection ? `。接続方式 ${connection} も考慮しています` : ''}。ナレッジベースを確認し、最適な手順で案内します。` },
  };
  return copy[lang] || copy.en;
}

const pageStyle = {
  background: `
    radial-gradient(circle at 10% 62%, rgba(0,245,230,0.22) 0%, transparent 28%),
    radial-gradient(circle at 92% 55%, rgba(255,20,150,0.28) 0%, transparent 34%),
    linear-gradient(135deg, #02040a 0%, #070615 42%, #0c102e 65%, #09020d 100%)
  `,
  minHeight: '100vh',
};


const STEP_COPY = {
  de: {
    analyzing: 'Lumi analysiert',
    checking: (title) => `Ich prüfe gerade ${title ? `„${title}“` : 'diesen Schritt'}.`,
    suggestion: (name) => `${name || 'Marina'}, wie wäre es, wenn wir jetzt diesen Schritt zuerst sauber durchführen?`,
    why: 'Das grenzt den Fehler schnell ein — und wenn dieser Test klappt, sind wir der Lösung schon ein gutes Stück näher.',
    brainHint: 'Lumi ist bereit',
    solved: 'Hat geholfen',
    notPossible: 'Nicht möglich',
    waiting: 'Warte auf Rückmeldung',
  },
  en: {
    analyzing: 'Lumi is analysing',
    checking: (title) => `I am checking ${title ? `“${title}”` : 'this step'} right now.`,
    suggestion: (name) => `${name || 'Marina'}, how about we try this step cleanly first?`,
    why: 'This narrows the issue down quickly — and if this test works, we are already much closer to the solution.',
    brainHint: 'Lumi is ready',
    solved: 'Solved',
    notPossible: 'Not possible',
    waiting: 'Waiting for feedback',
  },
};

function getStepCopy(lang) {
  return STEP_COPY[lang] || STEP_COPY.de;
}

function SoftGlowButton({ children, onClick, className = '', variant = 'soft' }) {
  const base = 'rounded-full px-4 py-2 text-xs font-medium transition-all duration-300';
  const styles = variant === 'gold'
    ? 'text-amber-300 hover:text-amber-200 hover:bg-amber-400/10'
    : variant === 'success'
      ? 'text-primary hover:text-primary/90 hover:bg-primary/10'
      : 'text-white/55 hover:text-white hover:bg-white/8';
  return (
    <button onClick={onClick} className={`${base} ${styles} ${className}`}>
      {children}
    </button>
  );
}

function GuidedStepCard({ step, stepIndex, totalSteps, onResult, onResume, isWaiting }) {
  const session = getSession();
  const settings = getSettings();
  const lang = (settings.emailLanguage || 'de').toLowerCase();
  const copy = getStepCopy(lang);
  const supporterName = session?.supporterName || 'Marina';

  const title = step?.title || step?.instruction || step?.body || 'Troubleshooting step';
  const instruction = step?.instruction || step?.body || '';
  const difficulty = step?.difficulty || '';

  const continueStep = () => {
    if (isWaiting && onResume) {
      onResume();
      return;
    }
    onResult('not_solved', '');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 18, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -12, scale: 0.98 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="relative mx-auto w-full max-w-[620px]"
    >
      <div className="absolute -inset-[1px] rounded-[2rem] bg-gradient-to-br from-primary/55 via-white/10 to-secondary/55 blur-[1px] opacity-80" />
      <div
        className="relative overflow-hidden rounded-[2rem] px-7 py-7 sm:px-9 sm:py-8"
        style={{
          background: 'linear-gradient(155deg, rgba(7,10,25,0.92), rgba(16,10,31,0.94) 58%, rgba(22,7,35,0.92))',
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 28px 80px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.05)',
        }}
      >
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-28 left-1/2 h-56 w-56 -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute -bottom-28 right-0 h-64 w-64 rounded-full bg-secondary/12 blur-3xl" />
        </div>

        <div className="relative z-10 flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-primary/75">
              {copy.analyzing} {stepIndex + 1} / {totalSteps}
            </p>
            {difficulty && (
              <p className="mt-1 text-[10px] uppercase tracking-[0.18em] text-white/25">
                {difficulty}
              </p>
            )}
          </div>
          <div className="h-8 w-8 rounded-full border border-white/10 bg-white/[0.03] flex items-center justify-center text-white/25">
            <SlidersHorizontal className="w-3.5 h-3.5" />
          </div>
        </div>

        <div className="relative z-10 mt-7 text-center">
          <h2 className="text-[1.65rem] sm:text-[1.9rem] leading-tight font-semibold text-white tracking-[-0.03em]">
            {copy.checking(title)}
          </h2>

          <div className="mx-auto mt-5 max-w-[500px] space-y-3">
            <p className="text-base sm:text-[1.05rem] leading-relaxed text-white/76">
              {copy.suggestion(supporterName)}
            </p>
            {instruction && (
              <p className="rounded-2xl border border-white/8 bg-white/[0.045] px-5 py-4 text-sm sm:text-[0.95rem] leading-relaxed text-white/68">
                {instruction}
              </p>
            )}
            <p className="text-sm leading-relaxed text-primary/75">
              {copy.why}
            </p>
          </div>

          <div className="mt-8 flex flex-col items-center">
            <motion.button
              type="button"
              onClick={continueStep}
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.96 }}
              className="group relative h-24 w-24 rounded-full focus:outline-none focus:ring-2 focus:ring-primary/60 focus:ring-offset-2 focus:ring-offset-[#080816]"
              aria-label="Lumi continue"
            >
              <span className="absolute inset-0 rounded-full bg-primary/20 blur-2xl opacity-70 group-hover:opacity-100 transition-opacity" />
              <span className="absolute inset-2 rounded-full bg-secondary/20 blur-xl opacity-60 group-hover:opacity-90 transition-opacity" />
              <img
                src={brainNeon}
                alt=""
                className="relative z-10 h-full w-full object-contain drop-shadow-[0_0_22px_rgba(45,212,191,0.65)]"
              />
            </motion.button>
            <p className="mt-3 text-[11px] uppercase tracking-[0.22em] text-white/30">
              {copy.brainHint}
            </p>
          </div>

          <div className="mt-7 flex flex-wrap items-center justify-center gap-2">
            <SoftGlowButton variant="success" onClick={() => onResult('solved', '')}>
              {copy.solved}
            </SoftGlowButton>
            <SoftGlowButton onClick={() => onResult('not_possible', '')}>
              {copy.notPossible}
            </SoftGlowButton>
            <SoftGlowButton variant="gold" onClick={() => onResult('waiting_customer', '')}>
              {copy.waiting}
            </SoftGlowButton>
          </div>
        </div>
      </div>
    </motion.div>
  );
}


export default function Troubleshoot() {
  const navigate = useNavigate();
  const [session, setLocalSession] = useState(getSession());
  const [showBrain, setShowBrain] = useState(false);

  const { steps, currentStepIndex, problem, rootCause, issueType, status, kbEntry } = session;

  const settings = getSettings();
  const language = (settings.emailLanguage || 'de').toLowerCase();
  const ui = getUI(language);
  const intro = advisorIntro(session, language);

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
    const updatedSteps = [...steps];
    updatedSteps[currentStepIndex] = {
      ...updatedSteps[currentStepIndex],
      status: 'pending',
      result: '',
      note: '',
      timestamp: null,
    };
    updateSession({
      steps: updatedSteps,
      currentStepIndex: currentStepIndex - 1,
      status: 'troubleshooting',
    });
  };

  const handleStepResult = async (result, note) => {
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
        title: (updatedSteps[currentStepIndex].title && updatedSteps[currentStepIndex].title !== 'Step') ? updatedSteps[currentStepIndex].title : (updatedSteps[currentStepIndex].instruction || updatedSteps[currentStepIndex].body || updatedSteps[currentStepIndex].stepId || 'Nicht benannter Schritt'),
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
      setTimeout(() => navigate('/final'), 600);
      return;
    }

    if (result === 'waiting_customer') {
      playAction();
      updateSession({ steps: updatedSteps, performedSteps, status: 'waiting_customer' });
      setTimeout(() => navigate('/final'), 400);
      return;
    }

    playAction();
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < updatedSteps.length) {
      updateSession({ steps: updatedSteps, performedSteps, currentStepIndex: nextIndex });
    } else {
      const currentSession = { ...getSession(), steps: updatedSteps };
      const dynamicStep = generateNextDynamicStep(currentSession, kbEntry);
      if (dynamicStep) {
        const withDynamic = [...updatedSteps, dynamicStep];
        updateSession({ steps: withDynamic, performedSteps, currentStepIndex: withDynamic.length - 1, status: 'troubleshooting' });
      } else {
        updateSession({ steps: updatedSteps, performedSteps, status: 'exhausted' });
        setTimeout(() => navigate('/final'), 400);
      }
    }
  };

  if (!steps || steps.length === 0) return null;

  const currentStepRaw = steps[currentStepIndex];
  const currentStep = currentStepRaw;
  const isTroubleshooting = status === 'troubleshooting';
  const isWaiting = status === 'waiting_customer';
  const isActive = isTroubleshooting || isWaiting;

  const stepDots = steps.length > 1 ? steps.map((s, i) => ({
    isDone: ['solved', 'not_solved', 'not_possible', 'skipped', 'waiting_customer', 'blocked'].includes(s.status),
    isCurrent: i === currentStepIndex,
    isFailed: ['not_solved', 'not_possible'].includes(s.status),
  })) : [];

  return (
    <div style={pageStyle} className="pt-8 pb-8 px-5">
      <div className="max-w-3xl mx-auto space-y-5 pt-4">

        {/* Top nav */}
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
              onClick={() => setShowBrain(b => !b)}
              className={`p-1.5 rounded-lg transition-colors ${showBrain ? 'text-primary/60' : 'text-white/20 hover:text-white/40'}`}
              title="Technical Analysis"
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Advisor intro */}
        {false && null}

        {/* Progress dots */}
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

        {/* Step navigation */}
        {isActive && currentStepIndex > 0 && (
          <button
            onClick={goPreviousStep}
            className="flex items-center gap-1.5 text-xs text-white/30 hover:text-white/60 transition-colors -mt-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            {ui.back || 'Zurück'}
          </button>
        )}

        {/* Current step */}
        {isActive && currentStep && (
          <AnimatePresence mode="wait">
            <GuidedStepCard
              key={currentStepIndex}
              step={currentStep}
              stepIndex={currentStepIndex}
              totalSteps={steps.length}
              onResult={handleStepResult}
              onResume={isWaiting ? () => updateSession({ status: 'troubleshooting' }) : null}
              isWaiting={isWaiting}
            />
          </AnimatePresence>
        )}

        {/* Go to final page when waiting */}
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

        {/* Technical Analysis — hidden by default */}
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