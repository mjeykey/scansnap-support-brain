import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import GuidedStepCard from '@/components/troubleshoot/GuidedStepCard';
import BrainPanel from '@/components/troubleshoot/BrainPanel';
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