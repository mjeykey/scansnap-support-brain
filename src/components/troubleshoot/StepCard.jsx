import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, SkipForward, Play, StickyNote, Clock, Ban } from 'lucide-react';
import { getUI } from '@/lib/uiTranslations';
import { getSettings } from '@/lib/sessionStore';
import { resolveStep } from '@/lib/stepTranslations.js';

const difficultyColors = {
  easy: 'border-primary/40 text-primary bg-primary/10',
  medium: 'border-accent/40 text-amber-400 bg-amber-400/10',
  advanced: 'border-secondary/40 text-secondary bg-secondary/10',
};

const panelStyle = {
  background: 'rgba(248, 248, 252, 0.97)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '1rem',
  boxShadow: '0 4px 32px rgba(0,0,0,0.3)',
};

export default function StepCard({ step, stepIndex, totalSteps, onResult }) {
  const [phase, setPhase] = useState('action'); // 'action' | 'result'
  const [note, setNote] = useState('');
  const [showNote, setShowNote] = useState(false);
  const ui = getUI(getSettings().emailLanguage);

  // Resolve localized content — stepId-based (dynamic steps) or direct (KB steps)
  const lang = getSettings().emailLanguage || 'de';
  const resolved = step.stepId
    ? resolveStep(step.stepId, lang)
    : { title: step.title || '', body: step.instruction || '', difficulty: step.difficulty || 'easy' };

  const difficulty = resolved.difficulty || step.difficulty || 'easy';

  const handleResult = (result) => {
    onResult(result, note);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="w-full"
    >
      <div style={panelStyle} className="p-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-primary bg-primary/10 px-2.5 py-1 rounded-full border border-primary/20">
              {stepIndex + 1} / {totalSteps}
            </span>
            <Badge variant="outline" className={`text-[10px] ${difficultyColors[difficulty]}`}>
              {ui[`difficulty_${difficulty}`] || difficulty}
            </Badge>
          </div>
          <button
            onClick={() => setShowNote(!showNote)}
            className={`transition-colors ${showNote ? 'text-primary' : 'text-black/30 hover:text-black/60'}`}
          >
            <StickyNote className="w-4 h-4" />
          </button>
        </div>

        {/* Step title */}
        <h3 className="text-base font-semibold text-black leading-snug">
          {resolved.title}
        </h3>

        {/* Instruction */}
        <p className="text-sm text-black/60 leading-relaxed">
          {resolved.body}
        </p>

        {/* Note area */}
        {showNote && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}>
            <Textarea
              placeholder={ui.add_note}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="text-sm min-h-[56px] bg-white border-black/10 text-black placeholder:text-black/30"
            />
          </motion.div>
        )}

        {/* ── Phase: ACTION — supporter tests with customer ── */}
        {phase === 'action' && (
          <div className="space-y-2.5">
            <Button
              onClick={() => setPhase('result')}
              className="w-full bg-primary hover:bg-primary/90 text-white font-medium"
            >
              <Play className="w-4 h-4 mr-2" />
              {ui.test_now}
            </Button>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => handleResult('not_possible')}
                className="flex-1 text-sm border-black/15 text-black/60 hover:bg-black/5"
              >
                <Ban className="w-3.5 h-3.5 mr-1.5" />
                {ui.not_possible}
              </Button>
              <Button
                variant="outline"
                onClick={() => handleResult('waiting_customer')}
                className="flex-1 text-sm border-amber-400/30 text-amber-600 hover:bg-amber-400/5"
              >
                <Clock className="w-3.5 h-3.5 mr-1.5" />
                {ui.waiting_customer}
              </Button>
              <Button
                variant="ghost"
                onClick={() => handleResult('skipped')}
                className="text-sm text-black/30 hover:text-black/60 px-3"
              >
                <SkipForward className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* ── Phase: RESULT — did this solve it? ── */}
        {phase === 'result' && (
          <div className="space-y-3">
            <p className="text-xs font-medium text-center text-black/50 uppercase tracking-wider">
              {ui.resolved_question}
            </p>
            <div className="flex gap-2.5">
              <Button
                onClick={() => handleResult('solved')}
                className="flex-1 bg-primary hover:bg-primary/90 text-white"
              >
                <CheckCircle2 className="w-4 h-4 mr-2" />
                {ui.solved}
              </Button>
              <Button
                variant="outline"
                onClick={() => handleResult('not_solved')}
                className="flex-1 border-secondary/30 text-secondary hover:bg-secondary/5"
              >
                <XCircle className="w-4 h-4 mr-2" />
                {ui.not_solved}
              </Button>
            </div>
            <button
              onClick={() => setPhase('action')}
              className="w-full text-[10px] text-black/30 hover:text-black/50 text-center"
            >
              ← {ui.back || 'Back'}
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}