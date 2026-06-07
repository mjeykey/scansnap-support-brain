import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { getSession, setSession } from '@/lib/sessionStore';
import { ArrowLeft, RotateCcw, Clock, StickyNote, ChevronDown, ChevronUp } from 'lucide-react';
import { format } from 'date-fns';

const statusColors = {
  solved: 'border-primary/40 text-primary bg-primary/10',
  not_solved: 'border-secondary/40 text-secondary bg-secondary/10',
  not_possible: 'border-white/15 text-white/40 bg-white/5',
  skipped: 'border-white/15 text-white/40 bg-white/5',
  pending: 'border-accent/30 text-amber-400 bg-amber-400/10',
};


function localizeHistoryStep(step) {
  if (!step) return step;
  const title = step.title || '';
  const instruction = step.instruction || '';
  const combined = `${title} ${instruction}`;

  if (combined.includes('Confirm scanner boot state and USB detection first')) {
    return {
      ...step,
      title: 'Scanner-Startzustand und USB-Erkennung zuerst prüfen; wenn Recovery-Symptome bestätigt sind, iX1600-Recovery über Top Sensor + Empty Arm mit eigenständigem Firmware-Updater per USB durchführen',
      instruction: 'Prüfen Sie zuerst, ob der Scanner startet und per USB erkannt wird. Wenn sich bestätigt, dass sich der Scanner im Recovery-Zustand befindet oder das Firmwareupdate nicht korrekt abgeschlossen wurde, führen Sie die iX1600-Recovery über Top Sensor + Empty Arm durch und verwenden Sie anschließend den eigenständigen Firmware-Updater per USB.'
    };
  }
  return step;
}

const panelStyle = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.07)',
  borderRadius: '0.875rem',
};

export default function StepHistory() {
  const navigate = useNavigate();
  const [session, setLocalSession] = useState(getSession());
  const { steps, problem, issueType } = session;
  const [expandedIndex, setExpandedIndex] = useState(null);
  const [editNote, setEditNote] = useState('');

  const pageStyle = {
    background: 'radial-gradient(ellipse at 20% 50%, rgba(13,40,44,0.9) 0%, rgba(8,8,16,1) 50%, rgba(28,10,25,0.85) 100%)',
    minHeight: '100vh',
  };

  if (!steps || steps.length === 0) {
    return (
      <div style={pageStyle} className="pt-14 flex flex-col items-center justify-center px-5 min-h-screen">
        <p className="text-white/30 text-sm mb-4">No active session</p>
        <Button variant="ghost" onClick={() => navigate('/')} className="text-white/40 hover:text-white/70">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Start new analysis
        </Button>
      </div>
    );
  }

  const toggleExpand = (index) => {
    if (expandedIndex === index) {
      setExpandedIndex(null);
    } else {
      setExpandedIndex(index);
      setEditNote(steps[index].note || '');
    }
  };

  const saveNote = (index) => {
    const updatedSteps = [...steps];
    updatedSteps[index] = { ...updatedSteps[index], note: editNote };
    const updated = setSession({ steps: updatedSteps });
    setLocalSession(updated);
  };

  const jumpToStep = (index) => {
    const updatedSteps = steps.map((s, i) => {
      if (i > index) {
        return { ...s, status: 'pending', result: '', timestamp: null };
      }
      return s;
    });
    const updated = setSession({
      steps: updatedSteps,
      currentStepIndex: index,
      status: 'troubleshooting',
    });
    setLocalSession(updated);
    navigate('/troubleshoot');
  };

  return (
    <div style={pageStyle} className="pt-14 pb-10 px-5">
      <div className="max-w-2xl mx-auto space-y-5 pt-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-sm text-white/40 hover:text-white/70 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          {issueType && (
            <Badge variant="outline" className="text-xs border-primary/30 text-primary bg-primary/10">
              {issueType}
            </Badge>
          )}
        </div>

        <div>
          <h2 className="text-base font-semibold text-white">Step History</h2>
          {problem && (
            <p className="text-xs text-white/30 mt-1 truncate">{problem}</p>
          )}
        </div>

        <div className="space-y-2.5">
          {steps.map((rawStep, index) => {
            const step = localizeHistoryStep(rawStep);
            return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04 }}
            >
              <div style={panelStyle} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-xs font-medium text-primary/70">#{index + 1}</span>
                      <Badge variant="outline" className={`text-[10px] ${statusColors[step.status] || ''}`}>
                        {step.status.replace('_', ' ')}
                      </Badge>
                    </div>
                    <h4 className="text-sm font-medium text-white/80 truncate">{(step.title && step.title !== "Step") ? step.title : (step.instruction || step.body || step.stepId || "Nicht benannter Schritt")}</h4>
                    {step.timestamp && (
                      <p className="text-[10px] text-white/25 flex items-center gap-1 mt-1">
                        <Clock className="w-2.5 h-2.5" />
                        {format(new Date(step.timestamp), 'HH:mm:ss')}
                      </p>
                    )}
                    {step.note && (
                      <p className="text-[11px] text-white/40 flex items-center gap-1 mt-1 italic">
                        <StickyNote className="w-2.5 h-2.5" />
                        {step.note}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {step.status !== 'pending' && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => jumpToStep(index)}
                        className="text-xs text-white/30 hover:text-white/60 h-7 px-2"
                      >
                        <RotateCcw className="w-3 h-3 mr-1" />
                        Retry
                      </Button>
                    )}
                    <button
                      onClick={() => toggleExpand(index)}
                      className="p-1 text-white/25 hover:text-white/50 transition-colors"
                    >
                      {expandedIndex === index
                        ? <ChevronUp className="w-4 h-4" />
                        : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {expandedIndex === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    className="mt-3 pt-3 border-t border-white/5 space-y-3"
                  >
                    <p className="text-xs text-white/40 leading-relaxed">{step.instruction}</p>
                    <div className="flex items-end gap-2">
                      <div className="flex-1">
                        <label className="text-[10px] text-white/30 flex items-center gap-1 mb-1 uppercase tracking-wide">
                          <StickyNote className="w-2.5 h-2.5" /> Note
                        </label>
                        <Textarea
                          value={editNote}
                          onChange={(e) => setEditNote(e.target.value)}
                          className="text-xs min-h-[44px] bg-white/5 border-white/10 text-white placeholder:text-white/20"
                          placeholder="Add note…"
                        />
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => saveNote(index)}
                        className="h-8 text-xs border-white/10 text-white/60 hover:bg-white/5"
                      >
                        Save
                      </Button>
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )})}
        </div>
      </div>
    </div>
  );
}