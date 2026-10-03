function removeKnownModelMissingInfo(list, session) {
  const knownModel = session?.model || session?.device || session?.scannerModel;
  if (!knownModel || !Array.isArray(list)) return list;
  return list.filter(item => {
    const t = String(item?.key || item?.id || item?.label || item || '').toLowerCase();
    return !(t.includes('model') || t.includes('modell') || t.includes('device') || t.includes('gerät'));
  });
}

// ============================================================
// SUPPORT BRAIN – Local Decision Engine v1.0
// Deterministic, rule-based, local-first.
// NO AI calls. Uses only the 4 local JSON sources.
// ============================================================

import { knowledgeBase, getEmailText, getCaseSummary, getEscalationText, getKBEntryInLanguage } from './localData';
import { getUI } from './uiTranslations';

// ── Language detection ──────────────────────────────────────

const LANG_PATTERNS = [
  { lang: 'de', patterns: ['nicht', 'fehler', 'hängt', 'startet', 'wird', 'kann', 'bitte', 'haben', 'keine', 'geht'] },
  { lang: 'fr', patterns: ['erreur', 'problème', 'connecté', 'marche', 'reconnu', 'fonctionne', 'bonjour'] },
  { lang: 'es', patterns: ['error', 'problema', 'conectado', 'funciona', 'detectado', 'gracias', 'hola'] },
  { lang: 'pt', patterns: ['erro', 'problema', 'conectado', 'funciona', 'detectado', 'obrigado', 'olá'] },
  { lang: 'it', patterns: ['errore', 'problema', 'connesso', 'funziona', 'rilevato', 'grazie'] },
  { lang: 'nl', patterns: ['fout', 'probleem', 'verbonden', 'werkt', 'herkend', 'bedankt'] },
  { lang: 'ja', patterns: ['エラー', 'スキャナ', '接続', '認識', '問題'] },
  { lang: 'zh', patterns: ['错误', '扫描仪', '连接', '识别', '问题'] },
];

export function detectLanguage(text) {
  if (!text || typeof text !== 'string') return null;
  const lower = text.toLowerCase();
  for (const { lang, patterns } of LANG_PATTERNS) {
    const hits = patterns.filter(p => lower.includes(p)).length;
    if (hits >= 2) return lang;
  }
  return null;
}

// ── Scanner state classification ────────────────────────────

export function classifyScannerState(text) {
  const t = (text || '').toLowerCase();
  if (/stuck.*(logo|boot)|logo.*stuck|hängt.*logo/.test(t)) return 'stuck_on_logo';
  if (/orange.*led|led.*orange|orange.*light/.test(t)) return 'orange_led';
  if (/not detected|nicht erkannt|wird nicht erkannt|undetected/.test(t)) return 'not_detected';
  if (/firmware.*interrupted|interrupted.*firmware|firmware.*abgebrochen/.test(t)) return 'firmware_interrupted';
  if (/cannot scan|scan.*button|blinkt|blinking/.test(t)) return 'detected_cannot_scan';
  if (/ready|bereit/.test(t) && !/not|nicht/.test(t)) return 'ready_no_movement';
  if (/initializ|init/.test(t)) return 'initializing';
  return 'unknown';
}

// ── Issue category rules ────────────────────────────────────

const CATEGORY_RULES = [
  { category: 'firmware',  keywords: ['firmware', 'bios', 'flash', 'boot', 'update failed', 'update interrupted', 'logo'] },
  { category: 'software',  keywords: ['software', 'application', 'app', 'cleanup', 'reinstall', 'crash', 'not starting', 'startup', 'runtime', 'cache', 'ocr'] },
  { category: 'network',   keywords: ['wifi', 'wi-fi', 'wlan', '2.4ghz', '5ghz', 'band steering', 'dhcp', 'subnet', 'nas', 'smb', 'cloud', 'wireless'] },
  { category: 'usb',       keywords: ['usb', 'device manager', 'usb stack', 'not detected', 'hub', 'dock', 'cable'] },
  { category: 'hardware',  keywords: ['streak', 'roller', 'feed', 'paper jam', 'skew', 'noise', 'mechanical', 'glass', 'cleaning'] },
  { category: 'profile',   keywords: ['profile', 'scan to folder', 'library', 'index', 'thumbnail', 'greyed', 'destination'] },
];

export function classifyIssueCategory(text, kbEntry) {
  const t = ((text || '') + ' ' + (kbEntry?.tags || []).join(' ')).toLowerCase();
  const scores = {};
  for (const { category, keywords } of CATEGORY_RULES) {
    scores[category] = keywords.filter(kw => t.includes(kw)).length;
  }
  const best = Object.entries(scores).sort((a, b) => b[1] - a[1])[0];
  return best && best[1] > 0 ? best[0] : 'software';
}

// ── Generic firmware diagnostic routing ────────────────────

/**
 * Generic firmware flow.
 * No vendor, model, recovery-button or manufacturer-download knowledge is stored here.
 * The engine only decides which information or class of action should come next.
 */
export function runFirmwareDiagnostic(session, deviceState, completedStepTitles = [], failedStepTitles = []) {
  const problem = (session.problem || '').toLowerCase();
  const connType = (session.connectionType || '').toLowerCase();
  const done = (pattern) => completedStepTitles.some(t => new RegExp(pattern, 'i').test(t));
  const failed = (pattern) => failedStepTitles.some(t => new RegExp(pattern, 'i').test(t));

  const triedDirectConnection = done('direct usb|direct connection|usb cable|reconnect');
  const triedSoftwareRepair = done('software|application|cleanup|reinstall');
  const triedFirmwareUpdate = done('firmware.*update|update firmware');
  const firmwareUpdateFailed = failed('firmware.*update|update firmware');

  const explicitlyDetected = /detected|recognized|shows up|erkannt|sichtbar/.test(problem);
  const explicitlyNotDetected = /not detected|not recognized|nicht erkannt|undetected/.test(problem);
  const bootProblem = ['stuck_on_logo', 'firmware_interrupted'].includes(deviceState)
    || /boot|logo|firmware.*interrupted|update.*interrupted|update.*failed/.test(problem);

  const deviceDetected = explicitlyNotDetected ? false
    : explicitlyDetected ? true
    : ['ready_no_movement', 'detected_cannot_scan', 'initializing'].includes(deviceState) ? true
    : null;

  const bootsNormally = bootProblem ? false
    : ['ready_no_movement', 'detected_cannot_scan'].includes(deviceState) ? true
    : null;

  if (deviceDetected === null && bootsNormally === null) {
    return {
      usbAvailable: connType === 'usb' ? true : null,
      scannerDetected: null,
      bootsNormally: null,
      recoveryRequired: false,
      likelyCause: 'unknown',
      firmwareWorkflow: 'VERIFY_STATE',
      workflowReason: 'Device state is not yet clear enough to choose a safe firmware path',
      nextSteps: [
        'Confirm whether the device powers on normally.',
        'Confirm whether the operating system detects the device.',
        'Record the exact firmware/update symptom or error message.',
        'Confirm the current connection type and whether a direct connection is available.',
      ],
    };
  }

  if (!triedDirectConnection && connType === 'usb') {
    return {
      usbAvailable: true,
      scannerDetected: deviceDetected,
      bootsNormally,
      recoveryRequired: false,
      likelyCause: 'usb_comm',
      firmwareWorkflow: 'USB_COMM',
      workflowReason: 'Verify the basic communication path before changing firmware',
      nextSteps: [
        'Connect the device directly without a hub or dock.',
        'Try another port and cable if available.',
        'Confirm whether the operating system detects the device without warnings.',
      ],
    };
  }

  if (!triedSoftwareRepair && /software|application|app|crash|startup|install|cache/.test(problem)) {
    return {
      usbAvailable: connType === 'usb' ? true : null,
      scannerDetected: deviceDetected,
      bootsNormally,
      recoveryRequired: false,
      likelyCause: 'sw_env',
      firmwareWorkflow: 'SW_ENV',
      workflowReason: 'The symptoms may be caused by the local software environment rather than firmware',
      nextSteps: [
        'Check the installed application/software version.',
        'Repair or clean-reinstall the relevant application using the vendor-approved procedure.',
        'Restart the system and retest the device before attempting firmware again.',
      ],
    };
  }

  if (!triedFirmwareUpdate) {
    return {
      usbAvailable: connType === 'usb' ? true : null,
      scannerDetected: deviceDetected,
      bootsNormally,
      recoveryRequired: false,
      likelyCause: 'firmware',
      firmwareWorkflow: 'NORMAL',
      workflowReason: 'Firmware is the active path, but no vendor-specific update method is assumed',
      nextSteps: [
        'Verify the exact device model and current firmware version.',
        'Use the manufacturer-approved firmware procedure for that exact model.',
        'Keep the device powered and connected for the full update.',
        'Document the result before continuing.',
      ],
    };
  }

  if (firmwareUpdateFailed || bootProblem) {
    return {
      usbAvailable: connType === 'usb' ? true : null,
      scannerDetected: deviceDetected,
      bootsNormally,
      recoveryRequired: false,
      likelyCause: 'firmware',
      firmwareWorkflow: 'REVIEW',
      workflowReason: 'The standard firmware path failed or the device no longer boots normally; vendor-specific recovery must not be guessed',
      nextSteps: [
        'Collect the exact model, firmware version, update package/version and error message.',
        'Collect the current display/LED state and detection status.',
        'Escalate or consult the manufacturer-specific recovery documentation for this exact model.',
      ],
    };
  }

  return {
    usbAvailable: connType === 'usb' ? true : null,
    scannerDetected: deviceDetected,
    bootsNormally,
    recoveryRequired: false,
    likelyCause: 'firmware',
    firmwareWorkflow: 'REVIEW',
    workflowReason: 'Generic firmware troubleshooting is exhausted',
    nextSteps: [
      'Document all completed steps and outcomes.',
      'Continue with vendor/model-specific documentation or escalation.',
    ],
  };
}

// Backward-compatible generic helper.
export function determineFirmwarePath(model, deviceState, completedStepTitles) {
  const diag = runFirmwareDiagnostic({ model }, deviceState, completedStepTitles, []);
  return {
    path: diag.firmwareWorkflow === 'REVIEW' ? 'review' : 'normal_update',
    instruction: diag.nextSteps[0] || '',
    safe: diag.firmwareWorkflow !== 'REVIEW',
  };
}

// ── Step deduplication ──────────────────────────────────────

function stepAlreadyDone(stepText, completedStepTitles, completedStepIds = []) {
  // Check by stepId first (exact match — most reliable)
  if (completedStepIds.length > 0 && completedStepIds.some(id => id && stepText === id)) return true;

  const t = stepText.toLowerCase();
  const DEDUP_KEYS = [
    ['cleanup', 'reinstall', 'software'],
    ['reinstall', 'reinstalled'],
    ['usb', 'usb stack', 'device manager'],
    ['firmware', 'update'],
    ['wi-fi setup', 'wireless setup', 'wlan setup'],
    ['ocr', 'text recognition'],
    ['profile', 'recreat'],
  ];
  for (const keys of DEDUP_KEYS) {
    const matchesNew = keys.some(k => t.includes(k));
    const matchesDone = completedStepTitles.some(done =>
      keys.some(k => done.toLowerCase().includes(k))
    );
    if (matchesNew && matchesDone) return true;
  }
  return false;
}

// ── Escalation readiness ────────────────────────────────────

export function assessEscalationReadiness(steps, scannerState, category, kbEntry, lang = 'en') {
  const ui      = getUI(lang);
  const failed    = steps.filter(s => s.status === 'not_solved' || s.status === 'not_possible');
  const completed = steps.filter(s => s.status === 'solved' || s.status === 'done');

  const reasons = [];
  let ready = false;

  // General: many steps failed across the board
  if (failed.length >= 4) { reasons.push(`${failed.length} ${ui.esc_steps_failed}`); ready = true; }

  // Orange LED persisting after USB + firmware steps attempted
  if (scannerState === 'orange_led' && completed.length >= 3) {
    reasons.push(ui.esc_orange_led); ready = true;
  }

  // Recovery attempted and failed
  if (completed.some(s => /firmware|update|boot/i.test(s.title || '')) &&
      failed.some(s => /recovery|firmware/i.test(s.title || ''))) {
    reasons.push(ui.esc_recovery_failed); ready = true;
  }

  // Firmware: all major paths tried (USB, SW env, standalone, recovery) and still failing
  if (category === 'firmware' && failed.length >= 3 &&
      steps.some(s => /usb|device manager/i.test(s.title || '')) &&
      steps.some(s => /cleanup|software|application|reinstall/i.test(s.title || ''))) {
    reasons.push(ui.esc_firmware_exhausted);
    ready = true;
  }

  if (!ready) reasons.push(ui.esc_continue);

  return { ready, reasons };
}

// ── Missing information detector ────────────────────────────

export function detectMissingInfo(session, lang = 'en') {
  const ui = getUI(lang);
  const missing = [];
  if (!session.model || session.model === 'unknown') missing.push(ui.missing_model);
  if (!session.connectionType || session.connectionType === 'unknown') missing.push(ui.missing_connection);
  if (!session.scannerState || session.scannerState === 'unknown') missing.push(ui.missing_scanner_state);
  if (!session.os) missing.push(ui.missing_os);
  return missing;
}

// ── Case Status Logic ───────────────────────────────────────

/**
 * Determines the current case status based purely on session state.
 * A KB match NEVER implies resolution. Only completed+confirmed steps do.
 *
 * Status values:
 *   NEW                – no steps started yet
 *   IN_PROGRESS        – at least one step started, no resolution
 *   TESTING            – last step was performed, waiting for result
 *   PARTIALLY_RESOLVED – some steps solved, but not the final one
 *   WAITING_CUSTOMER   – action has been provided, pending customer response
 *   RESOLVED           – status === 'solved' (user confirmed)
 *   ESCALATION_REVIEW  – all steps failed or escalation threshold reached
 */
export function determineCaseStatus(session, steps, escalationReady, lang = 'en') {
  const ui = getUI(lang);
  const sessionStatus = session.status;

  // Explicit resolved state: only when session status is 'solved'
  if (sessionStatus === 'solved') {
    return {
      status: 'RESOLVED',
      isResolved: true,
      customerConfirmed: true,
      reason: ui.cs_solved,
    };
  }

  // All steps exhausted with failures
  if (sessionStatus === 'failed' || escalationReady) {
    return {
      status: 'ESCALATION_REVIEW',
      isResolved: false,
      customerConfirmed: false,
      reason: escalationReady ? ui.cs_escalation_ready : ui.cs_all_exhausted,
    };
  }

  const completed  = steps.filter(s => ['solved', 'done'].includes(s.status));
  const failed     = steps.filter(s => ['not_solved', 'not_possible'].includes(s.status));
  const pending    = steps.filter(s => s.status === 'pending');
  const totalSteps = steps.length;

  // No steps at all — brand new case
  if (totalSteps === 0) {
    return {
      status: 'NEW',
      isResolved: false,
      customerConfirmed: false,
      reason: ui.cs_no_steps,
    };
  }

  // All steps pending — just loaded from KB, nothing done yet
  if (pending.length === totalSteps) {
    return {
      status: 'NEW',
      isResolved: false,
      customerConfirmed: false,
      reason: ui.cs_kb_loaded,
    };
  }

  // Some completed, some still pending
  if (completed.length > 0 && pending.length > 0) {
    return {
      status: 'IN_PROGRESS',
      isResolved: false,
      customerConfirmed: false,
      reason: `${completed.length} ${ui.cs_steps_done_remain} ${pending.length}`,
    };
  }

  // All performed steps failed
  if (failed.length > 0 && completed.length === 0 && pending.length === 0) {
    return {
      status: 'IN_PROGRESS',
      isResolved: false,
      customerConfirmed: false,
      reason: `${failed.length} ${ui.cs_steps_failed_cont}`,
    };
  }

  // Steps in progress — mixed results
  if (completed.length > 0 || failed.length > 0) {
    return {
      status: 'IN_PROGRESS',
      isResolved: false,
      customerConfirmed: false,
      reason: ui.cs_in_progress,
    };
  }

  // Default for active troubleshooting
  return {
    status: 'IN_PROGRESS',
    isResolved: false,
    customerConfirmed: false,
    reason: ui.cs_in_progress,
  };
}

// ── Status-aware email text ─────────────────────────────────

/**
 * Builds a status-aware customer email.
 *
 * RESOLVED:     Returns the KB template as-is (confirmed fix wording).
 * NOT RESOLVED: Builds a "suggested troubleshooting" email directly from
 *               the KB entry's causes + solution_steps — never says "resolved".
 */
export function buildStatusAwareEmailText(kbEmailText, kbEntry, caseStatus, language, supporterName, caseNumber, localizedCauses = null, localizedSteps = null) {
  const lang = (language || 'en').toLowerCase();

  const GREETINGS = {
    de: 'Sehr geehrte/r Kunde/in,',
    en: 'Dear Customer,',
    fr: 'Cher(e) client(e),',
    es: 'Estimado/a cliente,',
    pt: 'Prezado(a) cliente,',
    it: 'Gentile cliente,',
    nl: 'Geachte klant,',
    ja: 'お客様各位、',
    zh: '尊敬的客户，',
  };
  const INTROS = {
    de: 'vielen Dank für Ihre Kontaktaufnahme. Nach Analyse Ihres Problems haben wir eine mögliche Ursache identifiziert und empfehlen die folgenden Troubleshooting-Schritte.\n\nBitte testen Sie diese Schritte der Reihe nach und teilen Sie uns das Ergebnis mit.',
    en: 'Thank you for contacting us. Based on the analysis of your issue, we have identified a likely cause and recommend the following troubleshooting steps.\n\nPlease try each step in order and let us know the result.',
    fr: 'Merci de nous avoir contactés. Après analyse de votre problème, nous avons identifié une cause probable et recommandons les étapes suivantes.\n\nVeuillez essayer chaque étape et nous indiquer le résultat.',
    es: 'Gracias por ponerse en contacto con nosotros. Tras analizar su problema, hemos identificado una posible causa y recomendamos los siguientes pasos.\n\nPor favor, pruebe cada paso e infórmenos del resultado.',
    pt: 'Obrigado por entrar em contato. Com base na análise do seu problema, identificamos uma causa provável e recomendamos as seguintes etapas.\n\nPor favor, teste cada etapa e informe-nos o resultado.',
    it: 'Grazie per averci contattato. Dopo aver analizzato il suo problema, abbiamo identificato una causa probabile e le consigliamo i seguenti passaggi.\n\nLa preghiamo di provare ogni passaggio e comunicarci il risultato.',
    nl: 'Bedankt voor uw contact. Na analyse van uw probleem hebben we een waarschijnlijke oorzaak geïdentificeerd en raden we de volgende stappen aan.\n\nProbeer elke stap en laat ons weten wat het resultaat is.',
    ja: 'お問い合わせいただきありがとうございます。問題を分析した結果、考えられる原因を特定し、以下のトラブルシューティング手順をお勧めします。\n\n各手順を順番に試していただき、結果をお知らせください。',
    zh: '感谢您联系我们。根据对您问题的分析，我们已确定可能的原因，并建议以下故障排除步骤。\n\n请按顺序尝试每个步骤，并告知我们结果。',
  };
  const CAUSE_LABELS = { de: 'Mögliche Ursache', en: 'Likely Cause', fr: 'Cause probable', es: 'Causa probable', pt: 'Causa provável', it: 'Causa probabile', nl: 'Waarschijnlijke oorzaak', ja: '考えられる原因', zh: '可能原因' };
  const STEPS_LABELS = { de: 'Empfohlene Schritte', en: 'Recommended Steps', fr: 'Étapes recommandées', es: 'Pasos recomendados', pt: 'Etapas recomendadas', it: 'Passaggi consigliati', nl: 'Aanbevolen stappen', ja: '推奨手順', zh: '建议步骤' };
  const REPLY_NOTE = {
    de: (cn) => `Bitte antworten Sie direkt auf diese E-Mail, damit keine Duplikate im System angelegt werden und sich die Bearbeitung nicht unnötig verzögert.\n\nFalls Sie uns telefonisch kontaktieren, nennen Sie bitte Ihre Fallnummer ${cn || '—'},\ndamit wir Ihren bestehenden Vorgang direkt aufrufen können.`,
    en: (cn) => `Please reply directly to this email to avoid duplicate cases being created and to keep your support history together.\n\nIf you contact us by phone, please have your case number ${cn || '—'} ready so we can pull up your existing case straight away.`,
    fr: (cn) => `Veuillez répondre directement à cet e-mail afin d'éviter la création de doublons dans notre système et de préserver l'historique complet de votre dossier.\n\nSi vous nous contactez par téléphone, merci d'indiquer votre numéro de dossier ${cn || '—'} afin que nous puissions retrouver votre demande immédiatement.`,
    es: (cn) => `Por favor, responda directamente a este correo para evitar que se creen casos duplicados y para que su historial de soporte permanezca completo.\n\nSi nos contacta por teléfono, le pedimos que indique su número de caso ${cn || '—'} para poder localizar su solicitud de inmediato.`,
    pt: (cn) => `Por favor, responda diretamente a este e-mail para evitar a criação de casos duplicados e para manter o histórico do seu suporte completo.\n\nSe nos contactar por telefone, indique o número do seu caso ${cn || '—'} para que possamos localizar o seu pedido de imediato.`,
    it: (cn) => `La preghiamo di rispondere direttamente a questa e-mail per evitare la creazione di casi duplicati e mantenere completa la cronologia del suo supporto.\n\nSe ci contatta telefonicamente, indichi il numero del caso ${cn || '—'} così possiamo recuperare la sua richiesta immediatamente.`,
    nl: (cn) => `Antwoord rechtstreeks op deze e-mail om te voorkomen dat er dubbele dossiers worden aangemaakt en om uw volledige ondersteuningsgeschiedenis bijeen te houden.\n\nAls u ons telefonisch contacteert, vermeld dan uw dossiernummer ${cn || '—'} zodat wij uw aanvraag direct kunnen openen.`,
    ja: (cn) => `重複したケースの作成を避け、サポート履歴をまとめるために、このメールに直接ご返信ください。\n\nお電話でお問い合わせの場合は、ケース番号 ${cn || '—'} をお手元にご用意ください。すぐに既存のご依頼を確認いたします。`,
    zh: (cn) => `请直接回复此邮件，以避免创建重复工单，并确保您的支持历史记录完整保存。\n\n如果您通过电话联系我们，请提供您的工单编号 ${cn || '—'}，以便我们立即调取您的现有请求。`,
  };

  const greeting   = GREETINGS[lang]    || GREETINGS['en'];
  const intro      = INTROS[lang]       || INTROS['en'];
  const causeLabel = CAUSE_LABELS[lang] || CAUSE_LABELS['en'];
  const stepsLabel = STEPS_LABELS[lang] || STEPS_LABELS['en'];
  const replyNoteFn = REPLY_NOTE[lang] || REPLY_NOTE['en'];
  const replyNote   = typeof replyNoteFn === 'function' ? replyNoteFn(caseNumber) : replyNoteFn;

  // Build closing with supporter name
  const sigName = supporterName || 'Support Team';
  const closing = `${replyNote}\n\n${sigName}\nSupport`;

  // Case number line
  const caseRef = caseNumber ? `[${caseNumber}]` : '';

  // Causes and steps — use pre-translated versions if provided, else fall back to KB entry
  const causesArr  = localizedCauses || kbEntry?.causes || [];
  const stepsArr   = localizedSteps  || kbEntry?.solution_steps || [];
  const causes     = causesArr.join(', ') || '—';
  const stepsText  = stepsArr.length > 0 ? stepsArr.map((s, i) => `${i + 1}. ${s}`).join('\n') : '—';

  const lines = [
    caseRef ? `${greeting}  ${caseRef}` : greeting,
    '',
    intro,
    '',
    `${causeLabel}: ${causes}`,
    '',
    `${stepsLabel}:`,
    stepsText,
    '',
    closing,
  ];

  return lines.join('\n');
}

/**
 * Builds a firmware-specific step-by-step email based on the diagnostic result.
 * Only called for firmware category cases.
 */
export function buildFirmwareEmail(fwDiag, lang, supporterName, caseNumber, localizedFwSteps = null) {
  if (!fwDiag) return '';

  const GREETINGS = {
    de: 'Sehr geehrte/r Kunde/in,', en: 'Dear Customer,', fr: 'Cher(e) client(e),',
    es: 'Estimado/a cliente,', pt: 'Prezado(a) cliente,', it: 'Gentile cliente,', nl: 'Geachte klant,',
    ja: 'お客様各位、', zh: '尊敬的客户，',
  };
  const REPLY_NOTE = {
    de: (cn) => `Bitte antworten Sie direkt auf diese E-Mail, damit keine Duplikate im System angelegt werden und sich die Bearbeitung nicht unnötig verzögert.\n\nFalls Sie uns telefonisch kontaktieren, nennen Sie bitte Ihre Fallnummer ${cn || '—'}, damit wir Ihren bestehenden Vorgang direkt aufrufen können.`,
    en: (cn) => `Please reply directly to this email to avoid duplicate cases and to keep your support history together.\n\nIf you contact us by phone, please have your case number ${cn || '—'} ready so we can pull up your existing case straight away.`,
    fr: (cn) => `Veuillez répondre directement à cet e-mail pour éviter les doublons et conserver l'historique complet de votre dossier.\n\nEn cas de contact téléphonique, merci d'indiquer le numéro de dossier ${cn || '—'}.`,
    es: (cn) => `Por favor, responda directamente a este correo para evitar casos duplicados y mantener su historial completo.\n\nSi nos contacta por teléfono, indique su número de caso ${cn || '—'}.`,
    pt: (cn) => `Por favor, responda diretamente a este e-mail para evitar casos duplicados e manter o histórico completo.\n\nSe nos contactar por telefone, indique o número do caso ${cn || '—'}.`,
    it: (cn) => `La preghiamo di rispondere direttamente a questa e-mail per evitare duplicati e mantenere la cronologia completa.\n\nSe ci contatta per telefono, indichi il numero del caso ${cn || '—'}.`,
    nl: (cn) => `Antwoord rechtstreeks op deze e-mail om dubbele dossiers te voorkomen en uw ondersteuningsgeschiedenis bijeen te houden.\n\nBij telefonisch contact, vermeld uw dossiernummer ${cn || '—'}.`,
    ja: (cn) => `重複を避けサポート履歴をまとめるため、このメールに直接ご返信ください。\n\nお電話の場合はケース番号 ${cn || '—'} をお手元にご用意ください。`,
    zh: (cn) => `请直接回复此邮件，以避免重复工单并保持支持历史完整。\n\n如需电话联系，请提供工单编号 ${cn || '—'}。`,
  };

  const WORKFLOW_INTROS = {
    VERIFY_USB: {
      de: 'vielen Dank für Ihre Kontaktaufnahme.\n\nBevor wir mit der Firmware-Aktualisierung fortfahren, benötigen wir einige wichtige Informationen zum aktuellen Status Ihres Scanners.',
      en: 'Thank you for contacting us.\n\nBefore proceeding with the firmware update, we need to verify a few important details about the current state of your scanner.',
      fr: 'Merci de nous avoir contactés.\n\nAvant de procéder à la mise à jour du firmware, nous devons vérifier quelques informations importantes sur l\'état actuel de votre scanner.',
      es: 'Gracias por contactarnos.\n\nAntes de proceder con la actualización de firmware, necesitamos verificar algunos detalles importantes sobre el estado actual de su escáner.',
      pt: 'Obrigado por entrar em contato.\n\nAntes de prosseguir com a atualização de firmware, precisamos verificar alguns detalhes importantes sobre o estado atual do seu scanner.',
      it: 'Grazie per averci contattato.\n\nPrima di procedere con l\'aggiornamento del firmware, dobbiamo verificare alcuni dettagli importanti sullo stato attuale dello scanner.',
      nl: 'Bedankt voor uw contact.\n\nVoordat we doorgaan met de firmware-update, moeten we enkele belangrijke details over de huidige staat van uw scanner verifiëren.',
    },
    NORMAL: {
      de: 'vielen Dank für Ihre Kontaktaufnahme.\n\nIhr Scanner ist erkannt und startet normal. Bitte führen Sie die folgende Standard-Firmware-Aktualisierung durch.',
      en: 'Thank you for contacting us.\n\nYour scanner is detected and booting normally. Please follow the standard firmware update procedure below.',
      fr: 'Merci de nous avoir contactés.\n\nVotre scanner est détecté et démarre normalement. Veuillez suivre la procédure standard de mise à jour du firmware.',
      es: 'Gracias por contactarnos.\n\nSu escáner es detectado y arranca normalmente. Siga el procedimiento estándar de actualización de firmware.',
      pt: 'Obrigado por entrar em contato.\n\nSeu scanner é detectado e inicializa normalmente. Siga o procedimento padrão de atualização de firmware.',
      it: 'Grazie per averci contattato.\n\nIl suo scanner è rilevato e si avvia normalmente. Segua la procedura standard di aggiornamento firmware.',
      nl: 'Bedankt voor uw contact.\n\nUw scanner wordt gedetecteerd en start normaal op. Volg de standaard firmware-updateprocedure hieronder.',
    },
    RECOVERY: {
      de: 'vielen Dank für Ihre Kontaktaufnahme.\n\nDa der Standard-Update-Vorgang nicht erfolgreich war und die Symptome auf einen beschädigten Firmware-Zustand hinweisen, sind zusätzliche Wiederherstellungsschritte erforderlich.',
      en: 'Thank you for contacting us.\n\nSince the standard update process was unsuccessful and symptoms indicate a corrupted firmware state, the following recovery procedure is required.',
      fr: 'Merci de nous avoir contactés.\n\nLa procédure de mise à jour standard ayant échoué et les symptômes indiquant un état firmware corrompu, la procédure de récupération suivante est nécessaire.',
      es: 'Gracias por contactarnos.\n\nComo el proceso de actualización estándar no tuvo éxito y los síntomas indican un estado de firmware dañado, se requiere el siguiente procedimiento de recuperación.',
      pt: 'Obrigado por entrar em contato.\n\nComo o processo de atualização padrão não teve sucesso e os sintomas indicam um estado de firmware corrompido, é necessário o seguinte procedimento de recuperação.',
      it: 'Grazie per averci contattato.\n\nPoiché il processo di aggiornamento standard non ha avuto successo e i sintomi indicano uno stato firmware danneggiato, è necessaria la seguente procedura di ripristino.',
      nl: 'Bedankt voor uw contact.\n\nOmdat het standaard updateproces niet succesvol was en de symptomen een beschadigde firmwarestatus aangeven, is de volgende herstelprocedure vereist.',
    },
  };

  const STEPS_LABELS = {
    de: 'Bitte führen Sie folgende Schritte durch', en: 'Please follow these steps',
    fr: 'Veuillez suivre ces étapes', es: 'Por favor, siga estos pasos',
    pt: 'Por favor, siga estas etapas', it: 'Si prega di seguire questi passaggi',
    nl: 'Volg deze stappen',
  };

  const l = lang in GREETINGS ? lang : 'en';
  const workflow = fwDiag.firmwareWorkflow in WORKFLOW_INTROS ? fwDiag.firmwareWorkflow : 'VERIFY_USB';

  const sigName      = supporterName || 'Support Team';
  const replyNoteFn  = REPLY_NOTE[l] || REPLY_NOTE['en'];
  const replyNote    = typeof replyNoteFn === 'function' ? replyNoteFn(caseNumber) : replyNoteFn;
  const closing      = `${replyNote}\n\n${sigName}\nSupport`;
  const caseRef   = caseNumber ? `[${caseNumber}]` : '';

  const greeting  = caseRef ? `${GREETINGS[l]}  ${caseRef}` : GREETINGS[l];
  const intro     = (WORKFLOW_INTROS[workflow][l] || WORKFLOW_INTROS[workflow]['en']);
  const stepsLbl  = STEPS_LABELS[l] || STEPS_LABELS['en'];
  const resolvedSteps = localizedFwSteps || fwDiag.nextSteps || [];
  const stepsText = resolvedSteps.map((s, i) => `${i + 1}. ${s}`).join('\n');

  return [greeting, '', intro, '', `${stepsLbl}:`, stepsText, '', closing].join('\n');
}

// ── Next action selector ────────────────────────────────────

const NEXT_ACTION_TEMPLATES = {
  request_info:     'Request missing information before proceeding: {info}',
  request_video:    'Request screenshot or short video of current scanner state from customer.',
  firmware_normal:  'Run normal firmware update via direct USB.',
  software_cleanup: 'Repair or clean-reinstall the relevant application using the approved procedure.',
  win_integrity:    'Run Windows system integrity repair (sfc /scannow → restart → DISM → restart → sfc repeat). Do NOT touch USB stack first.',
  usb_stack:        'Inspect USB/device registrations in Device Manager and rebuild the USB path if appropriate.',
  wifi_setup:       'Reset wireless settings and re-run Wi-Fi pairing. Check 2.4GHz / band steering.',
  cloud_reauth:     'Re-authenticate the cloud account and recreate the affected cloud profile if applicable.',
  hardware_clean:   'Clean internal glass and roller area carefully.',
  profile_recreate: 'Remove corrupted profile configuration and recreate profiles manually.',
  request_remote:   'Suggest remote session to investigate live system state.',
  review:           'Prepare internal review — steps exhausted, escalation may be warranted.',
  continue:         'Continue with next KB troubleshooting step.',
};

export function selectNextAction(session, kbEntry, category, scannerState, missingInfo, steps) {
  const completed = steps.filter(s => s.status === 'solved' || s.status === 'done').map(s => s.title || '');
  const failed    = steps.filter(s => s.status === 'not_solved' || s.status === 'not_possible').map(s => s.title || '');
  const blocked   = steps.filter(s => s.status === 'blocked').map(s => s.title || '');

  // Priority 1: Safety — missing info before anything complex
  if (missingInfo.length > 0 && completed.length === 0 && (category === 'firmware' || category === 'hardware')) {
    return { action: 'request_info', reason: 'Critical info missing before firmware/hardware path', params: { info: missingInfo.join('; ') } };
  }

  // Priority 2: Firmware — run full diagnostic state machine
  if (category === 'firmware') {
    const fwDiag = runFirmwareDiagnostic(session, scannerState, completed, failed);
    if (fwDiag.firmwareWorkflow === 'VERIFY_STATE') {
      return { action: 'request_info', reason: fwDiag.workflowReason, params: { info: fwDiag.nextSteps.join(' | ') }, fwDiag };
    }
    if (fwDiag.firmwareWorkflow === 'WIN_INTEGRITY') {
      return { action: 'win_integrity', reason: fwDiag.workflowReason, params: { instruction: fwDiag.nextSteps[0] }, fwDiag };
    }
    if (fwDiag.firmwareWorkflow === 'USB_COMM') {
      return { action: 'usb_stack', reason: fwDiag.workflowReason, params: { instruction: fwDiag.nextSteps[0] }, fwDiag };
    }
    if (fwDiag.firmwareWorkflow === 'SW_ENV') {
      return { action: 'software_cleanup', reason: fwDiag.workflowReason, params: { instruction: fwDiag.nextSteps[0] }, fwDiag };
    }
    if (fwDiag.firmwareWorkflow === 'NORMAL') {
      return { action: 'firmware_normal', reason: fwDiag.workflowReason, params: { instruction: fwDiag.nextSteps[0] }, fwDiag };
    }
    if (fwDiag.firmwareWorkflow === 'RETRY_STANDALONE') {
      return { action: 'firmware_normal', reason: fwDiag.workflowReason, params: { instruction: fwDiag.nextSteps[0] }, fwDiag };
    }
    if (fwDiag.firmwareWorkflow === 'REVIEW') {
      return { action: 'review', reason: fwDiag.workflowReason, fwDiag };
    }
  }

  // Priority 3: Dedup — don't repeat completed steps
  const pendingSteps = steps.filter(s => s.status === 'pending');
  const trueNext = pendingSteps.find(s => !stepAlreadyDone(s.instruction || s.title || '', completed));

  // Priority 4: Category-based fallback if no pending steps
  if (!trueNext || pendingSteps.length === 0) {
    if (failed.length >= 2 && !blocked.some(b => b.toLowerCase().includes('remote'))) {
      return { action: 'request_remote', reason: 'Multiple failures, remote session may help' };
    }
    if (failed.length >= 3) return { action: 'review', reason: 'All reasonable steps exhausted' };

    // Category fallback
    const fallbacks = {
      software:  'software_cleanup',
      usb:       'usb_stack',
      network:   'wifi_setup',
      firmware:  'firmware_normal',
      hardware:  'hardware_clean',
      profile:   'profile_recreate',
    };
    return { action: fallbacks[category] || 'continue', reason: `Category fallback: ${category}` };
  }

  return { action: 'continue', reason: 'Next KB step available', nextStep: trueNext };
}

// ── Dynamic next step generator ─────────────────────────────

/**
 * Generates the next dynamic step as a stepId reference.
 * The frontend resolves the stepId to localized text via resolveStep().
 *
 * Returns { stepId, difficulty, _dynamic: true } or null if exhausted.
 */
export function generateNextDynamicStep(session, kbEntry) {
  const steps    = session.steps || [];
  const problem  = (session.problem || '');

  // Dedup: check by stepId (for dynamic steps) or by keyword match on title (for KB steps)
  const usedStepIds = new Set(steps.map(s => s.stepId).filter(Boolean));
  const allTitles   = steps.map(s => (s.title || '').toLowerCase());
  const alreadyByTitle = (keyword) => allTitles.some(t => new RegExp(keyword, 'i').test(t));
  const already = (stepId, keyword) => usedStepIds.has(stepId) || alreadyByTitle(keyword);

  const category = classifyIssueCategory(problem, kbEntry);

  // ── Ordered progression chains — stepId + keyword fallback for KB step dedup ──

  const firmwareChain = [
    { stepId: 'verifyDeviceState',         keyword: 'verify|state|power|led|display' },
    { stepId: 'directUsbConnectionTest',   keyword: 'direct usb|direct connection|usb cable|reconnect' },
    { stepId: 'checkSoftwareEnvironment',  keyword: 'software|application|cleanup|reinstall' },
    { stepId: 'standardFirmwareUpdate',    keyword: 'firmware update|normal update' },
    { stepId: 'prepareVendorReview',       keyword: 'vendor|manufacturer|review|escalat' },
  ];

  const softwareChain = [
    { stepId: 'checkSoftwareEnvironment', keyword: 'software|application|cleanup|reinstall' },
    { stepId: 'checkSystemIntegrity',     keyword: 'sfc|dism|system integrity|systemreparatur|integridade|windows repair' },
    { stepId: 'rebuildUsbStack',          keyword: 'device manager|usb|driver' },
    { stepId: 'recreateProfiles',         keyword: 'profile|scan to folder|library|destination' },
  ];

  const usbChain = [
    { stepId: 'directUsbConnectionTest',   keyword: 'direct usb|native usb|reconnect|usb cable' },
    { stepId: 'windowsSystemRepair',       keyword: 'sfc|dism|system integrity|systemreparatur|integridade|windows repair' },
    { stepId: 'rebuildUsbStack',           keyword: 'device manager|usb stack|stale|registration' },
    { stepId: 'disableUsbPowerManagement', keyword: 'power management|usb power|selective suspend' },
    { stepId: 'checkSoftwareEnvironment',  keyword: 'software|application|cleanup|reinstall' },
  ];

  const networkChain = [
    { stepId: 'repairWifiConnection',  keyword: 'wifi|wi-fi|wireless|reconnect|pairing' },
    { stepId: 'checkRouterBandSteering', keyword: 'band steering|2.4ghz|5ghz|router' },
    { stepId: 'reauthCloudStorage',    keyword: 'onedrive|cloud|sync|smb|nas' },
  ];

  const hardwareChain = [
    { stepId: 'cleanRollersAndGlass', keyword: 'clean|roller|glass|streak|maintenance' },
    { stepId: 'checkPaperPath',       keyword: 'paper path|skew|misalignment|feed' },
  ];

  const chains = {
    firmware: firmwareChain,
    software: softwareChain,
    usb:      usbChain,
    network:  networkChain,
    hardware: hardwareChain,
  };

  const chain = chains[category] || softwareChain;

  for (const { stepId, keyword } of chain) {
    if (!already(stepId, keyword)) {
      return { stepId, status: 'pending', result: '', note: '', timestamp: null, _dynamic: true };
    }
  }

  return null;
}

// ── Language-aware email loader ─────────────────────────────

export function loadLocalEmail(kbEntry, language) {
  if (!kbEntry) return { text: '', fallbackUsed: false, langLoaded: language };
  const directText = getEmailText(kbEntry, language);
  if (directText) return { text: directText, fallbackUsed: false, langLoaded: language };
  const fallbackText = getEmailText(kbEntry, 'en');
  return { text: fallbackText, fallbackUsed: true, langLoaded: 'en (fallback)' };
}

// ── MAIN: runDecisionEngine ─────────────────────────────────

/**
 * Pure function — returns the full brain output.
 * No side effects, no AI calls.
 *
 * @param {object} session  - full session object from sessionStore
 * @param {object} kbEntry  - matched KB entry (or null)
 * @param {string} language - selected language code
 * @returns {object} brainOutput
 */
export function runDecisionEngine(session, kbEntry, language) {
  const steps         = session.steps || [];
  const problem       = session.problem || '';
  const model         = session.model || session.device || '';
  const connType      = session.connectionType || 'unknown';
  const os            = session.os || '';
  const supporterName = session.supporterName || '';
  const caseNumber    = session.caseNumber || '';

  // Detect language
  const detectedLang = detectLanguage(problem);
  const activeLang   = language || detectedLang || 'en';

  // Classify
  const scannerState = classifyScannerState(problem + ' ' + (session.scannerStateNote || ''));
  const category     = classifyIssueCategory(problem, kbEntry);

  // Step analysis
  const completedSteps = steps.filter(s => ['solved', 'done'].includes(s.status));
  const failedSteps    = steps.filter(s => ['not_solved', 'not_possible'].includes(s.status));
  const blockedSteps   = steps.filter(s => s.status === 'blocked');
  const pendingSteps   = steps.filter(s => s.status === 'pending');

  // Missing info
  const missingInfo = detectMissingInfo({ ...session, model, connectionType: connType, scannerState }, activeLang);

  // Firmware diagnostic (always run for firmware category, null otherwise)
  const fwDiag = category === 'firmware'
    ? runFirmwareDiagnostic(session, scannerState, completedSteps.map(s => s.title || ''), failedSteps.map(s => s.title || ''))
    : null;

  // Next action
  const nextAction = selectNextAction(session, kbEntry, category, scannerState, removeKnownModelMissingInfo(missingInfo, session), steps);

  // Escalation
  const escalation = assessEscalationReadiness(steps, scannerState, category, kbEntry, activeLang);

  // Case Status (MUST run before email — email wording depends on it)
  const caseStatus = determineCaseStatus(session, steps, escalation.ready, activeLang);

  // Load localized KB content (causes, solution_steps in selected language)
  const localizedKB   = getKBEntryInLanguage(kbEntry, activeLang);

  // Templates — for firmware unresolved cases use diagnostic email; otherwise KB template
  const emailData    = loadLocalEmail(kbEntry, activeLang);
  const emailText    = buildStatusAwareEmailText(
    emailData.text,
    kbEntry,
    caseStatus,
    activeLang,
    supporterName,
    caseNumber,
    localizedKB.causes,
    localizedKB.solution_steps
  );
  const summaryText  = getCaseSummary(kbEntry);
  const escText      = getEscalationText(kbEntry);

  // Confidence
  const confidence = kbEntry?._score || 0;
  const confidenceLabel = confidence >= 80 ? 'HIGH' : confidence >= 40 ? 'MEDIUM' : confidence >= 10 ? 'LOW' : 'NONE';

  return {
    // Core
    category,
    scannerState,
    matchedCaseId:    kbEntry?.case_id || null,
    confidence,
    confidenceLabel,

    // Case status
    caseStatus:           caseStatus.status,
    isResolved:           caseStatus.isResolved,
    customerConfirmed:    caseStatus.customerConfirmed,
    caseStatusReason:     caseStatus.reason,

    // Steps
    completedSteps,
    failedSteps,
    blockedSteps,
    pendingSteps,

    // Info
    missingInfo: removeKnownModelMissingInfo(missingInfo, session),

    // Action
    nextAction,

    // Templates — email is status-aware, never says "resolved" unless truly resolved
    email:           emailText,
    emailRaw:        emailData.text,
    emailFallback:   emailData.fallbackUsed,
    emailLangLoaded: emailData.langLoaded,
    caseSummary:     summaryText,
    escalationText:  escText,

    // Escalation
    escalationReady:   escalation.ready,
    escalationReasons: escalation.reasons,

    // Firmware diagnostic (only for firmware category)
    fwDiag,

    // Localized KB content (causes + steps in active language)
    localizedKB,

    // Language
    detectedLang,
    activeLang,

    // Model detection metadata (from auto-detection on Page 1)
    modelDetection:     session.modelDetection || null,

    // Model match analysis
    modelSelected:      model || '(not set)',
    modelMatchedKB:     kbEntry?.models?.join(', ') || '(none)',
    modelMatchConf:     kbEntry?.models?.some(m => model && m.toLowerCase().replace(/[^a-z0-9]/g,'').includes(model.toLowerCase().replace(/[^a-z0-9]/g,''))) ? 'EXACT' : kbEntry ? 'GENERIC/FALLBACK' : 'NO MATCH',
    crossModelFallback: kbEntry?.models?.length > 0 && model && !kbEntry.models.some(m => m.toLowerCase().replace(/[^a-z0-9]/g,'').includes(model.toLowerCase().replace(/[^a-z0-9]/g,''))) ? true : false,

    // Debug metadata
    _debug: {
      // Supporter context
      supporterName:        supporterName || '(not set)',
      caseNumber:           caseNumber || '(not set)',
      // Language
      analysisLang:         activeLang,
      emailLang:            activeLang,
      caseSummaryLang:      'en (always)',
      escalationLang:       'en (always)',
      detectedLang:         detectedLang || '(auto)',
      emailLangLoaded:      emailData.langLoaded,
      emailFallback:        emailData.fallbackUsed,
      // Multilingual KB status
      kbLanguageSelected:   activeLang,
      kbLanguageLoaded:     localizedKB.langLoaded || activeLang,
      kbIsMultilingual:     localizedKB.isMultilingual ? 'YES' : 'NO (legacy English)',
      kbFallbackUsed:       localizedKB.fallback ? 'YES' : 'NO',
      aiUsed:               false,
      aiCallsCount:         0,
      searchMode:           'LOCAL_ONLY',
      // Model matching
      selectedModel:        model || '(not set)',
      modelSource:          session.modelDetection?.source || (model ? 'manual' : 'unknown'),
      modelDetectConf:      session.modelDetection?.confidence || (model ? 'MANUAL' : 'NONE'),
      modelDetectRaw:       session.modelDetection?.raw || '—',
      matchedKBModels:      kbEntry?.models?.join(', ') || '(none)',
      modelMatchConf:       kbEntry?.models?.some(m => model && m.toLowerCase().replace(/[^a-z0-9]/g,'').includes(model.toLowerCase().replace(/[^a-z0-9]/g,''))) ? 'EXACT' : kbEntry ? 'GENERIC/FALLBACK' : 'NO MATCH',
      crossModelFallback:   kbEntry?.models?.length > 0 && model && !kbEntry.models.some(m => m.toLowerCase().replace(/[^a-z0-9]/g,'').includes(model.toLowerCase().replace(/[^a-z0-9]/g,''))) ? 'YES' : 'NO',
      // Classification
      model,
      connType,
      os,
      scannerState,
      category,
      confidence,
      confidenceLabel,
      matchedCaseId:        kbEntry?.case_id || null,
      localKBMatch:         !!kbEntry,
      // Case state
      caseStatus:           caseStatus.status,
      isResolved:           caseStatus.isResolved,
      customerConfirmed:    caseStatus.customerConfirmed,
      caseStatusReason:     caseStatus.reason,
      // Steps
      completedCount:       completedSteps.length,
      failedCount:          failedSteps.length,
      blockedCount:         blockedSteps.length,
      // Decision
      nextAction:           nextAction.action,
      nextActionReason:     nextAction.reason,
      escalationReady:      escalation.ready,
      progressionExhausted: session.status === 'exhausted' ? 'YES' : 'NO',
      pendingCount:         pendingSteps.length,
      // Firmware diagnostic
      fw_usbAvailable:      fwDiag?.usbAvailable ?? 'N/A',
      fw_scannerDetected:   fwDiag?.scannerDetected ?? 'N/A',
      fw_bootsNormally:     fwDiag?.bootsNormally ?? 'N/A',
      fw_recoveryRequired:  fwDiag?.recoveryRequired ?? 'N/A',
      fw_likelyCause:       fwDiag?.likelyCause ?? 'N/A',
      fw_workflow:          fwDiag?.firmwareWorkflow ?? 'N/A',
      fw_workflowReason:    fwDiag?.workflowReason ?? 'N/A',
      fw_likelyCause:       fwDiag?.likelyCause ?? 'N/A',
      // Issue type classification for debug panel
      issueType: fwDiag?.likelyCause === 'win_integrity' ? 'Windows integrity / system instability'
        : fwDiag?.likelyCause === 'usb_comm' ? 'USB enumeration failure'
        : fwDiag?.likelyCause === 'sw_env' ? 'Software environment'
        : fwDiag?.likelyCause === 'firmware' ? 'Firmware (recovery state)'
        : category === 'network' ? 'Wi-Fi / network'
        : category,
      sfcDismRecommended: fwDiag?.firmwareWorkflow === 'WIN_INTEGRITY' ? 'YES — communication instability detected, integrity repair precedes USB cleanup' : 'NO',
      usbStackDelayed: fwDiag?.firmwareWorkflow === 'WIN_INTEGRITY' ? 'YES — delayed until after integrity repair' : fwDiag?.likelyCause === 'usb_comm' ? 'NO — pure USB enumeration failure, USB cleanup appropriate' : 'N/A',
      troubleshootingPriority: fwDiag?.firmwareWorkflow === 'WIN_INTEGRITY'
        ? '1.Basic check → 2.SSH/FW state → 3.Windows integrity (SFC/DISM) → 4.Retest → 5.USB cleanup if needed → 6.software reinstall'
        : fwDiag?.firmwareWorkflow === 'USB_COMM'
        ? '1.Basic check → 2.USB stack rebuild (pure enum failure) → 3.Retest'
        : '1.Basic check → 2.software state → 3.Next step',
    },
  };
}