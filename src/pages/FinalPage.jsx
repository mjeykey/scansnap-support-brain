// ============================================================
// FINAL PAGE — Post-troubleshooting documentation hub
// Shows: full step history, module-based email builder,
// case summary, escalation — ALL LOCAL, ZERO AI credits.
// ============================================================

import React, { useState, useMemo, useEffect } from 'react';
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


function sourceOpening(session, lang = 'de') {
  const source = session?.contactSource || session?.source || session?.knownFacts?.contactSource || 'email';
  const isEn = String(lang).toLowerCase().startsWith('en');
  const isPt = String(lang).toLowerCase().startsWith('pt');

  if (isPt) {
    const map = {
      phone: 'Obrigado pelo seu telefonema para o PFU Support hoje.',
      email: 'Obrigado pelo seu e-mail.',
      live_chat: 'Obrigado pelo contacto através do Live Chat.',
      webportal: 'Obrigado pelo seu pedido através do Webportal.',
      self_registration_portal: 'Obrigado pelo seu pedido através do portal de autorregisto.',
      online: 'Obrigado pelo seu pedido online.',
    };
    return `Bom dia,\n\n${map[source] || map.email}`;
  }

  if (isEn) {
    const map = {
      phone: 'Thank you for calling PFU Support today.',
      email: 'Thank you for your email.',
      live_chat: 'Thank you for contacting us via Live Chat.',
      webportal: 'Thank you for your request via the web portal.',
      self_registration_portal: 'Thank you for your request via the self-registration portal.',
      online: 'Thank you for your online request.',
    };
    return `Hello,\n\n${map[source] || map.email}`;
  }

  const map = {
    phone: 'Vielen Dank für Ihren Anruf beim PFU Support heute.',
    email: 'vielen Dank für Ihre E-Mail.',
    live_chat: 'vielen Dank für den Kontakt über den Live Chat.',
    webportal: 'vielen Dank für Ihre Anfrage über das Webportal.',
    self_registration_portal: 'vielen Dank für Ihre Anfrage über das Selbstregistrierungsportal.',
    online: 'vielen Dank für Ihre Online-Anfrage.',
  };
  return `Guten Tag,\n\n${map[source] || map.email}`;
}


// ── Email Module Builder ─────────────────────────────────────

function EmailBuilder({ session, brain, lang }) {
  const suggested = useMemo(() => suggestModules(session, brain), [session, brain]);
  const [selected, setSelected] = useState(suggested);
  const [selectedScreenshotDetails, setSelectedScreenshotDetails] = useState(['error_message']);
  const [emailText, setEmailText] = useState('');
  const [built, setBuilt] = useState(false);
  const ui = getUI(lang);

  const groups = {
    troubleshooting: Object.values(EMAIL_MODULES).filter(m => m.category === 'troubleshooting'),
    request: Object.values(EMAIL_MODULES).filter(m => m.category === 'request'),
    status: Object.values(EMAIL_MODULES).filter(m => m.category === 'status' && m.key !== 'greeting' && m.key !== 'closing'),
  };

  const GROUP_LABELS = {
    troubleshooting: { de: 'Troubleshooting-Schritte', en: 'Troubleshooting Steps', fr: 'Étapes de dépannage', es: 'Pasos de resolución', pt: 'Etapas de resolução', it: 'Passaggi di risoluzione', nl: 'Probleemoplossing stappen', ja: 'トラブルシューティング手順', zh: '故障排除步骤' },
    request: { de: 'Informationsanfragen', en: 'Information Requests', fr: "Demandes d'informations", es: 'Solicitudes de información', pt: 'Solicitações de informação', it: 'Richieste di informazioni', nl: 'Informatieverzoeken', ja: '情報要求', zh: '信息请求' },
    status: { de: 'Statusmeldungen', en: 'Status Messages', fr: 'Messages de statut', es: 'Mensajes de estado', pt: 'Mensagens de status', it: 'Messaggi di stato', nl: 'Statusberichten', ja: 'ステータスメッセージ', zh: '状态消息' },
  };


  const SCREENSHOT_DETAIL_OPTIONS = [
    {
      key: 'error_message',
      label: { de: 'Fehlermeldung', en: 'Error message' },
      text: { de: 'Screenshot der vollständigen Fehlermeldung', en: 'Screenshot of the full error message' },
    },
    {
      key: 'device_manager',
      label: { de: 'Geräte-Manager', en: 'Device Manager' },
      text: { de: 'Screenshot oder Foto aus dem Windows-Geräte-Manager, auf dem der Scanner bzw. das unbekannte Gerät sichtbar ist', en: 'Screenshot or photo from Windows Device Manager showing the scanner or unknown device' },
    },
    {
      key: 'scanner_display_led',
      label: { de: 'Scanner-Display / LED', en: 'Scanner display / LED' },
      text: { de: 'Foto des Scanner-Displays bzw. der aktuellen LED-Anzeige', en: 'Photo of the scanner display or current LED indicator' },
    },
    {
      key: 'scanner_behavior_video',
      label: { de: 'Kurzes Video', en: 'Short video' },
      text: { de: 'Falls möglich, ein kurzes Video des Scannerverhaltens (max. 30 Sekunden)', en: 'If possible, a short video of the scanner behaviour (max. 30 seconds)' },
    },
    {
      key: 'scansnap_home_screen',
      label: { de: 'ScanSnap Home Fenster', en: 'ScanSnap Home screen' },
      text: { de: 'Screenshot des betroffenen ScanSnap Home Fensters bzw. der Scanner-Informationen', en: 'Screenshot of the affected ScanSnap Home window or scanner information' },
    },
    {
      key: 'scan_result',
      label: { de: 'Scan-Ergebnis', en: 'Scan result' },
      text: { de: 'Beispielscan oder Screenshot des fehlerhaften Scan-Ergebnisses', en: 'Sample scan or screenshot of the incorrect scan result' },
    },
  ];

  const screenshotDetailText = (key) => {
    const option = SCREENSHOT_DETAIL_OPTIONS.find(item => item.key === key);
    if (!option) return '';
    return option.text[lang] || option.text.de || option.text.en || '';
  };

  const moduleStepPatterns = {
    usb_direct: /usb|direkt|direct|anschluss|cable|kabel/i,
    firmware_update_normal: /firmware|update/i,
    sshomeclean: /sshome|cleanup|bereinig|reinstall|neu install|scansnap home/i,
    sfc_dism: /sfc|dism|integrity|systemintegrität|windows/i,
    device_manager_usb: /geräte-manager|device manager|usb-stack|usb stack/i,
    firmware_recovery_instructions: /recovery|top sensor|empty arm|firmware-wiederherstellung/i,
  };

  const normalize = (value) => String(value || '').toLowerCase();
  const getText = (key) => getModuleText(key, lang) || getModuleText(key, 'de') || getModuleText(key, 'en') || '';
  const isDe = normalize(lang).startsWith('de');

  const resultLabel = (status) => {
    const de = {
      solved: 'Problem behoben',
      done: 'durchgeführt',
      not_solved: 'durchgeführt, Problem nicht behoben',
      not_possible: 'nicht möglich',
      skipped: 'übersprungen',
      blocked: 'blockiert',
      waiting_customer: 'wartet auf Rückmeldung',
    };
    const en = {
      solved: 'issue resolved',
      done: 'completed',
      not_solved: 'completed, issue not resolved',
      not_possible: 'not possible',
      skipped: 'skipped',
      blocked: 'blocked',
      waiting_customer: 'awaiting customer response',
    };
    return (isDe ? de : en)[status] || status || '';
  };

  const stepTitle = (step) => {
    const raw = step?.title || step?.instruction || step?.body || step?.stepId || (isDe ? 'Schritt' : 'Step');
    return String(raw).replace(/^Ich prüfe gerade\s*[„"']?/i, '').replace(/[„"']$/g, '').trim();
  };

  const selectedTroubleshootingKeys = (keys) =>
    keys.filter(k => EMAIL_MODULES[k]?.category === 'troubleshooting');

  const selectedRequestKeys = (keys) =>
    keys.filter(k => EMAIL_MODULES[k]?.category === 'request');

  const selectedStatusKeys = (keys) =>
    keys.filter(k => EMAIL_MODULES[k]?.category === 'status');

  const addUniqueLine = (lines, line) => {
    const clean = String(line || '')
      .replace(/^[-•]\s*/, '')
      .replace(/^Bitte\s+/i, '')
      .replace(/^Please\s+/i, '')
      .replace(/[.。]\s*$/, '')
      .trim();
    if (!clean) return;
    const key = clean.toLowerCase()
      .replace(/vollständigen|angezeigten|aktuellen|aktuell|bitte|please/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    if (!lines.some(x => x.key === key || x.text.toLowerCase().includes(key) || key.includes(x.key))) {
      lines.push({ key, text: clean });
    }
  };

  const analysisLinesForSelected = (keys) => {
    const tKeys = selectedTroubleshootingKeys(keys);
    if (!tKeys.length) return [];

    const steps = (session?.steps || []).filter(step =>
      ['solved', 'done', 'not_solved', 'not_possible', 'skipped', 'blocked', 'waiting_customer'].includes(step.status)
    );

    return steps.filter(step => {
      const combined = `${step?.title || ''} ${step?.instruction || ''} ${step?.stepId || ''}`;
      return tKeys.some(key => moduleStepPatterns[key]?.test(combined));
    }).map(step => `- ${stepTitle(step)}: ${resultLabel(step.status)}`);
  };

  const requestBlockForSelected = (keys) => {
    const requestKeys = selectedRequestKeys(keys);
    if (!requestKeys.length) return '';

    const lines = [];
    const has = (key) => requestKeys.includes(key);

    if (has('missing_info_request')) {
      if (!session?.os && !session?.knownFacts?.os) addUniqueLine(lines, isDe ? 'Betriebssystem inklusive Version' : 'Operating system including version');
      if (!session?.connectionType && !session?.knownFacts?.connectionType) addUniqueLine(lines, isDe ? 'Verbindungstyp (USB / WLAN / LAN)' : 'Connectivity type (USB / Wi-Fi / LAN)');
      addUniqueLine(lines, isDe ? 'Screenshot der vollständigen Fehlermeldung' : 'Screenshot of the full error message');
    }

    if (has('request_device_manager_photo')) {
      addUniqueLine(lines, isDe
        ? 'Screenshot oder Foto aus dem Windows-Geräte-Manager, auf dem der Scanner bzw. das unbekannte Gerät sichtbar ist'
        : 'Screenshot or photo from Windows Device Manager showing the scanner or unknown device'
      );
    }

    if (has('request_error_screenshot')) {
      addUniqueLine(lines, isDe ? 'Screenshot der vollständigen Fehlermeldung' : 'Screenshot of the full error message');
    }

    if (has('request_os_version')) {
      addUniqueLine(lines, isDe ? 'Betriebssystem inklusive Versionsstand' : 'Operating system including version');
    }

    if (has('request_sshome_version')) {
      addUniqueLine(lines, isDe ? 'Installierte ScanSnap Home Version' : 'Installed ScanSnap Home version');
    }

    if (has('request_firmware_version')) {
      addUniqueLine(lines, isDe ? 'Installierte Firmware-Version des Scanners' : 'Installed scanner firmware version');
    }

    if (has('screenshot_request')) {
      const activeScreenshotDetails = selectedScreenshotDetails.length ? selectedScreenshotDetails : ['error_message'];
      activeScreenshotDetails.forEach(detailKey => addUniqueLine(lines, screenshotDetailText(detailKey)));
    }

    if (!lines.length) return '';
    return `${isDe ? 'Für die nächste Prüfung benötigen wir bitte noch folgende Informationen:' : 'For the next review, we still need the following information:'}

${lines.map(line => `- ${line.text}`).join('\n')}`;
  };

  const statusBlockForSelected = (keys) => {
    const statusKeys = selectedStatusKeys(keys);
    const blocks = [];

    if (statusKeys.includes('waiting_response')) {
      blocks.push(isDe
        ? 'Bitte testen Sie die oben beschriebenen Schritte und teilen Sie uns das Ergebnis mit.'
        : 'Please test the steps described above and let us know the result.'
      );
    }

    if (statusKeys.includes('resolved_confirmation')) {
      const text = getText('resolved_confirmation').trim();
      if (text) blocks.push(text);
    }

    return blocks.join('\n\n');
  };

  const buildSelectedEmail = (keys = selected) => {
    const unique = [...new Set(keys)];
    const model = session?.model || session?.device || session?.knownFacts?.model || (isDe ? 'Scanner' : 'scanner');

    const parts = [];
    parts.push(sourceOpening(session, lang));

    const analysisLines = analysisLinesForSelected(unique);
    if (analysisLines.length) {
      parts.push(isDe
        ? `Gemäß der dokumentierten Analyse wurden die folgenden ausgewählten Schritte für Ihren ${model} bereits durchgeführt:\n\n${analysisLines.join('\n')}`
        : `According to the documented analysis, the following selected steps have already been performed for your ${model}:\n\n${analysisLines.join('\n')}`
      );
    }

    const requestBlock = requestBlockForSelected(unique);
    if (requestBlock) parts.push(requestBlock);

    const statusBlock = statusBlockForSelected(unique);
    if (statusBlock) parts.push(statusBlock);

    let closing = getText('closing');
    closing = closing.replaceAll('[Supporter Name]', session?.supporterName || 'Marina Karlovic');
    parts.push(closing);

    return parts.filter(Boolean).join('\n\n').replace(/\n{3,}/g, '\n\n');
  };

  const toggle = (key) => {
    setSelected(prev => {
      const next = prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key];
      if (key === 'screenshot_request' && !prev.includes(key) && selectedScreenshotDetails.length === 0) {
        setSelectedScreenshotDetails(['error_message']);
      }
      if (built) setEmailText(buildSelectedEmail(next));
      return next;
    });
  };

  const toggleScreenshotDetail = (key) => {
    setSelectedScreenshotDetails(prev => {
      const next = prev.includes(key) ? prev.filter(item => item !== key) : [...prev, key];
      if (built) setEmailText(buildSelectedEmail(selected));
      return next;
    });
  };

  const buildEmail = () => {
    setEmailText(buildSelectedEmail(selected));
    setBuilt(true);
  };

  useEffect(() => {
    if (built) setEmailText(buildSelectedEmail(selected));
  }, [selected, selectedScreenshotDetails, lang]);

  const copy = () => { navigator.clipboard.writeText(emailText); toast.success('Email copied'); };

  return (
    <div className="space-y-4">
      {Object.entries(groups).map(([groupKey, modules]) => (
        <div key={groupKey}>
          <p className="text-[9px] font-bold uppercase tracking-widest text-white/25 mb-2">
            {GROUP_LABELS[groupKey][lang] || GROUP_LABELS[groupKey]['en']}
          </p>
          <div className="space-y-1.5">
            {modules.map(mod => {
              const isSuggested = suggested.includes(mod.key);
              const isSelected = selected.includes(mod.key);
              const label = mod.label[lang] || mod.label['en'];
              return (
                <React.Fragment key={mod.key}>
                  <button
                    onClick={() => toggle(mod.key)}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-left transition-all ${
                      isSelected
                        ? 'bg-primary/12 border border-primary/30'
                        : 'bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06]'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded flex items-center justify-center border transition-all shrink-0 ${
                      isSelected ? 'bg-primary border-primary' : 'border-white/20'
                    }`}>
                      {isSelected && <CheckCircle2 className="w-3 h-3 text-white" />}
                    </div>
                    <span className={`text-xs ${isSelected ? 'text-white/80' : 'text-white/40'}`}>{label}</span>
                    {isSuggested && (
                      <span className="ml-auto text-[9px] text-primary/60 uppercase tracking-wider shrink-0">suggested</span>
                    )}
                  </button>

                  {mod.key === 'screenshot_request' && isSelected && (
                    <div className="ml-7 -mt-0.5 mb-2 rounded-xl border border-primary/15 bg-black/20 px-3 py-2 space-y-1.5">
                      <p className="text-[9px] uppercase tracking-widest text-primary/55 mb-1">
                        {isDe ? 'Screenshot-Untermenü' : 'Screenshot submenu'}
                      </p>
                      {SCREENSHOT_DETAIL_OPTIONS.map(option => {
                        const checked = selectedScreenshotDetails.includes(option.key);
                        const optionLabel = option.label[lang] || option.label.de || option.label.en;
                        return (
                          <button
                            key={option.key}
                            type="button"
                            onClick={() => toggleScreenshotDetail(option.key)}
                            className={`w-full flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-left transition-all ${
                              checked ? 'bg-primary/10 text-white/80' : 'text-white/38 hover:text-white/70 hover:bg-white/[0.04]'
                            }`}
                          >
                            <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 ${checked ? 'bg-primary border-primary' : 'border-white/20'}`}>
                              {checked && <CheckCircle2 className="w-2.5 h-2.5 text-white" />}
                            </div>
                            <span className="text-[11px]">{optionLabel}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </React.Fragment>
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
            <div
              className="rounded-xl overflow-hidden"
              style={{ background: 'rgba(248,248,252,0.98)', border: '1px solid rgba(45,212,191,0.2)' }}
            >
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





function LocalCaseSummary({ session, lang }) {
  const sourceLang = (lang || getSettings()?.emailLanguage || 'de').toLowerCase();
  const [summaryLang, setSummaryLang] = useState(sourceLang);

  useEffect(() => {
    setSummaryLang(sourceLang);
  }, [sourceLang]);
  const steps = session?.steps || [];
  const model = session?.model || session?.device || session?.knownFacts?.model || (summaryLang === 'en' ? 'Not provided' : 'Nicht angegeben');
  const issue = session?.problem || (summaryLang === 'en' ? 'Not provided' : 'Nicht angegeben');
  const connection = session?.connectionType || session?.knownFacts?.connectionType || (summaryLang === 'en' ? 'Not provided' : 'Nicht angegeben');
  const osInfo = session?.os || session?.osType || session?.knownFacts?.os || (summaryLang === 'en' ? 'Not provided' : 'Nicht angegeben');
  const sourceInfo = session?.contactSource || session?.source || session?.knownFacts?.contactSource || (summaryLang === 'en' ? 'Not provided' : 'Nicht angegeben');

  const visible = steps.filter(s => s.status && s.status !== 'pending');
  const solved = steps.find(s => s.status === 'solved');
  const failed = visible.filter(s => ['not_solved', 'not_possible', 'blocked'].includes(s.status));
  const waiting = visible.find(s => s.status === 'waiting_customer');

  const statusLabel = (status, target) => {
    const labels = {
      en: { solved:'resolved', done:'completed', not_solved:'completed, issue not resolved', not_possible:'not possible', blocked:'blocked', waiting_customer:'awaiting customer response', skipped:'skipped' },
      de: { solved:'gelöst', done:'durchgeführt', not_solved:'durchgeführt, Problem nicht behoben', not_possible:'nicht möglich', blocked:'blockiert', waiting_customer:'wartet auf Kundenrückmeldung', skipped:'übersprungen' },
      pt: { solved:'resolvido', done:'concluído', not_solved:'concluído, problema não resolvido', not_possible:'não possível', blocked:'bloqueado', waiting_customer:'a aguardar resposta do cliente', skipped:'ignorado' },
    };
    return (labels[target] || labels.de)[status] || String(status || '').replaceAll('_', ' ');
  };

  const cleanTitle = (step, target = sourceLang) => {
    if (step?.stepId) {
      const resolved = resolveStep(step.stepId, target);
      if (resolved?.title && resolved.title !== step.stepId) return resolved.title;
    }

    const raw = String(step?.title || step?.instruction || step?.body || step?.stepId || (target === 'en' ? 'Step' : 'Schritt')).trim();

    if (target === 'en') {
      if (raw.includes('Direkte USB-Verbindung') || raw.includes('Verificar ligação USB direta')) return 'Checked direct USB connection';
      if (raw.includes('Anderen USB-Anschluss') || raw.includes('Testar outra porta USB')) return 'Tested another USB port and cable';
      if (raw.includes('Geräte-Manager') || raw.includes('Gestor de Dispositivos')) return 'Checked Windows Device Manager detection';
      if (raw.includes('Scanner in ScanSnap Home entfernen') || raw.includes('Remover e voltar')) return 'Removed and reconnected scanner in ScanSnap Home';
      if (raw.includes('ScanSnap Home bereinigen') || raw.includes('Limpar e reinstalar')) return 'Prepared ScanSnap Home cleanup and reinstall';
      if (raw.includes('Windows-Systemintegrität')) return 'Checked Windows system integrity (SFC/DISM)';
      if (raw.includes('WLAN-Status') || raw.includes('estado do Wi')) return 'Checked scanner Wi-Fi status';
      if (raw.includes('Scanner und Computer im selben Netzwerk') || raw.includes('mesma rede')) return 'Checked scanner and computer are on the same network';
      if (raw.includes('Router')) return 'Checked router / 2.4 GHz network';
      if (raw.includes('Hotspot')) return 'Performed hotspot or alternate network test';
      if (raw.includes('Firmwareupdate') || raw.includes('firmware')) return 'Checked firmware update path';
    }

    return raw;
  };

  const buildSummary = (target) => {
    const isEn = target === 'en';
    const isPt = target === 'pt';
    const lines = [];

    const H = isEn
      ? { issue:'Issue', action:'Action', result:'Result', customer:'Customer reported', product:'Product', connection:'Connection', none:'No troubleshooting steps have been documented yet.', progress:'Troubleshooting is still in progress. Additional feedback or information is required.' }
      : isPt
        ? { issue:'Problema', action:'Ação', result:'Resultado', customer:'Cliente reportou', product:'Produto', connection:'Ligação', none:'Ainda não foram documentados passos de troubleshooting.', progress:'A análise ainda está em curso. É necessária resposta ou informação adicional.' }
        : { issue:'Issue', action:'Action', result:'Result', customer:'Kundenmeldung', product:'Produkt', connection:'Verbindung', none:'Es wurden noch keine Troubleshooting-Schritte dokumentiert.', progress:'Fehlersuche läuft weiter. Weitere Rückmeldung oder zusätzliche Informationen erforderlich.' };

    lines.push(H.issue);
    lines.push(`${H.customer}: ${issue}`);
    lines.push(`${H.product}: ${model}`);
    lines.push(`${H.connection}: ${connection}`);
    lines.push(`${H.os}: ${osInfo}`);
    lines.push(`${H.source}: ${sourceInfo}`);
    lines.push('');
    lines.push(H.action);

    if (!visible.length) {
      lines.push(H.none);
    } else {
      visible.forEach(s => lines.push(`- ${cleanTitle(s, target)}: ${statusLabel(s.status, target)}`));
    }

    lines.push('');
    lines.push(H.result);

    if (solved) {
      lines.push(isEn ? `Issue resolved after: ${cleanTitle(solved, 'en')}.` : isPt ? `Problema resolvido após: ${cleanTitle(solved, 'pt')}.` : `Problem gelöst nach: ${cleanTitle(solved, 'de')}.`);
    } else if (waiting) {
      lines.push(isEn ? `Awaiting customer response regarding: ${cleanTitle(waiting, 'en')}.` : isPt ? `A aguardar resposta do cliente sobre: ${cleanTitle(waiting, 'pt')}.` : `Warten auf Kundenrückmeldung zu: ${cleanTitle(waiting, 'de')}.`);
    } else if (failed.length >= 3) {
      lines.push(isEn
        ? 'The documented troubleshooting did not resolve the issue. Next step: remote session or escalation depending on the case context.'
        : isPt
          ? 'Os passos documentados não resolveram o problema. Próximo passo: sessão remota ou escalamento, dependendo do contexto do caso.'
          : 'Die dokumentierten Maßnahmen haben das Problem nicht behoben. Nächster Schritt: Remote-Session oder Eskalation je nach Fallkontext.');
    } else {
      lines.push(H.progress);
    }

    return lines.join('\n');
  };

  const text = buildSummary(summaryLang);
  const copy = () => { navigator.clipboard.writeText(text); toast.success(summaryLang === 'en' ? 'Case summary copied' : 'Fallzusammenfassung kopiert'); };
  const sourceLabel = sourceLang === 'pt' ? 'Português' : sourceLang === 'de' ? 'Deutsch' : sourceLang.toUpperCase();

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] text-white/30 uppercase tracking-widest">
          {summaryLang === 'en' ? 'Case summary · English' : `Case summary · ${sourceLabel}`}
        </span>
        {summaryLang !== 'en' && (
          <button
            type="button"
            onClick={() => setSummaryLang('en')}
            className="px-3 py-1 rounded-full text-[10px] transition-all text-white/35 hover:text-primary"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            English
          </button>
        )}
        {summaryLang === 'en' && sourceLang !== 'en' && (
          <button
            type="button"
            onClick={() => setSummaryLang(sourceLang)}
            className="px-3 py-1 rounded-full text-[10px] transition-all text-white/35 hover:text-primary"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            Zurück
          </button>
        )}
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