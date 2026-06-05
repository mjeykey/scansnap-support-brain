// ============================================================
// CaseSummary — AUTO-GENERATED from diagnostic timeline
// Built from executed steps + final state. No hallucination.
// ============================================================

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Copy, FileText, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { getSettings } from '@/lib/sessionStore';
import { buildDiagnosticTimeline, determineFinalState, buildAutoCaseSummary } from '@/lib/diagnosticMemory.js';

const FINAL_STATE_COLORS = {
  solved:            'text-primary border-primary/30 bg-primary/5',
  waiting_customer:  'text-amber-400 border-amber-400/30 bg-amber-400/5',
  continue:          'text-blue-400 border-blue-400/30 bg-blue-400/5',
  remote_session:    'text-cyan-400 border-cyan-400/30 bg-cyan-400/5',
  escalation:        'text-secondary border-secondary/30 bg-secondary/5',
  firmware_recovery: 'text-amber-400 border-amber-400/30 bg-amber-400/5',
  reinstall:         'text-purple-400 border-purple-400/30 bg-purple-400/5',
  hardware_suspicion:'text-red-400 border-red-400/30 bg-red-400/5',
};

const panelStyle = {
  background: 'rgba(245, 245, 250, 0.97)',
  border: '1px solid rgba(0,0,0,0.07)',
  borderRadius: '1rem',
};

export default function CaseSummary({ session }) {
  const lang = getSettings().emailLanguage || 'en';
  const steps = session?.steps || [];

  const timeline   = buildDiagnosticTimeline(steps, lang);
  const finalState = determineFinalState(session || {}, timeline);
  const autoText   = buildAutoCaseSummary(session || {}, timeline, finalState);

  const [text, setText] = useState(autoText);

  // Re-generate if steps change
  useEffect(() => {
    setText(buildAutoCaseSummary(session || {}, timeline, finalState));
  }, [steps.length, steps.map(s => s.status).join(',')]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(text);
    toast.success('Case Summary copied');
  };

  const regenerate = () => {
    setText(buildAutoCaseSummary(session || {}, timeline, finalState));
  };

  const stateColor = FINAL_STATE_COLORS[finalState] || FINAL_STATE_COLORS.continue;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <div style={panelStyle} className="p-5 space-y-4">

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4" style={{ color: '#d4a017' }} />
            <h3 className="text-sm font-semibold text-black">Case Summary</h3>
            <span className="text-[10px] text-black/40 uppercase tracking-wide">Auto-generated · Internal</span>
          </div>
          <button onClick={regenerate} className="text-black/30 hover:text-black/60 p-1" title="Regenerate">
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Final state badge */}
        <div className={`inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full border ${stateColor}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-current" />
          Final State: {finalState.replace(/_/g, ' ')}
        </div>

        {/* Timeline summary */}
        {timeline.length > 0 && (
          <div className="bg-black/[0.03] rounded-xl px-3 py-2.5 space-y-1">
            <p className="text-[9px] font-bold uppercase tracking-wider text-black/30 mb-1.5">Diagnostic Timeline</p>
            {timeline.map((t, i) => (
              <div key={i} className="flex items-start gap-2 text-xs">
                <span className={`mt-0.5 shrink-0 font-semibold ${
                  t.result === 'solved' ? 'text-green-600' :
                  ['not_solved', 'not_possible'].includes(t.result) ? 'text-red-500' :
                  'text-black/40'
                }`}>
                  {t.result === 'solved' ? '✓' : ['not_solved', 'not_possible'].includes(t.result) ? '✗' : '·'}
                </span>
                <span className="text-black/70 leading-snug">
                  <span className="font-medium">{t.title}</span>
                  <span className="text-black/40"> — {t.resultLabel}</span>
                  {t.note && <span className="text-black/30 italic"> · {t.note}</span>}
                </span>
              </div>
            ))}
          </div>
        )}

        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Execute troubleshooting steps to auto-generate the case summary."
          className="text-xs font-mono leading-relaxed min-h-[100px] bg-white border-black/10 text-black"
        />

        {text && (
          <Button
            size="sm"
            variant="outline"
            onClick={copyToClipboard}
            className="h-8 text-xs border-black/15 text-black hover:bg-black/5 ml-auto flex"
          >
            <Copy className="w-3.5 h-3.5 mr-1.5" />
            Copy
          </Button>
        )}
      </div>
    </motion.div>
  );
}