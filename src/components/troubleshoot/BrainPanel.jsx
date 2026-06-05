// ============================================================
// BrainPanel – INTERNAL SUPPORTER ANALYSIS ONLY
// Never shown to customers.
// Contains: diagnostics, reasoning, missing info, next action.
// ============================================================

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import {
  Brain, ChevronDown, ChevronUp, AlertTriangle, CheckCircle2,
  Info, Zap, Shield, ArrowRight, Lock, FileText, Copy
} from 'lucide-react';
import { toast } from 'sonner';
import { resolveStep } from '@/lib/stepTranslations.js';
import { getSettings } from '@/lib/sessionStore';
import { getUI } from '@/lib/uiTranslations';

// ── Constants ────────────────────────────────────────────────

const CATEGORY_COLORS = {
  firmware: 'border-amber-400/40 text-amber-400 bg-amber-400/10',
  software: 'border-primary/40 text-primary bg-primary/10',
  usb:      'border-blue-400/40 text-blue-400 bg-blue-400/10',
  network:  'border-cyan-400/40 text-cyan-400 bg-cyan-400/10',
  hardware: 'border-secondary/40 text-secondary bg-secondary/10',
  profile:  'border-purple-400/40 text-purple-400 bg-purple-400/10',
};

// Map category key → ui translation key
const CATEGORY_UI_KEYS = {
  firmware: 'cat_firmware',
  software: 'cat_software',
  usb:      'cat_usb',
  network:  'cat_network',
  hardware: 'cat_hardware',
  profile:  'cat_profile',
};

// Map scanner state key → ui translation key
const STATE_UI_KEYS = {
  stuck_on_logo:        'state_stuck_on_logo',
  orange_led:           'state_orange_led',
  not_detected:         'state_not_detected',
  firmware_interrupted: 'state_firmware_interrupted',
  detected_cannot_scan: 'state_detected_cannot_scan',
  ready_no_movement:    'state_ready_no_movement',
  initializing:         'state_initializing',
  unknown:              'state_unknown',
};

// Map next action key → ui translation key
const ACTION_UI_KEYS = {
  request_info:      'action_request_info',
  request_video:     'action_request_video',
  firmware_recovery: 'action_firmware_recovery',
  firmware_normal:   'action_firmware_normal',
  software_cleanup:  'action_software_cleanup',
  win_integrity:     'action_win_integrity',
  usb_stack:         'action_usb_stack',
  wifi_setup:        'action_wifi_setup',
  cloud_reauth:      'action_cloud_reauth',
  hardware_clean:    'action_hardware_clean',
  profile_recreate:  'action_profile_recreate',
  request_remote:    'action_request_remote',
  review:            'action_review',
  continue:          'action_continue',
};

const CONF_COLORS = {
  HIGH:   'border-primary/40 text-primary bg-primary/10',
  MEDIUM: 'border-amber-400/40 text-amber-400 bg-amber-400/10',
  LOW:    'border-secondary/40 text-secondary bg-secondary/10',
  NONE:   'border-white/15 text-white/40 bg-white/5',
};

const CASE_STATUS_COLORS = {
  NEW:                'border-white/20 text-white/50 bg-white/5',
  IN_PROGRESS:        'border-amber-400/40 text-amber-400 bg-amber-400/10',
  TESTING:            'border-blue-400/40 text-blue-400 bg-blue-400/10',
  WAITING_CUSTOMER:   'border-amber-300/40 text-amber-300 bg-amber-300/10',
  PARTIALLY_RESOLVED: 'border-cyan-400/40 text-cyan-400 bg-cyan-400/10',
  ESCALATION_REVIEW:  'border-secondary/40 text-secondary bg-secondary/10',
  RESOLVED:           'border-primary/40 text-primary bg-primary/10',
};

const FW_WORKFLOW_COLORS = {
  VERIFY_STATE:     'border-amber-400/40 text-amber-400 bg-amber-400/10',
  USB_COMM:         'border-blue-400/40 text-blue-400 bg-blue-400/10',
  SW_ENV:           'border-purple-400/40 text-purple-400 bg-purple-400/10',
  NORMAL:           'border-primary/40 text-primary bg-primary/10',
  RETRY_STANDALONE: 'border-cyan-400/40 text-cyan-400 bg-cyan-400/10',
  RECOVERY:         'border-secondary/40 text-secondary bg-secondary/10',
  REVIEW:           'border-red-500/40 text-red-400 bg-red-400/10',
};

const ACTION_ICONS = {
  firmware_recovery: <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />,
  firmware_normal:   <Zap className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />,
  software_cleanup:  <Shield className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />,
  review:            <AlertTriangle className="w-3.5 h-3.5 text-secondary shrink-0 mt-0.5" />,
  request_info:      <Info className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />,
  request_remote:    <ArrowRight className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />,
  continue:          <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />,
};

// ── Sub-components ───────────────────────────────────────────

function Section({ label, children, defaultOpen = true, icon }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-white/30 hover:text-white/60 mb-1.5 w-full text-left"
      >
        {icon && <span className="shrink-0">{icon}</span>}
        {label}
        {open ? <ChevronUp className="w-3 h-3 ml-auto" /> : <ChevronDown className="w-3 h-3 ml-auto" />}
      </button>
      {open && children}
    </div>
  );
}

function StepList({ steps, color = 'text-white/50', ui }) {
  const lang = getSettings().emailLanguage || 'de';
  const noneLabel = ui?.none_label || '(none)';
  const unnamedLabel = ui?.unnamed_label || '(unnamed)';
  if (!steps || steps.length === 0) return <p className="text-xs text-white/25 italic">{noneLabel}</p>;
  return (
    <ul className="space-y-1">
      {steps.map((s, i) => {
        const label = s.stepId
          ? resolveStep(s.stepId, lang).title
          : (s.title || s.instruction || unnamedLabel);
        return (
          <li key={i} className={`text-xs ${color} flex items-start gap-1.5`}>
            <span className="mt-0.5 shrink-0">·</span>
            {label}
          </li>
        );
      })}
    </ul>
  );
}

const BoolCell = ({ value, labelKey, ui }) => {
  const label = ui?.[labelKey] || labelKey;
  if (value === null || value === undefined || value === 'N/A') {
    return <span className="text-white/25 text-xs">? {label}</span>;
  }
  const yes = value === true;
  return <span className={`text-xs ${yes ? 'text-primary' : 'text-secondary'}`}>{yes ? '✓' : '✗'} {label}</span>;
};

// ── Main Component ───────────────────────────────────────────

export default function BrainPanel({ brain }) {
  const [showDebug, setShowDebug] = useState(false);
  const lang = getSettings().emailLanguage || 'en';
  const ui = getUI(lang);

  if (!brain) return null;

  const {
    category, scannerState, matchedCaseId, confidenceLabel, confidence,
    completedSteps, failedSteps, blockedSteps, pendingSteps,
    missingInfo, nextAction,
    escalationReady, escalationReasons,
    caseStatus, isResolved, customerConfirmed, caseStatusReason,
    fwDiag, modelSelected, modelMatchConf, crossModelFallback,
    _debug, modelDetection,
  } = brain;

  const catColor   = CATEGORY_COLORS[category] || CATEGORY_COLORS.software;
  const catLabel   = ui[CATEGORY_UI_KEYS[category]] || category;
  const stateLabel = ui[STATE_UI_KEYS[scannerState]] || scannerState;
  const actionIcon = ACTION_ICONS[nextAction?.action] || <ArrowRight className="w-3.5 h-3.5 text-white/40 shrink-0 mt-0.5" />;
  const actionLabel = ui[ACTION_UI_KEYS[nextAction?.action]] || (nextAction?.action?.replace(/_/g, ' ') || '');

  const copyText = (t, label) => { navigator.clipboard.writeText(t); toast.success(`${label} copied`); };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl overflow-hidden"
      style={{
        background: 'rgba(10,18,28,0.85)',
        border: '1px solid rgba(45,212,191,0.15)',
        boxShadow: '0 0 32px rgba(45,212,191,0.06)',
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-white/5">
        <Brain className="w-4 h-4 text-primary" />
        <div>
          <span className="text-sm font-semibold text-white">{ui.supporter_analysis}</span>
          <div className="flex items-center gap-1.5 mt-0.5">
            <Lock className="w-2.5 h-2.5 text-amber-400/70" />
            <span className="text-[9px] text-amber-400/70 font-semibold uppercase tracking-wider">{ui.internal_warning || 'INTERNAL — DO NOT SHARE WITH CUSTOMER'}</span>
          </div>
        </div>
        <Badge variant="outline" className="text-[9px] border-primary/30 text-primary bg-primary/10 ml-auto">
          LOCAL · NO AI
        </Badge>
      </div>

      <div className="p-5 space-y-5">

        {/* ── BLOCK 1: ISSUE ANALYSIS ─────────────────────── */}
        <div className="space-y-3">
          <p className="text-[9px] font-bold uppercase tracking-widest text-white/20">{ui.issue_analysis}</p>

          {/* Selected Model — PRIMARY FILTER */}
          {(() => {
            const hasModel = modelSelected && modelSelected !== '(not set)';
            const detectionSrc = brain._debug?.modelSource || 'unknown';
            const detectionConf = brain._debug?.modelDetectConf || null;
            const detectionRaw = brain._debug?.modelDetectRaw || null;

            const confColor = detectionConf === 'HIGH' || detectionConf === 'MANUAL'
              ? 'text-primary'
              : detectionConf === 'MEDIUM'
              ? 'text-amber-400'
              : 'text-secondary';

            const srcLabel = detectionSrc === 'exact' ? ui.detect_auto_exact
              : detectionSrc === 'fuzzy' ? `${ui.detect_auto_fuzzy} (${detectionConf?.toLowerCase()})`
              : detectionSrc === 'manual' ? ui.detect_manual
              : ui.detect_not_found;

            return (
              <div className={`rounded-xl px-4 py-2.5 border flex items-center justify-between ${hasModel ? 'border-primary/30 bg-primary/5' : 'border-amber-400/30 bg-amber-400/5'}`}>
                <div>
                  <p className="text-[9px] uppercase tracking-wider text-white/30 mb-0.5">{ui.selected_model}</p>
                  <p className={`text-sm font-bold ${hasModel ? 'text-primary' : 'text-amber-400'}`}>
                    {hasModel ? modelSelected.toUpperCase() : ui.detect_not_detected}
                  </p>
                  {hasModel && (
                    <p className={`text-[9px] mt-0.5 ${confColor}`}>{srcLabel}</p>
                  )}
                  {!hasModel && (
                    <p className="text-[9px] mt-0.5 text-amber-400/60">{ui.detect_hint}</p>
                  )}
                </div>
                <div className="text-right text-[9px] text-white/30 shrink-0 ml-3 space-y-0.5">
                  <div>{ui.kb_match}: <span className={modelMatchConf === 'EXACT' ? 'text-primary' : modelMatchConf === 'GENERIC/FALLBACK' ? 'text-amber-400' : 'text-secondary'}>{modelMatchConf}</span></div>
                  {crossModelFallback && <div className="text-secondary">{ui.detect_cross_fallback}</div>}
                  {detectionRaw && detectionRaw !== '—' && <div className="text-white/25">{ui.detect_raw}: "{detectionRaw}"</div>}
                </div>
              </div>
            );
          })()}

          {/* Classification */}
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className={`text-[10px] ${catColor}`}>{catLabel}</Badge>
            {matchedCaseId && (
              <Badge variant="outline" className="text-[10px] border-white/15 text-white/50">KB {matchedCaseId}</Badge>
            )}
            <Badge variant="outline" className={`text-[10px] ${CONF_COLORS[confidenceLabel]}`}>
              {confidenceLabel} ({confidence} {ui.match_pts})
            </Badge>
            {scannerState && scannerState !== 'unknown' && (
              <Badge variant="outline" className="text-[10px] border-white/10 text-white/40">{stateLabel}</Badge>
            )}
          </div>

          {/* Case status */}
          <div className={`rounded-xl px-4 py-2.5 border flex items-center justify-between ${CASE_STATUS_COLORS[caseStatus] || CASE_STATUS_COLORS.IN_PROGRESS}`}>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider">Status: {caseStatus || 'IN_PROGRESS'}</span>
              <p className="text-[9px] mt-0.5 opacity-70">{caseStatusReason}</p>
            </div>
            <div className="flex flex-col items-end gap-0.5 text-[9px] opacity-60 shrink-0 ml-3">
            <span>{ui.status_resolved}: {isResolved ? ui.resolved_yes : ui.resolved_no}</span>
            <span>{ui.confirmed || 'Confirmed'}: {customerConfirmed ? ui.resolved_yes : ui.resolved_no}</span>
            </div>
          </div>
        </div>

        {/* ── BLOCK 2: MISSING INFORMATION ────────────────── */}
        {missingInfo.length > 0 && (
          <div className="rounded-xl px-4 py-3 border border-amber-400/20" style={{ background: 'rgba(43,30,8,0.6)' }}>
            <p className="text-[10px] font-semibold text-amber-400/80 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Info className="w-3 h-3" />
              {ui.missing_info}
            </p>
            <ul className="space-y-1">
              {missingInfo.map((m, i) => (
                <li key={i} className="text-xs text-amber-200/60 flex items-start gap-1.5">
                  <span className="mt-0.5 shrink-0 text-amber-400">·</span>{m}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* ── BLOCK 3: FIRMWARE DIAGNOSTIC STATE MACHINE ─── */}
        {fwDiag && (
          <div className="space-y-2">
            <p className="text-[9px] font-bold uppercase tracking-widest text-white/20">{ui.firmware_diag}</p>
            <div className="rounded-xl border overflow-hidden" style={{ background: 'rgba(10,18,28,0.7)', borderColor: 'rgba(255,255,255,0.07)' }}>
              {/* Workflow */}
              <div className="px-4 py-2.5 border-b border-white/5 flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className={`text-[10px] ${FW_WORKFLOW_COLORS[fwDiag.firmwareWorkflow] || FW_WORKFLOW_COLORS.VERIFY_STATE}`}>
                  {fwDiag.firmwareWorkflow}
                </Badge>
                {fwDiag.likelyCause && fwDiag.likelyCause !== 'unknown' && (
                  <Badge variant="outline" className="text-[10px] border-white/15 text-white/40">
                    {ui.detect_likely}: {fwDiag.likelyCause.replace(/_/g, ' ')}
                  </Badge>
                )}
                <span className="text-[10px] text-white/40 leading-snug">{fwDiag.workflowReason}</span>
              </div>
              {/* State grid */}
              <div className="grid grid-cols-2 gap-x-6 gap-y-2 px-4 py-3">
                <BoolCell value={fwDiag.usbAvailable}     labelKey="bool_usb_available"     ui={ui} />
                <BoolCell value={fwDiag.scannerDetected}  labelKey="bool_scanner_detected"  ui={ui} />
                <BoolCell value={fwDiag.bootsNormally}    labelKey="bool_boots_normally"    ui={ui} />
                <BoolCell value={fwDiag.recoveryRequired} labelKey="bool_recovery_required" ui={ui} />
              </div>
              {/* Next support steps */}
              {fwDiag.nextSteps?.length > 0 && (
                <div className="px-4 pb-3 border-t border-white/5 pt-2.5">
                  <p className="text-[9px] uppercase tracking-wider text-white/25 mb-1.5">{ui.required_steps}</p>
                  <ul className="space-y-1.5">
                    {fwDiag.nextSteps.map((s, i) => (
                      <li key={i} className="text-xs text-white/60 flex items-start gap-2">
                        <span className="text-primary font-semibold shrink-0 mt-0.5">{i + 1}.</span>{s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── BLOCK 4: NEXT SUPPORT ACTION ────────────────── */}
        <div className="space-y-2">
          <p className="text-[9px] font-bold uppercase tracking-widest text-white/20">{fwDiag ? '④' : '③'} {ui.next_action}</p>
          <div className="rounded-xl px-4 py-3 border border-primary/15" style={{ background: 'rgba(20,40,38,0.5)' }}>
            <div className="flex items-start gap-2">
              {actionIcon}
              <div>
                <p className="text-xs font-semibold text-white/85 mb-0.5">
                  {actionLabel}
                </p>
                {nextAction?.nextStep && (
                  <p className="text-xs text-white/65 leading-relaxed">
                    {nextAction.nextStep.instruction || nextAction.nextStep.title}
                  </p>
                )}
                {nextAction?.params?.instruction && (
                  <p className="text-xs text-white/65 leading-relaxed">{nextAction.params.instruction}</p>
                )}
                {nextAction?.params?.info && (
                  <p className="text-xs text-amber-300/70 leading-relaxed mt-1">{nextAction.params.info}</p>
                )}
                <p className="text-[10px] text-white/25 mt-1.5 italic">{nextAction?.reason}</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── BLOCK 5: TROUBLESHOOTING PROGRESS ───────────── */}
        <div className="space-y-2">
          <p className="text-[9px] font-bold uppercase tracking-widest text-white/20">
            {fwDiag ? '⑤' : '④'} {ui.ts_progress} · ✓{completedSteps.length} ✗{failedSteps.length} ⊘{blockedSteps.length} ⏳{pendingSteps.length}
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-[9px] text-primary/60 uppercase tracking-wider mb-1">{ui.completed}</p>
              <StepList steps={completedSteps} color="text-primary/60" ui={ui} />
            </div>
            <div>
              <p className="text-[9px] text-secondary/60 uppercase tracking-wider mb-1">{ui.failed_label}</p>
              <StepList steps={failedSteps} color="text-secondary/60" ui={ui} />
            </div>
            {blockedSteps.length > 0 && (
              <div className="col-span-2">
                <p className="text-[9px] text-amber-400/60 uppercase tracking-wider mb-1">{ui.blocked}</p>
                <StepList steps={blockedSteps} color="text-amber-400/60" ui={ui} />
              </div>
            )}
            {pendingSteps.length > 0 && (
              <div className="col-span-2">
                <p className="text-[9px] text-white/25 uppercase tracking-wider mb-1">{ui.pending}</p>
                <StepList steps={pendingSteps} color="text-white/30" ui={ui} />
              </div>
            )}
          </div>
        </div>

        {/* ── BLOCK 6: ESCALATION READINESS ───────────────── */}
        <div className="space-y-2">
          <p className="text-[9px] font-bold uppercase tracking-widest text-white/20">{fwDiag ? '⑥' : '⑤'} {ui.escalation}</p>
          <div
            className={`rounded-xl px-4 py-3 border ${escalationReady ? 'border-secondary/30' : 'border-white/8'}`}
            style={{ background: escalationReady ? 'rgba(40,10,25,0.6)' : 'rgba(255,255,255,0.03)' }}
          >
            <div className="flex items-center gap-2 mb-1.5">
              <div className={`w-2 h-2 rounded-full ${escalationReady ? 'bg-secondary animate-pulse' : 'bg-primary'}`} />
              <span className={`text-xs font-semibold ${escalationReady ? 'text-secondary' : 'text-primary'}`}>
                {escalationReady ? ui.ready_escalation : ui.continue_ts}
              </span>
            </div>
            <ul className="space-y-0.5">
              {escalationReasons.map((r, i) => (
                <li key={i} className="text-[11px] text-white/40">· {r}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* ── DEBUG PANEL ──────────────────────────────────── */}
        <div>
          <button
            onClick={() => setShowDebug(!showDebug)}
            className="flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-wider text-white/15 hover:text-white/40"
          >
            {ui.debug_label}
            {showDebug ? <ChevronUp className="w-2.5 h-2.5" /> : <ChevronDown className="w-2.5 h-2.5" />}
          </button>
          {showDebug && _debug && (
            <div className="mt-2 bg-black/20 rounded-xl p-3 text-[10px] font-mono text-white/30 space-y-1">
              {Object.entries(_debug).map(([k, v]) => (
                <div key={k} className="flex gap-2 flex-wrap">
                  <span className="text-white/20 min-w-[150px] shrink-0">{k}:</span>
                  <span className={v === true ? 'text-primary' : v === false ? 'text-secondary/60' : 'text-white/40'}>
                    {Array.isArray(v) ? v.join(', ') || '—' : String(v) || '—'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </motion.div>
  );
}