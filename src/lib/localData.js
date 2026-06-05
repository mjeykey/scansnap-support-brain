// ============================================================
// LOCAL DATA LAYER – Single source of truth
// Schema v4.0: MULTILINGUAL KB
// All customer-facing fields are now language objects:
//   { de: [...], en: [...], pt: [...], es: [...], fr: [...], it: [...], nl: [...], ja: [...], zh: [...] }
// NO runtime translation. Load the right language directly.
// ============================================================

import kbRaw          from '../data/knowledgeBase.json';
import emailRaw       from '../data/emailTemplates.json';
import caseSummaryRaw from '../data/caseSummaries.json';
import escalationRaw  from '../data/escalationTemplates.json';
import { officialKB } from './officialKB.js';

// ── In-memory lookup maps ────────────────────────────────────
const emailMap = Object.fromEntries(emailRaw.map(t => [t.template_id, t.content]));
const caseMap  = Object.fromEntries(caseSummaryRaw.map(t => [t.summary_id, t.content]));
const escMap   = Object.fromEntries(escalationRaw.map(t => [t.escalation_id, t.content]));

// Merged KB: local experience entries first, then official seed entries
// Local entries always ranked higher in search due to richer content
export const knowledgeBase = [...kbRaw, ...officialKB];

const SUPPORTED_LANGS = ['de', 'en', 'pt', 'es', 'fr', 'it', 'nl', 'ja', 'zh'];

// ── Multilingual field resolver ──────────────────────────────

/**
 * Resolve a multilingual field.
 * Field can be:
 *   - { de: [...], en: [...], ... }   → new multilingual format
 *   - [...]                            → legacy English-only array
 *   - string                           → legacy English-only string
 *
 * Returns { value, fallback, langLoaded }
 */
export function resolveField(field, lang) {
  const l = (lang || 'en').toLowerCase();

  // New multilingual object
  if (field && typeof field === 'object' && !Array.isArray(field)) {
    if (field[l]) return { value: field[l], fallback: false, langLoaded: l };
    if (field['en']) return { value: field['en'], fallback: true, langLoaded: 'en' };
    const first = Object.values(field)[0];
    return { value: first || (Array.isArray(first) ? [] : ''), fallback: true, langLoaded: 'unknown' };
  }

  // Legacy array/string — always English
  if (field !== null && field !== undefined) {
    return { value: field, fallback: l !== 'en', langLoaded: 'en' };
  }

  return { value: Array.isArray(field) ? [] : '', fallback: false, langLoaded: l };
}

/**
 * Get all customer-facing fields for a KB entry in the requested language.
 * Returns { title, symptoms, causes, solution_steps, fallback, langLoaded }
 */
export function getKBEntryInLanguage(entry, lang) {
  if (!entry) return { title: '', symptoms: [], causes: [], solution_steps: [], fallback: false, langLoaded: lang };

  const title         = resolveField(entry.title, lang);
  const symptoms      = resolveField(entry.symptoms, lang);
  const causes        = resolveField(entry.causes, lang);
  const solution_steps = resolveField(entry.solution_steps, lang);

  // Overall fallback: true if ANY field fell back
  const fallback = title.fallback || symptoms.fallback || causes.fallback || solution_steps.fallback;
  // langLoaded: the actual language that was served (may differ per field — use causes as reference)
  const langLoaded = causes.langLoaded;

  return {
    title:          title.value,
    symptoms:       Array.isArray(symptoms.value) ? symptoms.value : [symptoms.value].filter(Boolean),
    causes:         Array.isArray(causes.value) ? causes.value : [causes.value].filter(Boolean),
    solution_steps: Array.isArray(solution_steps.value) ? solution_steps.value : [solution_steps.value].filter(Boolean),
    fallback,
    langLoaded,
    isMultilingual: typeof entry.causes === 'object' && !Array.isArray(entry.causes),
  };
}

// ── Template resolvers ───────────────────────────────────────

export function getEmailText(entry, language) {
  if (!entry?.linked_email_template_id) return '';
  const content = emailMap[entry.linked_email_template_id];
  if (!content) return '';
  const lang = (language || 'en').toLowerCase();
  return content[lang] || content['en'] || Object.values(content)[0] || '';
}

export function getCaseSummary(entry) {
  if (!entry?.linked_case_summary_id) return '';
  return caseMap[entry.linked_case_summary_id] || '';
}

export function getEscalationText(entry) {
  if (!entry?.linked_escalation_id) return '';
  return escMap[entry.linked_escalation_id] || '';
}

// ── KB stats ─────────────────────────────────────────────────

export function getKBStats() {
  const allEntries = [...kbRaw, ...officialKB];
  const multilingualCount = allEntries.filter(e =>
    e.causes && typeof e.causes === 'object' && !Array.isArray(e.causes)
  ).length;

  const kws = ['firmware', 'wifi', 'wi-fi', 'cloud', 'update', 'recovery', 'streak', 'paper', 'startup', 'not detected', 'ocr', 'usb'];
  const kwCounts = {};
  for (const kw of kws) {
    kwCounts[kw] = allEntries.filter(e => {
      // Search across all language variants
      const title = typeof e.title === 'object' ? Object.values(e.title).join(' ') : (e.title || '');
      const tags  = (e.tags || []).join(' ');
      const models = (e.models || []).join(' ');
      const causes = typeof e.causes === 'object' && !Array.isArray(e.causes)
        ? Object.values(e.causes).flat().join(' ')
        : (e.causes || []).join(' ');
      return [title, tags, models, causes].join(' ').toLowerCase().includes(kw);
    }).length;
  }

  return {
    total: allEntries.length,
    localCount: kbRaw.length,
    officialCount: officialKB.length,
    multilingualCount,
    isFullyMultilingual: multilingualCount === allEntries.length,
    first10ids: kbRaw.slice(0, 10).map(e => e.case_id),
    keywordCounts: kwCounts,
  };
}

// ── Search Engine ────────────────────────────────────────────

const normalize = (s) => (s || '').toLowerCase()
  .replace(/[\u2011\u2010]/g, '-')
  .replace(/[.,!?;:()[\]{}'"]/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

const tokenize = (s) => normalize(s).split(/[\s,;/|+]+/).filter(b => b.length >= 2);

const SYNONYM_MAP = [
  ['firmware update fehlgeschlagen', 'firmware update failed'],
  ['firmware update hängt', 'firmware update stuck'],
  ['startet nicht', 'not starting'],
  ['scanner startet nicht', 'scanner not starting'],
  ['wird nicht erkannt', 'not detected'],
  ['nicht erkannt', 'not detected'],
  ['verbindet nicht', 'not connecting'],
  ['wlan verbindet nicht', 'wifi not connecting'],
  ['wlan', 'wifi'],
  ['hängt', 'stuck'],
  ['absturz', 'crash'],
  ['papierstau', 'paper jam'],
  ['einzug', 'feed'],
  ['streifen', 'streaks'],
  ['orange led blinkt', 'orange led flashing'],
  ['fehlgeschlagen', 'failed'],
  ['fehler', 'error'],
  ['geräusch', 'noise'],
  ['nicht gefunden', 'not found'],
  ['doppeleinzug', 'double feed'],
  ['unscharfe scans', 'blurry scan'],
  ['falhou', 'failed'],
  ['não conecta', 'not connecting'],
  ['não reconhecido', 'not detected'],
  ['travado', 'stuck'],
  ['atolamento', 'paper jam'],
  ['listras', 'streaks'],
  ['falló', 'failed'],
  ['no detectado', 'not detected'],
  ['no conecta', 'not connecting'],
  ['atasco', 'paper jam'],
  ['rayas', 'streaks'],
  ['échec', 'failed'],
  ['ne démarre pas', 'not starting'],
  ['non détecté', 'not detected'],
  ['bourrage papier', 'paper jam'],
  ['rayures', 'streaks'],
  ['non rilevato', 'not detected'],
  ['non si avvia', 'not starting'],
  ['inceppamento', 'paper jam'],
  ['strisce', 'streaks'],
  ['niet gedetecteerd', 'not detected'],
  ['start niet', 'not starting'],
  ['papierstoring', 'paper jam'],
  ['strepen', 'streaks'],
];

function applyMultilingualSynonyms(raw) {
  let s = normalize(raw);
  for (const [foreign, english] of SYNONYM_MAP) {
    s = s.replace(new RegExp(foreign.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), english);
  }
  return s;
}

const LOW_VALUE_WORDS = new Set([
  'failed', 'failure', 'issue', 'error', 'problem', 'scanner', 'not', 'working',
  'the', 'and', 'for', 'with', 'from', 'that', 'this', 'can', 'cannot',
  'during', 'after', 'when', 'while', 'only', 'also',
]);

const FIRMWARE_CLUSTER   = ['firmware', 'update', 'recovery', 'stuck', 'boot', 'flash', 'bios'];
const WIFI_CLOUD_CLUSTER = ['wifi', 'wi-fi', 'cloud', 'onedrive', 'sync'];

function levenshtein(a, b) {
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, (_, i) => [i]);
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = a[i-1] === b[j-1]
        ? dp[i-1][j-1]
        : 1 + Math.min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1]);
  return dp[m][n];
}

function substringFuzzy(needle, haystack) {
  if (!needle || !haystack) return false;
  if (haystack.includes(needle)) return true;
  if (needle.length >= 5 && levenshtein(needle, haystack) <= Math.floor(needle.length / 4)) return true;
  return false;
}

function scoreTokenInText(token, text, exactWeight, fuzzyWeight) {
  if (!text) return 0;
  const norm = normalize(text);
  if (norm.split(/\s+/).includes(token)) return exactWeight;
  if (norm.includes(token)) return exactWeight * 0.8;
  if (token.length >= 4 && substringFuzzy(token, norm)) return fuzzyWeight;
  return 0;
}

/**
 * Flatten a multilingual field to a single searchable string.
 * For multilingual objects: join ALL language variants for search.
 * For arrays: join directly.
 */
function flattenForSearch(field) {
  if (!field) return '';
  if (Array.isArray(field)) return field.join(' ');
  if (typeof field === 'object') return Object.values(field).flat().join(' ');
  return String(field);
}

/**
 * Score a KB entry's model list against the selected model.
 * Returns:
 *   200 — exact model match
 *   0   — generic (no specific model in entry)
 *  -150 — different specific model (cross-model penalty)
 */
function scoreModelMatch(entryModels, selectedModel) {
  if (!selectedModel || selectedModel.trim() === '') return 0;
  const sel = selectedModel.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (!entryModels || entryModels.length === 0) return 0;

  const genericTerms = ['scansnap', 'scansnaphome', 'scansnapcl', 'windows', 'macos', 'mac'];
  const nonGenericModels = entryModels.filter(m => {
    const mn = m.toLowerCase().replace(/[^a-z0-9]/g, '');
    return !genericTerms.some(g => mn === g);
  });

  // Entry has no specific scanner model — it's generic
  if (nonGenericModels.length === 0) return 0;

  // Check if selected model matches any entry model
  const hasExactMatch = nonGenericModels.some(m => {
    const mn = m.toLowerCase().replace(/[^a-z0-9]/g, '');
    return mn.includes(sel) || sel.includes(mn);
  });

  if (hasExactMatch) return 200;

  // Entry is for a DIFFERENT specific model — heavy penalty
  return -150;
}

export function searchKnowledgeBase(query, modell = '', fehlercode = '') {
  const qNorm   = applyMultilingualSynonyms(query);
  const q       = normalize(qNorm);
  const qTokens = tokenize(qNorm).filter(t => !LOW_VALUE_WORDS.has(t));
  const inModell = normalize(modell);
  const inFehler = normalize(fehlercode);

  const translationApplied = qNorm !== normalize(query) ? qNorm : null;

  const qAll = (q + ' ' + inModell + ' ' + inFehler);
  const queryFirmwareFocused = FIRMWARE_CLUSTER.some(kw => qAll.includes(kw));

  const queryWords = q.split(/\s+/).filter(w => w.length >= 2);
  const bigrams    = queryWords.slice(0, -1).map((w, i) => w + ' ' + queryWords[i + 1]);
  const trigrams   = queryWords.slice(0, -2).map((w, i) => w + ' ' + queryWords[i + 1] + ' ' + queryWords[i + 2]);
  const phrases    = [...trigrams, ...bigrams];

  const scored = kbRaw.map((entry) => {
    let score = 0;
    const debugMatched   = [];
    const debugPhrases   = [];
    const debugPenalties = [];

    // ── MODEL MATCH — applied first, overrides everything ──
    const modelScore = scoreModelMatch(entry.models || [], inModell);
    if (modelScore !== 0) {
      score += modelScore;
      if (modelScore > 0) debugMatched.push(`model_match_exact(+${modelScore})`);
      else debugPenalties.push(`cross_model_penalty(${modelScore})`);
    }

    // Flatten all fields for search (searches ALL language variants)
    const eTitle    = normalize(flattenForSearch(entry.title));
    const eSymptoms = normalize(flattenForSearch(entry.symptoms));
    const eCauses   = normalize(flattenForSearch(entry.causes));
    const eSteps    = normalize(flattenForSearch(entry.solution_steps));
    const eTags     = normalize((entry.tags || []).join(' '));
    const eModels   = normalize((entry.models || []).join(' '));
    const corpusAll = [eTitle, eSymptoms, eCauses, eSteps, eTags, eModels].join(' ');

    // 1. Error code match
    if (inFehler) {
      if (corpusAll.includes(inFehler)) {
        const boost = eTitle.includes(inFehler) ? 150 : 80;
        score += boost;
        debugMatched.push(`error_code:${inFehler}(+${boost})`);
      }
    }

    // 2. Firmware cluster boost
    if (queryFirmwareFocused) {
      const cnt = FIRMWARE_CLUSTER.filter(kw => corpusAll.includes(kw)).length;
      if (cnt > 0) { score += cnt * 25; debugMatched.push(`firmware_cluster(+${cnt * 25})`); }
    }

    // 3. Exact phrase matches
    for (const phrase of phrases) {
      if (phrase.split(' ').every(w => LOW_VALUE_WORDS.has(w))) continue;
      if (eTitle.includes(phrase)) { score += 120; debugPhrases.push(`title:"${phrase}"(+120)`); }
      else if (eSymptoms.includes(phrase) || eCauses.includes(phrase)) { score += 70; debugPhrases.push(`sym/cause:"${phrase}"(+70)`); }
      else if (corpusAll.includes(phrase)) { score += 35; debugPhrases.push(`corpus:"${phrase}"(+35)`); }
    }

    // 4. Title token matching
    for (const tok of qTokens) {
      if (LOW_VALUE_WORDS.has(tok)) continue;
      const s = scoreTokenInText(tok, eTitle, 30, 12);
      if (s > 0) { score += s; debugMatched.push(`title:"${tok}"(+${s})`); }
    }

    // 5. Model match
    if (inModell && inModell.length >= 3) {
      if (eModels.includes(inModell) || eTitle.includes(inModell)) { score += 50; debugMatched.push(`model_exact(+50)`); }
      else if (corpusAll.includes(inModell)) { score += 25; debugMatched.push(`model_corpus(+25)`); }
    }

    // 6. Symptom exact match
    if (q.length >= 4 && eSymptoms.length >= 4 && (eSymptoms.includes(q) || q.includes(eSymptoms))) {
      score += 90; debugMatched.push(`symptom_exact(+90)`);
    }

    // 7. Symptom + cause token matching
    for (const tok of qTokens) {
      if (LOW_VALUE_WORDS.has(tok)) continue;
      let s = 0;
      s += scoreTokenInText(tok, eSymptoms, 20, 8);
      s += scoreTokenInText(tok, eCauses, 14, 5);
      if (s > 0) { score += s; debugMatched.push(`sym/cause:"${tok}"(+${s})`); }
    }

    // 8. Tag + step matching
    for (const tok of qTokens) {
      if (LOW_VALUE_WORDS.has(tok)) continue;
      let s = 0;
      s += scoreTokenInText(tok, eTags, 12, 4);
      s += scoreTokenInText(tok, eSteps, 8, 3);
      if (s > 0) { score += s; debugMatched.push(`tag/step:"${tok}"(+${s})`); }
    }

    // 9. Negative scoring
    if (queryFirmwareFocused) {
      const wifiCnt = WIFI_CLOUD_CLUSTER.filter(kw => corpusAll.includes(kw)).length;
      const firmCnt = FIRMWARE_CLUSTER.filter(kw => corpusAll.includes(kw)).length;
      if (wifiCnt > 0 && firmCnt === 0) {
        const penalty = wifiCnt * 20;
        score -= penalty;
        debugPenalties.push(`wifi_cloud_penalty(-${penalty})`);
      }
    }

    return {
      entry,
      score: Math.max(0, Math.round(score)),
      _debug: {
        case_id: entry.case_id, score, matched: debugMatched, phrases: debugPhrases,
        penalties: debugPenalties, firmware_focused: queryFirmwareFocused,
        normalized_query: q, translation_applied: translationApplied,
        isMultilingual: typeof entry.causes === 'object' && !Array.isArray(entry.causes),
      },
    };
  });

  return scored
    .filter(({ score }) => score >= 5)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map(({ entry, score, _debug }) => ({ ...entry, _score: score, _debug }));
}