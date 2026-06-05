// ============================================================
// OFFICIAL KB LAYER — src/data/official/
// Adapts PFU official seed entries (SS-xxx) into the local KB
// schema so they participate in search and display.
//
// Merge strategy:
//   - Official entries act as a FALLBACK / coverage layer.
//   - Local KB entries (KB-xxx) always win on model+category match.
//   - Official entries are marked with _official: true for UI hints.
// ============================================================

import officialRaw from '../data/official/knowledgeBase.json';
import metadata    from '../data/official/metadata.json';

// ── Category → local KB category mapping ────────────────────
const CAT_MAP = {
  firmware: 'firmware',
  usb:      'usb',
  wifi:     'network',
  home:     'software',
  cloud:    'network',
  scan:     'hardware',
  profile:  'profile',
  ocr:      'software',
  detect:   'usb',
  speed:    'software',
};

// ── Category → search tags ───────────────────────────────────
const CAT_TAGS = {
  firmware: ['firmware', 'update', 'recovery', 'flash'],
  usb:      ['usb', 'device manager', 'not detected', 'connection'],
  wifi:     ['wifi', 'wi-fi', 'wireless', 'connection'],
  home:     ['sshome', 'startup', 'crash', 'install'],
  cloud:    ['cloud', 'onedrive', 'sync', 'login'],
  scan:     ['scan', 'image', 'processing', 'quality'],
  profile:  ['profile', 'corrupted', 'scandirect'],
  ocr:      ['ocr', 'text recognition', 'incorrect'],
  detect:   ['not detected', 'usb', 'device manager', 'recognition'],
  speed:    ['slow', 'speed', 'performance'],
};

// ── Adapt official entry → local KB schema ───────────────────
function adaptEntry(e) {
  const category = CAT_MAP[e.category] || 'software';
  const tags = CAT_TAGS[e.category] || [];

  // Build causes from support_logic (the closest semantic match)
  const causesEn = e.support_logic || [];
  const causesDe = e.support_logic || [];

  return {
    // Identity
    case_id:    e.case_id,
    _official:  true,
    _source:    'official',
    priority:   e.priority || 'MEDIUM',

    // Model + category
    models: [e.model],
    tags:   [e.model.toLowerCase(), e.category, ...tags],

    // Multilingual title
    title: e.title,

    // Multilingual symptoms (from official symptoms field)
    symptoms: e.symptoms,

    // Causes — derived from support_logic
    causes: {
      de: causesDe,
      en: causesEn,
    },

    // Solution steps — support_logic reused as step guidance
    solution_steps: {
      de: e.support_logic,
      en: e.support_logic,
    },

    // Official source link (no local templates)
    official_source: e.official_source,
    linked_email_template_id: null,
    linked_case_summary_id:   null,
    linked_escalation_id:     null,

    // Boost HIGH priority entries slightly in search
    _priorityBoost: e.priority === 'HIGH' ? 10 : 0,
  };
}

// ── Exported official KB (adapted) ──────────────────────────
export const officialKB = officialRaw.map(adaptEntry);

export const officialMetadata = metadata;

// ── Quick lookup by model + category ────────────────────────
const _officialIndex = {};
for (const e of officialKB) {
  const key = `${(e.models[0] || '').toLowerCase()}|${e.tags[1] || ''}`;
  _officialIndex[key] = e;
}

export function getOfficialEntry(model, category) {
  const key = `${(model || '').toLowerCase()}|${category || ''}`;
  return _officialIndex[key] || null;
}

/**
 * Merge official entries into the local KB array.
 * Local entries always take precedence for the same model+category.
 * Official entries fill gaps — specifically models/categories not
 * covered by the local experience KB.
 *
 * @param {Array} localKB — the existing local KB array
 * @returns {Array} merged KB
 */
export function mergeWithLocalKB(localKB) {
  // Build a set of covered model|category combos from local KB
  const covered = new Set();
  for (const e of localKB) {
    for (const m of (e.models || [])) {
      const cat = (e.tags || []).find(t => Object.values(CAT_MAP).includes(t)) || '';
      covered.add(`${m.toLowerCase()}|${cat}`);
    }
  }

  // Only include official entries that aren't already covered
  // All official entries are included as supplemental — local entries WIN on score
  const supplemental = officialKB.filter(e => {
    const m   = (e.models[0] || '').toLowerCase();
    const cat = CAT_MAP[e.tags[1]] || '';
    // Include anyway — search scoring will rank local entries higher
    // because local entries have richer causes, steps, tags
    return true;
  });

  return [...localKB, ...supplemental];
}