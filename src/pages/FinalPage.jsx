// ============================================================
// FINAL PAGE — Post-troubleshooting documentation hub
// Shows: full step history, module-based email builder,
// case summary, escalation — ALL LOCAL, ZERO AI credits.
// ============================================================

import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, MinusCircle, Clock, ChevronDown, ChevronUp, RotateCcw, AlertTriangle, Copy, Mail, FileText, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { getSession, getSettings } from '@/lib/sessionStore';
import { runDecisionEngine } from '@/lib/decisionEngine';
import { buildDiagnosticTimeline, determineFinalState, buildAutoCaseSummary, buildCleanCaseSummary } from '@/lib/diagnosticMemory';
import { EMAIL_MODULES, assembleEmail, suggestModules, getModuleText } from '@/lib/emailModules';
import { getUI } from '@/lib/uiTranslations';
import EscalationForm from '@/components/troubleshoot/EscalationForm';
import SaveToKBButton from '@/components/kb/SaveToKBButton';
import { resolveStep } from '@/lib/stepTranslations.js';
import { buildHardwareProcessEmail, buildProcessSummary, classifyProcess } from '@/lib/processEngine';
import { shouldUseAnalysisAwareEmail, buildAnalysisAwareEmail } from '@/lib/analysisEmailEngine';


const MISSING_INFO_LABELS = {
  de: {
    title: 'FEHLENDE INFORMATIONEN VOR ESKALATION',
    connectivity: 'Verbindungstyp (USB / WLAN / LAN)',
    os: 'Betriebssystem',
    serial: 'Scanner-Seriennummer',
    address: 'Kundenadresse',
    scan_count: 'Scananzahl / Lifetime Counter',
    country: 'Land des Kunden',
    button: 'Kunden-E-Mail zur Anforderung fehlender Informationen erstellen',
    customerEmailTitle: 'KUNDEN-E-MAIL — ANFORDERUNG FEHLENDER INFORMATIONEN',
    copyEmail: 'E-Mail kopieren',
  },
  en: {
    title: 'MISSING INFORMATION BEFORE ESCALATION',
    connectivity: 'Connectivity type (USB / Wi-Fi / LAN)',
    os: 'Operating system',
    serial: 'Scanner serial number',
    address: 'Customer address',
    scan_count: 'Scan count / Lifetime counter',
    country: 'Customer country',
    button: 'Generate customer email to request missing information',
    customerEmailTitle: 'CUSTOMER EMAIL — MISSING INFORMATION REQUEST',
    copyEmail: 'Copy Email',
  }
};

function buildMissingInfoEmail(lang, model) {
  const l = (lang || 'de').toLowerCase();
  if (l === 'de') {
    return `Guten Tag,

vielen Dank für Ihre Geduld, während wir den gemeldeten Fall zu Ihrem ${model || 'Scanner'} weiter prüfen.

Damit wir die nächsten Schritte korrekt einleiten können, benötigen wir bitte noch folgende Informationen:

- Verbindungstyp (USB / WLAN / LAN)
- Betriebssystem
- Scanner-Seriennummer
- Kundenadresse
- Scananzahl / Lifetime Counter
- Land des Kunden

Bitte antworten Sie direkt auf diese E-Mail, damit alle Informationen zentral im bestehenden Vorgang dokumentiert bleiben.

Mit freundlichen Grüßen
PFU Support Team`;
  }
  return `Dear Customer,

Thank you for your continued patience while we work to resolve the issue with your ${model || 'scanner'}.

To proceed with the next steps, we require the following additional information:

- Connectivity type (USB / Wi-Fi / LAN)
- Operating system
- Scanner serial number
- Customer address
- Scan count / Lifetime counter
- Customer country

Please reply directly to this email so all information remains documented in the existing case.

Kind regards
PFU Support Team`;
}

const pageStyle = {
  background: 'radial-gradient(ellipse at 20% 50%, rgba(13,40,44,0.9) 0%, rgba(8,8,16,1) 50%, rgba(28,10,25,0.85) 100%)',
  minHeight: '100vh',
};

const STATUS_ICON = {
  solved:           <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />,
  done:             <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />,
  not_solved:       <XCircle className="w-3.5 h-3.5 text-secondary shrink-0 mt-0.5" />,
  not_possible:     <MinusCircle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />,
  waiting_customer: <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />,
  skipped:          <MinusCircle className="w-3.5 h-3.5 text-white/20 shrink-0 mt-0.5" />,
  blocked:          <MinusCircle className="w-3.5 h-3.5 text-white/20 shrink-0 mt-0.5" />,
};

function Section({ title, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-5 py-3.5 text-left hover:bg-white/[0.02] transition-colors"
      >
        <span className="text-xs font-semibold uppercase tracking-widest text-white/40">{title}</span>
        {open ? <ChevronUp className="w-3.5 h-3.5 text-white/20" /> : <ChevronDown className="w-3.5 h-3.5 text-white/20" />}
      </button>
      {open && <div className="px-5 pb-5">{children}</div>}
    </div>
  );
}

// ── Email Module Builder ─────────────────────────────────────

const EXTRA_REQUEST_MODULES = [
  {
    key: 'request_error_screenshot',
    category: 'request',
    label: { de: 'Fehlermeldung als Screenshot anfordern', en: 'Request screenshot of the error message' },
    text: { de: 'Bitte senden Sie uns einen Screenshot der vollständigen Fehlermeldung.', en: 'Please send us a screenshot of the full error message.' },
  },
  {
    key: 'request_device_manager_photo',
    category: 'request',
    label: { de: 'Geräte-Manager Screenshot/Foto anfordern', en: 'Request Device Manager screenshot/photo' },
    text: { de: 'Bei USB-Problemen senden Sie uns bitte zusätzlich einen Screenshot oder ein Foto aus dem Windows-Geräte-Manager, auf dem der Scanner bzw. das unbekannte Gerät sichtbar ist.', en: 'For USB issues, please also send a screenshot or photo from Windows Device Manager showing the scanner or unknown device.' },
  },
  {
    key: 'request_sshome_version',
    category: 'request',
    label: { de: 'ScanSnap Home (SSH) Version anfragen', en: 'Request ScanSnap Home version' },
    text: { de: 'Bitte teilen Sie uns außerdem mit, welche ScanSnap Home Version aktuell installiert ist.', en: 'Please also let us know which ScanSnap Home version is currently installed.' },
  },
  {
    key: 'request_firmware_version',
    category: 'request',
    label: { de: 'Firmware-Version anfragen', en: 'Request firmware version' },
    text: { de: 'Bitte teilen Sie uns zusätzlich die aktuell installierte Firmware-Version des Scanners mit.', en: 'Please also let us know the scanner firmware version currently installed.' },
  },
  {
    key: 'request_os_version',
    category: 'request',
    label: { de: 'Betriebssystem anfragen', en: 'Request operating system' },
    text: { de: 'Bitte nennen Sie uns außerdem Ihr Betriebssystem inklusive Versionsstand.', en: 'Please also tell us which operating system and version you are using.' },
  },
];

function getSuggestedExtraModules(session) {
  const text = `${session?.problem || ''} ${session?.connectionType || ''} ${session?.issueType || ''} ${(session?.performedSteps || []).map(s => s.title || '').join(' ')}`.toLowerCase();
  const result = [];
  if (/usb|geräte-manager|device manager|nicht erkannt|not detect|0x80211001/.test(text)) {
    result.push('request_device_manager_photo', 'request_error_screenshot', 'request_os_version', 'request_sshome_version');
  }
  if (/firmware|update|recovery/.test(text)) {
    result.push('request_firmware_version');
  }
  if (!session?.os) result.push('request_os_version');
  if (/scansnap home|installation|pfussmon|software|ocr|image processing|home/.test(text)) {
    result.push('request_sshome_version');
  }
  return Array.from(new Set(result));
}

function buildExtraRequestLines(selectedExtraKeys, lang) {
  const selectedExtra = EXTRA_REQUEST_MODULES.filter(mod => selectedExtraKeys.includes(mod.key));
  if (!selectedExtra.length) return '';
  const intro = lang === 'de'
    ? 'Für die weitere Prüfung benötigen wir bitte noch folgende Informationen:'
    : 'For the further review, we still need the following information:';
  return `${intro}\n\n${selectedExtra.map(mod => `- ${mod.text[lang] || mod.text.en}`).join('\n')}`;
}

function EmailBuilder({ session, brain, lang }) {
  const baseSuggested = useMemo(() => suggestModules(session, brain), [session, brain]);
  const extraSuggested = useMemo(() => getSuggestedExtraModules(session), [session]);
  const suggested = useMemo(() => Array.from(new Set([...(baseSuggested || []), ...extraSuggested])), [baseSuggested, extraSuggested]);
  const [selected, setSelected] = useState(suggested);
  const [emailText, setEmailText] = useState('');
  const [built, setBuilt] = useState(false);
  const ui = getUI(lang);
  const extraKeys = EXTRA_REQUEST_MODULES.map(m => m.key);

  const groups = {
    troubleshooting: Object.values(EMAIL_MODULES).filter(m => m.category === 'troubleshooting'),
    request: [...Object.values(EMAIL_MODULES).filter(m => m.category === 'request'), ...EXTRA_REQUEST_MODULES],
    status: Object.values(EMAIL_MODULES).filter(m => m.category === 'status' && m.key !== 'greeting' && m.key !== 'closing'),
  };

  const GROUP_LABELS = {
    troubleshooting: { de: 'Troubleshooting-Schritte', en: 'Troubleshooting Steps', fr: 'Étapes de dépannage', es: 'Pasos de resolución', pt: 'Etapas de resolução', it: 'Passaggi di risoluzione', nl: 'Probleemoplossing stappen', ja: 'トラブルシューティング手順', zh: '故障排除步骤' },
    request: { de: 'Informationsanfragen', en: 'Information Requests', fr: 'Demandes d\'informations', es: 'Solicitudes de información', pt: 'Solicitações de informação', it: 'Richieste di informazioni', nl: 'Informatieverzoeken', ja: '情報要求', zh: '信息请求' },
    status: { de: 'Statusmeldungen', en: 'Status Messages', fr: 'Messages de statut', es: 'Mensajes de estado', pt: 'Mensagens de status', it: 'Messaggi di stato', nl: 'Statusberichten', ja: 'ステータスメッセージ', zh: '状态消息' },
  };

  const toggle = (key) => {
    setBuilt(false);
    setSelected(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
  };

  const buildEmail = () => {
    const baseSelected = selected.filter(key => !extraKeys.includes(key));
    const selectedExtra = selected.filter(key => extraKeys.includes(key));
    let text = '';
    try {
      text = assembleEmail(baseSelected, lang, session?.supporterName || '', session);
    } catch (err) {
      console.error('Email generation failed:', err);
      text = assembleEmail(baseSelected, lang, session?.supporterName || '', session);
    }

    const extraBlock = buildExtraRequestLines(selectedExtra, lang);
    if (extraBlock) {
      const closingDE = 'Mit freundlichen Grüßen';
      const closingEN = 'Kind regards';
      if (lang === 'de' && text.includes(closingDE)) {
        text = text.replace(closingDE, `${extraBlock}\n\n${closingDE}`);
      } else if (lang !== 'de' && text.includes(closingEN)) {
        text = text.replace(closingEN, `${extraBlock}\n\n${closingEN}`);
      } else {
        text = `${text.trim()}\n\n${extraBlock}`;
      }
    }
    setEmailText(text);
    setBuilt(true);
  };

  const copy = () => { navigator.clipboard.writeText(emailText); toast.success('Email copied'); };

  return (
    <div className="space-y-4">
      {Object.entries(groups).map(([groupKey, modules]) => (
        <div key={groupKey}>
          <p className="text-[9px] font-bold uppercase tracking-widest text-white/25 mb-2">
            {GROUP_LABELS[groupKey][lang] || GROUP_LABELS[groupKey].en}
          </p>
          <div className="space-y-1.5">
            {modules.map(mod => {
              const isSuggested = suggested.includes(mod.key);
              const isSelected = selected.includes(mod.key);
              const label = mod.label[lang] || mod.label.en;
              return (
                <button
                  key={mod.key}
                  onClick={() => toggle(mod.key)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-left transition-all ${isSelected ? 'bg-primary/12 border border-primary/30' : 'bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06]'}`}
                >
                  <div className={`w-4 h-4 rounded flex items-center justify-center border transition-all shrink-0 ${isSelected ? 'bg-primary border-primary' : 'border-white/20'}`}>
                    {isSelected && <CheckCircle2 className="w-3 h-3 text-white" />}
                  </div>
                  <span className={`text-xs ${isSelected ? 'text-white/80' : 'text-white/40'}`}>{label}</span>
                  {isSuggested && <span className="ml-auto text-[9px] text-primary/60 uppercase tracking-wider shrink-0">suggested</span>}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      <div className="flex gap-2 pt-1">
        <Button
          onClick={buildEmail}
          disabled={selected.length === 0}
          className="flex-1 bg-primary/90 hover:bg-primary text-white h-10 text-sm"
        >
          <Mail className="w-4 h-4 mr-2" />
          {ui.generate_email || 'Assemble Email'}
        </Button>
      </div>

      <AnimatePresence>
        {built && emailText && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <div className="rounded-xl overflow-hidden" style={{ background: 'rgba(248,248,252,0.98)', border: '1px solid rgba(45,212,191,0.2)' }}>
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-black/6">
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-primary" />
                  <span className="text-xs font-semibold text-black">{ui.customer_email}</span>
                  <span className="text-[9px] text-black/30 uppercase tracking-wider">LOCAL · NO AI</span>
                </div>
                <Button size="sm" onClick={copy} className="h-7 text-xs bg-primary hover:bg-primary/90 text-white">
                  <Copy className="w-3 h-3 mr-1.5" />
                  {ui.copy_email}
                </Button>
              </div>
              <pre className="p-4 text-xs text-black/70 leading-relaxed whitespace-pre-wrap font-sans">{emailText}</pre>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Case Summary ─────────────────────────────────────────────
 ─────────────────────────────────────────────


function LocalCaseSummary({ session, lang }) {
  const [summaryLang, setSummaryLang] = useState('en');
  const steps = session?.steps || [];
  const model = session?.model || session?.device || session?.knownFacts?.model || 'Not provided';
  const issue = session?.problem || 'Not provided';
  const connection = session?.connectionType || session?.knownFacts?.connectionType || 'Not provided';

  const visible = steps.filter(s => s.status && s.status !== 'pending');
  const solved = steps.find(s => s.status === 'solved');
  const failed = visible.filter(s => ['not_solved', 'not_possible', 'blocked'].includes(s.status));
  const waiting = visible.find(s => s.status === 'waiting_customer');

  const cleanTitle = (step, target = 'en') => {
    const raw = String(step?.title || step?.instruction || step?.body || step?.stepId || 'Step').trim();
    if (target === 'en') {
      if (raw.includes('Direkte USB-Verbindung')) return 'Checked direct USB connection';
      if (raw.includes('Anderen USB-Anschluss')) return 'Tested another USB port and cable';
      if (raw.includes('Geräte-Manager')) return 'Checked Windows Device Manager detection';
      if (raw.includes('Scanner in ScanSnap Home entfernen')) return 'Removed and reconnected scanner in ScanSnap Home';
      if (raw.includes('ScanSnap Home bereinigen')) return 'Prepared ScanSnap Home cleanup and reinstall';
      if (raw.includes('Windows-Systemintegrität')) return 'Checked Windows system integrity (SFC/DISM)';
      if (raw.includes('WLAN-Status')) return 'Checked scanner Wi-Fi status';
      if (raw.includes('Scanner und Computer im selben Netzwerk')) return 'Checked scanner and computer are on the same network';
      if (raw.includes('Router')) return 'Checked router / 2.4 GHz network';
      if (raw.includes('Hotspot')) return 'Performed hotspot or direct connection test';
      if (raw.includes('Firmwareupdate')) return 'Checked firmware update via ScanSnap Home';
      if (raw.includes('Firmware-Recovery')) return 'Prepared firmware recovery only if recovery state is confirmed';
    }
    return raw;
  };

  const buildSummary = (target) => {
    const en = target === 'en';
    const lines = [];

    if (en) {
      lines.push('Issue');
      lines.push(`Customer reported: ${issue}`);
      lines.push(`Product: ${model}`);
      lines.push(`Connection: ${connection}`);
      lines.push('');
      lines.push('Action');
      if (!visible.length) {
        lines.push('No troubleshooting steps have been documented yet.');
      } else {
        visible.forEach(s => lines.push(`- ${cleanTitle(s, 'en')}: ${String(s.status || '').replaceAll('_', ' ')}`));
      }
      lines.push('');
      lines.push('Result');
      if (solved) lines.push(`Issue resolved after: ${cleanTitle(solved, 'en')}.`);
      else if (waiting) lines.push(`Awaiting customer response regarding: ${cleanTitle(waiting, 'en')}.`);
      else if (failed.length >= 3) lines.push('The documented troubleshooting did not resolve the issue. Next step: remote session, escalation, or hardware process depending on the case context.');
      else lines.push('Troubleshooting is still in progress. Additional feedback or information is required.');
      return lines.join('\n');
    }

    lines.push('Issue');
    lines.push(`Kundenmeldung: ${issue}`);
    lines.push(`Produkt: ${model}`);
    lines.push(`Verbindung: ${connection}`);
    lines.push('');
    lines.push('Action');
    if (!visible.length) {
      lines.push('Es wurden noch keine Troubleshooting-Schritte dokumentiert.');
    } else {
      visible.forEach(s => lines.push(`- ${cleanTitle(s, 'de')}: ${String(s.status || '').replaceAll('_', ' ')}`));
    }
    lines.push('');
    lines.push('Result');
    if (solved) lines.push(`Problem gelöst nach: ${cleanTitle(solved, 'de')}.`);
    else if (waiting) lines.push(`Warten auf Kundenrückmeldung zu: ${cleanTitle(waiting, 'de')}.`);
    else if (failed.length >= 3) lines.push('Die dokumentierten Maßnahmen haben das Problem nicht behoben. Nächster Schritt: Remote-Session, Eskalation oder Hardwareprozess je nach Fallkontext.');
    else lines.push('Fehlersuche läuft weiter. Weitere Rückmeldung oder zusätzliche Informationen erforderlich.');
    return lines.join('\n');
  };

  const text = buildSummary(summaryLang);
  const copy = () => { navigator.clipboard.writeText(text); toast.success(summaryLang === 'en' ? 'English case summary copied' : 'Fallzusammenfassung kopiert'); };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] text-white/30 uppercase tracking-widest">
          {summaryLang === 'en' ? 'English case summary' : 'Deutsche Fallzusammenfassung'}
        </span>
        <div className="flex items-center gap-1 rounded-full p-1" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <button type="button" onClick={() => setSummaryLang('de')} className={`px-3 py-1 rounded-full text-[10px] transition-all ${summaryLang !== 'en' ? 'bg-primary/20 text-primary' : 'text-white/35 hover:text-white/60'}`}>
            Deutsch
          </button>
          <button type="button" onClick={() => setSummaryLang('en')} className={`px-3 py-1 rounded-full text-[10px] transition-all ${summaryLang === 'en' ? 'bg-primary/20 text-primary' : 'text-white/35 hover:text-white/60'}`}>
            English
          </button>
        </div>
      </div>
      <div className="rounded-xl p-4 font-mono text-xs text-white/60 leading-relaxed whitespace-pre-wrap" style={{ background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(255,255,255,0.05)' }}>
        {text || '(No steps executed yet)'}
      </div>
      <Button size="sm" variant="outline" onClick={copy} className="h-8 text-xs border-white/10 text-white/40 hover:text-white/70">
        <Copy className="w-3.5 h-3.5 mr-1.5" />
        Copy
      </Button>
    </div>
  );
}


// ── Step History List ────────────────────────────────────────

function StepHistoryList({ steps, lang }) {
  if (!steps || steps.length === 0) return <p className="text-xs text-white/25 italic">No steps performed.</p>;

  return (
    <div className="space-y-2">
      {steps.map((s, i) => {
        const resolved = s.stepId
          ? resolveStep(s.stepId, lang)
          : { title: s.title || '(unnamed)', body: s.instruction || '' };
        const icon = STATUS_ICON[s.status] || STATUS_ICON.skipped;
        const statusColor = {
          solved: 'text-primary/70',
          done: 'text-primary/70',
          not_solved: 'text-secondary/70',
          not_possible: 'text-amber-400/70',
          waiting_customer: 'text-amber-400/70',
          skipped: 'text-white/25',
          blocked: 'text-white/25',
          pending: 'text-white/20',
        }[s.status] || 'text-white/30';

        return (
          <div key={i} className="flex items-start gap-2.5 px-3 py-2.5 rounded-xl"
            style={{ background: 'rgba(255,255,255,0.025)' }}>
            {icon}
            <div className="flex-1 min-w-0">
              <p className={`text-xs font-medium leading-snug ${statusColor}`}>{resolved.title}</p>
              {s.note && <p className="text-[10px] text-white/25 italic mt-0.5">{s.note}</p>}
            </div>
            <span className="text-[9px] text-white/20 uppercase tracking-wider shrink-0">{s.status?.replace('_', ' ')}</span>
          </div>
        );
      })}
    </div>
  );
}


function HardwareProcessPanel({ session, lang }) {
  const process = classifyProcess(session);
  const summary = buildProcessSummary(session, lang);
  const [emailText, setEmailText] = useState('');

  const build = () => setEmailText(buildHardwareProcessEmail(session, lang));
  const copy = () => { navigator.clipboard.writeText(emailText); toast.success(lang === 'en' ? 'Process email copied' : 'Prozess-E-Mail kopiert'); };

  return (
    <div className="space-y-3">
      <div className="rounded-xl p-4" style={{ background: process.recommendedProcess === 'advance_exchange' ? 'rgba(45,212,191,0.06)' : 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="flex items-center justify-between gap-2 mb-2">
          <p className="text-sm font-semibold text-white/75">{summary.title}</p>
          <span className="text-[9px] uppercase tracking-widest text-primary/70 border border-primary/20 rounded-full px-2 py-1">
            {process.recommendedProcess === 'advance_exchange' ? (lang === 'en' ? 'Ready' : 'Bereit') : (lang === 'en' ? 'Check' : 'Prüfen')}
          </span>
        </div>
        <p className="text-xs text-white/38 leading-relaxed">{summary.text}</p>
      </div>

      <Button onClick={build} className="w-full bg-primary/90 hover:bg-primary text-white h-10 text-sm">
        <Mail className="w-4 h-4 mr-2" />
        {lang === 'en' ? 'Create customer email for hardware process' : 'Kunden-E-Mail für Hardwareprozess erstellen'}
      </Button>

      {emailText && (
        <div className="rounded-xl overflow-hidden" style={{ background: 'rgba(248,248,252,0.98)', border: '1px solid rgba(45,212,191,0.2)' }}>
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-black/6">
            <span className="text-xs font-semibold text-black">{lang === 'en' ? 'Customer email' : 'Kunden-E-Mail'}</span>
            <Button size="sm" onClick={copy} className="h-7 text-xs bg-primary hover:bg-primary/90 text-white">
              <Copy className="w-3 h-3 mr-1.5" />
              {lang === 'en' ? 'Copy' : 'Kopieren'}
            </Button>
          </div>
          <pre className="p-4 text-xs text-black/70 leading-relaxed whitespace-pre-wrap font-sans">{emailText}</pre>
        </div>
      )}
    </div>
  );
}

// ── MAIN ─────────────────────────────────────────────────────

export default function FinalPage() {
  const navigate = useNavigate();
  const session = getSession();
  const settings = getSettings();
  const lang = (settings.emailLanguage || 'de').toLowerCase();
  const ui = getUI(lang);

  const brain = useMemo(
    () => runDecisionEngine(session, session.kbEntry || null, lang),
    [session, lang]
  );

  const steps = session?.steps || [];
  const completed = steps.filter(s => ['solved', 'done'].includes(s.status));
  const failed = steps.filter(s => ['not_solved', 'not_possible'].includes(s.status));
  const skipped = steps.filter(s => ['skipped', 'blocked'].includes(s.status));
  const pending = steps.filter(s => s.status === 'pending');

  const isSolved = session?.status === 'solved';
  const isExhausted = session?.status === 'exhausted';

  const [showEscalation, setShowEscalation] = useState(false);

  return (
    <div style={pageStyle} className="pt-14 pb-16 px-5">
      <div className="max-w-xl mx-auto space-y-4 pt-6">

        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <button
            onClick={() => navigate('/troubleshoot')}
            className="flex items-center gap-1.5 text-sm text-white/30 hover:text-white/60 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {ui.back || 'Back'}
          </button>
          {(session.model || session.device) && (
            <span className="text-[10px] font-bold text-primary/50 tracking-wider uppercase">
              {(session.model || session.device).toUpperCase()}
            </span>
          )}
        </div>

        {/* Status */}
        <div className={`flex items-center gap-2.5 rounded-2xl px-5 py-4 border ${
          isSolved ? 'border-primary/25 bg-primary/[0.05]' : 'border-secondary/20 bg-secondary/[0.04]'
        }`}>
          {isSolved
            ? <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
            : <AlertTriangle className="w-5 h-5 text-secondary shrink-0" />
          }
          <div>
            <p className={`text-sm font-semibold ${isSolved ? 'text-primary' : 'text-secondary'}`}>
              {isSolved ? (ui.solved || 'Issue Resolved') : (ui.steps_exhausted || 'Steps Exhausted')}
            </p>
            <p className="text-[10px] text-white/30 mt-0.5">
              {completed.length} ✓ · {failed.length} ✗ · {skipped.length} skipped
            </p>
          </div>
        </div>

        {/* Step history */}
        <Section title={`${ui.ts_progress || 'Troubleshooting History'} · ${steps.filter(s => s.status !== 'pending').length} steps`}>
          <StepHistoryList steps={steps} lang={lang} />
        </Section>

        {/* Email builder */}
        <Section title={ui.customer_email || 'Customer Email'} defaultOpen={true}>
          <EmailBuilder session={session} brain={brain} lang={lang} />
        </Section>

        {/* Case summary */}
        <Section title={ui.case_summary || 'Case Summary'} defaultOpen={false}>
          <LocalCaseSummary session={session} lang={lang} />
        </Section>

        {/* Escalation — always available, dropdown-template based */}
        <Section title={ui.prepare_escalation || 'Escalation / Request'} defaultOpen={false}>
          <EscalationForm steps={steps} kbEntry={session.kbEntry} session={session} />
        </Section>

        <Section title={lang === 'en' ? 'Hardware Process / Advance Exchange' : 'Hardwareprozess / Advance Exchange'} defaultOpen={false}>
          <HardwareProcessPanel session={session} lang={lang} />
        </Section>

        {/* Save to KB */}
        <SaveToKBButton session={session} />

        {/* New case */}
        <div className="flex justify-center pt-2">
          <Button onClick={() => navigate('/')} variant="ghost" className="text-white/30 hover:text-white/60">
            <RotateCcw className="w-4 h-4 mr-2" />
            {ui.new_search}
          </Button>
        </div>

        {/* Debug strip */}
        <div className="rounded-xl px-4 py-3 text-[9px] font-mono text-white/15 space-y-0.5"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
          <div>MODE: LOCAL ONLY · AI USED: NO · AI CALLS THIS SESSION: 0</div>
          <div>LANGUAGE: {lang.toUpperCase()} · EMAIL: MODULE-BASED LOCAL ASSEMBLY</div>
          <div>KB MATCH: {session.kbEntry ? session.kbEntry.case_id || 'yes' : 'none'} · MODEL: {session.model || '?'}</div>
          <div>GENERATED FROM LOCAL MODULES: YES · MISSING TRANSLATIONS: {brain.missingInfo?.length > 0 ? 'CHECK' : 'NO'}</div>
        </div>

      </div>
    </div>
  );
}