// ============================================================
// PFU Escalation & Request Templates
// Template-driven, data-aware, original compact PFU formats.
// ============================================================

import { resolveStep } from './stepTranslations';

function getPerformedSteps(session) {
  return (session?.steps || []).filter(s =>
    ['solved', 'not_solved', 'not_possible', 'skipped', 'blocked', 'done', 'waiting_customer'].includes(s.status)
  );
}

function stepResultLabel(status) {
  const map = {
    not_solved: 'Issue persists',
    not_possible: 'Not possible in customer environment',
    skipped: 'Skipped',
    blocked: 'Blocked by customer environment',
    done: 'Completed (outcome unconfirmed)',
    solved: 'Resolved',
    waiting_customer: 'Awaiting customer response',
  };
  return map[status] || 'Not recorded';
}

function buildTroubleshootingHistory(session) {
  const performed = getPerformedSteps(session);
  if (performed.length === 0) return 'Not provided';
  return performed.map((s, i) => {
    let title = s.title;
    if (s.stepId) {
      const resolved = resolveStep(s.stepId, 'en');
      title = resolved.title || s.title || s.stepId;
    }
    let line = `${i + 1}. ${title || 'Step'} → ${stepResultLabel(s.status)}`;
    if (s.note && s.note.trim()) line += ` (Note: ${s.note.trim()})`;
    return line;
  }).join('\n');
}

function autoFill(session = {}) {
  const problem = session?.problem || '';
  const errMatch = problem.match(/(?:error|fehler|code|err)?\s*(-?\d{1,4})/i);
  return {
    model: (session?.model || session?.device || session?.knownFacts?.model || '').toUpperCase(),
    os: session?.os || session?.knownFacts?.os || '',
    connType: session?.connectionType || session?.knownFacts?.connectionType || '',
    problem,
    caseNum: session?.caseNumber || '',
    errorCode: session?.errorCode || session?.knownFacts?.errorCode || (errMatch ? errMatch[1] : ''),
    errorMessage: session?.errorMessage || session?.knownFacts?.errorMessage || '',
    errorDescription: session?.errorDescription || session?.problem || '',
    scanCount: session?.scanCount || session?.knownFacts?.scanCount || '',
    lifetimeCounter: session?.lifetimeCounter || session?.knownFacts?.lifetimeCounter || '',
    consumableCounter: session?.consumableCounter || session?.knownFacts?.consumableCounter || '',
    assistRollerCounter: session?.assistRollerCounter || session?.knownFacts?.assistRollerCounter || '',
    serialNumber: session?.serialNumber || session?.knownFacts?.serialNumber || '',
    customerName: session?.customerName || session?.knownFacts?.customerName || '',
    customerEmail: session?.customerEmail || session?.knownFacts?.customerEmail || '',
    phone: session?.phone || session?.knownFacts?.phone || '',
    address: session?.address || session?.knownFacts?.address || '',
    country: session?.country || session?.knownFacts?.country || '',
    language: session?.supportLanguage || session?.emailLanguage || session?.language || '',
    troubleshootingHistory: buildTroubleshootingHistory(session),
  };
}

function np(v) {
  return v && String(v).trim() ? String(v).trim() : 'Not provided';
}

export function detectMissingFields(templateKey, session) {
  const f = autoFill(session);
  const missing = [];

  if (templateKey === 'level4') {
    if (!f.connType) missing.push({ id: 'connType', label: 'Connectivity type (USB / Wi-Fi / LAN)' });
    if (!f.os) missing.push({ id: 'os', label: 'Operating system' });
    if (!f.errorCode) missing.push({ id: 'errorCode', label: 'Error code on scanner display' });
    if (!f.scanCount && !f.lifetimeCounter) missing.push({ id: 'scanCount', label: 'Scan count / Lifetime counter' });
    missing.push({ id: 'frequency', label: 'Frequency of occurrence' });
    missing.push({ id: 'screenshots', label: 'Links to files / screenshots from customer' });
  }

  if (templateKey === 'advance_exchange') {
    if (!f.errorCode) missing.push({ id: 'errorCode', label: 'Error code' });
    if (!f.errorMessage) missing.push({ id: 'errorMessage', label: 'Error message' });
    if (!f.errorDescription) missing.push({ id: 'errorDescription', label: 'Error description' });
    if (!f.scanCount) missing.push({ id: 'scanCount', label: 'Scan count' });
    if (!f.customerName || !f.customerEmail) missing.push({ id: 'customerDetails', label: 'Customer details (name and e-mail)' });
    if (!f.phone) missing.push({ id: 'phone', label: 'Phone number' });
    if (!f.address) missing.push({ id: 'address', label: 'Address' });
  }

  if (templateKey === 'cost_quotation') {
    if (!f.errorCode) missing.push({ id: 'errorCode', label: 'Error code' });
    if (!f.errorMessage) missing.push({ id: 'errorMessage', label: 'Error message' });
    if (!f.errorDescription) missing.push({ id: 'errorDescription', label: 'Error description' });
    if (!f.scanCount) missing.push({ id: 'scanCount', label: 'Scan count' });
    if (!f.customerName || !f.customerEmail) missing.push({ id: 'customerDetails', label: 'Customer details (name and e-mail)' });
    if (!f.phone) missing.push({ id: 'phone', label: 'Phone number' });
    if (!f.address) missing.push({ id: 'address', label: 'Address' });
  }

  if (templateKey === 'preventive_maintenance') {
    if (!f.serialNumber) missing.push({ id: 'serialNumber', label: 'Scanner serial number' });
    if (!f.scanCount) missing.push({ id: 'scanCount', label: 'Scan count / Lifetime counter' });
  }

  return missing;
}

function buildLevel4(session) {
  const f = autoFill(session);
  return `Case Enquiry Type:
Country: ${np(f.country)}
Language: ${np(f.language)}
Error Code on scanner display: ${np(f.errorCode)}

Error Detail:
${np(f.errorMessage)}

Error Description:
${np(f.errorDescription)}

Previous attempts included:
${np(f.troubleshootingHistory)}

Scan Count: ${np(f.scanCount)}
Lifetime Counter: ${np(f.lifetimeCounter)}
Consumable Counter: ${np(f.consumableCounter)}
Assist Roller Counter (if applicable): ${np(f.assistRollerCounter)}

Connectivity (USB / Wi-Fi / LAN): ${np(f.connType)}

Frequency of occurrence:
Warranty status discussed with customer:
Warranty status disputed by customer:
Estimated cost (if out of warranty):

Number of scanners affected:

Deadline for solution imposed by customer:

Troubleshooting performed:
${np(f.troubleshootingHistory)}

Reason for escalation to PFUE:

Links to files received from customer that illustrate the reported issue:

New Service Requests from same customer (if any):

Case ${np(f.caseNum)}
Scanner Service History from last 12 months, including Case Numbers:

COMMENTS
Request:
Action Taken:
Resolution:`;
}

function buildAdvanceExchange(session) {
  const f = autoFill(session);
  return `Customer Request: Advance Exchange Request
Error Code: ${np(f.errorCode)}
Error Message: ${np(f.errorMessage)}
Error Description: ${np(f.errorDescription)}
Scan Count: ${np(f.scanCount)}
Customer Details: ${np([f.customerName, f.customerEmail].filter(Boolean).join(' / '))}
Phone Number: ${np(f.phone)}
Address: ${np(f.address)}

Files that illustrate the reported issue:`;
}

function buildCostQuotation(session) {
  const f = autoFill(session);
  return `Customer Request: Estimated Cost Quotation Request
Error Code: ${np(f.errorCode)}
Error Message: ${np(f.errorMessage)}
Error Description: ${np(f.errorDescription)}
Scan Count: ${np(f.scanCount)}
Customer Details: ${np([f.customerName, f.customerEmail].filter(Boolean).join(' / '))}
Phone Number: ${np(f.phone)}
Address: ${np(f.address)}

Files that illustrate the reported issue:`;
}

function buildPreventiveMaintenance(session) {
  const f = autoFill(session);
  return `Customer Request: Preventive Maintenance Request
Scanner Model: ${np(f.model)}
Serial Number: ${np(f.serialNumber)}
Scan Count / Lifetime Counter: ${np(f.scanCount || f.lifetimeCounter)}
Consumable Counter: ${np(f.consumableCounter)}
Customer Details: ${np([f.customerName, f.customerEmail].filter(Boolean).join(' / '))}
Phone Number: ${np(f.phone)}
Address: ${np(f.address)}`;
}

function buildOrderRequest(session) {
  return `Customer Request: Order Request
Item / Part Number:
Quantity:
Customer Details:
Phone Number:
Address:

Files that illustrate the request:`;
}

export const ESCALATION_TEMPLATES = [
  { key: 'level4', label: 'Level 4 Escalation', build: buildLevel4 },
  { key: 'advance_exchange', label: 'Advance Exchange Request (Case 2)', build: buildAdvanceExchange },
  { key: 'preventive_maintenance', label: 'Preventive Maintenance (Case 4)', build: buildPreventiveMaintenance },
  { key: 'cost_quotation', label: 'Estimated Cost Quotation Request (Case 3)', build: buildCostQuotation },
  { key: 'order_request', label: 'Order Request', build: buildOrderRequest },
];

export function buildTemplate(templateKey, session) {
  const tmpl = ESCALATION_TEMPLATES.find(t => t.key === templateKey);
  if (!tmpl) return '';
  return tmpl.build(session);
}

export function buildMissingInfoEmail(missingFields, session = {}) {
  const model = (session?.model || session?.device || '').toUpperCase() || 'Scanner';
  const lang = String(session?.supportLanguage || session?.emailLanguage || session?.language || 'de').toLowerCase();
  const fields = (missingFields || [])
    .filter(f => !['country', 'warranty'].includes(f.id))
    .map(f => f.label);

  if (lang.startsWith('de')) {
    return `Guten Tag,

vielen Dank für Ihre Geduld, während wir den gemeldeten Fall zu Ihrem ${model} weiter prüfen.

Damit wir die nächsten Schritte korrekt einleiten können, benötigen wir bitte noch folgende Informationen:

${fields.map(x => `- ${x}`).join('\n') || '- Screenshot der vollständigen Fehlermeldung\n- Betriebssystem inklusive Version\n- ScanSnap Home Version'}

Bitte antworten Sie direkt auf diese E-Mail, damit alle Informationen zentral im bestehenden Vorgang dokumentiert bleiben und kein zusätzlicher Doppelvorgang entsteht. Wenn Sie uns telefonisch kontaktieren, nennen Sie bitte Ihre Fallnummer, damit wir Ihren bestehenden Vorgang direkt aufrufen können.

Mit freundlichen Grüßen

Marina Karlovic
PFU Support Team`;
  }

  return `Dear Customer,

Thank you for your continued patience while we work to resolve the issue with your ${model}.

To proceed with the next steps, we require the following additional information:

${fields.map(x => `- ${x}`).join('\n') || '- Screenshot of the full error message\n- Operating system including version\n- ScanSnap Home version'}

Please reply directly to this email so all information remains documented in the existing case and no duplicate case is created. If you contact us by phone, please mention your case number so we can locate the existing case immediately.

Kind regards

Marina Karlovic
PFU Support Team`;
}
