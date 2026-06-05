function s(v){return String(v||'').toLowerCase();}
function any(t, words){t=s(t);return words.some(w=>t.includes(w));}

export function classifyProcess(session = {}) {
  const problem = s(session.problem);
  const issueType = s(session.issueType);
  const hardwareWords = ['ds42039','h8000','hardware','no power','kein strom','internal error','sensor','mechanical','paper jam','papierstau','roller','feed','einzug','scanner startet nicht','startet nicht'];
  const advanceExchangeLikely = any(problem, hardwareWords) || ['hardware','firmware'].includes(issueType);
  const steps = session.steps || [];
  const completed = steps.filter(x => ['solved','done','not_solved','not_possible','waiting_customer'].includes(x.status));
  const failed = steps.filter(x => ['not_solved','not_possible'].includes(x.status));
  const solved = steps.some(x => x.status === 'solved');
  const waiting = steps.some(x => x.status === 'waiting_customer');
  const localStepsExhausted = !solved && (session.status === 'exhausted' || completed.length >= 3 || (completed.length >= 2 && failed.length >= 2));
  let recommendedProcess = 'continue_troubleshooting';
  if (advanceExchangeLikely && localStepsExhausted) recommendedProcess = 'advance_exchange';
  else if (localStepsExhausted) recommendedProcess = 'level4_escalation';
  else if (waiting) recommendedProcess = 'waiting_customer';
  return { advanceExchangeLikely, localStepsExhausted, recommendedProcess, completedCount: completed.length, failedCount: failed.length, solved, waiting };
}

export function getProcessMissingInfo(session = {}) {
  const k = session.knownFacts || {};
  const missing = [];
  if (!session.model && !session.device && !k.model) missing.push({ key:'model', label:'Scanner model' });
  if (!session.serialNumber && !k.serialNumber) missing.push({ key:'serialNumber', label:'Scanner serial number' });
  if (!session.scanCount && !k.scanCount) missing.push({ key:'scanCount', label:'Scan Count, if available' });
  if (!session.locationConfirmed && !k.locationConfirmed && !k.address) missing.push({ key:'locationConfirmed', label:'Scanner location confirmation' });
  if (!session.contactConfirmed && !k.contactConfirmed && !k.contactPerson) missing.push({ key:'contactConfirmed', label:'Contact person confirmation' });
  return missing;
}

export function buildHardwareProcessEmail(session = {}, lang = 'de') {
  const missing = getProcessMissingInfo(session);
  const model = session.model || session.device || session.knownFacts?.model || 'Scanner';
  const supporter = session.supporterName || 'PFU Support Team';
  const l = (lang || 'de').toLowerCase();
  const needs = key => missing.some(m => m.key === key);

  if (l === 'en') {
    const b = [];
    if (needs('locationConfirmed')) b.push('- Confirmation that the scanner is still located at the current/known site');
    if (needs('locationConfirmed')) b.push('- If the location has changed, please provide the current address');
    if (needs('scanCount')) b.push('- If possible, the current scan count of the scanner');
    if (needs('contactConfirmed')) b.push('- Confirmation of the current contact person');
    if (needs('contactConfirmed')) b.push('- If another contact person should handle the case, please provide name, email address and phone number');
    if (needs('serialNumber')) b.push('- Scanner serial number');
    return `Hello,\n\nThank you for your feedback.\n\nAs the troubleshooting steps performed so far did not resolve the issue and the recommended checks have been completed, we would now like to prepare the next steps for a possible hardware process for your ${model}.\n\nFor this, please provide or confirm the following information:\n\n${b.join('\n') || '- No further customer information is currently missing.'}\n\nOnce we have received this information, we will review the next steps and get back to you as soon as possible.\n\nPlease reply directly to this email so no duplicate case is created.\n\nKind regards\n\n${supporter}\nPFU Support Team`;
  }

  const b = [];
  if (needs('locationConfirmed')) b.push('- Bestätigung, dass sich der Scanner weiterhin am bisherigen Standort befindet');
  if (needs('locationConfirmed')) b.push('- Falls sich der Standort geändert hat, teilen Sie uns bitte die aktuelle Anschrift mit');
  if (needs('scanCount')) b.push('- Falls möglich, den aktuellen Scan Count Ihres Scanners');
  if (needs('contactConfirmed')) b.push('- Bestätigung der bisherigen Ansprechperson');
  if (needs('contactConfirmed')) b.push('- Falls die weitere Bearbeitung über eine andere Ansprechperson erfolgen soll, teilen Sie uns bitte deren Namen, E-Mail-Adresse und Telefonnummer mit');
  if (needs('serialNumber')) b.push('- Seriennummer des Scanners');
  return `Guten Tag,\n\nvielen Dank für Ihre Rückmeldung.\n\nDa die bisher durchgeführten Maßnahmen das Problem leider nicht beheben konnten und die empfohlenen Prüfschritte abgeschlossen wurden, möchten wir nun die nächsten Schritte für einen möglichen Hardwareprozess zu Ihrem ${model} vorbereiten.\n\nHierfür benötige ich bitte noch folgende Informationen:\n\n${b.join('\n') || '- Aktuell fehlen keine weiteren Kundeninformationen.'}\n\nSobald uns diese Informationen vorliegen, prüfen wir die weiteren Schritte und kommen schnellstmöglich auf Sie zurück.\n\nBitte antworten Sie hierfür einfach direkt auf diese E-Mail, damit kein neuer Vorgang entsteht.\n\nMit freundlichen Grüßen\n\n${supporter}\nPFU Support Team`;
}

export function buildProcessSummary(session = {}, lang = 'de') {
  const p = classifyProcess(session);
  const missing = getProcessMissingInfo(session);
  if ((lang || 'de').toLowerCase() === 'en') return {
    title: p.recommendedProcess === 'advance_exchange' ? 'Advance Exchange / hardware process possible' : 'Next process check',
    text: p.recommendedProcess === 'advance_exchange' ? `All relevant local troubleshooting steps appear to be completed. A hardware process can be prepared. Missing process information: ${missing.map(m=>m.label).join(', ') || 'none'}.` : 'Continue troubleshooting or collect missing information before preparing a hardware process.',
    action: p.recommendedProcess
  };
  return {
    title: p.recommendedProcess === 'advance_exchange' ? 'Advance Exchange / Hardwareprozess möglich' : 'Nächster Prozessschritt',
    text: p.recommendedProcess === 'advance_exchange' ? `Die relevanten lokalen Prüfschritte wirken abgeschlossen. Ein Hardwareprozess kann vorbereitet werden. Fehlende Prozessinformationen: ${missing.map(m=>m.label).join(', ') || 'keine'}.` : 'Troubleshooting fortsetzen oder fehlende Informationen erfassen, bevor ein Hardwareprozess vorbereitet wird.',
    action: p.recommendedProcess
  };
}
