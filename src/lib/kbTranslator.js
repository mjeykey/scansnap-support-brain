// ============================================================
// KB CONTENT TRANSLATOR
// Translates KB causes + solution_steps into the selected language.
// Uses InvokeLLM with session-level caching (no repeated calls).
// Falls back to English if translation fails.
// ============================================================

import { base44 } from '@/api/base44Client';

const CACHE_KEY = 'scansnap_kb_translations';

function getCache() {
  try { return JSON.parse(sessionStorage.getItem(CACHE_KEY) || '{}'); } catch { return {}; }
}

function setCache(cache) {
  try { sessionStorage.setItem(CACHE_KEY, JSON.stringify(cache)); } catch {}
}

function cacheKey(caseId, lang) {
  return `${caseId}__${lang}`;
}

/**
 * Returns { causes: string[], solution_steps: string[], fallback: boolean }
 * in the requested language.
 *
 * If lang === 'en' — returns the original content directly.
 * Otherwise — translates via LLM (or returns from cache).
 */
export async function getLocalizedKBContent(kbEntry, lang) {
  if (!kbEntry) return { causes: [], solution_steps: [], fallback: false };

  const normalizedLang = (lang || 'en').toLowerCase();
  const causes = kbEntry.causes || [];
  const steps  = kbEntry.solution_steps || [];

  // English — no translation needed
  if (normalizedLang === 'en') {
    return { causes, solution_steps: steps, fallback: false };
  }

  // Check cache
  const cache = getCache();
  const key = cacheKey(kbEntry.case_id, normalizedLang);
  if (cache[key]) {
    return { ...cache[key], fallback: false };
  }

  // Language name map for the prompt
  const LANG_NAMES = {
    de: 'German', pt: 'Portuguese', es: 'Spanish', fr: 'French',
    it: 'Italian', nl: 'Dutch', ja: 'Japanese', zh: 'Chinese (Simplified)',
  };
  const langName = LANG_NAMES[normalizedLang] || normalizedLang;

  try {
    const prompt = `You are a professional ScanSnap support translator.
Translate the following technical support content from English to ${langName}.

Rules:
- Translate accurately and naturally, as a native-language support engineer would write
- Preserve all technical terms (model names, software names, error codes) unchanged
- Do NOT add or remove any items
- Return ONLY valid JSON, no explanation

Input:
${JSON.stringify({ causes, solution_steps: steps }, null, 2)}

Return JSON format:
{
  "causes": ["..."],
  "solution_steps": ["..."]
}`;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: 'object',
        properties: {
          causes:         { type: 'array', items: { type: 'string' } },
          solution_steps: { type: 'array', items: { type: 'string' } },
        },
      },
    });

    const translated = {
      causes:         result.causes || causes,
      solution_steps: result.solution_steps || steps,
    };

    // Cache it
    const updatedCache = getCache();
    updatedCache[key] = translated;
    setCache(updatedCache);

    return { ...translated, fallback: false };
  } catch (err) {
    console.warn('[kbTranslator] Translation failed, falling back to English:', err);
    return { causes, solution_steps: steps, fallback: true };
  }
}

/**
 * Also translates the firmware diagnostic nextSteps into the selected language.
 */
export async function getLocalizedFirmwareSteps(nextSteps, lang) {
  const normalizedLang = (lang || 'en').toLowerCase();
  if (normalizedLang === 'en' || !nextSteps || nextSteps.length === 0) {
    return { steps: nextSteps || [], fallback: false };
  }

  const LANG_NAMES = {
    de: 'German', pt: 'Portuguese', es: 'Spanish', fr: 'French',
    it: 'Italian', nl: 'Dutch', ja: 'Japanese', zh: 'Chinese (Simplified)',
  };
  const langName = LANG_NAMES[normalizedLang] || normalizedLang;

  // Cache key based on content hash
  const cacheK = `fw_steps__${normalizedLang}__${nextSteps.join('|').slice(0, 80)}`;
  const cache = getCache();
  if (cache[cacheK]) return { steps: cache[cacheK], fallback: false };

  try {
    const prompt = `Translate the following ScanSnap support instructions from English to ${langName}.
Preserve all technical terms and model names.
Return ONLY a JSON array of strings.

Input: ${JSON.stringify(nextSteps)}`;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: 'object',
        properties: { steps: { type: 'array', items: { type: 'string' } } },
      },
    });

    const translated = result.steps || nextSteps;
    const updatedCache = getCache();
    updatedCache[cacheK] = translated;
    setCache(updatedCache);

    return { steps: translated, fallback: false };
  } catch {
    return { steps: nextSteps, fallback: true };
  }
}