// ============================================================
// PFU Escalation & Request Templates
// Template-driven, data-aware, missing-field-aware.
// NO AI generation. All fields mapped from real session data.
// ============================================================

import { resolveStep } from './stepTranslations';

// ── Step history helpers ────────────────────────────────────

function getPerformedSteps(session) {
  return (session?.steps || []).filter(s =>
    ['solved', 'not_solved', 'not_possible', 'skipped', 'blocked', 'done', 'waiting_customer'].includes(s.status)
  );
}

function stepResultLabel(status) {
  const map = {
    not_solved:       'Issue persists',
    not_possible:     'Not possible in customer environment',
    skipped:          'Skipped',
    blocked:          'Blocked by customer environment',
    done:             'Completed (outcome unconfirmed)',
    solved:           'Resolved',
    waiting_customer: 'Awaiting customer response',
  };
  return map[status] || 'Not recorded';
}

function buildTroubleshootingHistory(session) {
  const performed = getPerformedSteps(session);
  if (performed.length === 0) return '[MISSING — No troubleshooting steps recorded yet]';
  return performed.map((s, i) => {
    let title = s.title;
    if (s.stepId) {
      const resolved = resolveStep(s.stepId, 'en');
      title = resolved.title || s.title || s.stepId;
    }
    let line = `${i + 1}. ${title} → ${stepResultLabel(s.status)}`;
    if (s.note && s.note.trim()) line += ` (Note: ${s.note.trim()})`;
    return line;
  }).join('\n');
}

function buildExclusions(session) {
  const performed = getPerformedSteps(session);
  const all = performed.map(s => (s.title || s.stepId || '').toLowerCase()).join(' ');
  const lines = [];
  if (/direct.*usb|native.*usb|reconnect/i.test(all))         lines.push('Simple USB connectivity issue (direct connection tested)');
  if (/usb.*stack|device.*manager|rebuild/i.test(all))         lines.push('Stale USB/ScanSnap registration as sole cause (USB stack rebuilt)');
  if (/sfc|dism|integrity/i.test(all))                         lines.push('Repairable Windows component corruption (SFC/DISM executed)');
  if (/sshomeclean|cleanup|reinstall/i.test(all))              lines.push('ScanSnap Home environment corruption (full reinstall performed)');
  if (/firmware|standalone/i.test(all))                        lines.push('Firmware recoverable via standard update path');
  if (/recovery|top.*sensor|empty.*arm/i.test(all))            lines.push('Firmware recoverable via button-combo recovery');
  return lines.length > 0 ? lines.map(l => `- ${l}`).join('\n') : '[MISSING — Not enough troubleshooting history to determine exclusions]';
}

// ── Auto-fill from session ──────────────────────────────────

function autoFill(session) {
  const model      = (session?.model || session?.device || '').toUpperCase() || null;
  const os         = session?.os || null;
  const connType   = session?.connectionType && session.connectionType !== 'unknown' ? session.connectionType : null;
  const problem    = session?.problem || null;
  const caseNum    = session?.caseNumber || null;
  const rootCause  = session?.rootCause || null;
  const issueType  = session?.issueType || null;

  // Extract error code from problem text (e.g. "-6", "error -6", "code 19")
  const errMatch   = (problem || '').match(/(?:error|fehler|code|err)?\s*(-?\d{1,4})/i);
  const errorCode  = errMatch ? errMatch[1] : null;

  const performed  = getPerformedSteps(session);
  const failed     = performed.filter(s => ['not_solved', 'not_possible'].includes(s.status));

  return {
    model,
    os,
    connType,
    problem,
    caseNum,
    rootCause,
    issueType,
    errorCode,
    troubleshootingHistory: buildTroubleshootingHistory(session),
    exclusions: buildExclusions(session),
    failedCount: failed.length,
    performedCount: performed.length,
  };
}

// ── MISSING FIELD DETECTION ─────────────────────────────────

export function detectMissingFields(templateKey, session) {
  const f = autoFill(session);
  const missing = [];

  // Fields always required
  if (!f.model)    missing.push({ id: 'model',     label: 'Scanner model' });
  if (!f.connType) missing.push({ id: 'connType',  label: 'Connectivity type (USB / Wi-Fi / LAN)' });
  if (!f.os)       missing.push({ id: 'os',        label: 'Operating system' });

  if (templateKey === 'level4') {
    if (!f.errorCode)    missing.push({ id: 'errorCode',    label: 'Error code displayed on scanner' });
    missing.push({ id: 'scanCount',      label: 'Scan count / Lifetime counter' });
    missing.push({ id: 'frequency',      label: 'Frequency of occurrence (always / intermittent)' });
    missing.push({ id: 'screenshots',    label: 'Links to files / screenshots from customer' });
  }

  if (templateKey === 'advance_exchange') {
    missing.push({ id: 'serialNumber',   label: 'Scanner serial number' });
    missing.push({ id: 'address',        label: 'Customer delivery address' });
    missing.push({ id: 'country',        label: 'Customer country' });
    missing.push({ id: 'warranty',       label: 'Warranty status confirmed' });
  }

  if (templateKey === 'preventive_maintenance') {
    missing.push({ id: 'serialNumber',   label: 'Scanner serial number' });
    missing.push({ id: 'address',        label: 'Customer address' });
    missing.push({ id: 'scanCount',      label: 'Scan count / Lifetime counter' });
    missing.push({ id: 'country',        label: 'Customer country' });
  }

  if (templateKey === 'cost_quotation') {
    missing.push({ id: 'serialNumber',   label: 'Scanner serial number' });
    missing.push({ id: 'address',        label: 'Customer address' });
    missing.push({ id: 'country',        label: 'Customer country' });
    missing.push({ id: 'warranty',       label: 'Warranty status (out-of-warranty confirmed)' });
  }

  if (templateKey === 'order_request') {
    missing.push({ id: 'partNumber',     label: 'Part number / Item requested' });
    missing.push({ id: 'quantity',       label: 'Quantity' });
    missing.push({ id: 'address',        label: 'Shipping address' });
    missing.push({ id: 'country',        label: 'Customer country' });
  }

  return missing;
}

// ── TEMPLATE BUILDERS ───────────────────────────────────────

function placeholder(label) {
  return `[MISSING — ${label}]`;
}

function val(v, label) {
  return v || placeholder(label);
}

// ── Level 4 Escalation ──────────────────────────────────────
function buildLevel4(session) {
  const f = autoFill(session);

  const errorDetail = f.problem
    ? `Customer reports: ${f.problem}\nPossible cause (unconfirmed): ${f.rootCause || 'Not yet determined.'}`
    : placeholder('Error detail from customer');

  const escalationReason = f.failedCount >= 2
    ? `Issue persists after ${f.failedCount} failed troubleshooting actions. Standard Level 1–2 path exhausted. Root cause not isolatable at current support level.`
    : `All available troubleshooting steps performed without resolution. Level 4 technical review required.`;

  return `Case Enquiry Type:      Level 4 Technical Escalation
Country:                ${placeholder('Customer country')}
Language:               ${placeholder('Customer language')}
Error Code on scanner display: ${val(f.errorCode, 'Error code — check scanner display or ScanSnap Home error log')}

Error Detail:
${errorDetail}

Error Description:
${val(f.problem, 'Full error description from customer')}

Previous attempts included:
${f.troubleshootingHistory}

Scan Count:             ${placeholder('Lifetime counter — check Scanner Information in ScanSnap Home')}
Lifetime Counter:       ${placeholder('Lifetime counter')}
Consumable Counter:     ${placeholder('Consumable counter')}
Assist Roller Counter (if applicable): ${placeholder('Assist roller counter')}

Connectivity:           ${val(f.connType, 'USB / Wi-Fi / LAN')}

Frequency of occurrence:          ${placeholder('Always / Intermittent — specify')}
Warranty status discussed with customer: ${placeholder('Yes / No')}
Warranty status disputed by customer:    ${placeholder('Yes / No')}
Estimated cost (if out of warranty):     ${placeholder('Quoted amount or N/A')}

Number of scanners affected:      ${placeholder('Number of units')}

Deadline for solution imposed by customer: ${placeholder('Yes / No — specify date if applicable')}

Troubleshooting performed:
${f.troubleshootingHistory}

Excluded as sole cause:
${f.exclusions}

Reason for escalation to PFUE:
${escalationReason}

Links to files received from customer:
${placeholder('Upload screenshots / logs and paste links here')}

New Service Requests from same customer (if any):
${val(f.caseNum ? `Case ${f.caseNum}` : null, 'Case number(s)')}

Scanner Service History from last 12 months, including Case Numbers:
${placeholder('List all related cases from CRM')}

COMMENTS
Request:        Level 4 technical review for persistent issue on ${val(f.model, 'scanner model')} (${val(f.os, 'OS')}).
Action Taken:   Full L1–L2 troubleshooting performed as documented above.
Resolution:     ${placeholder('To be completed by Level 4 engineer')}`;
}

// ── Advance Exchange Request (Case 2) ───────────────────────
function buildAdvanceExchange(session) {
  const f = autoFill(session);
  return `REQUEST TYPE:           Advance Exchange (Case 2)

DEVICE INFORMATION
Model:                  ${val(f.model, 'Scanner model')}
Serial Number:          ${placeholder('Serial number — check underside of scanner or ScanSnap Home')}
Connectivity:           ${val(f.connType, 'USB / Wi-Fi / LAN')}

ISSUE SUMMARY
${val(f.problem, 'Issue description')}

TROUBLESHOOTING PERFORMED
${f.troubleshootingHistory}

WARRANTY
Warranty status:        ${placeholder('In warranty / Out of warranty — confirm with customer')}
Warranty disputed:      ${placeholder('Yes / No')}
Proof of purchase:      ${placeholder('Date of purchase / retailer if out of warranty')}

CUSTOMER DELIVERY DETAILS
Name:                   ${placeholder('Customer full name')}
Address line 1:         ${placeholder('Street address')}
Address line 2:         ${placeholder('City / Postcode')}
Country:                ${placeholder('Country')}
Phone:                  ${placeholder('Contact phone number')}

COMMENTS
Request:        Advance Exchange for ${val(f.model, 'scanner model')} — standard troubleshooting exhausted.
Action Taken:   ${f.performedCount > 0 ? `${f.performedCount} troubleshooting step(s) performed as documented above.` : placeholder('Document actions taken')}
Resolution:     ${placeholder('To be completed after exchange')}`;
}

// ── Preventive Maintenance (Case 4) ─────────────────────────
function buildPreventiveMaintenance(session) {
  const f = autoFill(session);
  return `REQUEST TYPE:           Preventive Maintenance (Case 4)

DEVICE INFORMATION
Model:                  ${val(f.model, 'Scanner model')}
Serial Number:          ${placeholder('Serial number')}
Connectivity:           ${val(f.connType, 'USB / Wi-Fi / LAN')}
OS:                     ${val(f.os, 'Operating system')}

MAINTENANCE REQUEST
Reason:                 ${val(f.problem, 'Reason for preventive maintenance request')}
Scan Count / Lifetime Counter: ${placeholder('Check Scanner Information in ScanSnap Home')}
Consumable Counter:     ${placeholder('Consumable counter value')}

CUSTOMER DETAILS
Name:                   ${placeholder('Customer full name')}
Address:                ${placeholder('Full address including country')}
Country:                ${placeholder('Country')}
Phone:                  ${placeholder('Contact phone number')}

COMMENTS
Request:        Preventive maintenance for ${val(f.model, 'scanner model')}.
Action Taken:   ${placeholder('Actions taken prior to this request')}
Resolution:     ${placeholder('To be completed after maintenance')}`;
}

// ── Estimated Cost Quotation Request (Case 3) ───────────────
function buildCostQuotation(session) {
  const f = autoFill(session);
  return `REQUEST TYPE:           Estimated Cost Quotation (Case 3)

DEVICE INFORMATION
Model:                  ${val(f.model, 'Scanner model')}
Serial Number:          ${placeholder('Serial number')}
Connectivity:           ${val(f.connType, 'USB / Wi-Fi / LAN')}
OS:                     ${val(f.os, 'Operating system')}

ISSUE
${val(f.problem, 'Issue description')}

TROUBLESHOOTING PERFORMED
${f.troubleshootingHistory}

WARRANTY
Warranty status:        ${placeholder('Out of warranty — confirm with customer')}
Estimated repair cost:  ${placeholder('If already communicated — specify amount and currency')}

CUSTOMER DETAILS
Name:                   ${placeholder('Customer full name')}
Address:                ${placeholder('Full address')}
Country:                ${placeholder('Country')}
Phone / Email:          ${placeholder('Contact details')}

COMMENTS
Request:        Cost quotation for out-of-warranty repair of ${val(f.model, 'scanner model')}.
Action Taken:   ${f.performedCount > 0 ? `${f.performedCount} troubleshooting step(s) performed as documented above.` : placeholder('Document actions taken')}
Resolution:     ${placeholder('To be completed after quotation issued')}`;
}

// ── Order Request ───────────────────────────────────────────
function buildOrderRequest(session) {
  const f = autoFill(session);
  return `REQUEST TYPE:           Order Request

CUSTOMER INFORMATION
Name:                   ${placeholder('Customer full name')}
Company (if applicable): ${placeholder('Company name')}
Address line 1:         ${placeholder('Street address')}
Address line 2:         ${placeholder('City / Postcode')}
Country:                ${placeholder('Country')}
Phone / Email:          ${placeholder('Contact details')}

ORDER DETAILS
Item / Part Number:     ${placeholder('Exact part number or item description')}
Quantity:               ${placeholder('Number of units')}
Device (if related):    ${val(f.model, 'Scanner model if applicable')}

REASON FOR ORDER
${val(f.problem, 'Reason for this order request')}

SHIPPING DETAILS
Preferred shipping:     ${placeholder('Standard / Express')}
Delivery address:       ${placeholder('If different from customer address')}

COMMENTS
Request:        ${placeholder('Describe order request')}
Action Taken:   ${placeholder('Actions prior to order request')}
Resolution:     ${placeholder('To be completed after order processed')}`;
}

// ── TEMPLATE REGISTRY ───────────────────────────────────────

// Dropdown templates from official PFU package — template_reference_only
// No L2 review escalation generated. Level 4 only after troubleshooting exhausted.
export const ESCALATION_TEMPLATES = [
  { key: 'level4',                label: 'Level 4 Escalation',                       build: buildLevel4 },
  { key: 'advance_exchange',      label: 'Advance Exchange Request (Case 2)',         build: buildAdvanceExchange },
  { key: 'preventive_maintenance',label: 'Preventive Maintenance (Case 4)',           build: buildPreventiveMaintenance },
  { key: 'cost_quotation',        label: 'Estimated Cost Quotation Request (Case 3)', build: buildCostQuotation },
  { key: 'order_request',         label: 'Order Request',                             build: buildOrderRequest },
];

export function buildTemplate(templateKey, session) {
  const tmpl = ESCALATION_TEMPLATES.find(t => t.key === templateKey);
  if (!tmpl) return '';
  return tmpl.build(session);
}

// ── MISSING FIELDS EMAIL ────────────────────────────────────

export function buildMissingInfoEmail(missingFields, session) {
  const model = (session?.model || session?.device || '').toUpperCase() || 'Scanner';
  const lang = String(session?.supportLanguage || session?.emailLanguage || session?.language || session?.settings?.emailLanguage || 'de').toLowerCase();
  const cleanFields = (missingFields || []).filter(f => !['country', 'warranty'].includes(f.id));
  const fieldList = cleanFields.map(f => `- ${f.label}`).join('
');

  if (lang.startsWith('de')) {
    return `Guten Tag,

vielen Dank für Ihre Geduld, während wir den gemeldeten Fall zu Ihrem ${model} weiter prüfen.

Damit wir die nächsten Schritte korrekt einleiten können, benötigen wir bitte noch folgende Informationen:

${fieldList || '- Betriebssystem inklusive Version
- ScanSnap Home Version
- Screenshot der vollständigen Fehlermeldung'}

Bitte antworten Sie direkt auf diese E-Mail, damit alle Informationen zentral im bestehenden Vorgang dokumentiert bleiben und kein zusätzlicher Doppelvorgang entsteht. Wenn Sie uns telefonisch kontaktieren, nennen Sie bitte Ihre Fallnummer, damit wir Ihren bestehenden Vorgang direkt aufrufen können.

Mit freundlichen Grüßen

Marina Karlovic
PFU Support Team`;
  }

  return `Dear Customer,

Thank you for your continued patience while we work to resolve the issue with your ${model}.

To proceed with the next steps, we require the following additional information:

${fieldList || '- Operating system including version
- ScanSnap Home version
- Screenshot of the full error message'}

Please reply directly to this email so all information remains documented in the existing case and no duplicate case is created. If you contact us by phone, please mention your case number so we can locate the existing case immediately.

Kind regards

Marina Karlovic
PFU Support Team`;
}