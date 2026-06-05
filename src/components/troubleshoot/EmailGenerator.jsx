// ============================================================
// EmailGenerator — LOCAL ONLY. Zero AI. Zero credits.
// Assembles customer email from approved fixed modules.
// AI is available ONLY as an optional "Improve Wording" action.
// ============================================================

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Copy, Mail, Sparkles, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';
import { getSettings } from '@/lib/sessionStore';
import { getUI } from '@/lib/uiTranslations';
import { assembleEmail, suggestModules, EMAIL_MODULES } from '@/lib/emailModules';

export default function EmailGenerator({ session, fwDiag, category }) {
  const settings = getSettings();
  const lang = (settings.emailLanguage || 'de').toLowerCase();
  const ui = getUI(lang);

  const suggested = useMemo(() => suggestModules(session, { fwDiag, category }), [session, fwDiag, category]);
  const [selected, setSelected] = useState(suggested);
  const [emailText, setEmailText] = useState(() => assembleEmail(suggested, lang));
  const [aiImproving, setAiImproving] = useState(false);

  const toggle = (key) => {
    const next = selected.includes(key) ? selected.filter(k => k !== key) : [...selected, key];
    setSelected(next);
    setEmailText(assembleEmail(next, lang, session?.supporterName || ''));
  };

  const copy = () => { navigator.clipboard.writeText(emailText); toast.success('Email copied'); };

  const improveWithAI = async () => {
    setAiImproving(true);
    try {
      const { buildDiagnosticTimeline, determineFinalState, buildEmailPrompt } = await import('@/lib/diagnosticMemory.js');
      const steps = session?.steps || [];
      const tl = buildDiagnosticTimeline(steps, lang);
      const fs = determineFinalState(session || {}, tl);
      const prompt = buildEmailPrompt(session || {}, tl, fs, lang, emailText);
      const result = await base44.integrations.Core.InvokeLLM({ prompt });
      setEmailText(typeof result === 'string' ? result : JSON.stringify(result));
      toast.success('AI improved wording applied');
    } finally {
      setAiImproving(false);
    }
  };

  const contentModules = Object.values(EMAIL_MODULES).filter(m => !['greeting', 'closing'].includes(m.key));

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: 'rgba(248,248,252,0.97)', border: '1px solid rgba(45,212,191,0.2)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-black/6"
          style={{ background: 'rgba(45,212,191,0.05)' }}>
          <div className="flex items-center gap-2">
            <Mail className="w-3.5 h-3.5 text-primary" />
            <span className="text-sm font-semibold text-black">{ui.customer_email}</span>
            <span className="text-[9px] text-black/30 uppercase tracking-wider">LOCAL · NO AI</span>
          </div>
          {emailText && (
            <Button size="sm" onClick={copy} className="h-7 text-xs bg-primary hover:bg-primary/90 text-white">
              <Copy className="w-3 h-3 mr-1.5" />
              {ui.copy_email}
            </Button>
          )}
        </div>

        <div className="p-5 space-y-4">
          {/* Module toggles */}
          <div className="space-y-1.5">
            <p className="text-[9px] font-bold uppercase tracking-widest text-black/30 mb-2">
              Select modules to include:
            </p>
            {contentModules.map(mod => {
              const isSel = selected.includes(mod.key);
              const label = mod.label[lang] || mod.label['en'];
              return (
                <button
                  key={mod.key}
                  onClick={() => toggle(mod.key)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-all text-xs ${
                    isSel ? 'bg-primary/10 text-black/80' : 'bg-black/[0.03] text-black/40 hover:text-black/60'
                  }`}
                >
                  <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 transition-all ${
                    isSel ? 'bg-primary border-primary' : 'border-black/20'
                  }`}>
                    {isSel && <span className="text-white text-[8px] font-bold">✓</span>}
                  </div>
                  {label}
                  {suggested.includes(mod.key) && (
                    <span className="ml-auto text-[8px] text-primary/60 uppercase">suggested</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Email preview */}
          <textarea
            value={emailText}
            onChange={e => setEmailText(e.target.value)}
            className="w-full text-xs text-black/70 leading-relaxed bg-white border border-black/8 rounded-xl p-4 resize-none min-h-[180px] font-sans"
          />

          {/* Optional AI improve */}
          <div className="flex items-center gap-2 pt-1 border-t border-black/5">
            <Button
              size="sm"
              variant="outline"
              onClick={improveWithAI}
              disabled={aiImproving || !emailText}
              className="h-8 text-xs border-black/15 text-black/40 hover:text-black/70"
            >
              {aiImproving
                ? <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />Improving…</>
                : <><Sparkles className="w-3.5 h-3.5 mr-1.5 text-amber-400" />Improve wording with AI</>
              }
            </Button>
            <span className="text-[9px] text-black/25 italic">optional · uses AI credits</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}