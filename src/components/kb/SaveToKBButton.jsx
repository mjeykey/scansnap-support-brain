import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { base44 } from '@/api/base44Client';
import { Database, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';

const panelStyle = {
  background: 'rgba(248, 252, 248, 0.97)',
  border: '1px solid rgba(45,212,191,0.2)',
  borderRadius: '1rem',
};

export default function SaveToKBButton({ session }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [modell, setModell] = useState(session.device || '');
  const [fehlercode, setFehlercode] = useState('');
  const [prioritaet, setPrioritaet] = useState('mittel');

  const solvedStep = session.steps?.find(s => s.status === 'solved');

  const handleSave = async () => {
    setSaving(true);
    await base44.entities.SolvedCase.create({
      problem: session.problem,
      device: modell || session.device || 'Unknown',
      os: session.os || 'Unknown',
      connection_type: session.connectionType || 'Unknown',
      issue_type: session.issueType,
      root_cause: session.rootCause,
      steps: session.steps,
      solution_step_index: session.steps?.findIndex(s => s.status === 'solved') ?? -1,
      solved: true,
      language: 'DE',
    });
    setSaving(false);
    setSaved(true);
    toast.success('Als Wissenseintrag gespeichert');
  };

  if (saved) {
    return (
      <div className="flex items-center justify-center gap-2 text-xs text-primary py-2">
        <Check className="w-3.5 h-3.5" />
        In Wissensdatenbank gespeichert
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <div style={panelStyle} className="overflow-hidden">
        <button
          onClick={() => setOpen(!open)}
          className="w-full flex items-center justify-between px-5 py-3.5 text-sm font-medium text-black/70 hover:text-black transition-colors"
        >
          <span className="flex items-center gap-2">
            <Database className="w-4 h-4 text-primary" />
            Als neuen Wissenseintrag speichern
          </span>
          {open ? <ChevronUp className="w-4 h-4 text-black/30" /> : <ChevronDown className="w-4 h-4 text-black/30" />}
        </button>

        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="px-5 pb-4 space-y-3"
            >
              <div className="pt-2 border-t border-black/5 space-y-1">
                <p className="text-xs text-black/40">Problem: <span className="text-black/60">{session.problem}</span></p>
                <p className="text-xs text-black/40">Root Cause: <span className="text-black/60">{session.rootCause}</span></p>
                {solvedStep && (
                  <p className="text-xs text-black/40">Lösung: <span className="text-primary">{solvedStep.title}</span></p>
                )}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Modell"
                  value={modell}
                  onChange={e => setModell(e.target.value)}
                  className="h-8 text-xs bg-white border-black/10 text-black"
                />
                <Input
                  placeholder="Fehlercode"
                  value={fehlercode}
                  onChange={e => setFehlercode(e.target.value)}
                  className="h-8 text-xs bg-white border-black/10 text-black"
                />
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={prioritaet}
                  onChange={e => setPrioritaet(e.target.value)}
                  className="h-8 text-xs bg-white border border-black/10 text-black rounded-md px-2 flex-1"
                >
                  <option value="hoch">Priorität: Hoch</option>
                  <option value="mittel">Priorität: Mittel</option>
                  <option value="niedrig">Priorität: Niedrig</option>
                </select>
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  size="sm"
                  className="h-8 text-xs bg-primary hover:bg-primary/90 text-white"
                >
                  {saving ? 'Speichern…' : 'Speichern'}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}