// ============================================================
// EXPERIENCE ENGINE — local learning layer, no AI, no external cost.
// Stores successful troubleshooting steps per context and suggests them
// for similar future cases.
// ============================================================

const EXPERIENCE_KEY = 'scansnap_experience_steps_v1';

function normalize(v) {
  return String(v || '').trim().toLowerCase();
}

function loadAll() {
  try {
    return JSON.parse(localStorage.getItem(EXPERIENCE_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveAll(items) {
  try {
    localStorage.setItem(EXPERIENCE_KEY, JSON.stringify(items));
  } catch {}
}

function contextFromSession(session = {}) {
  return {
    model: normalize(session.model || session.device),
    os: normalize(session.os || session.osVersion),
    connectionType: normalize(session.connectionType || session.connection),
    category: normalize(session.issueType || session.category),
  };
}

function scoreContext(a, b) {
  let score = 0;
  if (a.model && b.model && a.model === b.model) score += 4;
  if (a.os && b.os && (a.os.includes(b.os) || b.os.includes(a.os))) score += 2;
  if (a.connectionType && b.connectionType && a.connectionType === b.connectionType) score += 2;
  if (a.category && b.category && a.category === b.category) score += 1;
  return score;
}

export function recordSuccessfulStep(session, step) {
  if (!step) return;
  const title = step.title || step.instruction || '';
  if (!title.trim()) return;

  const context = contextFromSession(session);
  const all = loadAll();
  const key = [
    context.model,
    context.os,
    context.connectionType,
    normalize(title)
  ].join('|');

  const existing = all.find(x => x.key === key);
  if (existing) {
    existing.successCount = (existing.successCount || 0) + 1;
    existing.lastUsedAt = new Date().toISOString();
    existing.note = step.note || existing.note || '';
  } else {
    all.push({
      key,
      context,
      title: step.title || title,
      instruction: step.instruction || step.body || title,
      stepId: step.stepId || '',
      successCount: 1,
      createdAt: new Date().toISOString(),
      lastUsedAt: new Date().toISOString(),
      source: 'agent_marked_success'
    });
  }

  saveAll(all.slice(-200));
}

export function getExperienceSteps(session, limit = 3) {
  const current = contextFromSession(session);
  return loadAll()
    .map(item => ({ ...item, score: scoreContext(current, item.context || {}) }))
    .filter(item => item.score >= 4)
    .sort((a, b) => (b.score - a.score) || ((b.successCount || 0) - (a.successCount || 0)))
    .slice(0, limit)
    .map(item => ({
      title: `${item.title} · bewährt (${item.successCount || 1}×)`,
      instruction: item.instruction,
      difficulty: 'medium',
      status: 'pending',
      result: '',
      note: '',
      timestamp: null,
      source: 'experience',
      experienceCount: item.successCount || 1,
    }));
}

export function clearExperienceSteps() {
  saveAll([]);
}
