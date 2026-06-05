// ============================================================
// DIAGNOSTIC MEMORY — Builds structured timeline from executed steps
// Determines final state → drives case summary + email generation
// ============================================================

import { resolveStep } from '@/lib/stepTranslations.js';

// ── Result labels (internal) ─────────────────────────────────
const RESULT_LABELS = {
  solved:          'resolved the issue',
  not_solved:      'did not resolve the issue',
  not_possible:    'could not be performed',
  skipped:         'was skipped',
  waiting_customer:'sent to customer — awaiting response',
  blocked:         'was blocked',
  done:            'completed',
};

/**
 * Build a structured diagnostic timeline from executed steps.
 * Each entry: { stepId, title, result, resultLabel, note, timestamp }
 */
export function buildDiagnosticTimeline(steps, lang = 'en') {
  return (steps || [])
    .filter(s => s.status && s.status !== 'pending')
    .map(s => {
      const resolved = s.stepId
        ? resolveStep(s.stepId, lang)
        : { title: s.title || '(unnamed step)', body: s.instruction || '' };
      return {
        stepId:      s.stepId || null,
        title:       resolved.title,
        result:      s.status,
        resultLabel: RESULT_LABELS[s.status] || s.status,
        note:        s.note || '',
        timestamp:   s.timestamp || null,
      };
    });
}

/**
 * Determine the final diagnostic state from the timeline + session status.
 *
 * Returns one of:
 *   solved | continue | request_info | remote_session | escalation |
 *   firmware_recovery | reinstall | hardware_suspicion | waiting_customer
 */
export function determineFinalState(session, timeline) {
  const status = session.status;

  if (status === 'solved') return 'solved';
  if (status === 'waiting_customer') return 'waiting_customer';
  if (status === 'exhausted') {
    // Check if firmware recovery was attempted and failed
    const recoveryFailed = timeline.some(t =>
      /recovery|top sensor|empty arm/i.test(t.title) &&
      ['not_solved', 'not_possible'].includes(t.result)
    );
    if (recoveryFailed) return 'escalation';

    const hardwareSteps = timeline.filter(t => /clean|roller|paper|glass|hardware/i.test(t.title));
    if (hardwareSteps.length >= 2 && hardwareSteps.every(t => t.result === 'not_solved')) return 'hardware_suspicion';

    const firmwareSteps = timeline.filter(t => /firmware|recovery/i.test(t.title));
    if (firmwareSteps.length >= 1 && firmwareSteps.every(t => t.result === 'not_solved')) return 'firmware_recovery';

    const swSteps = timeline.filter(t => /cleanup|reinstall|sshome/i.test(t.title));
    if (swSteps.length >= 1 && swSteps.every(t => t.result === 'not_solved')) return 'reinstall';

    const failedCount = timeline.filter(t => ['not_solved', 'not_possible'].includes(t.result)).length;
    if (failedCount >= 4) return 'escalation';
    if (failedCount >= 2) return 'remote_session';

    return 'continue';
  }

  return 'continue';
}

/**
 * Build the complete internal case summary as structured text.
 * Purely from diagnostic timeline — no hallucination.
 */
export function buildAutoCaseSummary(session, timeline, finalState) {
  const model    = session.model || session.device || 'unknown model';
  const problem  = session.problem || '(not described)';
  const category = session.category || session.issueType || '';

  const performed = timeline.filter(t => !['skipped', 'blocked'].includes(t.result));
  const resolved  = timeline.find(t => t.result === 'solved');
  const failed    = timeline.filter(t => ['not_solved', 'not_possible'].includes(t.result));
  const pending   = timeline.filter(t => t.result === 'waiting_customer');

  const actionLines = performed.map(t =>
    `• ${t.title}: ${t.resultLabel}${t.note ? ` — Note: ${t.note}` : ''}`
  ).join('\n');

  const STATE_ASSESSMENTS = {
    solved:            `Issue resolved. ${resolved ? `Solution: ${resolved.title}.` : ''}`,
    waiting_customer:  `Troubleshooting in progress. Awaiting customer response on: ${pending.map(t => t.title).join(', ') || 'last step'}.`,
    continue:          `Troubleshooting ongoing. ${failed.length} step(s) failed so far. Further diagnostics required.`,
    remote_session:    `Multiple steps failed without resolution. Remote session recommended to investigate live system state.`,
    escalation:        `All standard troubleshooting paths exhausted. Escalation to L2/engineering required.`,
    firmware_recovery: `Firmware corruption suspected. Standard update paths attempted without success. Recovery procedure may be required.`,
    reinstall:         `Software environment appears corrupted. Full reinstallation of ScanSnap Home required.`,
    hardware_suspicion:`Hardware-level issue suspected. Multiple hardware-related steps failed. Physical inspection or replacement may be required.`,
  };

  const assessment = STATE_ASSESSMENTS[finalState] || STATE_ASSESSMENTS.continue;

  return [
    `=== INTERNAL CASE SUMMARY ===`,
    `Model: ${model}`,
    `Issue: ${problem}`,
    category ? `Category: ${category}` : null,
    ``,
    `--- Actions Performed ---`,
    actionLines || '(no steps executed yet)',
    ``,
    `--- Assessment ---`,
    assessment,
    ``,
    `--- Final State ---`,
    finalState.replace(/_/g, ' ').toUpperCase(),
  ].filter(l => l !== null).join('\n');
}

/**
 * Build the AI prompt for generating a customer-facing email
 * from the diagnostic timeline and final state.
 */
export function buildEmailPrompt(session, timeline, finalState, language, currentEmailDraft = '') {
  const model    = session.model || session.device || 'the scanner';
  const problem  = session.problem || '';
  const langLabel = {
    de: 'German', en: 'English', fr: 'French', es: 'Spanish',
    pt: 'Portuguese', it: 'Italian', nl: 'Dutch', ja: 'Japanese', zh: 'Chinese',
  }[language] || 'English';

  const performed = timeline.filter(t => !['skipped', 'blocked', 'pending'].includes(t.result));
  const stepsText = performed.length > 0
    ? performed.map((t, i) => `${i + 1}. ${t.title}: ${t.resultLabel}${t.note ? ` (${t.note})` : ''}`).join('\n')
    : 'No troubleshooting steps have been performed yet.';

  const STATE_DIRECTION = {
    solved:            'The issue has been resolved. Write a closing email confirming the solution and encouraging the customer to reach out if the issue recurs.',
    waiting_customer:  'We are waiting for the customer to test the last step. Write a friendly follow-up asking them to confirm whether the step helped.',
    continue:          'Troubleshooting is ongoing. Write an email explaining what was tested and what the customer should try next.',
    remote_session:    'Multiple steps have been attempted without resolution. Write an email explaining the situation and proposing a remote support session.',
    escalation:        'All troubleshooting steps have been exhausted. Write an empathetic email explaining that the case requires deeper technical investigation and that the team will follow up.',
    firmware_recovery: 'Firmware-related issue. Write an email explaining that further firmware recovery steps are required and provide clear instructions.',
    reinstall:         'A full software reinstallation is required. Write an email with step-by-step reinstallation instructions for ScanSnap Home.',
    hardware_suspicion:'Hardware issue is suspected after all software steps failed. Write an email explaining the situation and recommending a device inspection or repair.',
  };

  const direction = STATE_DIRECTION[finalState] || STATE_DIRECTION.continue;

  return `You are a ScanSnap technical support agent writing a customer-facing email.

STRICT RULES:
- Write ONLY in ${langLabel}
- Write ONLY what the customer needs to know or do — no internal reasoning
- Be professional, clear, and empathetic
- Do NOT mention internal tools, ticket systems, or supporter names unless provided
- Do NOT invent steps that were not performed
- Keep it concise but complete

Scanner Model: ${model}
Original Issue: ${problem}

Troubleshooting performed (in order):
${stepsText}

Email direction: ${direction}

${currentEmailDraft ? `Existing draft to improve (keep structure, improve wording):\n${currentEmailDraft}` : 'Generate the email from scratch based on the above.'}`;
}

// LOCAL OVERRIDE — language-clean case summary
export function buildCleanCaseSummary(session, timeline, finalState, lang = 'de') {
  const steps = session?.steps || [];
  const model = session?.model || session?.device || 'Not provided';
  const issue = session?.problem || 'Not provided';

  const translateStatus = (status) => {
    const de = {
      solved: 'erfolgreich gelöst',
      done: 'durchgeführt',
      not_solved: 'Problem nicht behoben',
      not_possible: 'nicht möglich',
      waiting_customer: 'an Kunden gesendet — warte auf Rückmeldung',
      skipped: 'übersprungen',
      blocked: 'blockiert',
      pending: 'offen'
    };
    const en = {
      solved: 'resolved',
      done: 'completed',
      not_solved: 'did not resolve the issue',
      not_possible: 'not possible',
      waiting_customer: 'sent to customer — awaiting response',
      skipped: 'skipped',
      blocked: 'blocked',
      pending: 'pending'
    };
    return (lang || 'de').toLowerCase() === 'de' ? (de[status] || status) : (en[status] || status);
  };

  const translatedTitle = (s) => {
    const t = s?.title || s?.instruction || 'Step';
    const map = [
      ['Direct USB connection', 'Direkten USB-Anschluss testen'],
      ['Windows system integrity', 'Windows-Systemintegrität reparieren (SFC/DISM)'],
      ['Clean and reinstall ScanSnap Home', 'ScanSnap Home bereinigen und neu installieren'],
      ['Confirm scanner boot state', 'Scanner-Startzustand und USB-Erkennung prüfen'],
      ['Firmware Recovery', 'Firmware-Recovery vorbereiten']
    ];
    if ((lang || 'de').toLowerCase() === 'de') {
      const hit = map.find(([en]) => t.includes(en));
      return hit ? hit[1] : t;
    }
    return t;
  };

  if ((lang || 'de').toLowerCase() === 'de') {
    const lines = [];
    lines.push('=== INTERNE FALLZUSAMMENFASSUNG ===');
    lines.push(`Modell: ${model}`);
    lines.push(`Problem: ${issue}`);
    lines.push('');
    lines.push('--- Durchgeführte Schritte ---');
    if (steps.length === 0) {
      lines.push('• Keine Schritte dokumentiert');
    } else {
      steps.forEach(s => {
        if (s.status && s.status !== 'pending') {
          lines.push(`• ${translatedTitle(s)}: ${translateStatus(s.status)}`);
        }
      });
    }
    lines.push('');
    lines.push('--- Bewertung ---');
    const waiting = steps.find(s => s.status === 'waiting_customer');
    const solved = steps.find(s => s.status === 'solved');
    if (solved) {
      lines.push(`Problem gelöst durch: ${translatedTitle(solved)}.`);
    } else if (waiting) {
      lines.push(`Fehlersuche läuft. Warte auf Rückmeldung des Kunden zu: ${translatedTitle(waiting)}.`);
    } else {
      lines.push('Fehlersuche läuft. Weitere Rückmeldung oder zusätzliche Informationen erforderlich.');
    }
    lines.push('');
    lines.push('--- Aktueller Status ---');
    lines.push(waiting ? 'WARTE AUF KUNDENRÜCKMELDUNG' : solved ? 'GELÖST' : 'IN BEARBEITUNG');
    return lines.join('\n');
  }

  const lines = [];
  lines.push('=== INTERNAL CASE SUMMARY ===');
  lines.push(`Model: ${model}`);
  lines.push(`Issue: ${issue}`);
  lines.push('');
  lines.push('--- Actions Performed ---');
  if (steps.length === 0) {
    lines.push('• No steps documented');
  } else {
    steps.forEach(s => {
      if (s.status && s.status !== 'pending') {
        lines.push(`• ${translatedTitle(s)}: ${translateStatus(s.status)}`);
      }
    });
  }
  lines.push('');
  lines.push('--- Assessment ---');
  const waiting = steps.find(s => s.status === 'waiting_customer');
  const solved = steps.find(s => s.status === 'solved');
  if (solved) {
    lines.push(`Issue resolved by: ${translatedTitle(solved)}.`);
  } else if (waiting) {
    lines.push(`Troubleshooting in progress. Awaiting customer response on: ${translatedTitle(waiting)}.`);
  } else {
    lines.push('Troubleshooting in progress. Additional feedback or information required.');
  }
  lines.push('');
  lines.push('--- Final State ---');
  lines.push(waiting ? 'WAITING CUSTOMER' : solved ? 'SOLVED' : 'IN PROGRESS');
  return lines.join('\n');
}
