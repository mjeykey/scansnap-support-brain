function removeKnownModelMissingInfo(list, session) {
  const knownModel = session?.model || session?.device || session?.scannerModel;
  if (!knownModel || !Array.isArray(list)) return list;
  return list.filter(item => {
    const t = String(item?.key || item?.id || item?.label || item || '').toLowerCase();
    return !(t.includes('model') || t.includes('modell') || t.includes('device') || t.includes('gerät'));
  });
}

// ============================================================
// SUPPORT BRAIN – Local Decision Engine v1.0
// Deterministic, rule-based, local-first.
// NO AI calls. Uses only the 4 local JSON sources.
// ============================================================

import { knowledgeBase, getEmailText, getCaseSummary, getEscalationText, getKBEntryInLanguage } from './localData';
import { getUI } from './uiTranslations';

// ── Language detection ──────────────────────────────────────

const LANG_PATTERNS = [
  { lang: 'de', patterns: ['nicht', 'fehler', 'hängt', 'startet', 'wird', 'kann', 'bitte', 'haben', 'keine', 'geht'] },
  { lang: 'fr', patterns: ['erreur', 'problème', 'connecté', 'marche', 'reconnu', 'fonctionne', 'bonjour'] },
  { lang: 'es', patterns: ['error', 'problema', 'conectado', 'funciona', 'detectado', 'gracias', 'hola'] },
  { lang: 'pt', patterns: ['erro', 'problema', 'conectado', 'funciona', 'detectado', 'obrigado', 'olá'] },
  { lang: 'it', patterns: ['errore', 'problema', 'connesso', 'funziona', 'rilevato', 'grazie'] },
  { lang: 'nl', patterns: ['fout', 'probleem', 'verbonden', 'werkt', 'herkend', 'bedankt'] },
  { lang: 'ja', patterns: ['エラー', 'スキャナ', '接続', '認識', '問題'] },
  { lang: 'zh', patterns: ['错误', '扫描仪', '连接', '识别', '问题'] },
];

export function detectLanguage(text) {
  if (!text || typeof text !== 'string') return null;
  const lower = text.toLowerCase();
  for (const { lang, patterns } of LANG_PATTERNS) {
    const hits = patterns.filter(p => lower.includes(p)).length;
    if (hits >= 2) return lang;
  }
  return null;
}

// ── Scanner state classification ────────────────────────────

export function classifyScannerState(text) {
  const t = (text || '').toLowerCase();
  if (/stuck.*(logo|boot)|logo.*stuck|hängt.*logo/.test(t)) return 'stuck_on_logo';
  if (/orange.*led|led.*orange|orange.*light/.test(t)) return 'orange_led';
  if (/not detected|nicht erkannt|wird nicht erkannt|undetected/.test(t)) return 'not_detected';
  if (/firmware.*interrupted|interrupted.*firmware|firmware.*abgebrochen/.test(t)) return 'firmware_interrupted';
  if (/cannot scan|scan.*button|blinkt|blinking/.test(t)) return 'detected_cannot_scan';
  if (/ready|bereit/.test(t) && !/not|nicht/.test(t)) return 'ready_no_movement';
  if (/initializ|init/.test(t)) return 'initializing';
  return 'unknown';
}

// ── Issue category rules ────────────────────────────────────

const CATEGORY_RULES = [
  { category: 'firmware',  keywords: ['firmware', 'recovery', 'top sensor', 'empty arm', 'standalone', 'bios', 'flash', 'logo', 'orange led'] },
  { category: 'software',  keywords: ['sshomeclean', 'cleanup', 'reinstall', 'tb21', '-6', 'visual c', 'dism', 'sfc', 'appdata', 'pfu', 'ocr', 'startup crash', 'not starting', 'startup'] },
  { category: 'network',   keywords: ['wifi', 'wi-fi', 'wlan', '2.4ghz', 'band steering', 'dhcp', 'subnet', 'nas', 'smb', 'onedrive', 'cloud', 'wireless'] },
  { category: 'usb',       keywords: ['usb', 'device manager', 'usb stack', 'not detected', 'hub', 'dock'] },
  { category: 'hardware',  keywords: ['streak', 'roller', 'feed', 'paper jam', 'skew', 'noise', 'mechanical', 'glass', 'cleaning'] },
  { category: 'profile',   keywords: ['profile', 'ScanDirect', 'Scan to Folder', 'library', 'index', 'thumbnail', 'greyed'] },
];

export function classifyIssueCategory(text, kbEntry) {
  const t = ((text || '') + ' ' + (kbEntry?.tags || []).join(' ')).toLowerCase();
  const scores = {};
  for (const { category, keywords } of CATEGORY_RULES) {
    scores[category] = keywords.filter(kw => t.includes(kw)).length;
  }
  const best = Object.entries(scores).sort((a, b) => b[1] - a[1])[0];
  return best && best[1] > 0 ? best[0] : 'software';
}

// ── Firmware diagnostic state machine ──────────────────────

// Model normalizer — strips spaces, dashes, lowercases
function normalizeModel(m) {
  return (m || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Model capability registry — each model has its OWN firmware logic.
 * supportsRecovery: true only if low-level button-combo recovery is verified.
 * recoveryMethod:   describes the exact method supported.
 * standaloneUpdate: all models support standalone USB update unless noted.
 */
function getModelCapability(model) {
  const m = normalizeModel(model);

  // iX1600 — Top Sensor + Empty Arm recovery supported
  if (m.includes('ix1600')) {
    return {
      modelKey: 'ix1600',
      supportsRecovery: true,
      recoveryMethod: 'top_sensor_empty_arm',
      recoverySteps: [
        'Power off the iX1600 completely.',
        'Hold the Top Sensor button AND the Empty Arm button simultaneously.',
        'While holding both buttons, connect the USB cable directly to the computer (no hub).',
        'Release both buttons after 3 seconds — the scanner should enter recovery/DFU mode.',
        'Run the standalone firmware updater EXE via USB only.',
        'Do NOT power off or disconnect during the process.',
      ],
      standaloneUpdate: true,
    };
  }

  // iX1500 — Top Sensor + Empty Arm recovery supported
  if (m.includes('ix1500')) {
    return {
      modelKey: 'ix1500',
      supportsRecovery: true,
      recoveryMethod: 'top_sensor_empty_arm',
      recoverySteps: [
        'Power off the iX1500 completely.',
        'Hold the Top Sensor button AND the Empty Arm button simultaneously.',
        'While holding both buttons, connect the USB cable directly to the computer (no hub).',
        'Release both buttons after 3 seconds — the scanner should enter recovery/DFU mode.',
        'Run the standalone firmware updater EXE via USB only.',
        'Do NOT power off or disconnect during the process.',
      ],
      standaloneUpdate: true,
    };
  }

  // iX500 — No button-combo recovery. USB standalone retry only.
  if (m.includes('ix500')) {
    return {
      modelKey: 'ix500',
      supportsRecovery: false,
      recoveryMethod: 'usb_standalone_retry_only',
      recoverySteps: [],
      standaloneUpdate: true,
    };
  }

  // iX100 — No verified low-level recovery
  if (m.includes('ix100')) {
    return {
      modelKey: 'ix100',
      supportsRecovery: false,
      recoveryMethod: 'usb_standalone_retry_only',
      recoverySteps: [],
      standaloneUpdate: true,
    };
  }

  // iX1300 — No verified low-level recovery
  if (m.includes('ix1300')) {
    return {
      modelKey: 'ix1300',
      supportsRecovery: false,
      recoveryMethod: 'usb_standalone_retry_only',
      recoverySteps: [],
      standaloneUpdate: true,
    };
  }

  // iX1400 — No verified low-level recovery
  if (m.includes('ix1400')) {
    return {
      modelKey: 'ix1400',
      supportsRecovery: false,
      recoveryMethod: 'usb_standalone_retry_only',
      recoverySteps: [],
      standaloneUpdate: true,
    };
  }

  // Unknown model — conservative: no recovery assumed
  return {
    modelKey: m || 'unknown',
    supportsRecovery: false,
    recoveryMethod: 'unknown',
    recoverySteps: [],
    standaloneUpdate: true,
  };
}

// Keep legacy export (backward compat)
function getModelRecoveryCapability(model) {
  const cap = getModelCapability(model);
  return { supportsRecovery: cap.supportsRecovery, method: cap.recoveryMethod };
}

/**
 * Full firmware diagnostic flow — real PFU support engineer logic.
 *
 * PRIORITY ORDER:
 *   1) Verify what still works / communicates
 *   2) Determine if issue is USB, software env, or truly firmware
 *   3) Attempt communication / USB rebuild before any firmware action
 *   4) Normal firmware update if scanner still boots
 *   5) Software environment cleanup if needed
 *   6) Firmware retry after clean environment
 *   7) Recovery ONLY if confirmed recovery symptoms + model supports it
 *   8) Escalation if recovery fails or model has no recovery path
 *
 * Returns:
 *   usbAvailable        – boolean | null
 *   scannerDetected     – boolean | null
 *   bootsNormally       – boolean | null
 *   recoveryRequired    – boolean
 *   likelyCause         – 'usb_comm' | 'sw_env' | 'firmware' | 'unknown'
 *   firmwareWorkflow    – 'VERIFY_STATE' | 'USB_COMM' | 'SW_ENV' | 'NORMAL' | 'RETRY_STANDALONE' | 'RECOVERY' | 'REVIEW'
 *   workflowReason      – string
 *   nextSteps           – string[]
 */
export function runFirmwareDiagnostic(session, scannerState, completedStepTitles, failedStepTitles) {
  const modelRaw = session.model || session.device || '';
  const modelCap = getModelCapability(modelRaw);
  const modelName = modelRaw ? modelRaw.toUpperCase() : 'scanner';
  const problem  = (session.problem || '').toLowerCase();
  const connType = (session.connectionType || '').toLowerCase();

  // ── What has already been tried? ───────────────────────
  const done = (title) => completedStepTitles.some(t => new RegExp(title, 'i').test(t));
  const failed = (title) => failedStepTitles.some(t => new RegExp(title, 'i').test(t));

  const triedUSBRebuild       = done('usb|device manager|usb stack|usb root');
  const triedSWCleanup        = done('sshomeclean|cleanup|reinstall|fresh install');
  const triedNormalUpdate     = done('firmware.*update|normal.*update|sshome.*firmware|standalone');
  const triedRecovery         = done('recovery|top sensor|empty arm');
  const triedUSBDirectConnect = done('direct usb|native usb|usb port|reconnect');
  const triedWinIntegrity     = done('sfc|dism|system integrity|windows.*repair|systemreparatur|integridade');

  const normalUpdateFailed    = failed('firmware.*update|normal.*update|standalone');
  const usbRebuildFailed      = failed('usb|device manager');
  const swCleanupFailed       = failed('sshomeclean|cleanup|reinstall');
  const recoveryFailed        = failed('recovery|top sensor|empty arm');

  // ── USB & connection state ──────────────────────────────
  const usbMentioned  = /usb/.test(problem) || connType === 'usb';
  const wifiOnly      = /wifi|wi-fi|wlan|wireless/.test(problem) && !usbMentioned;
  const usbBlocked    = completedStepTitles.some(t => /blocked|not available|no usb/i.test(t));

  let usbAvailable = usbBlocked ? false : usbMentioned ? true : triedUSBDirectConnect ? true : null;

  // ── Scanner detection + boot state ─────────────────────
  const recoveryStateSymptoms = ['stuck_on_logo', 'firmware_interrupted', 'not_detected', 'orange_led'];
  const bootsOkStates         = ['ready_no_movement', 'detected_cannot_scan', 'initializing'];

  const customerSaidDetected    = /detected|recognized|shows up|erkannt|sichtbar/i.test(problem);
  const customerSaidNotDetected = /not detected|not recognized|nicht erkannt|undetected/i.test(problem);

  const scannerDetected = customerSaidNotDetected ? false
    : customerSaidDetected ? true
    : recoveryStateSymptoms.includes(scannerState) ? false
    : bootsOkStates.includes(scannerState) ? true
    : null;

  const bootsNormally = ['stuck_on_logo', 'firmware_interrupted', 'orange_led'].includes(scannerState) ? false
    : ['ready_no_movement', 'detected_cannot_scan'].includes(scannerState) ? true
    : null;

  const confirmedRecoverySymptoms = recoveryStateSymptoms.includes(scannerState)
    || customerSaidNotDetected
    || /firmware.*interrupted|abgebrochen|corrupt/i.test(problem);

  // ── Likely root cause analysis ──────────────────────────
  // Determine what ACTUALLY is likely wrong before choosing a path
  const likelyUSBComm  = /usb|hub|dock|device manager|not detected|undetected|nicht erkannt/i.test(problem)
                          && !confirmedRecoverySymptoms;
  const likelySWEnv    = /sshome|scansnap home|startup|crash|install|cleanup|tb21|ocr|appdata/i.test(problem);
  const likelyFirmware = confirmedRecoverySymptoms || /firmware/i.test(problem);

  // Pure USB enumeration failure: scanner completely absent in Device Manager
  const pureUsbEnumerationFailure =
    (customerSaidNotDetected && usbMentioned) ||
    /usb.*corrupt|device manager.*unknown|device.*appears.*disappear|usb.*enum/i.test(problem);

  // Windows system integrity is the recommended path for general communication
  // instability, post-update issues, repeated connection loss, or unclear USB/Wi-Fi
  // problems — UNLESS there's a confirmed pure USB enumeration failure.
  const likelyWinIntegrity =
    !pureUsbEnumerationFailure &&
    !confirmedRecoverySymptoms &&
    (
      /update.*after|after.*update|post.*(update|install)|connection.*loss|verbindung.*verlor|instabil|communication.*instab|repeated.*connection|wiederholt|communication|instability/i.test(problem) ||
      (!likelyUSBComm && !likelySWEnv && !likelyFirmware)
    );

  const likelyCause = likelySWEnv && !likelyFirmware ? 'sw_env'
    : pureUsbEnumerationFailure ? 'usb_comm'
    : likelyWinIntegrity ? 'win_integrity'
    : likelyFirmware ? 'firmware'
    : likelyUSBComm ? 'usb_comm'
    : 'unknown';

  // ════════════════════════════════════════════════════════
  // PHASE 1 — Verify scanner state first (nothing known yet)
  // ════════════════════════════════════════════════════════
  if (scannerDetected === null && bootsNormally === null && !confirmedRecoverySymptoms) {
    return {
      usbAvailable,
      scannerDetected: null,
      bootsNormally: null,
      recoveryRequired: false,
      likelyCause: 'unknown',
      firmwareWorkflow: 'VERIFY_STATE',
      workflowReason: 'Scanner state not yet confirmed — must determine what still works before any action',
      nextSteps: [
        `Power on the ${modelName}. What LEDs or display text do you see?`,
        'Connect the scanner via direct USB (no hub, no dock, no extension). Does it appear in Device Manager?',
        'Open ScanSnap Home — does it detect the scanner?',
        'Describe the exact symptom: stuck on logo? No power? Orange LED only? Not detected in Windows?',
      ],
    };
  }

  // ════════════════════════════════════════════════════════
  // PHASE 2 — Scanner boots normally: check USB comms first
  // BEFORE jumping to firmware actions
  // ════════════════════════════════════════════════════════
  if ((scannerDetected === true || bootsNormally === true)) {
    // 2a: Basic connection check — direct USB test first (always)
    if (!triedUSBDirectConnect && usbAvailable !== false) {
      return {
        usbAvailable: usbAvailable !== false,
        scannerDetected: true,
        bootsNormally: true,
        recoveryRequired: false,
        likelyCause: likelyCause,
        firmwareWorkflow: 'USB_COMM',
        workflowReason: 'Verify basic connection quality first: direct USB, no hub/dock, different cable/port',
        nextSteps: [
          `Connect the ${modelName} directly to a native USB port on the computer (no hub, dock, or extension cable).`,
          'Try a different USB cable if available.',
          'Test on a different USB port (preferably USB 2.0 on the rear of the computer).',
          'Open Device Manager — confirm the scanner appears without errors or unknown device warnings.',
          'Restart the scanner and reconnect — then check ScanSnap Home detection.',
        ],
      };
    }

    // 2b: Windows system integrity repair — BEFORE USB stack rebuild and BEFORE firmware actions
    // Skip only if the issue is clearly a pure USB enumeration failure
    if (!triedWinIntegrity && !pureUsbEnumerationFailure && likelyCause !== 'sw_env') {
      return {
        usbAvailable: usbAvailable !== false,
        scannerDetected: true,
        bootsNormally: true,
        recoveryRequired: false,
        likelyCause: 'win_integrity',
        firmwareWorkflow: 'WIN_INTEGRITY',
        workflowReason: 'General communication instability detected — Windows system integrity must be verified and repaired BEFORE USB stack cleanup or firmware actions',
        nextSteps: [
          'Open Command Prompt as Administrator.',
          'Step 1: Run sfc /scannow — wait for completion.',
          'Step 2: Restart the computer.',
          'Step 3: Run DISM /Online /Cleanup-Image /RestoreHealth — wait for completion (10–20 min).',
          'Step 4: Restart the computer.',
          'Step 5: Run sfc /scannow again.',
          'Step 6: Repeat sfc /scannow until you see: "Windows Resource Protection did not find any integrity violations."',
          `After completion: retest ScanSnap Home and ${modelName} connection before proceeding further.`,
        ],
      };
    }

    // 2c: ScanSnap Home / software environment — if SW env is likely cause
    if (!triedSWCleanup && (likelySWEnv || (triedUSBDirectConnect && !triedNormalUpdate))) {
      return {
        usbAvailable: usbAvailable !== false,
        scannerDetected: true,
        bootsNormally: true,
        recoveryRequired: false,
        likelyCause: likelyCause,
        firmwareWorkflow: 'SW_ENV',
        workflowReason: 'Scanner communicates but ScanSnap Home / software environment may be corrupted',
        nextSteps: [
          'Run SSHomeClean.exe to fully remove ScanSnap Home and all local configuration.',
          'Restart the computer after cleanup.',
          'Reinstall ScanSnap Home as Administrator from the official PFU/Fujitsu download page.',
          'Reconnect the scanner via direct USB after fresh installation.',
          'Check if firmware update is now offered in ScanSnap Home → Scanner Information.',
        ],
      };
    }

    // 2d: Normal firmware update — scanner detected, comms/SW environment verified
    if (!triedNormalUpdate) {
      return {
        usbAvailable: usbAvailable !== false,
        scannerDetected: true,
        bootsNormally: true,
        recoveryRequired: false,
        likelyCause: 'firmware',
        firmwareWorkflow: 'NORMAL',
        workflowReason: `${modelName} is detected and booting — proceed with normal firmware update via direct USB`,
        nextSteps: [
          `Ensure ${modelName} is connected via direct USB (no hub, no dock).`,
          'Open ScanSnap Home → Settings → Scanner Information → check for firmware update.',
          'If update is shown: apply it via USB only (do NOT use Wi-Fi for firmware updates).',
          `If no update shown in ScanSnap Home: download the standalone firmware package for ${modelName} from the PFU website and run it directly.`,
          'Keep the scanner powered and connected throughout the process.',
        ],
      };
    }

    // 2e: Normal update was tried — if USB rebuild not yet done, do it now
    if (triedNormalUpdate && !triedUSBRebuild && !normalUpdateFailed) {
      return {
        usbAvailable: usbAvailable !== false,
        scannerDetected: true,
        bootsNormally: true,
        recoveryRequired: false,
        likelyCause: 'usb_comm',
        firmwareWorkflow: 'USB_COMM',
        workflowReason: 'Normal update attempted — rebuild USB stack to ensure clean communication before retry',
        nextSteps: [
          'Open Device Manager → View → Show hidden devices.',
          'Uninstall all ScanSnap and scanner-related entries (including greyed-out entries).',
          'Disconnect the scanner and restart the computer.',
          'Reconnect via direct USB on a native port after restart.',
          'Attempt the firmware update again via ScanSnap Home or standalone updater.',
        ],
      };
    }

    // 2f: Normal update tried and failed, USB stack rebuilt — retry standalone
    if (triedNormalUpdate && (triedUSBRebuild || triedUSBDirectConnect) && !triedSWCleanup && normalUpdateFailed) {
      return {
        usbAvailable: usbAvailable !== false,
        scannerDetected: true,
        bootsNormally: true,
        recoveryRequired: false,
        likelyCause: 'sw_env',
        firmwareWorkflow: 'SW_ENV',
        workflowReason: 'Normal update and USB rebuild done — clean software environment before firmware retry',
        nextSteps: [
          'Run SSHomeClean.exe — fully removes ScanSnap Home and all local data.',
          'Restart computer after cleanup.',
          'Reinstall ScanSnap Home as Administrator from the official PFU download page.',
          `After reinstall, reconnect ${modelName} via direct USB and retry the firmware update.`,
        ],
      };
    }
  }

  // ════════════════════════════════════════════════════════
  // PHASE 3 — Recovery symptoms present
  // Only reach here if scanner is NOT booting normally
  // AND confirmed recovery symptoms exist
  // ════════════════════════════════════════════════════════
  if (confirmedRecoverySymptoms) {

    // 3a: USB not yet verified — do this first even with recovery symptoms
    if (usbAvailable === null && !wifiOnly) {
      return {
        usbAvailable: null,
        scannerDetected: false,
        bootsNormally: false,
        recoveryRequired: false,
        likelyCause: 'firmware',
        firmwareWorkflow: 'VERIFY_STATE',
        workflowReason: 'Recovery symptoms detected but USB availability not yet confirmed',
        nextSteps: [
          'Can the customer connect the scanner directly via USB to the computer?',
          'If USB is available: connect via native port (no hub, dock, or extension cable).',
          'Does Windows/Mac detect the scanner at all — even as unknown device in Device Manager?',
          'If USB is not available: document as blocked and continue remote diagnostics.',
        ],
      };
    }

    // 3b: Try standalone USB update first — before any button-combo recovery
    if (!triedNormalUpdate && usbAvailable !== false) {
      return {
        usbAvailable: usbAvailable !== false,
        scannerDetected: false,
        bootsNormally: false,
        recoveryRequired: false,
        likelyCause: 'firmware',
        firmwareWorkflow: 'RETRY_STANDALONE',
        workflowReason: `Recovery symptoms present but standalone USB update not yet attempted — try this BEFORE recovery`,
        nextSteps: [
          `Connect the ${modelName} via direct USB (no hub, no dock).`,
          `Download the standalone firmware package specifically for ${modelName} from the PFU/Fujitsu website.`,
          'Run the standalone firmware updater EXE — do NOT use ScanSnap Home at this stage.',
          'If Windows detects the scanner (even briefly): let the updater run to completion.',
          'Do NOT power off or disconnect during the update.',
        ],
      };
    }

    // 3c: Standalone tried — check model-specific recovery availability
    if (triedNormalUpdate || normalUpdateFailed) {

      // Model supports recovery (iX1500 / iX1600)
      if (modelCap.supportsRecovery && !triedRecovery) {
        return {
          usbAvailable: usbAvailable !== false,
          scannerDetected: false,
          bootsNormally: false,
          recoveryRequired: true,
          likelyCause: 'firmware',
          firmwareWorkflow: 'RECOVERY',
          workflowReason: `Standalone update attempted + confirmed recovery symptoms — ${modelName} supports ${modelCap.recoveryMethod} recovery`,
          nextSteps: modelCap.recoverySteps,
        };
      }

      // Model does NOT support button-combo recovery (iX500, iX100, iX1300, iX1400)
      if (!modelCap.supportsRecovery && !triedRecovery) {
        return {
          usbAvailable: usbAvailable !== false,
          scannerDetected: false,
          bootsNormally: false,
          recoveryRequired: false,
          likelyCause: 'firmware',
          firmwareWorkflow: 'RETRY_STANDALONE',
          workflowReason: `${modelName} does NOT support button-combo low-level recovery — USB standalone retry is the only firmware option`,
          nextSteps: [
            `Connect the ${modelName} via direct USB only (no hub, no dock).`,
            `Download the standalone firmware package specifically for ${modelName} from the PFU/Fujitsu website (verify model match).`,
            'Run the standalone updater — attempt during any brief detection window.',
            'If scanner is completely undetected and standalone fails: prepare for engineering review.',
          ],
        };
      }

      // Recovery was attempted but failed
      if (triedRecovery && recoveryFailed) {
        return {
          usbAvailable: usbAvailable !== false,
          scannerDetected: false,
          bootsNormally: false,
          recoveryRequired: true,
          likelyCause: 'firmware',
          firmwareWorkflow: 'REVIEW',
          workflowReason: 'All firmware paths exhausted including recovery — hardware-level issue likely, prepare for engineering review',
          nextSteps: [
            'Document all steps performed and their outcomes.',
            'Collect photos or video of the current scanner LED/display state.',
            'Record the exact firmware version attempted and the standalone updater version used.',
            'Prepare a detailed internal review — this may require hardware service or engineering escalation.',
            'Inform the customer that the issue has exceeded standard troubleshooting scope.',
          ],
        };
      }
    }
  }

  // ════════════════════════════════════════════════════════
  // PHASE 4 — Default: scanner still active, continue normally
  // ════════════════════════════════════════════════════════
  return {
    usbAvailable: usbAvailable !== false,
    scannerDetected: scannerDetected,
    bootsNormally: bootsNormally,
    recoveryRequired: false,
    likelyCause: likelyCause,
    firmwareWorkflow: 'NORMAL',
    workflowReason: 'Scanner appears functional — proceed with standard firmware update path',
    nextSteps: [
      `Connect the ${modelName} via direct USB (no hub, no dock, no extension cable).`,
      'Open ScanSnap Home → Settings → Scanner Information → check for firmware update.',
      'Apply via USB if shown, or download the standalone firmware package from the PFU website.',
      'Keep the scanner powered and connected throughout the update.',
    ],
  };
}

// Keep legacy export for backward compatibility
export function determineFirmwarePath(model, scannerState, completedStepTitles) {
  const diag = runFirmwareDiagnostic({ model }, scannerState, completedStepTitles, []);
  return {
    path: diag.firmwareWorkflow === 'RECOVERY' ? 'recovery'
        : diag.firmwareWorkflow === 'REVIEW' ? 'review'
        : 'normal_update',
    instruction: diag.nextSteps[0] || '',
    safe: diag.firmwareWorkflow !== 'REVIEW',
  };
}

// ── Step deduplication ──────────────────────────────────────

function stepAlreadyDone(stepText, completedStepTitles, completedStepIds = []) {
  // Check by stepId first (exact match — most reliable)
  if (completedStepIds.length > 0 && completedStepIds.some(id => id && stepText === id)) return true;

  const t = stepText.toLowerCase();
  const DEDUP_KEYS = [
    ['cleanup', 'sshomeclean'],
    ['reinstall', 'reinstalled'],
    ['usb', 'usb stack', 'device manager'],
    ['firmware recovery'],
    ['wi-fi setup', 'wireless setup', 'wlan setup'],
    ['ocr', 'ocr rebuild'],
    ['profile', 'recreat'],
  ];
  for (const keys of DEDUP_KEYS) {
    const matchesNew = keys.some(k => t.includes(k));
    const matchesDone = completedStepTitles.some(done =>
      keys.some(k => done.toLowerCase().includes(k))
    );
    if (matchesNew && matchesDone) return true;
  }
  return false;
}

// ── Escalation readiness ────────────────────────────────────

export function assessEscalationReadiness(steps, scannerState, category, kbEntry, lang = 'en') {
  const ui      = getUI(lang);
  const failed    = steps.filter(s => s.status === 'not_solved' || s.status === 'not_possible');
  const completed = steps.filter(s => s.status === 'solved' || s.status === 'done');

  const reasons = [];
  let ready = false;

  // General: many steps failed across the board
  if (failed.length >= 4) { reasons.push(`${failed.length} ${ui.esc_steps_failed}`); ready = true; }

  // Orange LED persisting after USB + firmware steps attempted
  if (scannerState === 'orange_led' && completed.length >= 3) {
    reasons.push(ui.esc_orange_led); ready = true;
  }

  // Recovery attempted and failed
  if (completed.some(s => /recovery|top sensor|empty arm/i.test(s.title || '')) &&
      failed.some(s => /recovery|firmware/i.test(s.title || ''))) {
    reasons.push(ui.esc_recovery_failed); ready = true;
  }

  // Firmware: all major paths tried (USB, SW env, standalone, recovery) and still failing
  if (category === 'firmware' && failed.length >= 3 &&
      steps.some(s => /usb|device manager/i.test(s.title || '')) &&
      steps.some(s => /cleanup|sshomeclean|reinstall/i.test(s.title || ''))) {
    reasons.push(ui.esc_firmware_exhausted);
    ready = true;
  }

  if (!ready) reasons.push(ui.esc_continue);

  return { ready, reasons };
}

// ── Missing information detector ────────────────────────────

export function detectMissingInfo(session, lang = 'en') {
  const ui = getUI(lang);
  const missing = [];
  if (!session.model || session.model === 'unknown') missing.push(ui.missing_model);
  if (!session.connectionType || session.connectionType === 'unknown') missing.push(ui.missing_connection);
  if (!session.scannerState || session.scannerState === 'unknown') missing.push(ui.missing_scanner_state);
  if (!session.os) missing.push(ui.missing_os);
  return missing;
}

// ── Case Status Logic ───────────────────────────────────────

/**
 * Determines the current case status based purely on session state.
 * A KB match NEVER implies resolution. Only completed+confirmed steps do.
 *
 * Status values:
 *   NEW                – no steps started yet
 *   IN_PROGRESS        – at least one step started, no resolution
 *   TESTING            – last step was performed, waiting for result
 *   PARTIALLY_RESOLVED – some steps solved, but not the final one
 *   WAITING_CUSTOMER   – action has been provided, pending customer response
 *   RESOLVED           – status === 'solved' (user confirmed)
 *   ESCALATION_REVIEW  – all steps failed or escalation threshold reached
 */
export function determineCaseStatus(session, steps, escalationReady, lang = 'en') {
  const ui = getUI(lang);
  const sessionStatus = session.status;

  // Explicit resolved state: only when session status is 'solved'
  if (sessionStatus === 'solved') {
    return {
      status: 'RESOLVED',
      isResolved: true,
      customerConfirmed: true,
      reason: ui.cs_solved,
    };
  }

  // All steps exhausted with failures
  if (sessionStatus === 'failed' || escalationReady) {
    return {
      status: 'ESCALATION_REVIEW',
      isResolved: false,
      customerConfirmed: false,
      reason: escalationReady ? ui.cs_escalation_ready : ui.cs_all_exhausted,
    };
  }

  const completed  = steps.filter(s => ['solved', 'done'].includes(s.status));
  const failed     = steps.filter(s => ['not_solved', 'not_possible'].includes(s.status));
  const pending    = steps.filter(s => s.status === 'pending');
  const totalSteps = steps.length;

  // No steps at all — brand new case
  if (totalSteps === 0) {
    return {
      status: 'NEW',
      isResolved: false,
      customerConfirmed: false,
      reason: ui.cs_no_steps,
    };
  }

  // All steps pending — just loaded from KB, nothing done yet
  if (pending.length === totalSteps) {
    return {
      status: 'NEW',
      isResolved: false,
      customerConfirmed: false,
      reason: ui.cs_kb_loaded,
    };
  }

  // Some completed, some still pending
  if (completed.length > 0 && pending.length > 0) {
    return {
      status: 'IN_PROGRESS',
      isResolved: false,
      customerConfirmed: false,
      reason: `${completed.length} ${ui.cs_steps_done_remain} ${pending.length}`,
    };
  }

  // All performed steps failed
  if (failed.length > 0 && completed.length === 0 && pending.length === 0) {
    return {
      status: 'IN_PROGRESS',
      isResolved: false,
      customerConfirmed: false,
      reason: `${failed.length} ${ui.cs_steps_failed_cont}`,
    };
  }

  // Steps in progress — mixed results
  if (completed.length > 0 || failed.length > 0) {
    return {
      status: 'IN_PROGRESS',
      isResolved: false,
      customerConfirmed: false,
      reason: ui.cs_in_progress,
    };
  }

  // Default for active troubleshooting
  return {
    status: 'IN_PROGRESS',
    isResolved: false,
    customerConfirmed: false,
    reason: ui.cs_in_progress,
  };
}

// ── Status-aware email text ─────────────────────────────────

/**
 * Builds a status-aware customer email.
 *
 * RESOLVED:     Returns the KB template as-is (confirmed fix wording).
 * NOT RESOLVED: Builds a "suggested troubleshooting" email directly from
 *               the KB entry's causes + solution_steps — never says "resolved".
 */
export function buildStatusAwareEmailText(kbEmailText, kbEntry, caseStatus, language, supporterName, caseNumber, localizedCauses = null, localizedSteps = null) {
  const lang = (language || 'en').toLowerCase();

  const GREETINGS = {
    de: 'Sehr geehrte/r Kunde/in,',
    en: 'Dear Customer,',
    fr: 'Cher(e) client(e),',
    es: 'Estimado/a cliente,',
    pt: 'Prezado(a) cliente,',
    it: 'Gentile cliente,',
    nl: 'Geachte klant,',
    ja: 'お客様各位、',
    zh: '尊敬的客户，',
  };
  const INTROS = {
    de: 'vielen Dank für Ihre Kontaktaufnahme. Nach Analyse Ihres Problems haben wir eine mögliche Ursache identifiziert und empfehlen die folgenden Troubleshooting-Schritte.\n\nBitte testen Sie diese Schritte der Reihe nach und teilen Sie uns das Ergebnis mit.',
    en: 'Thank you for contacting us. Based on the analysis of your issue, we have identified a likely cause and recommend the following troubleshooting steps.\n\nPlease try each step in order and let us know the result.',
    fr: 'Merci de nous avoir contactés. Après analyse de votre problème, nous avons identifié une cause probable et recommandons les étapes suivantes.\n\nVeuillez essayer chaque étape et nous indiquer le résultat.',
    es: 'Gracias por ponerse en contacto con nosotros. Tras analizar su problema, hemos identificado una posible causa y recomendamos los siguientes pasos.\n\nPor favor, pruebe cada paso e infórmenos del resultado.',
    pt: 'Obrigado por entrar em contato. Com base na análise do seu problema, identificamos uma causa provável e recomendamos as seguintes etapas.\n\nPor favor, teste cada etapa e informe-nos o resultado.',
    it: 'Grazie per averci contattato. Dopo aver analizzato il suo problema, abbiamo identificato una causa probabile e le consigliamo i seguenti passaggi.\n\nLa preghiamo di provare ogni passaggio e comunicarci il risultato.',
    nl: 'Bedankt voor uw contact. Na analyse van uw probleem hebben we een waarschijnlijke oorzaak geïdentificeerd en raden we de volgende stappen aan.\n\nProbeer elke stap en laat ons weten wat het resultaat is.',
    ja: 'お問い合わせいただきありがとうございます。問題を分析した結果、考えられる原因を特定し、以下のトラブルシューティング手順をお勧めします。\n\n各手順を順番に試していただき、結果をお知らせください。',
    zh: '感谢您联系我们。根据对您问题的分析，我们已确定可能的原因，并建议以下故障排除步骤。\n\n请按顺序尝试每个步骤，并告知我们结果。',
  };
  const CAUSE_LABELS = { de: 'Mögliche Ursache', en: 'Likely Cause', fr: 'Cause probable', es: 'Causa probable', pt: 'Causa provável', it: 'Causa probabile', nl: 'Waarschijnlijke oorzaak', ja: '考えられる原因', zh: '可能原因' };
  const STEPS_LABELS = { de: 'Empfohlene Schritte', en: 'Recommended Steps', fr: 'Étapes recommandées', es: 'Pasos recomendados', pt: 'Etapas recomendadas', it: 'Passaggi consigliati', nl: 'Aanbevolen stappen', ja: '推奨手順', zh: '建议步骤' };
  const REPLY_NOTE = {
    de: (cn) => `Bitte antworten Sie direkt auf diese E-Mail, damit keine Duplikate im System angelegt werden und sich die Bearbeitung nicht unnötig verzögert.\n\nFalls Sie uns telefonisch kontaktieren, nennen Sie bitte Ihre Fallnummer ${cn || '—'},\ndamit wir Ihren bestehenden Vorgang direkt aufrufen können.`,
    en: (cn) => `Please reply directly to this email to avoid duplicate cases being created and to keep your support history together.\n\nIf you contact us by phone, please have your case number ${cn || '—'} ready so we can pull up your existing case straight away.`,
    fr: (cn) => `Veuillez répondre directement à cet e-mail afin d'éviter la création de doublons dans notre système et de préserver l'historique complet de votre dossier.\n\nSi vous nous contactez par téléphone, merci d'indiquer votre numéro de dossier ${cn || '—'} afin que nous puissions retrouver votre demande immédiatement.`,
    es: (cn) => `Por favor, responda directamente a este correo para evitar que se creen casos duplicados y para que su historial de soporte permanezca completo.\n\nSi nos contacta por teléfono, le pedimos que indique su número de caso ${cn || '—'} para poder localizar su solicitud de inmediato.`,
    pt: (cn) => `Por favor, responda diretamente a este e-mail para evitar a criação de casos duplicados e para manter o histórico do seu suporte completo.\n\nSe nos contactar por telefone, indique o número do seu caso ${cn || '—'} para que possamos localizar o seu pedido de imediato.`,
    it: (cn) => `La preghiamo di rispondere direttamente a questa e-mail per evitare la creazione di casi duplicati e mantenere completa la cronologia del suo supporto.\n\nSe ci contatta telefonicamente, indichi il numero del caso ${cn || '—'} così possiamo recuperare la sua richiesta immediatamente.`,
    nl: (cn) => `Antwoord rechtstreeks op deze e-mail om te voorkomen dat er dubbele dossiers worden aangemaakt en om uw volledige ondersteuningsgeschiedenis bijeen te houden.\n\nAls u ons telefonisch contacteert, vermeld dan uw dossiernummer ${cn || '—'} zodat wij uw aanvraag direct kunnen openen.`,
    ja: (cn) => `重複したケースの作成を避け、サポート履歴をまとめるために、このメールに直接ご返信ください。\n\nお電話でお問い合わせの場合は、ケース番号 ${cn || '—'} をお手元にご用意ください。すぐに既存のご依頼を確認いたします。`,
    zh: (cn) => `请直接回复此邮件，以避免创建重复工单，并确保您的支持历史记录完整保存。\n\n如果您通过电话联系我们，请提供您的工单编号 ${cn || '—'}，以便我们立即调取您的现有请求。`,
  };

  const greeting   = GREETINGS[lang]    || GREETINGS['en'];
  const intro      = INTROS[lang]       || INTROS['en'];
  const causeLabel = CAUSE_LABELS[lang] || CAUSE_LABELS['en'];
  const stepsLabel = STEPS_LABELS[lang] || STEPS_LABELS['en'];
  const replyNoteFn = REPLY_NOTE[lang] || REPLY_NOTE['en'];
  const replyNote   = typeof replyNoteFn === 'function' ? replyNoteFn(caseNumber) : replyNoteFn;

  // Build closing with supporter name
  const sigName = supporterName || 'ScanSnap Support Team';
  const closing = `${replyNote}\n\n${sigName}\nScanSnap Support`;

  // Case number line
  const caseRef = caseNumber ? `[${caseNumber}]` : '';

  // Causes and steps — use pre-translated versions if provided, else fall back to KB entry
  const causesArr  = localizedCauses || kbEntry?.causes || [];
  const stepsArr   = localizedSteps  || kbEntry?.solution_steps || [];
  const causes     = causesArr.join(', ') || '—';
  const stepsText  = stepsArr.length > 0 ? stepsArr.map((s, i) => `${i + 1}. ${s}`).join('\n') : '—';

  const lines = [
    caseRef ? `${greeting}  ${caseRef}` : greeting,
    '',
    intro,
    '',
    `${causeLabel}: ${causes}`,
    '',
    `${stepsLabel}:`,
    stepsText,
    '',
    closing,
  ];

  return lines.join('\n');
}

/**
 * Builds a firmware-specific step-by-step email based on the diagnostic result.
 * Only called for firmware category cases.
 */
export function buildFirmwareEmail(fwDiag, lang, supporterName, caseNumber, localizedFwSteps = null) {
  if (!fwDiag) return '';

  const GREETINGS = {
    de: 'Sehr geehrte/r Kunde/in,', en: 'Dear Customer,', fr: 'Cher(e) client(e),',
    es: 'Estimado/a cliente,', pt: 'Prezado(a) cliente,', it: 'Gentile cliente,', nl: 'Geachte klant,',
    ja: 'お客様各位、', zh: '尊敬的客户，',
  };
  const REPLY_NOTE = {
    de: (cn) => `Bitte antworten Sie direkt auf diese E-Mail, damit keine Duplikate im System angelegt werden und sich die Bearbeitung nicht unnötig verzögert.\n\nFalls Sie uns telefonisch kontaktieren, nennen Sie bitte Ihre Fallnummer ${cn || '—'}, damit wir Ihren bestehenden Vorgang direkt aufrufen können.`,
    en: (cn) => `Please reply directly to this email to avoid duplicate cases and to keep your support history together.\n\nIf you contact us by phone, please have your case number ${cn || '—'} ready so we can pull up your existing case straight away.`,
    fr: (cn) => `Veuillez répondre directement à cet e-mail pour éviter les doublons et conserver l'historique complet de votre dossier.\n\nEn cas de contact téléphonique, merci d'indiquer le numéro de dossier ${cn || '—'}.`,
    es: (cn) => `Por favor, responda directamente a este correo para evitar casos duplicados y mantener su historial completo.\n\nSi nos contacta por teléfono, indique su número de caso ${cn || '—'}.`,
    pt: (cn) => `Por favor, responda diretamente a este e-mail para evitar casos duplicados e manter o histórico completo.\n\nSe nos contactar por telefone, indique o número do caso ${cn || '—'}.`,
    it: (cn) => `La preghiamo di rispondere direttamente a questa e-mail per evitare duplicati e mantenere la cronologia completa.\n\nSe ci contatta per telefono, indichi il numero del caso ${cn || '—'}.`,
    nl: (cn) => `Antwoord rechtstreeks op deze e-mail om dubbele dossiers te voorkomen en uw ondersteuningsgeschiedenis bijeen te houden.\n\nBij telefonisch contact, vermeld uw dossiernummer ${cn || '—'}.`,
    ja: (cn) => `重複を避けサポート履歴をまとめるため、このメールに直接ご返信ください。\n\nお電話の場合はケース番号 ${cn || '—'} をお手元にご用意ください。`,
    zh: (cn) => `请直接回复此邮件，以避免重复工单并保持支持历史完整。\n\n如需电话联系，请提供工单编号 ${cn || '—'}。`,
  };

  const WORKFLOW_INTROS = {
    VERIFY_USB: {
      de: 'vielen Dank für Ihre Kontaktaufnahme.\n\nBevor wir mit der Firmware-Aktualisierung fortfahren, benötigen wir einige wichtige Informationen zum aktuellen Status Ihres Scanners.',
      en: 'Thank you for contacting us.\n\nBefore proceeding with the firmware update, we need to verify a few important details about the current state of your scanner.',
      fr: 'Merci de nous avoir contactés.\n\nAvant de procéder à la mise à jour du firmware, nous devons vérifier quelques informations importantes sur l\'état actuel de votre scanner.',
      es: 'Gracias por contactarnos.\n\nAntes de proceder con la actualización de firmware, necesitamos verificar algunos detalles importantes sobre el estado actual de su escáner.',
      pt: 'Obrigado por entrar em contato.\n\nAntes de prosseguir com a atualização de firmware, precisamos verificar alguns detalhes importantes sobre o estado atual do seu scanner.',
      it: 'Grazie per averci contattato.\n\nPrima di procedere con l\'aggiornamento del firmware, dobbiamo verificare alcuni dettagli importanti sullo stato attuale dello scanner.',
      nl: 'Bedankt voor uw contact.\n\nVoordat we doorgaan met de firmware-update, moeten we enkele belangrijke details over de huidige staat van uw scanner verifiëren.',
    },
    NORMAL: {
      de: 'vielen Dank für Ihre Kontaktaufnahme.\n\nIhr Scanner ist erkannt und startet normal. Bitte führen Sie die folgende Standard-Firmware-Aktualisierung durch.',
      en: 'Thank you for contacting us.\n\nYour scanner is detected and booting normally. Please follow the standard firmware update procedure below.',
      fr: 'Merci de nous avoir contactés.\n\nVotre scanner est détecté et démarre normalement. Veuillez suivre la procédure standard de mise à jour du firmware.',
      es: 'Gracias por contactarnos.\n\nSu escáner es detectado y arranca normalmente. Siga el procedimiento estándar de actualización de firmware.',
      pt: 'Obrigado por entrar em contato.\n\nSeu scanner é detectado e inicializa normalmente. Siga o procedimento padrão de atualização de firmware.',
      it: 'Grazie per averci contattato.\n\nIl suo scanner è rilevato e si avvia normalmente. Segua la procedura standard di aggiornamento firmware.',
      nl: 'Bedankt voor uw contact.\n\nUw scanner wordt gedetecteerd en start normaal op. Volg de standaard firmware-updateprocedure hieronder.',
    },
    RECOVERY: {
      de: 'vielen Dank für Ihre Kontaktaufnahme.\n\nDa der Standard-Update-Vorgang nicht erfolgreich war und die Symptome auf einen beschädigten Firmware-Zustand hinweisen, sind zusätzliche Wiederherstellungsschritte erforderlich.',
      en: 'Thank you for contacting us.\n\nSince the standard update process was unsuccessful and symptoms indicate a corrupted firmware state, the following recovery procedure is required.',
      fr: 'Merci de nous avoir contactés.\n\nLa procédure de mise à jour standard ayant échoué et les symptômes indiquant un état firmware corrompu, la procédure de récupération suivante est nécessaire.',
      es: 'Gracias por contactarnos.\n\nComo el proceso de actualización estándar no tuvo éxito y los síntomas indican un estado de firmware dañado, se requiere el siguiente procedimiento de recuperación.',
      pt: 'Obrigado por entrar em contato.\n\nComo o processo de atualização padrão não teve sucesso e os sintomas indicam um estado de firmware corrompido, é necessário o seguinte procedimento de recuperação.',
      it: 'Grazie per averci contattato.\n\nPoiché il processo di aggiornamento standard non ha avuto successo e i sintomi indicano uno stato firmware danneggiato, è necessaria la seguente procedura di ripristino.',
      nl: 'Bedankt voor uw contact.\n\nOmdat het standaard updateproces niet succesvol was en de symptomen een beschadigde firmwarestatus aangeven, is de volgende herstelprocedure vereist.',
    },
  };

  const STEPS_LABELS = {
    de: 'Bitte führen Sie folgende Schritte durch', en: 'Please follow these steps',
    fr: 'Veuillez suivre ces étapes', es: 'Por favor, siga estos pasos',
    pt: 'Por favor, siga estas etapas', it: 'Si prega di seguire questi passaggi',
    nl: 'Volg deze stappen',
  };

  const l = lang in GREETINGS ? lang : 'en';
  const workflow = fwDiag.firmwareWorkflow in WORKFLOW_INTROS ? fwDiag.firmwareWorkflow : 'VERIFY_USB';

  const sigName      = supporterName || 'ScanSnap Support Team';
  const replyNoteFn  = REPLY_NOTE[l] || REPLY_NOTE['en'];
  const replyNote    = typeof replyNoteFn === 'function' ? replyNoteFn(caseNumber) : replyNoteFn;
  const closing      = `${replyNote}\n\n${sigName}\nScanSnap Support`;
  const caseRef   = caseNumber ? `[${caseNumber}]` : '';

  const greeting  = caseRef ? `${GREETINGS[l]}  ${caseRef}` : GREETINGS[l];
  const intro     = (WORKFLOW_INTROS[workflow][l] || WORKFLOW_INTROS[workflow]['en']);
  const stepsLbl  = STEPS_LABELS[l] || STEPS_LABELS['en'];
  const resolvedSteps = localizedFwSteps || fwDiag.nextSteps || [];
  const stepsText = resolvedSteps.map((s, i) => `${i + 1}. ${s}`).join('\n');

  return [greeting, '', intro, '', `${stepsLbl}:`, stepsText, '', closing].join('\n');
}

// ── Next action selector ────────────────────────────────────

const NEXT_ACTION_TEMPLATES = {
  request_info:     'Request missing information before proceeding: {info}',
  request_video:    'Request screenshot or short video of current scanner state from customer.',
  firmware_recovery:'Execute firmware recovery workflow. Verify model has confirmed recovery path.',
  firmware_normal:  'Run normal firmware update via direct USB.',
  software_cleanup: 'Perform ScanSnap Home cleanup (SSHomeClean.exe) and reinstall as administrator.',
  win_integrity:    'Run Windows system integrity repair (sfc /scannow → restart → DISM → restart → sfc repeat). Do NOT touch USB stack first.',
  usb_stack:        'Remove stale USB/ScanSnap entries from Device Manager and rebuild USB stack.',
  wifi_setup:       'Reset wireless settings and re-run Wi-Fi pairing. Check 2.4GHz / band steering.',
  cloud_reauth:     'Re-authenticate ScanSnap Cloud account and recreate cloud profiles.',
  hardware_clean:   'Clean internal glass and roller area carefully.',
  profile_recreate: 'Remove corrupted profile configuration and recreate profiles manually.',
  request_remote:   'Suggest remote session to investigate live system state.',
  review:           'Prepare internal review — steps exhausted, escalation may be warranted.',
  continue:         'Continue with next KB troubleshooting step.',
};

export function selectNextAction(session, kbEntry, category, scannerState, missingInfo, steps) {
  const completed = steps.filter(s => s.status === 'solved' || s.status === 'done').map(s => s.title || '');
  const failed    = steps.filter(s => s.status === 'not_solved' || s.status === 'not_possible').map(s => s.title || '');
  const blocked   = steps.filter(s => s.status === 'blocked').map(s => s.title || '');

  // Priority 1: Safety — missing info before anything complex
  if (missingInfo.length > 0 && completed.length === 0 && (category === 'firmware' || category === 'hardware')) {
    return { action: 'request_info', reason: 'Critical info missing before firmware/hardware path', params: { info: missingInfo.join('; ') } };
  }

  // Priority 2: Firmware — run full diagnostic state machine
  if (category === 'firmware') {
    const fwDiag = runFirmwareDiagnostic(session, scannerState, completed, failed);
    if (fwDiag.firmwareWorkflow === 'VERIFY_STATE') {
      return { action: 'request_info', reason: fwDiag.workflowReason, params: { info: fwDiag.nextSteps.join(' | ') }, fwDiag };
    }
    if (fwDiag.firmwareWorkflow === 'WIN_INTEGRITY') {
      return { action: 'win_integrity', reason: fwDiag.workflowReason, params: { instruction: fwDiag.nextSteps[0] }, fwDiag };
    }
    if (fwDiag.firmwareWorkflow === 'USB_COMM') {
      return { action: 'usb_stack', reason: fwDiag.workflowReason, params: { instruction: fwDiag.nextSteps[0] }, fwDiag };
    }
    if (fwDiag.firmwareWorkflow === 'SW_ENV') {
      return { action: 'software_cleanup', reason: fwDiag.workflowReason, params: { instruction: fwDiag.nextSteps[0] }, fwDiag };
    }
    if (fwDiag.firmwareWorkflow === 'NORMAL') {
      return { action: 'firmware_normal', reason: fwDiag.workflowReason, params: { instruction: fwDiag.nextSteps[0] }, fwDiag };
    }
    if (fwDiag.firmwareWorkflow === 'RETRY_STANDALONE') {
      return { action: 'firmware_normal', reason: fwDiag.workflowReason, params: { instruction: fwDiag.nextSteps[0] }, fwDiag };
    }
    if (fwDiag.firmwareWorkflow === 'RECOVERY') {
      return { action: 'firmware_recovery', reason: fwDiag.workflowReason, params: { instruction: fwDiag.nextSteps[0] }, fwDiag };
    }
    if (fwDiag.firmwareWorkflow === 'REVIEW') {
      return { action: 'review', reason: fwDiag.workflowReason, fwDiag };
    }
  }

  // Priority 3: Dedup — don't repeat completed steps
  const pendingSteps = steps.filter(s => s.status === 'pending');
  const trueNext = pendingSteps.find(s => !stepAlreadyDone(s.instruction || s.title || '', completed));

  // Priority 4: Category-based fallback if no pending steps
  if (!trueNext || pendingSteps.length === 0) {
    if (failed.length >= 2 && !blocked.some(b => b.toLowerCase().includes('remote'))) {
      return { action: 'request_remote', reason: 'Multiple failures, remote session may help' };
    }
    if (failed.length >= 3) return { action: 'review', reason: 'All reasonable steps exhausted' };

    // Category fallback
    const fallbacks = {
      software:  'software_cleanup',
      usb:       'usb_stack',
      network:   'wifi_setup',
      firmware:  'firmware_normal',
      hardware:  'hardware_clean',
      profile:   'profile_recreate',
    };
    return { action: fallbacks[category] || 'continue', reason: `Category fallback: ${category}` };
  }

  return { action: 'continue', reason: 'Next KB step available', nextStep: trueNext };
}

// ── Dynamic next step generator ─────────────────────────────

/**
 * Generates the next dynamic step as a stepId reference.
 * The frontend resolves the stepId to localized text via resolveStep().
 *
 * Returns { stepId, difficulty, _dynamic: true } or null if exhausted.
 */
export function generateNextDynamicStep(session, kbEntry) {
  const steps    = session.steps || [];
  const problem  = (session.problem || '');

  // Dedup: check by stepId (for dynamic steps) or by keyword match on title (for KB steps)
  const usedStepIds = new Set(steps.map(s => s.stepId).filter(Boolean));
  const allTitles   = steps.map(s => (s.title || '').toLowerCase());
  const alreadyByTitle = (keyword) => allTitles.some(t => new RegExp(keyword, 'i').test(t));
  const already = (stepId, keyword) => usedStepIds.has(stepId) || alreadyByTitle(keyword);

  const category = classifyIssueCategory(problem, kbEntry);

  // ── Ordered progression chains — stepId + keyword fallback for KB step dedup ──

  const firmwareChain = [
    { stepId: 'verifyScannerState',       keyword: 'verify|state|power|led|display' },
    { stepId: 'directUsbConnectionTest',  keyword: 'direct usb|native usb|usb cable|reconnect' },
    { stepId: 'windowsSystemRepair',      keyword: 'sfc|dism|system integrity|systemreparatur|integridade|windows repair' },
    { stepId: 'ssHomeCleanup',            keyword: 'sshomeclean|cleanup|reinstall|software environment' },
    { stepId: 'firmwareStandaloneUpdate', keyword: 'firmware update|standalone|normal update' },
    { stepId: 'rebuildUsbStack',          keyword: 'device manager|usb stack|usb root|stale' },
    { stepId: 'evaluateFirmwareRecovery', keyword: 'recovery|top sensor|empty arm' },
  ];

  const softwareChain = [
    { stepId: 'ssHomeCleanup',           keyword: 'sshomeclean|cleanup|reinstall|software' },
    { stepId: 'windowsSystemRepair',     keyword: 'sfc|dism|system integrity|systemreparatur|integridade|windows repair' },
    { stepId: 'rebuildUsbStack',         keyword: 'device manager|usb|driver' },
    { stepId: 'recreateScannerProfiles', keyword: 'profile|scan to folder|scandirect|library' },
  ];

  const usbChain = [
    { stepId: 'directUsbConnectionTest',   keyword: 'direct usb|native usb|reconnect|usb cable' },
    { stepId: 'windowsSystemRepair',       keyword: 'sfc|dism|system integrity|systemreparatur|integridade|windows repair' },
    { stepId: 'rebuildUsbStack',           keyword: 'device manager|usb stack|stale|registration' },
    { stepId: 'disableUsbPowerManagement', keyword: 'power management|usb power|selective suspend' },
    { stepId: 'ssHomeCleanup',             keyword: 'sshomeclean|cleanup|reinstall' },
  ];

  const networkChain = [
    { stepId: 'repairWifiConnection',  keyword: 'wifi|wi-fi|wireless|reconnect|pairing' },
    { stepId: 'checkRouterBandSteering', keyword: 'band steering|2.4ghz|5ghz|router' },
    { stepId: 'reauthCloudStorage',    keyword: 'onedrive|cloud|sync|smb|nas' },
  ];

  const hardwareChain = [
    { stepId: 'cleanRollersAndGlass', keyword: 'clean|roller|glass|streak|maintenance' },
    { stepId: 'checkPaperPath',       keyword: 'paper path|skew|misalignment|feed' },
  ];

  const chains = {
    firmware: firmwareChain,
    software: softwareChain,
    usb:      usbChain,
    network:  networkChain,
    hardware: hardwareChain,
  };

  const chain = chains[category] || softwareChain;

  for (const { stepId, keyword } of chain) {
    if (!already(stepId, keyword)) {
      return { stepId, status: 'pending', result: '', note: '', timestamp: null, _dynamic: true };
    }
  }

  return null;
}

// ── Language-aware email loader ─────────────────────────────

export function loadLocalEmail(kbEntry, language) {
  if (!kbEntry) return { text: '', fallbackUsed: false, langLoaded: language };
  const directText = getEmailText(kbEntry, language);
  if (directText) return { text: directText, fallbackUsed: false, langLoaded: language };
  const fallbackText = getEmailText(kbEntry, 'en');
  return { text: fallbackText, fallbackUsed: true, langLoaded: 'en (fallback)' };
}

// ── MAIN: runDecisionEngine ─────────────────────────────────

/**
 * Pure function — returns the full brain output.
 * No side effects, no AI calls.
 *
 * @param {object} session  - full session object from sessionStore
 * @param {object} kbEntry  - matched KB entry (or null)
 * @param {string} language - selected language code
 * @returns {object} brainOutput
 */
export function runDecisionEngine(session, kbEntry, language) {
  const steps         = session.steps || [];
  const problem       = session.problem || '';
  const model         = session.model || session.device || '';
  const connType      = session.connectionType || 'unknown';
  const os            = session.os || '';
  const supporterName = session.supporterName || '';
  const caseNumber    = session.caseNumber || '';

  // Detect language
  const detectedLang = detectLanguage(problem);
  const activeLang   = language || detectedLang || 'en';

  // Classify
  const scannerState = classifyScannerState(problem + ' ' + (session.scannerStateNote || ''));
  const category     = classifyIssueCategory(problem, kbEntry);

  // Step analysis
  const completedSteps = steps.filter(s => ['solved', 'done'].includes(s.status));
  const failedSteps    = steps.filter(s => ['not_solved', 'not_possible'].includes(s.status));
  const blockedSteps   = steps.filter(s => s.status === 'blocked');
  const pendingSteps   = steps.filter(s => s.status === 'pending');

  // Missing info
  const missingInfo = detectMissingInfo({ ...session, model, connectionType: connType, scannerState }, activeLang);

  // Firmware diagnostic (always run for firmware category, null otherwise)
  const fwDiag = category === 'firmware'
    ? runFirmwareDiagnostic(session, scannerState, completedSteps.map(s => s.title || ''), failedSteps.map(s => s.title || ''))
    : null;

  // Next action
  const nextAction = selectNextAction(session, kbEntry, category, scannerState, removeKnownModelMissingInfo(missingInfo, session), steps);

  // Escalation
  const escalation = assessEscalationReadiness(steps, scannerState, category, kbEntry, activeLang);

  // Case Status (MUST run before email — email wording depends on it)
  const caseStatus = determineCaseStatus(session, steps, escalation.ready, activeLang);

  // Load localized KB content (causes, solution_steps in selected language)
  const localizedKB   = getKBEntryInLanguage(kbEntry, activeLang);

  // Templates — for firmware unresolved cases use diagnostic email; otherwise KB template
  const emailData    = loadLocalEmail(kbEntry, activeLang);
  const emailText    = (category === 'firmware' && !caseStatus.isResolved && fwDiag)
    ? buildFirmwareEmail(fwDiag, activeLang, supporterName, caseNumber)
    : buildStatusAwareEmailText(emailData.text, kbEntry, caseStatus, activeLang, supporterName, caseNumber, localizedKB.causes, localizedKB.solution_steps);
  const summaryText  = getCaseSummary(kbEntry);
  const escText      = getEscalationText(kbEntry);

  // Confidence
  const confidence = kbEntry?._score || 0;
  const confidenceLabel = confidence >= 80 ? 'HIGH' : confidence >= 40 ? 'MEDIUM' : confidence >= 10 ? 'LOW' : 'NONE';

  return {
    // Core
    category,
    scannerState,
    matchedCaseId:    kbEntry?.case_id || null,
    confidence,
    confidenceLabel,

    // Case status
    caseStatus:           caseStatus.status,
    isResolved:           caseStatus.isResolved,
    customerConfirmed:    caseStatus.customerConfirmed,
    caseStatusReason:     caseStatus.reason,

    // Steps
    completedSteps,
    failedSteps,
    blockedSteps,
    pendingSteps,

    // Info
    missingInfo: removeKnownModelMissingInfo(missingInfo, session),

    // Action
    nextAction,

    // Templates — email is status-aware, never says "resolved" unless truly resolved
    email:           emailText,
    emailRaw:        emailData.text,
    emailFallback:   emailData.fallbackUsed,
    emailLangLoaded: emailData.langLoaded,
    caseSummary:     summaryText,
    escalationText:  escText,

    // Escalation
    escalationReady:   escalation.ready,
    escalationReasons: escalation.reasons,

    // Firmware diagnostic (only for firmware category)
    fwDiag,

    // Localized KB content (causes + steps in active language)
    localizedKB,

    // Language
    detectedLang,
    activeLang,

    // Model detection metadata (from auto-detection on Page 1)
    modelDetection:     session.modelDetection || null,

    // Model match analysis
    modelSelected:      model || '(not set)',
    modelMatchedKB:     kbEntry?.models?.join(', ') || '(none)',
    modelMatchConf:     kbEntry?.models?.some(m => model && m.toLowerCase().replace(/[^a-z0-9]/g,'').includes(model.toLowerCase().replace(/[^a-z0-9]/g,''))) ? 'EXACT' : kbEntry ? 'GENERIC/FALLBACK' : 'NO MATCH',
    crossModelFallback: kbEntry?.models?.length > 0 && model && !kbEntry.models.some(m => m.toLowerCase().replace(/[^a-z0-9]/g,'').includes(model.toLowerCase().replace(/[^a-z0-9]/g,''))) ? true : false,

    // Debug metadata
    _debug: {
      // Supporter context
      supporterName:        supporterName || '(not set)',
      caseNumber:           caseNumber || '(not set)',
      // Language
      analysisLang:         activeLang,
      emailLang:            activeLang,
      caseSummaryLang:      'en (always)',
      escalationLang:       'en (always)',
      detectedLang:         detectedLang || '(auto)',
      emailLangLoaded:      emailData.langLoaded,
      emailFallback:        emailData.fallbackUsed,
      // Multilingual KB status
      kbLanguageSelected:   activeLang,
      kbLanguageLoaded:     localizedKB.langLoaded || activeLang,
      kbIsMultilingual:     localizedKB.isMultilingual ? 'YES' : 'NO (legacy English)',
      kbFallbackUsed:       localizedKB.fallback ? 'YES' : 'NO',
      aiUsed:               false,
      aiCallsCount:         0,
      searchMode:           'LOCAL_ONLY',
      // Model matching
      selectedModel:        model || '(not set)',
      modelSource:          session.modelDetection?.source || (model ? 'manual' : 'unknown'),
      modelDetectConf:      session.modelDetection?.confidence || (model ? 'MANUAL' : 'NONE'),
      modelDetectRaw:       session.modelDetection?.raw || '—',
      matchedKBModels:      kbEntry?.models?.join(', ') || '(none)',
      modelMatchConf:       kbEntry?.models?.some(m => model && m.toLowerCase().replace(/[^a-z0-9]/g,'').includes(model.toLowerCase().replace(/[^a-z0-9]/g,''))) ? 'EXACT' : kbEntry ? 'GENERIC/FALLBACK' : 'NO MATCH',
      crossModelFallback:   kbEntry?.models?.length > 0 && model && !kbEntry.models.some(m => m.toLowerCase().replace(/[^a-z0-9]/g,'').includes(model.toLowerCase().replace(/[^a-z0-9]/g,''))) ? 'YES' : 'NO',
      modelRecoveryCapable: getModelRecoveryCapability(model).supportsRecovery ? 'YES' : 'NO',
      modelRecoveryMethod:  getModelRecoveryCapability(model).method,
      // Classification
      model,
      connType,
      os,
      scannerState,
      category,
      confidence,
      confidenceLabel,
      matchedCaseId:        kbEntry?.case_id || null,
      localKBMatch:         !!kbEntry,
      // Case state
      caseStatus:           caseStatus.status,
      isResolved:           caseStatus.isResolved,
      customerConfirmed:    caseStatus.customerConfirmed,
      caseStatusReason:     caseStatus.reason,
      // Steps
      completedCount:       completedSteps.length,
      failedCount:          failedSteps.length,
      blockedCount:         blockedSteps.length,
      // Decision
      nextAction:           nextAction.action,
      nextActionReason:     nextAction.reason,
      escalationReady:      escalation.ready,
      progressionExhausted: session.status === 'exhausted' ? 'YES' : 'NO',
      pendingCount:         pendingSteps.length,
      // Firmware diagnostic
      fw_usbAvailable:      fwDiag?.usbAvailable ?? 'N/A',
      fw_scannerDetected:   fwDiag?.scannerDetected ?? 'N/A',
      fw_bootsNormally:     fwDiag?.bootsNormally ?? 'N/A',
      fw_recoveryRequired:  fwDiag?.recoveryRequired ?? 'N/A',
      fw_likelyCause:       fwDiag?.likelyCause ?? 'N/A',
      fw_workflow:          fwDiag?.firmwareWorkflow ?? 'N/A',
      fw_workflowReason:    fwDiag?.workflowReason ?? 'N/A',
      fw_likelyCause:       fwDiag?.likelyCause ?? 'N/A',
      // Issue type classification for debug panel
      issueType: fwDiag?.likelyCause === 'win_integrity' ? 'Windows integrity / system instability'
        : fwDiag?.likelyCause === 'usb_comm' ? 'USB enumeration failure'
        : fwDiag?.likelyCause === 'sw_env' ? 'ScanSnap Home / software environment'
        : fwDiag?.likelyCause === 'firmware' ? 'Firmware (recovery state)'
        : category === 'network' ? 'Wi-Fi / network'
        : category,
      sfcDismRecommended: fwDiag?.firmwareWorkflow === 'WIN_INTEGRITY' ? 'YES — communication instability detected, integrity repair precedes USB cleanup' : 'NO',
      usbStackDelayed: fwDiag?.firmwareWorkflow === 'WIN_INTEGRITY' ? 'YES — delayed until after integrity repair' : fwDiag?.likelyCause === 'usb_comm' ? 'NO — pure USB enumeration failure, USB cleanup appropriate' : 'N/A',
      troubleshootingPriority: fwDiag?.firmwareWorkflow === 'WIN_INTEGRITY'
        ? '1.Basic check → 2.SSH/FW state → 3.Windows integrity (SFC/DISM) → 4.Retest → 5.USB cleanup if needed → 6.SSHome reinstall'
        : fwDiag?.firmwareWorkflow === 'USB_COMM'
        ? '1.Basic check → 2.USB stack rebuild (pure enum failure) → 3.Retest'
        : '1.Basic check → 2.ScanSnap Home state → 3.Next step',
    },
  };
}