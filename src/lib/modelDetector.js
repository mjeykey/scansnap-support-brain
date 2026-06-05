// ============================================================
// MODEL AUTO-DETECTOR
// Extracts ScanSnap model from free-text issue descriptions.
// No AI — pure regex + fuzzy matching.
// ============================================================

/**
 * All supported models with their canonical name and alias patterns.
 * Patterns are applied against a normalized version of the text
 * (lowercased, spaces/hyphens/underscores stripped).
 */
const MODEL_REGISTRY = [
  {
    canonical: 'iX1600',
    key: 'ix1600',
    patterns: [
      /ix[-\s]?1600/i,
      /scansnap[-\s]?1600/i,
      /ix[-\s]?160[^0-9]/i,   // typo: ix160x
    ],
    fuzzyPattern: /1600/,
    prefix: /ix|scansnap/i,
  },
  {
    canonical: 'iX1500',
    key: 'ix1500',
    patterns: [
      /ix[-\s]?1500/i,
      /scansnap[-\s]?1500/i,
      /ix[-\s]?150[^0-9]/i,   // typo: ix150x
    ],
    fuzzyPattern: /1500/,
    prefix: /ix|scansnap/i,
  },
  {
    canonical: 'iX1400',
    key: 'ix1400',
    patterns: [
      /ix[-\s]?1400/i,
      /scansnap[-\s]?1400/i,
    ],
    fuzzyPattern: /1400/,
    prefix: /ix|scansnap/i,
  },
  {
    canonical: 'iX1300',
    key: 'ix1300',
    patterns: [
      /ix[-\s]?1300/i,
      /scansnap[-\s]?1300/i,
    ],
    fuzzyPattern: /1300/,
    prefix: /ix|scansnap/i,
  },
  {
    canonical: 'iX2500',
    key: 'ix2500',
    patterns: [
      /ix[-\s]?2500/i,
      /scansnap[-\s]?2500/i,
    ],
    fuzzyPattern: /2500/,
    prefix: /ix|scansnap/i,
  },
  {
    canonical: 'iX500',
    key: 'ix500',
    patterns: [
      /ix[-\s]?500(?!0)/i,    // ix500 but not ix5000
      /scansnap[-\s]?500(?!0)/i,
    ],
    fuzzyPattern: /\b500\b/,
    prefix: /ix|scansnap/i,
  },
  {
    canonical: 'iX100',
    key: 'ix100',
    patterns: [
      /ix[-\s]?100(?!0)/i,
      /scansnap[-\s]?100(?!0)/i,
    ],
    fuzzyPattern: /\b100\b/,
    prefix: /ix|scansnap/i,
  },
  {
    canonical: 'SV600',
    key: 'sv600',
    patterns: [
      /sv[-\s]?600/i,
      /scansnap[-\s]?sv[-\s]?600/i,
    ],
    fuzzyPattern: /sv.*600|600.*sv/i,
    prefix: /sv/i,
  },
  {
    canonical: 'S1300i',
    key: 's1300i',
    patterns: [
      /s[-\s]?1300[-\s]?i/i,
      /scansnap[-\s]?s[-\s]?1300/i,
    ],
    fuzzyPattern: /s.*1300|1300.*i/i,
    prefix: /s/i,
  },
  {
    canonical: 'S1100i',
    key: 's1100i',
    patterns: [
      /s[-\s]?1100[-\s]?i/i,
      /scansnap[-\s]?s[-\s]?1100/i,
    ],
    fuzzyPattern: /s.*1100|1100.*i/i,
    prefix: /s/i,
  },
];

/**
 * Normalize text for matching:
 * - lowercase
 * - collapse whitespace, hyphens, underscores between word segments
 */
function normalize(text) {
  return (text || '').toLowerCase().replace(/[\s\-_]+/g, ' ').trim();
}

/**
 * detectModelFromText(text)
 *
 * Returns:
 * {
 *   detected: 'iX1600' | null,
 *   confidence: 'HIGH' | 'MEDIUM' | 'LOW' | null,
 *   source: 'exact' | 'fuzzy' | null,
 *   raw: string (the matched substring) | null,
 *   candidates: [] (all fuzzy candidates for LOW confidence)
 * }
 */
export function detectModelFromText(text) {
  if (!text || typeof text !== 'string') {
    return { detected: null, confidence: null, source: null, raw: null, candidates: [] };
  }

  const normalized = normalize(text);

  // ── PASS 1: Exact / direct pattern match ────────────────
  for (const model of MODEL_REGISTRY) {
    for (const pattern of model.patterns) {
      const match = text.match(pattern) || normalized.match(pattern);
      if (match) {
        return {
          detected: model.canonical,
          confidence: 'HIGH',
          source: 'exact',
          raw: match[0],
          candidates: [],
        };
      }
    }
  }

  // ── PASS 2: Fuzzy — number found + scansnap/ix prefix nearby ──
  // Scan a sliding window of ±30 chars around each number occurrence
  const fuzzyMatches = [];

  for (const model of MODEL_REGISTRY) {
    const numMatch = normalized.match(model.fuzzyPattern);
    if (!numMatch) continue;

    const idx = normalized.indexOf(numMatch[0]);
    const window = normalized.slice(Math.max(0, idx - 30), idx + 30);

    // Check if a ScanSnap/iX prefix appears in the window
    if (model.prefix.test(window)) {
      fuzzyMatches.push({ model: model.canonical, score: 2 });
    } else if (model.key !== 'ix100' && model.key !== 'ix500') {
      // For 4-digit models, just finding the number in an issue text is somewhat indicative
      fuzzyMatches.push({ model: model.canonical, score: 1 });
    }
  }

  if (fuzzyMatches.length === 1) {
    return {
      detected: fuzzyMatches[0].model,
      confidence: fuzzyMatches[0].score >= 2 ? 'MEDIUM' : 'LOW',
      source: 'fuzzy',
      raw: null,
      candidates: [],
    };
  }

  if (fuzzyMatches.length > 1) {
    // Multiple candidates — pick highest score; if tied, return LOW with all candidates
    const maxScore = Math.max(...fuzzyMatches.map(m => m.score));
    const top = fuzzyMatches.filter(m => m.score === maxScore);
    if (top.length === 1) {
      return {
        detected: top[0].model,
        confidence: maxScore >= 2 ? 'MEDIUM' : 'LOW',
        source: 'fuzzy',
        raw: null,
        candidates: top.map(m => m.model),
      };
    }
    // Ambiguous — return LOW with all options
    return {
      detected: top[0].model,
      confidence: 'LOW',
      source: 'fuzzy',
      raw: null,
      candidates: top.map(m => m.model),
    };
  }

  return { detected: null, confidence: null, source: null, raw: null, candidates: [] };
}