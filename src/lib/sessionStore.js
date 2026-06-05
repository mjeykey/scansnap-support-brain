// Session state management for troubleshooting flow
const SESSION_KEY = 'scansnap_session';

const defaultSession = {
  problem: '',
  issueType: '',
  rootCause: '',
  model: '',
  device: '',
  serialNumber: '',
  os: '',
  cpu: '',
  connectionType: 'unknown',
  scannerStateNote: '',
  knownFacts: {},
  performedSteps: [],
  missingInformation: [],
  steps: [],
  currentStepIndex: 0,
  status: 'idle', // idle | analyzing | troubleshooting | solved | escalated | failed
  supporterName: '',
  caseNumber: '',
  settings: {
    language: 'EN',
    emailLanguage: 'de',
    channel: 'Email',
    sound: true,
    darkMode: false,
    animations: true,
  },
};

export function getSession() {
  try {
    const stored = sessionStorage.getItem(SESSION_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return { ...defaultSession };
}

export function setSession(data) {
  const current = getSession();
  const updated = { ...current, ...data };
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(updated));
  return updated;
}

export function resetSession() {
  const current = getSession();
  const reset = { ...defaultSession, settings: current.settings };
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(reset));
  return reset;
}

export function getSettings() {
  return getSession().settings;
}

export function updateSettings(settings) {
  const current = getSession();
  return setSession({ settings: { ...current.settings, ...settings } });
}