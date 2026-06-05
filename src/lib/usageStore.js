// Session-basierte Nutzungsstatistik (keine AI für Zählung)
const KEY = 'scansnap_usage';

const defaultUsage = { localSearches: 0, aiAnalyses: 0 };

export function getUsage() {
  try {
    const stored = sessionStorage.getItem(KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return { ...defaultUsage };
}

export function incrementLocalSearch() {
  const u = getUsage();
  const updated = { ...u, localSearches: u.localSearches + 1 };
  sessionStorage.setItem(KEY, JSON.stringify(updated));
  return updated;
}

export function incrementAiAnalysis() {
  const u = getUsage();
  const updated = { ...u, aiAnalyses: u.aiAnalyses + 1 };
  sessionStorage.setItem(KEY, JSON.stringify(updated));
  return updated;
}