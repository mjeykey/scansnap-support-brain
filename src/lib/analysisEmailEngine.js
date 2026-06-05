const DONE_STATUSES = ['done', 'not_solved', 'not_possible', 'solved'];

function cleanTitle(step = {}) {
  const raw = step.title || step.instruction || step.body || step.stepId || 'Schritt';
  const text = String(raw).trim();
  if (!text || text === 'Step' || text.includes('_')) return step.instruction || step.body || 'Nicht benannter Schritt';
  return text;
}

function completedSteps(session = {}) {
  return (session.steps || []).filter(s => DONE_STATUSES.includes(s.status));
}

function failedSteps(session = {}) {
  return (session.steps || []).filter(s => ['not_solved', 'not_possible'].includes(s.status));
}

function waitingSteps(session = {}) {
  return (session.steps || []).filter(s => s.status === 'waiting_customer');
}

function pendingSteps(session = {}) {
  return (session.steps || []).filter(s => !s.status || s.status === 'pending');
}

function isHardwareCandidate(session = {}) {
  const text = `${session.problem || ''} ${session.issueType || ''}`.toLowerCase();
  return /hardware|ds42039|h8000|kein strom|no power|sensor|mechanik|mechanical|paper jam|papierstau/.test(text);
}

function isExhausted(session = {}) {
  const failed = failedSteps(session);
  const pending = pendingSteps(session);
  return failed.length >= 3 || (failed.length > 0 && pending.length === 0) || session.status === 'exhausted';
}

function missingFacts(session = {}, mode = 'default') {
  const k = session.knownFacts || {};
  const missing = [];
  if (!session.os && !k.os) missing.push('os');
  if (!session.problemSince && !k.problemSince) missing.push('problemSince');
  if (mode === 'hardware') {
    if (!session.locationConfirmed && !k.locationConfirmed && !k.address) missing.push('location');
    if (!session.contactConfirmed && !k.contactConfirmed && !k.contactPerson) missing.push('contact');
    if (!session.scanCount && !k.scanCount) missing.push('scanCount');
  } else {
    if (!session.errorScreenshot && !k.errorScreenshot) missing.push('errorScreenshot');
    if (!session.behaviourVideo && !k.behaviourVideo) missing.push('behaviourVideo');
    if (!session.ledPhoto && !k.ledPhoto) missing.push('ledPhoto');
  }
  return missing;
}

function missingLabel(key, lang = 'de') {
  const labels = {
    de: {
      os: 'Betriebssystem',
      problemSince: 'seit wann das Problem auftritt',
      errorScreenshot: 'Screenshot oder Foto der angezeigten Fehlermeldung',
      behaviourVideo: 'falls möglich, ein kurzes Video des Scannerverhaltens',
      ledPhoto: 'Foto der aktuellen LED-/Display-Anzeige des Scanners',
      location: 'Bestätigung des aktuellen Scannerstandorts',
      contact: 'Bestätigung der bisherigen Ansprechperson bzw. abweichende Kontaktdaten',
      scanCount: 'aktueller Scan Count, falls verfügbar',
    },
    en: {
      os: 'operating system',
      problemSince: 'when the issue first started',
      errorScreenshot: 'screenshot or photo of the displayed error message',
      behaviourVideo: 'if possible, a short video of the scanner behavior',
      ledPhoto: 'photo of the current LED/display status of the scanner',
      location: 'confirmation of the current scanner location',
      contact: 'confirmation of the current contact person or updated contact details',
      scanCount: 'current scan count, if available',
    },
    pt: {
      os: 'sistema operativo',
      problemSince: 'desde quando o problema ocorre',
      errorScreenshot: 'captura de ecrã ou foto da mensagem de erro',
      behaviourVideo: 'se possível, um vídeo curto do comportamento do scanner',
      ledPhoto: 'foto do estado atual do LED/ecrã do scanner',
      location: 'confirmação da localização atual do scanner',
      contact: 'confirmação da pessoa de contacto ou dados atualizados',
      scanCount: 'contador de digitalizações atual, se disponível',
    },
  };
  return (labels[lang] || labels.en)[key] || key;
}

function statusLabel(status, lang = 'de') {
  const labels = {
    de: { done:'durchgeführt', not_solved:'durchgeführt, Problem nicht behoben', not_possible:'nicht möglich', solved:'gelöst', waiting_customer:'an Kunden gesendet, Rückmeldung offen' },
    en: { done:'completed', not_solved:'completed, issue not resolved', not_possible:'not possible', solved:'resolved', waiting_customer:'sent to customer, awaiting response' },
    pt: { done:'realizado', not_solved:'realizado, problema não resolvido', not_possible:'não possível', solved:'resolvido', waiting_customer:'enviado ao cliente, a aguardar resposta' },
  };
  return (labels[lang] || labels.en)[status] || status;
}

function remoteSessionText(lang = 'de') {
  if (lang === 'en') {
    return 'Unfortunately, the steps performed so far did not resolve the issue. We would therefore like to review the behavior together with you in a remote session and try to resolve the issue directly on your system. Please let us know whether you would generally be available for a remote session so we can coordinate a suitable appointment.';
  }
  if (lang === 'pt') {
    return 'Infelizmente, os passos realizados até agora não resolveram o problema. Por isso, gostaríamos de verificar o comportamento consigo numa sessão remota e tentar resolver o erro diretamente no seu sistema. Por favor informe-nos se estaria disponível para uma sessão remota, para podermos combinar um horário adequado.';
  }
  return 'Leider konnten die bisher durchgeführten Schritte das Problem nicht beheben. Wir möchten das Verhalten daher gerne im Rahmen einer Remote-Session gemeinsam mit Ihnen überprüfen und versuchen, den Fehler direkt an Ihrem System zu beheben. Bitte teilen Sie uns mit, ob Sie grundsätzlich für eine Remote-Session zur Verfügung stehen, damit wir anschließend einen passenden Termin mit Ihnen abstimmen können.';
}

function internalReviewText(lang = 'de') {
  if (lang === 'en') {
    return 'After consultation with our team, we are currently reviewing the further course of action and the next possible steps. As soon as the internal assessment is completed, we will get back to you promptly. We kindly ask for a little patience in the meantime.';
  }
  if (lang === 'pt') {
    return 'Após consulta com a nossa equipa, estamos atualmente a analisar o procedimento seguinte e os próximos passos possíveis. Assim que a avaliação interna estiver concluída, entraremos em contacto consigo prontamente. Pedimos um pouco de paciência entretanto.';
  }
  return 'Nach Rücksprache mit unserem Team analysieren wir derzeit das weitere Vorgehen und prüfen die nächsten möglichen Schritte. Sobald die interne Bewertung abgeschlossen ist, melden wir uns umgehend wieder bei Ihnen. Bis dahin bitten wir Sie noch um etwas Geduld.';
}

function hardwareText(lang = 'de') {
  if (lang === 'en') {
    return 'Unfortunately, the steps performed so far did not resolve the issue. We are therefore reviewing the initiation of the next service measure.';
  }
  if (lang === 'pt') {
    return 'Infelizmente, os passos realizados até agora não resolveram o problema. Por isso, estamos a verificar a próxima medida de serviço.';
  }
  return 'Leider konnten die bisher durchgeführten Schritte das Problem nicht beheben. Daher prüfen wir aktuell die Einleitung der nächsten Service-Maßnahme.';
}

function greeting(lang) {
  if (lang === 'en') return 'Hello,';
  if (lang === 'pt') return 'Olá,';
  return 'Guten Tag,';
}

function thanks(lang) {
  if (lang === 'en') return 'Thank you for your feedback.';
  if (lang === 'pt') return 'Obrigada pelo feedback.';
  return 'vielen Dank für Ihre Rückmeldung.';
}

function closing(lang, supporter) {
  if (lang === 'en') return `Please reply directly to this email so no duplicate case is created.\n\nKind regards\n\n${supporter}\nPFU Tech Support Team`;
  if (lang === 'pt') return `Por favor responda diretamente a este e-mail para evitar a criação de um novo caso.\n\nCom os melhores cumprimentos\n\n${supporter}\nPFU Tech Support Team`;
  return `Bitte antworten Sie direkt auf diese E-Mail, damit kein neuer Vorgang entsteht.\n\nMit freundlichen Grüßen\n\n${supporter}\nPFU Tech Support Team`;
}

export function shouldUseAnalysisAwareEmail(session = {}) {
  return (session.steps || []).some(s => DONE_STATUSES.includes(s.status) || s.status === 'waiting_customer') || session.status === 'exhausted';
}

export function buildAnalysisAwareEmail(session = {}, lang = 'de') {
  const l = (lang || 'de').toLowerCase();
  const supporter = session.supporterName || '[Supporter Name]';
  const model = session.model || session.device || session.knownFacts?.model || 'Scanner';
  const done = completedSteps(session);
  const waiting = waitingSteps(session);
  const exhausted = isExhausted(session);
  const hardware = isHardwareCandidate(session);
  const missing = missingFacts(session, hardware ? 'hardware' : 'default');

  const parts = [greeting(l), thanks(l)];

  if (done.length) {
    const intro = l === 'en'
      ? `According to the documented analysis, the following steps have already been performed for your ${model}:`
      : l === 'pt'
        ? `De acordo com a análise documentada, os seguintes passos já foram realizados para o ${model}:`
        : `Gemäß der dokumentierten Analyse wurden die folgenden Schritte für Ihren ${model} bereits durchgeführt:`;
    parts.push(`${intro}\n\n${done.map(s => `- ${cleanTitle(s)}: ${statusLabel(s.status, l)}`).join('\n')}`);
  }

  if (waiting.length) {
    const intro = l === 'en'
      ? 'The following item is still awaiting your feedback:'
      : l === 'pt'
        ? 'O seguinte ponto ainda aguarda resposta:'
        : 'Zu folgendem Punkt warten wir noch auf Ihre Rückmeldung:';
    parts.push(`${intro}\n\n${waiting.map(s => `- ${cleanTitle(s)}`).join('\n')}`);
  }

  if (exhausted && hardware) {
    parts.push(hardwareText(l));
  } else if (exhausted) {
    parts.push(remoteSessionText(l));
    parts.push(internalReviewText(l));
  }

  if (missing.length) {
    const intro = l === 'en'
      ? 'For the next review, please send us only the following remaining information:'
      : l === 'pt'
        ? 'Para a próxima verificação, pedimos que nos envie apenas as seguintes informações restantes:'
        : 'Für die nächste Prüfung benötigen wir bitte nur noch die folgenden Informationen:';
    parts.push(`${intro}\n\n${missing.map(k => `- ${missingLabel(k, l)}`).join('\n')}`);
  }

  if (!exhausted && !waiting.length && !missing.length) {
    parts.push(l === 'en'
      ? 'We will review the information and continue with the next suitable support step.'
      : l === 'pt'
        ? 'Vamos verificar as informações e continuar com o próximo passo de suporte adequado.'
        : 'Wir prüfen die Informationen anschließend und setzen die Bearbeitung mit dem nächsten passenden Supportschritt fort.');
  }

  parts.push(closing(l, supporter));
  return parts.join('\n\n');
}
