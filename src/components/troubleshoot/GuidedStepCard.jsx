import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  CheckCircle2, XCircle, SkipForward, Ban, Clock, StickyNote, ArrowRight
} from 'lucide-react';
import { getUI } from '@/lib/uiTranslations';
import { getSettings } from '@/lib/sessionStore';
import { resolveStep } from '@/lib/stepTranslations.js';


function polishStepForLanguage(step, lang) {
  return { title: step?.title || step?.instruction || '', body: step?.instruction || step?.body || '', difficulty: step?.difficulty || 'medium' };
}

const cardStyle = {
  background: 'linear-gradient(135deg, rgba(6,12,28,0.82), rgba(25,8,30,0.76))',
  borderRadius: '1.65rem',
  border: '1.5px solid rgba(0,245,230,0.35)',
  borderRight: '1.5px solid rgba(255,45,170,0.50)',
  boxShadow: '0 0 34px rgba(0,245,230,0.12), 0 0 46px rgba(255,45,170,0.12), inset 0 1px 0 rgba(255,255,255,0.08)',
  color: 'rgba(255,255,255,0.92)',
  backdropFilter: 'blur(22px)',
  width: 'min(520px, 84vw)',
  margin: '0 auto',
};

export default function GuidedStepCard({ step, stepIndex, totalSteps, onResult, onResume, isWaiting }) {
  const [phase, setPhase] = useState('action');
  const [note, setNote] = useState('');
  const [showNote, setShowNote] = useState(false);

  const lang = getSettings().emailLanguage || 'de';
  const ui = getUI(lang);

  const rawResolved = step.stepId ? resolveStep(step.stepId, lang) : null;
  const fallbackResolved = polishStepForLanguage(step, lang);
  const resolved = (!rawResolved || rawResolved.title === step.stepId || rawResolved.title === 'Step' || String(rawResolved.title || '').includes('_'))
    ? fallbackResolved
    : rawResolved;

  const smartQuestion = step.smartQuestion?.[lang] || step.smartQuestion?.en || '';

  const handleResult = (result) => onResult(result, note);

  // ── Waiting state — paused, show resume ──
  if (isWaiting) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={cardStyle}
        className="p-7 text-center"
      >
        <div className="flex items-center gap-3 mb-5">
          <div className="w-8 h-8 rounded-full bg-amber-400/15 flex items-center justify-center">
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white/85">{ui.waiting_customer}</p>
            <p className="text-xs text-white/38 mt-0.5">{ui.waiting_customer_hint || 'Resume when customer responds'}</p>
          </div>
        </div>
        <p className="text-sm text-white/58 leading-relaxed mb-5">{resolved.title}</p>
        {onResume && (
          <Button onClick={onResume} className="w-full bg-gradient-to-r from-cyan-500/80 to-fuchsia-500/80 hover:from-cyan-400 hover:to-fuchsia-400 text-white shadow-[0_0_26px_rgba(255,45,170,0.25)] font-medium">
            {ui.resume || 'Resume'}
          </Button>
        )}
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      style={cardStyle}
      className="p-7 text-center"
    >
      {/* Step counter — subtle, top right */}
      <div className="flex items-start justify-between mb-1">
        <span className="text-[10px] text-white/28 font-medium tracking-widest uppercase">
          {(ui.step || 'Schritt').toUpperCase()} {stepIndex + 1}
          {totalSteps > 1 && <span className="text-white/30"> / {totalSteps}</span>}
        </span>
        <button
          onClick={() => setShowNote(!showNote)}
          className={`transition-colors mt-0.5 ${showNote ? 'text-white/58' : 'text-white/30 hover:text-white/45'}`}
        >
          <StickyNote className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Main instruction — the ONLY thing that matters */}
      <div className="space-y-3 mb-6">
        <h3 className="text-2xl font-semibold text-white leading-snug">
          {resolved.title}
        </h3>
        {resolved.body && (
          <p className="text-base text-white/72 leading-relaxed max-w-sm mx-auto">
            {resolved.body}
          </p>
        )}
        {smartQuestion && (
          <div className="rounded-xl px-4 py-3 bg-fuchsia-500/8 border border-fuchsia-300/25">
            <p className="text-xs font-medium text-fuchsia-200/80 uppercase tracking-widest mb-1">
              {({de:'Vor dem nächsten Schritt klären',en:'Clarify before next step',pt:'Clarificar antes do próximo passo',es:'Aclarar antes del siguiente paso',fr:'À clarifier avant l’étape suivante',it:'Chiarire prima del prossimo passo',nl:'Verduidelijken vóór de volgende stap',ja:'次の手順の前に確認'}[lang] || 'Clarify before next step')}
            </p>
            <p className="text-sm text-white/72 leading-relaxed">{smartQuestion}</p>
          </div>
        )}
      </div>

      {/* Note area */}
      <AnimatePresence>
        {showNote && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden mb-4"
          >
            <Textarea
              placeholder={ui.add_note}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="text-sm min-h-[52px] bg-black/3 border-black/8 text-black placeholder:text-white/28 resize-none"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── ACTION phase ── */}
      {phase === 'action' && (
        <div className="space-y-3 text-center">
          <button type="button" onClick={() => setPhase('result')} className="mx-auto block border-0 bg-transparent p-0" title={ui.done || 'Done'}>
            <img src="https://media.base44.com/images/public/69f772d8f3bd9572308a286b/37a2d2153_imagen.png" alt="Weiter" className="w-32 h-32 object-contain mx-auto transition-transform hover:scale-105" style={{ filter: 'drop-shadow(0 0 24px rgba(0,245,230,0.8)) drop-shadow(0 0 34px rgba(255,45,170,0.72))', mixBlendMode: 'screen' }} />
            <span className="block -mt-2 text-sm font-medium text-white/82">{ui.next || 'Weiter'}</span>
          </button>
          <div className="flex justify-center gap-4 text-xs">
            <button onClick={() => handleResult('not_possible')} className="text-white/42 hover:text-cyan-200 transition-colors">{ui.not_possible}</button>
            <button onClick={() => handleResult('waiting_customer')} className="text-amber-400/80 hover:text-amber-300 transition-colors">{ui.waiting_customer}</button>
          </div>
        </div>
      )}

      {/* ── RESULT phase ── */}
      {phase === 'result' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-3"
        >
          <p className="text-[11px] font-medium text-center text-white/38 uppercase tracking-widest mb-3">
            {ui.resolved_question}
          </p>
          <div className="flex gap-2.5">
            <Button
              onClick={() => handleResult('solved')}
              className="flex-1 bg-primary hover:bg-primary/90 text-white h-11"
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              {ui.solved}
            </Button>
            <Button
              variant="outline"
              onClick={() => handleResult('not_solved')}
              className="flex-1 border-secondary/25 text-secondary/80 hover:bg-secondary/5 h-11"
            >
              <XCircle className="w-4 h-4 mr-2" />
              {ui.not_solved}
            </Button>
          </div>
          <button
            onClick={() => setPhase('action')}
            className="w-full text-[10px] text-white/28 hover:text-white/50 text-center pt-1"
          >
            ← {ui.back || 'Back'}
          </button>
        </motion.div>
      )}
    </motion.div>
  );
}