import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Sparkles, ChevronDown, ChevronUp, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { getEmailText, getCaseSummary, getKBEntryInLanguage } from '@/lib/localData';
import { getSettings } from '@/lib/sessionStore';
import { getUI } from '@/lib/uiTranslations';
import DebugPanel from './DebugPanel';

const panelStyle = {
  background: 'rgba(248, 248, 252, 0.97)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '1rem',
  boxShadow: '0 4px 32px rgba(0,0,0,0.4)',
};

export default function KBResultCard({ result, onUse, onAi }) {
  const [showCauses, setShowCauses]   = useState(true);
  const [showEmail, setShowEmail]     = useState(false);
  const [showSummary, setShowSummary] = useState(false);

  const settings    = getSettings();
  const lang        = (settings.emailLanguage || 'de').toLowerCase();
  const ui          = getUI(lang);
  const emailText   = getEmailText(result, lang);
  const summaryText = getCaseSummary(result);
  const localized   = getKBEntryInLanguage(result, lang);

  const copyText = (t, label) => {
    navigator.clipboard.writeText(t);
    toast.success(`${label} copied`);
  };

  const confidence = result._score || 0;
  const confidenceLabel = confidence >= 80 ? 'HIGH' : confidence >= 40 ? 'MEDIUM' : 'LOW';
  const confidenceColor = confidence >= 80 ? 'border-primary/40 text-primary bg-primary/10'
    : confidence >= 40 ? 'border-amber-400/40 text-amber-400 bg-amber-400/10'
    : 'border-secondary/40 text-secondary bg-secondary/10';

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <div style={panelStyle} className="p-5 space-y-4">

        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <Badge variant="outline" className="text-[10px] border-black/15 text-black/60">
                {result.case_id}
              </Badge>
              <Badge variant="outline" className={`text-[10px] ${confidenceColor}`}>
                {confidenceLabel}
              </Badge>
              <Badge variant="outline" className="text-[10px] border-primary/30 text-primary bg-primary/10">
                {ui.local_kb}
              </Badge>
            </div>
            <h3 className="text-base font-semibold text-black leading-snug">{localized.title || result.case_id}</h3>
          </div>
        </div>

        {/* Causes */}
        <div>
          <button
            className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-black/40 hover:text-black/60 mb-1.5"
            onClick={() => setShowCauses(!showCauses)}
          >
            {ui.causes} ({localized.causes?.length || 0})
            {localized.isMultilingual && <span className="text-primary ml-1">· {lang.toUpperCase()}</span>}
            {localized.fallback && <span className="text-amber-500 ml-1">· fallback EN</span>}
            {showCauses ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
          {showCauses && (
            <ul className="space-y-1">
              {(localized.causes || []).map((u, i) => (
                <li key={i} className="text-xs text-black/60 flex items-start gap-1.5">
                  <span className="text-amber-500 mt-0.5">·</span>
                  {u}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Email template preview */}
        <div>
          <button
            className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-black/40 hover:text-black/60 mb-2"
            onClick={() => setShowEmail(!showEmail)}
          >
            {ui.customer_email} ({lang.toUpperCase()})
            {showEmail ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
          {showEmail && (
            <div className="relative">
              <div className="bg-black/[0.04] rounded-lg p-3 text-xs text-black/55 whitespace-pre-wrap leading-relaxed max-h-40 overflow-y-auto">
                {emailText || ui.no_template}
              </div>
              {emailText && (
                <button onClick={() => copyText(emailText, 'Email')} className="absolute top-2 right-2 p-1 text-black/30 hover:text-black/60">
                  <Copy className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Case summary preview */}
        <div>
          <button
            className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-black/40 hover:text-black/60 mb-2"
            onClick={() => setShowSummary(!showSummary)}
          >
            {ui.case_summary}
            {showSummary ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
          {showSummary && (
            <div className="flex items-start gap-2">
              <div className="bg-black/[0.04] rounded-lg p-3 text-xs text-black/55 leading-relaxed flex-1">
                {summaryText || ui.no_template}
              </div>
              {summaryText && (
                <button onClick={() => copyText(summaryText, 'Case Summary')} className="p-1 text-black/30 hover:text-black/60 mt-1">
                  <Copy className="w-3 h-3" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Debug panel */}
        <DebugPanel result={result} />

        {/* Action buttons */}
        <div className="flex gap-2.5 pt-1">
          <Button
            onClick={onUse}
            className="flex-1 bg-primary hover:bg-primary/90 text-white font-medium"
          >
            <CheckCircle2 className="w-4 h-4 mr-2" />
            {ui.use_solution}
          </Button>
          <Button
            variant="outline"
            onClick={onAi}
            className="border-secondary/30 text-secondary hover:bg-secondary/5 text-sm"
          >
            <Sparkles className="w-3.5 h-3.5 mr-1.5" />
            {ui.run_ai}
          </Button>
        </div>
      </div>
    </motion.div>
  );
}