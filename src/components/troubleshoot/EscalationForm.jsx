import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Copy, AlertTriangle, Edit3, Check, RefreshCw, Mail, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';
import { getSettings } from '@/lib/sessionStore';
import {
  ESCALATION_TEMPLATES,
  buildTemplate,
  detectMissingFields,
  buildMissingInfoEmail,
} from '@/lib/escalationTemplates';

const panelStyle = {
  background: 'rgba(255, 246, 250, 0.97)',
  border: '1px solid rgba(236,72,153,0.15)',
  borderRadius: '1rem',
};

export default function EscalationForm({ steps, kbEntry, session }) {
  const [templateKey, setTemplateKey] = useState('');
  const [content, setContent]         = useState('');
  const [editing, setEditing]         = useState(false);
  const [showEmail, setShowEmail]     = useState(false);
  const [emailText, setEmailText]     = useState('');

  // When template is selected, auto-fill and detect missing fields
  const missingFields = useMemo(() => {
    if (!templateKey) return [];
    return detectMissingFields(templateKey, session);
  }, [templateKey, session]);

  const handleSelectTemplate = (key) => {
    setTemplateKey(key);
    setContent(buildTemplate(key, session));
    setEditing(false);
    setShowEmail(false);
    setEmailText('');
  };

  const regenerate = () => {
    if (!templateKey) return;
    setContent(buildTemplate(templateKey, session));
    setEditing(false);
    toast.success('Template regenerated from session data');
  };

  const handleGenerateMissingEmail = () => {
    const text = buildMissingInfoEmail(missingFields, session);
    setEmailText(text);
    setShowEmail(true);
  };

  const copy = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const selectedLabel = ESCALATION_TEMPLATES.find(t => t.key === templateKey)?.label;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <div style={panelStyle} className="p-5 space-y-4">

        {/* ── Header ── */}
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-secondary" />
          <h3 className="text-sm font-semibold text-black">Escalation / Request</h3>
          <span className="text-[10px] text-black/40 uppercase tracking-wide">Official PFU Templates · EN</span>
        </div>

        {/* ── Template Selector ── */}
        <div className="space-y-1.5">
          <p className="text-[10px] font-semibold text-black/50 uppercase tracking-wider">
            Select Escalation / Request Type
          </p>
          <Select value={templateKey} onValueChange={handleSelectTemplate}>
            <SelectTrigger className="bg-white border-black/15 text-black text-sm h-9">
              <SelectValue placeholder="— Choose type —" />
            </SelectTrigger>
            <SelectContent>
              {ESCALATION_TEMPLATES.map(t => (
                <SelectItem key={t.key} value={t.key}>{t.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* ── Only show rest once a template is selected ── */}
        {templateKey && (
          <>
            {/* ── Missing Fields Warning ── */}
            {missingFields.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="rounded-xl border border-amber-400/40 bg-amber-50 p-3 space-y-2"
              >
                <div className="flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <p className="text-xs font-semibold text-amber-700">
                    MISSING INFORMATION BEFORE ESCALATION
                  </p>
                </div>
                <ul className="space-y-0.5">
                  {missingFields.map(f => (
                    <li key={f.id} className="text-[11px] text-amber-700 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                      {f.label}
                    </li>
                  ))}
                </ul>
                <Button
                  size="sm"
                  onClick={handleGenerateMissingEmail}
                  className="h-7 text-xs bg-amber-400/20 hover:bg-amber-400/30 text-amber-700 border border-amber-400/30 mt-1"
                >
                  <Mail className="w-3 h-3 mr-1.5" />
                  Generate customer email to request missing information
                </Button>
              </motion.div>
            )}

            {missingFields.length === 0 && (
              <div className="text-[10px] text-black/40 bg-black/[0.03] rounded-lg px-3 py-2 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block shrink-0" />
                Auto-filled from session · No AI · Template-driven
              </div>
            )}

            {/* ── Missing Info Customer Email ── */}
            <AnimatePresence>
              {showEmail && emailText && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="rounded-xl border border-primary/20 bg-white p-3 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-semibold text-black/50 uppercase tracking-wider">
                      Customer Email — Missing Information Request
                    </p>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setShowEmail(false)}
                      className="h-6 w-6 p-0 text-black/30 hover:text-black/60"
                    >
                      <ChevronUp className="w-3 h-3" />
                    </Button>
                  </div>
                  <div className="text-xs font-mono whitespace-pre-wrap text-black leading-relaxed max-h-52 overflow-y-auto bg-black/[0.02] rounded-lg p-3">
                    {emailText}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copy(emailText)}
                    className="h-7 text-xs border-primary/30 text-primary hover:bg-primary/5"
                  >
                    <Copy className="w-3 h-3 mr-1" />
                    Copy Email
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── Template Document ── */}
            <div className="space-y-1.5">
              <p className="text-[10px] font-semibold text-black/50 uppercase tracking-wider">
                {selectedLabel}
              </p>
              {editing ? (
                <Textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="text-xs font-mono leading-relaxed min-h-[380px] bg-white border-black/10 text-black"
                />
              ) : (
                <div className="bg-white rounded-xl p-4 text-xs font-mono whitespace-pre-wrap text-black leading-relaxed max-h-[460px] overflow-y-auto border border-black/5">
                  {content}
                </div>
              )}
            </div>

            {/* ── Actions ── */}
            <div className="flex gap-2 flex-wrap">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setEditing(!editing)}
                className="h-7 text-xs border-black/15 text-black hover:bg-black/5"
              >
                {editing
                  ? <><Check className="w-3 h-3 mr-1" />Done</>
                  : <><Edit3 className="w-3 h-3 mr-1" />Edit</>
                }
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={regenerate}
                className="h-7 text-xs border-black/15 text-black hover:bg-black/5"
              >
                <RefreshCw className="w-3 h-3 mr-1" />
                Regenerate
              </Button>
              {content && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copy(content)}
                  className="h-7 text-xs border-secondary/30 text-secondary hover:bg-secondary/5"
                >
                  <Copy className="w-3 h-3 mr-1" />
                  Copy
                </Button>
              )}
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
}