// ============================================================
// FINAL PAGE — Post-troubleshooting documentation hub
// Shows: full step history, module-based email builder,
// case summary, escalation — ALL LOCAL, ZERO AI credits.
// ============================================================

import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, MinusCircle, Clock, ChevronDown, ChevronUp, RotateCcw, AlertTriangle, Copy, Mail, FileText, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { getSession, getSettings, setSession } from '@/lib/sessionStore';
import { runDecisionEngine } from '@/lib/decisionEngine';
import { buildDiagnosticTimeline, determineFinalState, buildAutoCaseSummary, buildCleanCaseSummary } from '@/lib/diagnosticMemory';
import { EMAIL_MODULES, assembleEmail, suggestModules, getModuleText } from '@/lib/emailModules';
import { getUI } from '@/lib/uiTranslations';
import EscalationForm from '@/components/troubleshoot/EscalationForm';
import SaveToKBButton from '@/components/kb/SaveToKBButton';
import { resolveStep } from '@/lib/stepTranslations.js';
import { buildHardwareProcessEmail, buildProcessSummary, classifyProcess } from '@/lib/processEngine';
import { shouldUseAnalysisAwareEmail, buildAnalysisAwareEmail } from '@/lib/analysisEmailEngine';


const MISSING_INFO_LABELS = {
  de: {
    title: 'FEHLENDE INFORMATIONEN VOR ESKALATION',
    connectivity: 'Verbindungstyp (USB / WLAN / LAN)',
    os: 'Betriebssystem',
    serial: 'Scanner-Seriennummer',
    address: 'Kundenadresse',
    scan_count: 'Scananzahl / Lifetime Counter',
    country: 'Land des Kunden',
    button: 'Kunden-E-Mail zur Anforderung fehlender Informationen erstellen',
    customerEmailTitle: 'KUNDEN-E-MAIL — ANFORDERUNG FEHLENDER INFORMATIONEN',
    copyEmail: 'E-Mail kopieren',
  },
  en: {
    title: 'MISSING INFORMATION BEFORE ESCALATION',
    connectivity: 'Connectivity type (USB / Wi‑Fi / LAN)',
    os: 'Operating system',
    serial: 'Scanner serial number',
    address: 'Customer address',
    scan_count: 'Scan count / Lifetime counter',
    country: 'Customer country',
    button: 'Generate customer email to request missing information',
    customerEmailTitle: 'CUSTOMER EMAIL — MISSING INFORMATION REQUEST',
    copyEmail: 'Copy Email',
  },
  pt: {
    title: 'INFORMAÇÕES EM FALTA ANTES DO ESCALAMENTO',
    connectivity: 'Tipo de ligação (USB / Wi‑Fi / LAN)',
    os: 'Sistema operativo',
    serial: 'Número de série do scanner',
    address: 'Morada do cliente',
    scan_count: 'Contador de digitalizações / Lifetime Counter',
    country: 'País do cliente',
    button: 'Criar e-mail ao cliente para pedir informações em falta',
    customerEmailTitle: 'E-MAIL AO CLIENTE — PEDIDO DE INFORMAÇÕES EM FALTA',
    copyEmail: 'Copiar e-mail',
  },
  es: {
    title: 'INFORMACIÓN FALTANTE ANTES DE LA ESCALACIÓN',
    connectivity: 'Tipo de conexión (USB / Wi‑Fi / LAN)',
    os: 'Sistema operativo',
    serial: 'Número de serie del escáner',
    address: 'Dirección del cliente',
    scan_count: 'Contador de escaneos / Lifetime Counter',
    country: 'País del cliente',
    button: 'Crear e-mail al cliente para solicitar información faltante',
    customerEmailTitle: 'E-MAIL AL CLIENTE — SOLICITUD DE INFORMACIÓN FALTANTE',
    copyEmail: 'Copiar e-mail',
  },
  fr: {
    title: 'INFORMATIONS MANQUANTES AVANT ESCALADE',
    connectivity: 'Type de connexion (USB / Wi‑Fi / LAN)',
    os: 'Système d’exploitation',
    serial: 'Numéro de série du scanner',
    address: 'Adresse du client',
    scan_count: 'Compteur de scans / Lifetime Counter',
    country: 'Pays du client',
    button: 'Créer l’e-mail client pour demander les informations manquantes',
    customerEmailTitle: 'E-MAIL CLIENT — DEMANDE D’INFORMATIONS MANQUANTES',
    copyEmail: 'Copier l’e-mail',
  },
  it: {
    title: 'INFORMAZIONI MANCANTI PRIMA DELL’ESCALATION',
    connectivity: 'Tipo di connessione (USB / Wi‑Fi / LAN)',
    os: 'Sistema operativo',
    serial: 'Numero di serie dello scanner',
    address: 'Indirizzo del cliente',
    scan_count: 'Conteggio scansioni / Lifetime Counter',
    country: 'Paese del cliente',
    button: 'Creare e-mail al cliente per richiedere informazioni mancanti',
    customerEmailTitle: 'E-MAIL AL CLIENTE — RICHIESTA INFORMAZIONI MANCANTI',
    copyEmail: 'Copia e-mail',
  },
  nl: {
    title: 'ONTBREKENDE INFORMATIE VÓÓR ESCALATIE',
    connectivity: 'Verbindingstype (USB / Wi‑Fi / LAN)',
    os: 'Besturingssysteem',
    serial: 'Serienummer van de scanner',
    address: 'Adres van de klant',
    scan_count: 'Scanteller / Lifetime Counter',
    country: 'Land van de klant',
    button: 'Klantmail maken om ontbrekende informatie op te vragen',
    customerEmailTitle: 'KLANTMAIL — VERZOEK OM ONTBREKENDE INFORMATIE',
    copyEmail: 'E-mail kopiëren',
  },
  ja: {
    title: 'エスカレーション前の不足情報',
    connectivity: '接続タイプ（USB / Wi‑Fi / LAN）',
    os: 'オペレーティングシステム',
    serial: 'スキャナーのシリアル番号',
    address: 'お客様の住所',
    scan_count: 'スキャン枚数 / Lifetime Counter',
    country: 'お客様の国',
    button: '不足情報を依頼するお客様向けメールを作成',
    customerEmailTitle: 'お客様向けメール — 不足情報の依頼',
    copyEmail: 'メールをコピー',
  },
};

function buildMissingInfoEmail(lang, model) {
  const key = emailLangKey(lang);
  const labels = MISSING_INFO_LABELS[key] || MISSING_INFO_LABELS.en;
  const modelName = model || (key === 'en' ? 'scanner' : 'Scanner');

  const templates = {
    de: `Guten Tag,

vielen Dank für Ihre Geduld, während wir den gemeldeten Fall zu Ihrem ${modelName} weiter prüfen.

Damit wir die nächsten Schritte korrekt einleiten können, benötigen wir bitte noch folgende Informationen:

- ${labels.connectivity}
- ${labels.os}
- ${labels.serial}
- ${labels.address}
- ${labels.scan_count}
- ${labels.country}

Bitte antworten Sie direkt auf diese E-Mail, damit alle Informationen zentral im bestehenden Vorgang dokumentiert bleiben.

Mit freundlichen Grüßen
PFU Support Team`,

    en: `Dear Customer,

Thank you for your continued patience while we work to resolve the issue with your ${modelName}.

To proceed with the next steps, we require the following additional information:

- ${labels.connectivity}
- ${labels.os}
- ${labels.serial}
- ${labels.address}
- ${labels.scan_count}
- ${labels.country}

Please reply directly to this email so all information remains documented in the existing case.

Kind regards
PFU Support Team`,

    pt: `Bom dia,

Obrigado pela sua paciência enquanto continuamos a analisar o caso reportado com o seu ${modelName}.

Para podermos iniciar os próximos passos corretamente, precisamos ainda das seguintes informações:

- ${labels.connectivity}
- ${labels.os}
- ${labels.serial}
- ${labels.address}
- ${labels.scan_count}
- ${labels.country}

Por favor, responda diretamente a este e-mail para que todas as informações permaneçam documentadas no caso existente.

Atenciosamente
PFU Support Team`,

    es: `Buenos días,

Gracias por su paciencia mientras seguimos revisando el caso reportado con su ${modelName}.

Para poder iniciar los siguientes pasos correctamente, necesitamos todavía la siguiente información:

- ${labels.connectivity}
- ${labels.os}
- ${labels.serial}
- ${labels.address}
- ${labels.scan_count}
- ${labels.country}

Por favor, responda directamente a este e-mail para que toda la información quede documentada en el caso existente.

Atentamente
PFU Support Team`,

    fr: `Bonjour,

Merci pour votre patience pendant que nous poursuivons l’analyse du cas signalé avec votre ${modelName}.

Afin de pouvoir lancer correctement les prochaines étapes, nous avons encore besoin des informations suivantes :

- ${labels.connectivity}
- ${labels.os}
- ${labels.serial}
- ${labels.address}
- ${labels.scan_count}
- ${labels.country}

Veuillez répondre directement à cet e-mail afin que toutes les informations restent documentées dans le dossier existant.

Cordialement
PFU Support Team`,

    it: `Buongiorno,

La ringraziamo per la pazienza mentre continuiamo ad analizzare il caso segnalato con il suo ${modelName}.

Per procedere correttamente con i prossimi passaggi, abbiamo ancora bisogno delle seguenti informazioni:

- ${labels.connectivity}
- ${labels.os}
- ${labels.serial}
- ${labels.address}
- ${labels.scan_count}
- ${labels.country}

La preghiamo di rispondere direttamente a questa e-mail, in modo che tutte le informazioni restino documentate nel caso esistente.

Cordiali saluti
PFU Support Team`,

    nl: `Goedendag,

Bedankt voor uw geduld terwijl wij de gemelde situatie met uw ${modelName} verder onderzoeken.

Om de volgende stappen correct te kunnen starten, hebben wij nog de volgende informatie nodig:

- ${labels.connectivity}
- ${labels.os}
- ${labels.serial}
- ${labels.address}
- ${labels.scan_count}
- ${labels.country}

Reageer alstublieft rechtstreeks op deze e-mail, zodat alle informatie in de bestaande case gedocumenteerd blijft.

Met vriendelijke groet
PFU Support Team`,

    ja: `お世話になっております。

お客様の${modelName}に関するケースについて、引き続き確認しております。お待ちいただきありがとうございます。

次の手順を正しく進めるため、以下の情報をお知らせください：

- ${labels.connectivity}
- ${labels.os}
- ${labels.serial}
- ${labels.address}
- ${labels.scan_count}
- ${labels.country}

情報が既存のケースに記録されるよう、このメールに直接ご返信ください。

よろしくお願いいたします。
PFU Support Team`,
  };

  return templates[key] || templates.en;
}

const pageStyle = {
  background: 'radial-gradient(ellipse at 20% 50%, rgba(13,40,44,0.9) 0%, rgba(8,8,16,1) 50%, rgba(28,10,25,0.85) 100%)',
  minHeight: '100vh',
};

const STATUS_ICON = {
  solved:           <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />,
  done:             <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />,
  not_solved:       <XCircle className="w-3.5 h-3.5 text-secondary shrink-0 mt-0.5" />,
  not_possible:     <MinusCircle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />,
  waiting_customer: <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />,
  skipped:          <MinusCircle className="w-3.5 h-3.5 text-white/20 shrink-0 mt-0.5" />,
  blocked:          <MinusCircle className="w-3.5 h-3.5 text-white/20 shrink-0 mt-0.5" />,
};

function Section({ title, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-5 py-3.5 text-left hover:bg-white/[0.02] transition-colors"
      >
        <span className="text-xs font-semibold uppercase tracking-widest text-white/40">{title}</span>
        {open ? <ChevronUp className="w-3.5 h-3.5 text-white/20" /> : <ChevronDown className="w-3.5 h-3.5 text-white/20" />}
      </button>
      {open && <div className="px-5 pb-5">{children}</div>}
    </div>
  );
}


function sourceOpening(session, lang = 'de') {
  const source = session?.contactSource || session?.source || session?.knownFacts?.contactSource || 'email';
  const isEn = String(lang).toLowerCase().startsWith('en');
  const isPt = String(lang).toLowerCase().startsWith('pt');

  if (isPt) {
    const map = {
      phone: 'Obrigado pelo seu telefonema para o PFU Support hoje.',
      email: 'Obrigado pelo seu e-mail.',
      live_chat: 'Obrigado pelo contacto através do Live Chat.',
      webportal: 'Obrigado pelo seu pedido através do Webportal.',
      self_registration_portal: 'Obrigado pelo seu pedido através do portal de autorregisto.',
    };
    return `Bom dia,\n\n${map[source] || map.email}`;
  }

  if (isEn) {
    const map = {
      phone: 'Thank you for calling PFU Support today.',
      email: 'Thank you for your email.',
      live_chat: 'Thank you for contacting us via Live Chat.',
      webportal: 'Thank you for your request via the web portal.',
      self_registration_portal: 'Thank you for your request via the self-registration portal.',
    };
    return `Hello,\n\n${map[source] || map.email}`;
  }

  const map = {
    phone: 'Vielen Dank für Ihren Anruf beim PFU Support heute.',
    email: 'vielen Dank für Ihre E-Mail.',
    live_chat: 'vielen Dank für den Kontakt über den Live Chat.',
    webportal: 'vielen Dank für Ihre Anfrage über das Webportal.',
    self_registration_portal: 'vielen Dank für Ihre Anfrage über das Selbstregistrierungsportal.',
  };
  return `Guten Tag,\n\n${map[source] || map.email}`;
}



function emailLangKey(lang = 'de') {
  const key = String(lang || 'de').toLowerCase();
  if (key.startsWith('pt')) return 'pt';
  if (key.startsWith('es')) return 'es';
  if (key.startsWith('fr')) return 'fr';
  if (key.startsWith('it')) return 'it';
  if (key.startsWith('nl')) return 'nl';
  if (key.startsWith('ja')) return 'ja';
  if (key.startsWith('en')) return 'en';
  return 'de';
}

function translateEmailText(map, lang = 'de') {
  const key = emailLangKey(lang);
  return map[key] || map.en || map.de || '';
}

const EMAIL_PHRASES = {
  requestHeader: {
    de: 'Für die nächste Prüfung benötigen wir bitte noch folgende Informationen:',
    en: 'For the next review, we still need the following information:',
    pt: 'Para a próxima análise, precisamos ainda das seguintes informações:',
    es: 'Para la siguiente revisión, necesitamos todavía la siguiente información:',
    fr: 'Pour la prochaine vérification, nous avons encore besoin des informations suivantes :',
    it: 'Per la prossima verifica abbiamo ancora bisogno delle seguenti informazioni:',
    nl: 'Voor de volgende controle hebben wij nog de volgende informatie nodig:',
    ja: '次の確認のため、以下の情報をお知らせください：',
  },
  missingOs: {
    de: 'Betriebssystem inklusive Versionsstand',
    en: 'Operating system including version',
    pt: 'Sistema operativo incluindo versão',
    es: 'Sistema operativo incluida la versión',
    fr: 'Système d’exploitation avec version',
    it: 'Sistema operativo inclusa la versione',
    nl: 'Besturingssysteem inclusief versie',
    ja: 'オペレーティングシステムとバージョン',
  },
  missingConnection: {
    de: 'Verbindungstyp (USB / WLAN / LAN)',
    en: 'Connectivity type (USB / Wi‑Fi / LAN)',
    pt: 'Tipo de ligação (USB / Wi‑Fi / LAN)',
    es: 'Tipo de conexión (USB / Wi‑Fi / LAN)',
    fr: 'Type de connexion (USB / Wi‑Fi / LAN)',
    it: 'Tipo di connessione (USB / Wi‑Fi / LAN)',
    nl: 'Verbindingstype (USB / Wi‑Fi / LAN)',
    ja: '接続タイプ（USB / Wi‑Fi / LAN）',
  },
  errorScreenshot: {
    de: 'Screenshot der vollständigen Fehlermeldung',
    en: 'Screenshot of the full error message',
    pt: 'Screenshot da mensagem de erro completa',
    es: 'Captura completa del mensaje de error',
    fr: 'Capture complète du message d’erreur',
    it: 'Screenshot completo del messaggio di errore',
    nl: 'Screenshot van de volledige foutmelding',
    ja: '完全なエラーメッセージのスクリーンショット',
  },
  deviceManager: {
    de: 'Screenshot oder Foto aus dem Windows-Geräte-Manager, auf dem der Scanner bzw. das unbekannte Gerät sichtbar ist',
    en: 'Screenshot or photo from Windows Device Manager showing the scanner or unknown device',
    pt: 'Screenshot ou foto do Gestor de Dispositivos do Windows onde o scanner ou o dispositivo desconhecido esteja visível',
    es: 'Captura o foto del Administrador de dispositivos de Windows donde se vea el escáner o el dispositivo desconocido',
    fr: 'Capture ou photo du Gestionnaire de périphériques Windows montrant le scanner ou le périphérique inconnu',
    it: 'Screenshot o foto di Gestione dispositivi di Windows in cui sia visibile lo scanner o il dispositivo sconosciuto',
    nl: 'Screenshot of foto van Windows Apparaatbeheer waarop de scanner of het onbekende apparaat zichtbaar is',
    ja: 'スキャナーまたは不明なデバイスが表示されているWindowsデバイスマネージャーのスクリーンショットまたは写真',
  },
  sshomeVersion: {
    de: 'Installierte ScanSnap Home Version',
    en: 'Installed ScanSnap Home version',
    pt: 'Versão instalada do ScanSnap Home',
    es: 'Versión instalada de ScanSnap Home',
    fr: 'Version installée de ScanSnap Home',
    it: 'Versione installata di ScanSnap Home',
    nl: 'Geïnstalleerde ScanSnap Home-versie',
    ja: 'インストールされているScanSnap Homeバージョン',
  },
  firmwareVersion: {
    de: 'Installierte Firmware-Version des Scanners',
    en: 'Installed scanner firmware version',
    pt: 'Versão de firmware instalada no scanner',
    es: 'Versión de firmware instalada en el escáner',
    fr: 'Version du firmware installée sur le scanner',
    it: 'Versione firmware installata nello scanner',
    nl: 'Geïnstalleerde firmwareversie van de scanner',
    ja: 'スキャナーにインストールされているファームウェアバージョン',
  },
  waitingResponse: {
    de: 'Bitte testen Sie die oben beschriebenen Schritte und teilen Sie uns das Ergebnis mit.',
    en: 'Please test the steps described above and let us know the result.',
    pt: 'Por favor, teste os passos descritos acima e informe-nos do resultado.',
    es: 'Por favor, pruebe los pasos descritos anteriormente e indíquenos el resultado.',
    fr: 'Veuillez tester les étapes décrites ci-dessus et nous communiquer le résultat.',
    it: 'La preghiamo di provare i passaggi descritti sopra e comunicarci il risultato.',
    nl: 'Test de hierboven beschreven stappen en laat ons het resultaat weten.',
    ja: '上記の手順をお試しいただき、結果をお知らせください。',
  },
  analysisHeader: {
    de: 'Gemäß der dokumentierten Analyse wurden die folgenden ausgewählten Schritte für Ihren {model} bereits durchgeführt:',
    en: 'According to the documented analysis, the following selected steps have already been performed for your {model}:',
    pt: 'De acordo com a análise documentada, os seguintes passos selecionados já foram realizados para o seu {model}:',
    es: 'Según el análisis documentado, ya se realizaron los siguientes pasos seleccionados para su {model}:',
    fr: 'Selon l’analyse documentée, les étapes sélectionnées suivantes ont déjà été effectuées pour votre {model} :',
    it: 'Secondo l’analisi documentata, i seguenti passaggi selezionati sono già stati eseguiti per il suo {model}:',
    nl: 'Volgens de gedocumenteerde analyse zijn de volgende geselecteerde stappen al uitgevoerd voor uw {model}:',
    ja: '記録された分析によると、お客様の{model}について以下の選択された手順がすでに実施されています：',
  },
};


// ── Email Module Builder ─────────────────────────────────────

function EmailBuilder({ session, brain, lang }) {
  const suggested = useMemo(() => suggestModules(session, brain), [session, brain]);
  const [selected, setSelected] = useState(suggested);
  const [selectedScreenshotDetails, setSelectedScreenshotDetails] = useState(['error_message']);
  const [emailText, setEmailText] = useState('');
  const [built, setBuilt] = useState(false);
  const ui = getUI(lang);

  const groups = {
    troubleshooting: Object.values(EMAIL_MODULES).filter(m => m.category === 'troubleshooting'),
    request: Object.values(EMAIL_MODULES).filter(m => m.category === 'request'),
    status: Object.values(EMAIL_MODULES).filter(m => m.category === 'status' && m.key !== 'greeting' && m.key !== 'closing'),
  };

  const GROUP_LABELS = {
    troubleshooting: { de: 'Troubleshooting-Schritte', en: 'Troubleshooting Steps', fr: 'Étapes de dépannage', es: 'Pasos de resolución', pt: 'Etapas de resolução', it: 'Passaggi di risoluzione', nl: 'Probleemoplossing stappen', ja: 'トラブルシューティング手順', zh: '故障排除步骤' },
    request: { de: 'Informationsanfragen', en: 'Information Requests', fr: "Demandes d'informations", es: 'Solicitudes de información', pt: 'Solicitações de informação', it: 'Richieste di informazioni', nl: 'Informatieverzoeken', ja: '情報要求', zh: '信息请求' },
    status: { de: 'Statusmeldungen', en: 'Status Messages', fr: 'Messages de statut', es: 'Mensajes de estado', pt: 'Mensagens de status', it: 'Messaggi di stato', nl: 'Statusberichten', ja: 'ステータスメッセージ', zh: '状态消息' },
  };


  const SCREENSHOT_DETAIL_OPTIONS = [
    {
      key: 'error_message',
      label: { de: 'Fehlermeldung', en: 'Error message', pt: 'Mensagem de erro', es: 'Mensaje de error', fr: 'Message d’erreur', it: 'Messaggio di errore', nl: 'Foutmelding', ja: 'エラーメッセージ' },
      text: EMAIL_PHRASES.errorScreenshot,
    },
    {
      key: 'device_manager',
      label: { de: 'Geräte-Manager', en: 'Device Manager', pt: 'Gestor de Dispositivos', es: 'Administrador de dispositivos', fr: 'Gestionnaire de périphériques', it: 'Gestione dispositivi', nl: 'Apparaatbeheer', ja: 'デバイスマネージャー' },
      text: EMAIL_PHRASES.deviceManager,
    },
    {
      key: 'scanner_display_led',
      label: { de: 'Scanner-Display / LED', en: 'Scanner display / LED', pt: 'Display / LED do scanner', es: 'Pantalla / LED del escáner', fr: 'Écran / LED du scanner', it: 'Display / LED dello scanner', nl: 'Scannerdisplay / LED', ja: 'スキャナー画面 / LED' },
      text: {
        de: 'Foto des Scanner-Displays bzw. der aktuellen LED-Anzeige',
        en: 'Photo of the scanner display or current LED indicator',
        pt: 'Foto do display do scanner ou do estado atual do LED',
        es: 'Foto de la pantalla del escáner o del estado actual del LED',
        fr: 'Photo de l’écran du scanner ou de l’état actuel du voyant LED',
        it: 'Foto del display dello scanner o dello stato attuale del LED',
        nl: 'Foto van het scannerdisplay of de huidige LED-status',
        ja: 'スキャナー画面または現在のLED表示の写真',
      },
    },
    {
      key: 'scanner_behavior_video',
      label: { de: 'Kurzes Video', en: 'Short video', pt: 'Vídeo curto', es: 'Vídeo corto', fr: 'Courte vidéo', it: 'Breve video', nl: 'Korte video', ja: '短い動画' },
      text: {
        de: 'Falls möglich, ein kurzes Video des Scannerverhaltens (max. 30 Sekunden)',
        en: 'If possible, a short video of the scanner behaviour (max. 30 seconds)',
        pt: 'Se possível, um vídeo curto do comportamento do scanner (máx. 30 segundos)',
        es: 'Si es posible, un vídeo corto del comportamiento del escáner (máx. 30 segundos)',
        fr: 'Si possible, une courte vidéo du comportement du scanner (max. 30 secondes)',
        it: 'Se possibile, un breve video del comportamento dello scanner (max. 30 secondi)',
        nl: 'Indien mogelijk een korte video van het scannergedrag (max. 30 seconden)',
        ja: '可能であれば、スキャナーの動作を示す短い動画（最大30秒）',
      },
    },
    {
      key: 'scansnap_home_screen',
      label: { de: 'ScanSnap Home Fenster', en: 'ScanSnap Home screen', pt: 'Janela do ScanSnap Home', es: 'Ventana de ScanSnap Home', fr: 'Fenêtre ScanSnap Home', it: 'Finestra ScanSnap Home', nl: 'ScanSnap Home-venster', ja: 'ScanSnap Home画面' },
      text: {
        de: 'Screenshot des betroffenen ScanSnap Home Fensters bzw. der Scanner-Informationen',
        en: 'Screenshot of the affected ScanSnap Home window or scanner information',
        pt: 'Screenshot da janela afetada do ScanSnap Home ou das informações do scanner',
        es: 'Captura de la ventana afectada de ScanSnap Home o de la información del escáner',
        fr: 'Capture de la fenêtre ScanSnap Home concernée ou des informations du scanner',
        it: 'Screenshot della finestra ScanSnap Home interessata o delle informazioni scanner',
        nl: 'Screenshot van het betreffende ScanSnap Home-venster of de scannerinformatie',
        ja: '該当するScanSnap Home画面またはスキャナー情報のスクリーンショット',
      },
    },
    {
      key: 'scan_result',
      label: { de: 'Scan-Ergebnis', en: 'Scan result', pt: 'Resultado da digitalização', es: 'Resultado del escaneo', fr: 'Résultat de numérisation', it: 'Risultato della scansione', nl: 'Scanresultaat', ja: 'スキャン結果' },
      text: {
        de: 'Beispielscan oder Screenshot des fehlerhaften Scan-Ergebnisses',
        en: 'Sample scan or screenshot of the incorrect scan result',
        pt: 'Digitalização de exemplo ou screenshot do resultado incorreto',
        es: 'Escaneo de ejemplo o captura del resultado incorrecto',
        fr: 'Exemple de scan ou capture du résultat incorrect',
        it: 'Scansione di esempio o screenshot del risultato errato',
        nl: 'Voorbeeldscan of screenshot van het onjuiste scanresultaat',
        ja: '不正なスキャン結果のサンプルスキャンまたはスクリーンショット',
      },
    },
  ];

  const screenshotDetailText = (key) => {
    const option = SCREENSHOT_DETAIL_OPTIONS.find(item => item.key === key);
    if (!option) return '';
    return translateEmailText(option.text, lang);
  };

  const moduleStepPatterns = {
    usb_direct: /usb|direkt|direct|anschluss|cable|kabel/i,
    firmware_update_normal: /firmware|update/i,
    sshomeclean: /sshome|cleanup|bereinig|reinstall|neu install|scansnap home/i,
    sfc_dism: /sfc|dism|integrity|systemintegrität|windows/i,
    device_manager_usb: /geräte-manager|device manager|usb-stack|usb stack/i,
    firmware_recovery_instructions: /recovery|top sensor|empty arm|firmware-wiederherstellung/i,
  };

  const normalize = (value) => String(value || '').toLowerCase();
  const getText = (key) => getModuleText(key, lang) || getModuleText(key, 'de') || getModuleText(key, 'en') || '';
  const langCode = emailLangKey(lang);
  const isDe = langCode === 'de';

  const resultLabel = (status) => {
    const labels = {
      de: { solved: 'Problem behoben', done: 'durchgeführt', not_solved: 'durchgeführt, Problem nicht behoben', not_possible: 'nicht möglich', skipped: 'übersprungen', blocked: 'blockiert', waiting_customer: 'wartet auf Rückmeldung' },
      en: { solved: 'issue resolved', done: 'completed', not_solved: 'completed, issue not resolved', not_possible: 'not possible', skipped: 'skipped', blocked: 'blocked', waiting_customer: 'awaiting customer response' },
      pt: { solved: 'problema resolvido', done: 'concluído', not_solved: 'concluído, problema não resolvido', not_possible: 'não foi possível', skipped: 'ignorado', blocked: 'bloqueado', waiting_customer: 'a aguardar resposta do cliente' },
      es: { solved: 'problema resuelto', done: 'realizado', not_solved: 'realizado, problema no resuelto', not_possible: 'no posible', skipped: 'omitido', blocked: 'bloqueado', waiting_customer: 'esperando respuesta del cliente' },
      fr: { solved: 'problème résolu', done: 'effectué', not_solved: 'effectué, problème non résolu', not_possible: 'pas possible', skipped: 'ignoré', blocked: 'bloqué', waiting_customer: 'en attente de réponse client' },
      it: { solved: 'problema risolto', done: 'eseguito', not_solved: 'eseguito, problema non risolto', not_possible: 'non possibile', skipped: 'saltato', blocked: 'bloccato', waiting_customer: 'in attesa di risposta del cliente' },
      nl: { solved: 'probleem opgelost', done: 'uitgevoerd', not_solved: 'uitgevoerd, probleem niet opgelost', not_possible: 'niet mogelijk', skipped: 'overgeslagen', blocked: 'geblokkeerd', waiting_customer: 'wachten op reactie klant' },
      ja: { solved: '問題解決', done: '完了', not_solved: '実施済み、問題未解決', not_possible: '実施不可', skipped: 'スキップ', blocked: 'ブロック', waiting_customer: 'お客様の返信待ち' },
    };
    return (labels[langCode] || labels.en)[status] || status || '';
  };

  const stepTitle = (step) => {
    const raw = step?.title || step?.instruction || step?.body || step?.stepId || (isDe ? 'Schritt' : 'Step');
    return String(raw).replace(/^Ich prüfe gerade\s*[„"']?/i, '').replace(/[„"']$/g, '').trim();
  };

  const selectedTroubleshootingKeys = (keys) =>
    keys.filter(k => EMAIL_MODULES[k]?.category === 'troubleshooting');

  const selectedRequestKeys = (keys) =>
    keys.filter(k => EMAIL_MODULES[k]?.category === 'request');

  const selectedStatusKeys = (keys) =>
    keys.filter(k => EMAIL_MODULES[k]?.category === 'status');

  const addUniqueLine = (lines, line) => {
    const clean = String(line || '')
      .replace(/^[-•]\s*/, '')
      .replace(/^Bitte\s+/i, '')
      .replace(/^Please\s+/i, '')
      .replace(/^Por favor,?\s+/i, '')
      .replace(/^Veuillez\s+/i, '')
      .replace(/^La preghiamo di\s+/i, '')
      .replace(/^Ci comunichi\s+/i, '')
      .replace(/^Stuur ons alstublieft\s+/i, '')
      .replace(/^お手数ですが\s*/i, '')
      .replace(/[.。]\s*$/, '')
      .trim();
    if (!clean) return;
    const key = clean.toLowerCase()
      .replace(/vollständigen|angezeigten|aktuellen|aktuell|bitte|please/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    if (!lines.some(x => x.key === key || x.text.toLowerCase().includes(key) || key.includes(x.key))) {
      lines.push({ key, text: clean });
    }
  };

  const analysisLinesForSelected = (keys) => {
    const tKeys = selectedTroubleshootingKeys(keys);
    if (!tKeys.length) return [];

    const steps = (session?.steps || []).filter(step =>
      ['solved', 'done', 'not_solved', 'not_possible', 'skipped', 'blocked', 'waiting_customer'].includes(step.status)
    );

    return steps.filter(step => {
      const combined = `${step?.title || ''} ${step?.instruction || ''} ${step?.stepId || ''}`;
      return tKeys.some(key => moduleStepPatterns[key]?.test(combined));
    }).map(step => `- ${stepTitle(step)}: ${resultLabel(step.status)}`);
  };

  const requestBlockForSelected = (keys) => {
    const requestKeys = selectedRequestKeys(keys);
    if (!requestKeys.length) return '';

    const lines = [];
    const has = (key) => requestKeys.includes(key);

    if (has('missing_info_request')) {
      if (!session?.os && !session?.knownFacts?.os) addUniqueLine(lines, translateEmailText(EMAIL_PHRASES.missingOs, lang));
      if (!session?.connectionType && !session?.knownFacts?.connectionType) addUniqueLine(lines, translateEmailText(EMAIL_PHRASES.missingConnection, lang));
      addUniqueLine(lines, translateEmailText(EMAIL_PHRASES.errorScreenshot, lang));
    }

    if (has('request_device_manager_photo')) {
      addUniqueLine(lines, translateEmailText(EMAIL_PHRASES.deviceManager, lang));
    }

    if (has('request_error_screenshot') && !has('screenshot_request')) {
      addUniqueLine(lines, translateEmailText(EMAIL_PHRASES.errorScreenshot, lang));
    }

    if (has('request_os_version') && !session?.os && !session?.knownFacts?.os) {
      addUniqueLine(lines, translateEmailText(EMAIL_PHRASES.missingOs, lang));
    }

    if (has('request_sshome_version')) {
      addUniqueLine(lines, translateEmailText(EMAIL_PHRASES.sshomeVersion, lang));
    }

    if (has('request_firmware_version')) {
      addUniqueLine(lines, translateEmailText(EMAIL_PHRASES.firmwareVersion, lang));
    }

    if (has('screenshot_request')) {
      const activeScreenshotDetails = selectedScreenshotDetails.length ? selectedScreenshotDetails : ['error_message'];
      activeScreenshotDetails.forEach(detailKey => addUniqueLine(lines, screenshotDetailText(detailKey)));
    }

    if (!lines.length) return '';
    return `${translateEmailText(EMAIL_PHRASES.requestHeader, lang)}

${lines.map(line => `- ${line.text}`).join('\n')}`;
  };

  const statusBlockForSelected = (keys) => {
    const statusKeys = selectedStatusKeys(keys);
    const blocks = [];

    if (statusKeys.includes('waiting_response')) {
      blocks.push(translateEmailText(EMAIL_PHRASES.waitingResponse, lang));
    }

    if (statusKeys.includes('resolved_confirmation')) {
      const text = getText('resolved_confirmation').trim();
      if (text) blocks.push(text);
    }

    return blocks.join('\n\n');
  };

  const buildSelectedEmail = (keys = selected) => {
    const unique = [...new Set(keys)];
    const model = session?.model || session?.device || session?.knownFacts?.model || (isDe ? 'Scanner' : 'scanner');

    const parts = [];
    parts.push(sourceOpening(session, lang));

    const analysisLines = analysisLinesForSelected(unique);
    if (analysisLines.length) {
      const header = translateEmailText(EMAIL_PHRASES.analysisHeader, lang).replace('{model}', model);
      parts.push(`${header}\n\n${analysisLines.join('\n')}`);
    }

    const requestBlock = requestBlockForSelected(unique);
    if (requestBlock) parts.push(requestBlock);

    const statusBlock = statusBlockForSelected(unique);
    if (statusBlock) parts.push(statusBlock);

    let closing = getText('closing');
    closing = closing.replaceAll('[Supporter Name]', session?.supporterName || 'Marina Karlovic');
    parts.push(closing);

    return parts.filter(Boolean).join('\n\n').replace(/\n{3,}/g, '\n\n');
  };

  const toggle = (key) => {
    setSelected(prev => {
      const next = prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key];
      if (key === 'screenshot_request' && !prev.includes(key) && selectedScreenshotDetails.length === 0) {
        setSelectedScreenshotDetails(['error_message']);
      }
      if (built) setEmailText(buildSelectedEmail(next));
      return next;
    });
  };

  const toggleScreenshotDetail = (key) => {
    setSelectedScreenshotDetails(prev => {
      const next = prev.includes(key) ? prev.filter(item => item !== key) : [...prev, key];
      if (built) setEmailText(buildSelectedEmail(selected));
      return next;
    });
  };

  const buildEmail = () => {
    setEmailText(buildSelectedEmail(selected));
    setBuilt(true);
  };

  useEffect(() => {
    if (built) setEmailText(buildSelectedEmail(selected));
  }, [selected, selectedScreenshotDetails, lang]);

  const copy = () => { navigator.clipboard.writeText(emailText); toast.success('Email copied'); };

  return (
    <div className="space-y-4">
      {Object.entries(groups).map(([groupKey, modules]) => (
        <div key={groupKey}>
          <p className="text-[9px] font-bold uppercase tracking-widest text-white/25 mb-2">
            {GROUP_LABELS[groupKey][lang] || GROUP_LABELS[groupKey]['en']}
          </p>
          <div className="space-y-1.5">
            {modules.map(mod => {
              const isSuggested = suggested.includes(mod.key);
              const isSelected = selected.includes(mod.key);
              const label = mod.label[lang] || mod.label['en'];
              return (
                <React.Fragment key={mod.key}>
                  <button
                    onClick={() => toggle(mod.key)}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-left transition-all ${
                      isSelected
                        ? 'bg-primary/12 border border-primary/30'
                        : 'bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06]'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded flex items-center justify-center border transition-all shrink-0 ${
                      isSelected ? 'bg-primary border-primary' : 'border-white/20'
                    }`}>
                      {isSelected && <CheckCircle2 className="w-3 h-3 text-white" />}
                    </div>
                    <span className={`text-xs ${isSelected ? 'text-white/80' : 'text-white/40'}`}>{label}</span>
                    {isSuggested && (
                      <span className="ml-auto text-[9px] text-primary/60 uppercase tracking-wider shrink-0">suggested</span>
                    )}
                  </button>

                  {mod.key === 'screenshot_request' && isSelected && (
                    <div className="ml-7 -mt-0.5 mb-2 rounded-xl border border-primary/15 bg-black/20 px-3 py-2 space-y-1.5">
                      <p className="text-[9px] uppercase tracking-widest text-primary/55 mb-1">
                        {isDe ? 'Screenshot-Untermenü' : 'Screenshot submenu'}
                      </p>
                      {SCREENSHOT_DETAIL_OPTIONS.map(option => {
                        const checked = selectedScreenshotDetails.includes(option.key);
                        const optionLabel = option.label[lang] || option.label.de || option.label.en;
                        return (
                          <button
                            key={option.key}
                            type="button"
                            onClick={() => toggleScreenshotDetail(option.key)}
                            className={`w-full flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-left transition-all ${
                              checked ? 'bg-primary/10 text-white/80' : 'text-white/38 hover:text-white/70 hover:bg-white/[0.04]'
                            }`}
                          >
                            <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 ${checked ? 'bg-primary border-primary' : 'border-white/20'}`}>
                              {checked && <CheckCircle2 className="w-2.5 h-2.5 text-white" />}
                            </div>
                            <span className="text-[11px]">{optionLabel}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      ))}

      <div className="flex gap-2 pt-1">
        <Button
          onClick={buildEmail}
          disabled={selected.length === 0}
          className="flex-1 bg-primary/90 hover:bg-primary text-white h-10 text-sm"
        >
          <Mail className="w-4 h-4 mr-2" />
          {ui.generate_email || 'Assemble Email'}
        </Button>
      </div>

      <AnimatePresence>
        {built && emailText && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <div
              className="rounded-xl overflow-hidden"
              style={{ background: 'rgba(248,248,252,0.98)', border: '1px solid rgba(45,212,191,0.2)' }}
            >
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-black/6">
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-primary" />
                  <span className="text-xs font-semibold text-black">{ui.customer_email}</span>
                  <span className="text-[9px] text-black/30 uppercase tracking-wider">LOCAL · NO AI</span>
                </div>
                <Button size="sm" onClick={copy} className="h-7 text-xs bg-primary hover:bg-primary/90 text-white">
                  <Copy className="w-3 h-3 mr-1.5" />
                  {ui.copy_email}
                </Button>
              </div>
              <pre className="p-4 text-xs text-black/70 leading-relaxed whitespace-pre-wrap font-sans">{emailText}</pre>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Case Summary ─────────────────────────────────────────────





function LocalCaseSummary({ session, lang }) {
  const sourceLang = (lang || getSettings()?.emailLanguage || 'de').toLowerCase();
  const [summaryLang, setSummaryLang] = useState(sourceLang);

  useEffect(() => {
    setSummaryLang(sourceLang);
  }, [sourceLang]);
  const steps = session?.steps || [];
  const model = session?.model || session?.device || session?.knownFacts?.model || (summaryLang === 'en' ? 'Not provided' : 'Nicht angegeben');
  const issue = session?.problem || (summaryLang === 'en' ? 'Not provided' : 'Nicht angegeben');
  const connection = session?.connectionType || session?.knownFacts?.connectionType || (summaryLang === 'en' ? 'Not provided' : 'Nicht angegeben');
  const osInfo = session?.os || session?.osType || session?.knownFacts?.os || (summaryLang === 'en' ? 'Not provided' : 'Nicht angegeben');
  const sourceInfo = session?.contactSource || session?.source || session?.knownFacts?.contactSource || (summaryLang === 'en' ? 'Not provided' : 'Nicht angegeben');

  const visible = steps.filter(s => s.status && s.status !== 'pending');
  const solved = steps.find(s => s.status === 'solved');
  const failed = visible.filter(s => ['not_solved', 'not_possible', 'blocked'].includes(s.status));
  const waiting = visible.find(s => s.status === 'waiting_customer');

  const statusLabel = (status, target) => {
    const labels = {
      en: { solved:'resolved', done:'completed', not_solved:'completed, issue not resolved', not_possible:'not possible', blocked:'blocked', waiting_customer:'awaiting customer response', skipped:'skipped' },
      de: { solved:'gelöst', done:'durchgeführt', not_solved:'durchgeführt, Problem nicht behoben', not_possible:'nicht möglich', blocked:'blockiert', waiting_customer:'wartet auf Kundenrückmeldung', skipped:'übersprungen' },
      pt: { solved:'resolvido', done:'concluído', not_solved:'concluído, problema não resolvido', not_possible:'não possível', blocked:'bloqueado', waiting_customer:'a aguardar resposta do cliente', skipped:'ignorado' },
    };
    return (labels[target] || labels.de)[status] || String(status || '').replaceAll('_', ' ');
  };

  const cleanTitle = (step, target = sourceLang) => {
    if (step?.stepId) {
      const resolved = resolveStep(step.stepId, target);
      if (resolved?.title && resolved.title !== step.stepId) return resolved.title;
    }

    const raw = String(step?.title || step?.instruction || step?.body || step?.stepId || (target === 'en' ? 'Step' : 'Schritt')).trim();

    if (target === 'en') {
      if (raw.includes('Direkte USB-Verbindung') || raw.includes('Verificar ligação USB direta')) return 'Checked direct USB connection';
      if (raw.includes('Anderen USB-Anschluss') || raw.includes('Testar outra porta USB')) return 'Tested another USB port and cable';
      if (raw.includes('Geräte-Manager') || raw.includes('Gestor de Dispositivos')) return 'Checked Windows Device Manager detection';
      if (raw.includes('Scanner in ScanSnap Home entfernen') || raw.includes('Remover e voltar')) return 'Removed and reconnected scanner in ScanSnap Home';
      if (raw.includes('ScanSnap Home bereinigen') || raw.includes('Limpar e reinstalar')) return 'Prepared ScanSnap Home cleanup and reinstall';
      if (raw.includes('Windows-Systemintegrität')) return 'Checked Windows system integrity (SFC/DISM)';
      if (raw.includes('WLAN-Status') || raw.includes('estado do Wi')) return 'Checked scanner Wi-Fi status';
      if (raw.includes('Scanner und Computer im selben Netzwerk') || raw.includes('mesma rede')) return 'Checked scanner and computer are on the same network';
      if (raw.includes('Router')) return 'Checked router / 2.4 GHz network';
      if (raw.includes('Hotspot')) return 'Performed hotspot or alternate network test';
      if (raw.includes('Firmwareupdate') || raw.includes('firmware')) return 'Checked firmware update path';
    }

    return raw;
  };

  const buildSummary = (target) => {
    const isEn = target === 'en';
    const isPt = target === 'pt';
    const lines = [];

    const H = isEn
      ? { issue:'Issue', action:'Action', result:'Result', customer:'Customer reported', product:'Product', connection:'Connection', none:'No troubleshooting steps have been documented yet.', progress:'Troubleshooting is still in progress. Additional feedback or information is required.' }
      : isPt
        ? { issue:'Problema', action:'Ação', result:'Resultado', customer:'Cliente reportou', product:'Produto', connection:'Ligação', none:'Ainda não foram documentados passos de troubleshooting.', progress:'A análise ainda está em curso. É necessária resposta ou informação adicional.' }
        : { issue:'Issue', action:'Action', result:'Result', customer:'Kundenmeldung', product:'Produkt', connection:'Verbindung', none:'Es wurden noch keine Troubleshooting-Schritte dokumentiert.', progress:'Fehlersuche läuft weiter. Weitere Rückmeldung oder zusätzliche Informationen erforderlich.' };

    lines.push(H.issue);
    lines.push(`${H.customer}: ${issue}`);
    lines.push(`${H.product}: ${model}`);
    lines.push(`${H.connection}: ${connection}`);
    lines.push(`${H.os}: ${osInfo}`);
    lines.push(`${H.source}: ${sourceInfo}`);
    lines.push('');
    lines.push(H.action);

    if (!visible.length) {
      lines.push(H.none);
    } else {
      visible.forEach(s => lines.push(`- ${cleanTitle(s, target)}: ${statusLabel(s.status, target)}`));
    }

    lines.push('');
    lines.push(H.result);

    if (solved) {
      lines.push(isEn ? `Issue resolved after: ${cleanTitle(solved, 'en')}.` : isPt ? `Problema resolvido após: ${cleanTitle(solved, 'pt')}.` : `Problem gelöst nach: ${cleanTitle(solved, 'de')}.`);
    } else if (waiting) {
      lines.push(isEn ? `Awaiting customer response regarding: ${cleanTitle(waiting, 'en')}.` : isPt ? `A aguardar resposta do cliente sobre: ${cleanTitle(waiting, 'pt')}.` : `Warten auf Kundenrückmeldung zu: ${cleanTitle(waiting, 'de')}.`);
    } else if (failed.length >= 3) {
      lines.push(isEn
        ? 'The documented troubleshooting did not resolve the issue. Next step: remote session or escalation depending on the case context.'
        : isPt
          ? 'Os passos documentados não resolveram o problema. Próximo passo: sessão remota ou escalamento, dependendo do contexto do caso.'
          : 'Die dokumentierten Maßnahmen haben das Problem nicht behoben. Nächster Schritt: Remote-Session oder Eskalation je nach Fallkontext.');
    } else {
      lines.push(H.progress);
    }

    return lines.join('\n');
  };

  const text = buildSummary(summaryLang);
  const copy = () => { navigator.clipboard.writeText(text); toast.success(summaryLang === 'en' ? 'Case summary copied' : 'Fallzusammenfassung kopiert'); };
  const sourceLabel = sourceLang === 'pt' ? 'Português' : sourceLang === 'de' ? 'Deutsch' : sourceLang.toUpperCase();

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] text-white/30 uppercase tracking-widest">
          {summaryLang === 'en' ? 'Case summary · English' : `Case summary · ${sourceLabel}`}
        </span>
        {summaryLang !== 'en' && (
          <button
            type="button"
            onClick={() => setSummaryLang('en')}
            className="px-3 py-1 rounded-full text-[10px] transition-all text-white/35 hover:text-primary"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            English
          </button>
        )}
        {summaryLang === 'en' && sourceLang !== 'en' && (
          <button
            type="button"
            onClick={() => setSummaryLang(sourceLang)}
            className="px-3 py-1 rounded-full text-[10px] transition-all text-white/35 hover:text-primary"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            Zurück
          </button>
        )}
      </div>
      <div className="rounded-xl p-4 font-mono text-xs text-white/60 leading-relaxed whitespace-pre-wrap" style={{ background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(255,255,255,0.05)' }}>
        {text || '(No steps executed yet)'}
      </div>
      <Button size="sm" variant="outline" onClick={copy} className="h-8 text-xs border-white/10 text-white/40 hover:text-white/70">
        <Copy className="w-3.5 h-3.5 mr-1.5" />
        Copy
      </Button>
    </div>
  );
}


// ── Step History List ────────────────────────────────────────



function finalLangKey(lang = 'de') {
  const key = String(lang || 'de').toLowerCase();
  if (key.startsWith('pt')) return 'pt';
  if (key.startsWith('es')) return 'es';
  if (key.startsWith('fr')) return 'fr';
  if (key.startsWith('it')) return 'it';
  if (key.startsWith('nl')) return 'nl';
  if (key.startsWith('ja')) return 'ja';
  if (key.startsWith('en')) return 'en';
  return 'de';
}

const FINAL_WAITING_LABELS = {
  customerReply: { de:'Kundenrückmeldung eintragen', en:'Enter customer reply', pt:'Inserir resposta do cliente', es:'Introducir respuesta del cliente', fr:'Saisir la réponse client', it:'Inserire risposta del cliente', nl:'Klantreactie invoeren', ja:'お客様の返信を入力' },
  analyzeContinue: { de:'Antwort auswerten und Troubleshooting fortsetzen', en:'Analyze reply and continue troubleshooting', pt:'Analisar resposta e continuar troubleshooting', es:'Analizar respuesta y continuar troubleshooting', fr:'Analyser la réponse et continuer le troubleshooting', it:'Analizzare risposta e continuare troubleshooting', nl:'Reactie analyseren en troubleshooting voortzetten', ja:'返信を分析してトラブルシューティングを続行' },
  reminder: { de:'Erinnerungs-E-Mail erstellen', en:'Create reminder email', pt:'Criar e-mail de lembrete', es:'Crear e-mail de recordatorio', fr:'Créer un e-mail de relance', it:'Creare e-mail di promemoria', nl:'Herinneringsmail maken', ja:'リマインドメールを作成' },
  waitingFor: { de:'Benötigte Rückmeldung', en:'Needed reply', pt:'Resposta necessária', es:'Respuesta necesaria', fr:'Réponse nécessaire', it:'Risposta necessaria', nl:'Benodigde reactie', ja:'必要な返信' },
  copy: { de:'Kopieren', en:'Copy', pt:'Copiar', es:'Copiar', fr:'Copier', it:'Copia', nl:'Kopiëren', ja:'コピー' },
  reminderTitle: { de:'Erinnerungs-E-Mail', en:'Reminder email', pt:'E-mail de lembrete', es:'E-mail de recordatorio', fr:'E-mail de relance', it:'E-mail di promemoria', nl:'Herinneringsmail', ja:'リマインドメール' },
};

function finalWaitingText(key, lang = 'de') {
  return FINAL_WAITING_LABELS[key]?.[finalLangKey(lang)] || FINAL_WAITING_LABELS[key]?.en || key;
}

function buildFollowupReminderEmail(session, step, lang = 'de') {
  const l = finalLangKey(lang);
  const waitingFor = step?.waitingForText || step?.waitingNote || step?.note || (l === 'en' ? 'the requested information' : 'die angefragte Information');
  const caseNumber = session?.caseNumber || session?.caseNo || session?.caseId || '';

  const templates = {
    de: `Guten Tag,

ich wollte höflich nachfragen, ob Sie weiterhin Unterstützung zu Ihrem ScanSnap benötigen.

Falls ja, senden Sie uns bitte noch folgende Information zu, damit wir Ihre Anfrage weiter prüfen können:

- ${waitingFor}

Bitte antworten Sie direkt auf diese E-Mail, damit alle Informationen in Ihrer aktiven Anfrage gebündelt bleiben${caseNumber ? ` (${caseNumber})` : ''}.

Mit freundlichen Grüßen

Marina Karlovic
PFU Support Team`,
    en: `Hello,

I just wanted to kindly follow up and ask whether you still need support with your ScanSnap.

If yes, please send us the following information so we can continue reviewing your request:

- ${waitingFor}

Please reply directly to this email so all information stays together in your active support request${caseNumber ? ` (${caseNumber})` : ''}.

Kind regards

Marina Karlovic
PFU Support Team`,
    pt: `Bom dia,

Gostaria apenas de perguntar se ainda precisa de suporte com o seu ScanSnap.

Se sim, por favor envie-nos ainda a seguinte informação para podermos continuar a analisar o seu pedido:

- ${waitingFor}

Por favor, responda diretamente a este e-mail para que todas as informações permaneçam reunidas no seu pedido de suporte ativo${caseNumber ? ` (${caseNumber})` : ''}.

Atenciosamente

Marina Karlovic
PFU Support Team`,
    es: `Buenos días,

Quería preguntarle amablemente si todavía necesita soporte con su ScanSnap.

Si es así, envíenos todavía la siguiente información para poder continuar revisando su solicitud:

- ${waitingFor}

Por favor, responda directamente a este e-mail para que toda la información permanezca reunida en su solicitud de soporte activa${caseNumber ? ` (${caseNumber})` : ''}.

Atentamente

Marina Karlovic
PFU Support Team`,
    fr: `Bonjour,

Je souhaitais simplement vous demander si vous avez encore besoin d’assistance pour votre ScanSnap.

Si oui, veuillez nous envoyer l’information suivante afin que nous puissions poursuivre l’analyse de votre demande :

- ${waitingFor}

Veuillez répondre directement à cet e-mail afin que toutes les informations restent regroupées dans votre demande de support active${caseNumber ? ` (${caseNumber})` : ''}.

Cordialement

Marina Karlovic
PFU Support Team`,
    it: `Buongiorno,

Volevo gentilmente chiederle se ha ancora bisogno di supporto per il suo ScanSnap.

In caso affermativo, ci invii ancora la seguente informazione, così possiamo continuare a verificare la sua richiesta:

- ${waitingFor}

La preghiamo di rispondere direttamente a questa e-mail, così tutte le informazioni restano raccolte nella sua richiesta di supporto attiva${caseNumber ? ` (${caseNumber})` : ''}.

Cordiali saluti

Marina Karlovic
PFU Support Team`,
    nl: `Goedendag,

Ik wilde vriendelijk navragen of u nog ondersteuning nodig heeft voor uw ScanSnap.

Als dat zo is, stuur ons dan alstublieft nog de volgende informatie, zodat wij uw verzoek verder kunnen controleren:

- ${waitingFor}

Reageer alstublieft rechtstreeks op deze e-mail, zodat alle informatie gebundeld blijft in uw actieve supportverzoek${caseNumber ? ` (${caseNumber})` : ''}.

Met vriendelijke groet

Marina Karlovic
PFU Support Team`,
    ja: `お世話になっております。

ScanSnapについて、引き続きサポートが必要か確認のためご連絡いたしました。

必要な場合は、確認を進めるため以下の情報をお送りください：

- ${waitingFor}

情報が現在のサポート依頼にまとまるよう、このメールに直接ご返信ください${caseNumber ? ` (${caseNumber})` : ''}。

よろしくお願いいたします。

Marina Karlovic
PFU Support Team`,
  };

  return templates[l] || templates.en;
}

function inferNextStepFromReply(reply = '', session = {}, lang = 'de') {
  const text = String(reply || '').toLowerCase();
  const l = finalLangKey(lang);
  const make = (title, instruction, route = 'CUSTOMER_REPLY') => ({
    title,
    instruction,
    route,
    stepId: `CUSTOMER_REPLY_${Date.now()}`,
    status: 'pending',
    result: '',
    note: '',
    timestamp: null,
    source: 'customer_reply_analysis',
  });

  if (/nicht angezeigt|not shown|not visible|não aparece|nao aparece|não é exibido|no aparece|pas affich|non viene visualizzato|niet zichtbaar|表示されない|出ない/.test(text)) {
    return make(
      l === 'pt' ? 'USB-Erkennung erneut eingrenzen' : l === 'en' ? 'Narrow down USB detection' : 'USB-Erkennung erneut eingrenzen',
      l === 'pt' ? 'Der Scanner wird offenbar nicht im Geräte-Manager angezeigt. Prüfe als Nächstes direkten USB-Anschluss, anderen USB-Port, anderes USB-Kabel und ob der Scanner überhaupt als USB-Gerät erscheint.' : l === 'en' ? 'The scanner does not appear in Device Manager. Next check direct USB connection, another USB port, another USB cable and whether the scanner appears as any USB device.' : 'Der Scanner wird offenbar nicht im Geräte-Manager angezeigt. Prüfe als Nächstes direkten USB-Anschluss, anderen USB-Port, anderes USB-Kabel und ob der Scanner überhaupt als USB-Gerät erscheint.',
      'USB_CONNECTION'
    );
  }

  if (/unbekannt|unknown device|dispositivo desconhecido|dispositivo desconocido|périphérique inconnu|periferica sconosciuta|onbekend apparaat|不明/.test(text)) {
    return make(
      l === 'en' ? 'Handle unknown USB device' : 'Unbekanntes USB-Gerät prüfen',
      l === 'en' ? 'Windows detects something, but not correctly. Remove the unknown device in Device Manager, disconnect USB, restart the PC, reconnect directly and then check ScanSnap Home again.' : 'Windows erkennt ein Gerät, aber nicht korrekt. Entferne das unbekannte Gerät im Geräte-Manager, trenne USB, starte den PC neu, verbinde direkt erneut und prüfe danach ScanSnap Home.',
      'USB_CONNECTION'
    );
  }

  if (/korrekt|correctly|visible|sichtbar|aparece corretamente|correctamente|correctement|correttamente|zichtbaar|正常/.test(text)) {
    return make(
      l === 'en' ? 'Check ScanSnap Home registration' : 'ScanSnap Home Registrierung prüfen',
      l === 'en' ? 'The scanner seems visible to Windows. Continue with removing and reconnecting the scanner in ScanSnap Home, then test again.' : 'Der Scanner scheint in Windows sichtbar zu sein. Fahre mit Entfernen und erneuter Registrierung des Scanners in ScanSnap Home fort und teste danach erneut.',
      'SOFTWARE'
    );
  }

  return make(
    l === 'en' ? 'Evaluate customer reply' : l === 'pt' ? 'Avaliar resposta do cliente' : 'Kundenrückmeldung auswerten',
    reply || (l === 'en' ? 'Review the customer reply and continue with the most fitting next step.' : 'Kundenrückmeldung prüfen und mit dem passendsten nächsten Schritt fortfahren.'),
    'CUSTOMER_REPLY'
  );
}


function finalStatusText(session, ui, lang = 'de') {
  const status = session?.status || '';
  const hasWaiting = (session?.steps || []).some(s => s.status === 'waiting_customer');

  const map = {
    waiting: { de: 'Warte auf Kundenrückmeldung', en: 'Waiting for customer reply', pt: 'A aguardar resposta do cliente', es: 'Esperando respuesta del cliente', fr: 'En attente de réponse client', it: 'In attesa di risposta del cliente', nl: 'Wachten op reactie klant', ja: 'お客様の返信待ち' },
    exhausted: { de: 'Alle Schritte ausgeschöpft', en: 'All steps exhausted', pt: 'Todos os passos esgotados', es: 'Todos los pasos agotados', fr: 'Toutes les étapes sont épuisées', it: 'Tutti i passaggi esauriti', nl: 'Alle stappen uitgeput', ja: 'すべての手順を実施済み' },
    solved: { de: 'Problem gelöst', en: 'Issue resolved', pt: 'Problema resolvido', es: 'Problema resuelto', fr: 'Problème résolu', it: 'Problema risolto', nl: 'Probleem opgelost', ja: '問題解決' },
  };
  const key = String(lang || 'de').toLowerCase();
  const l = key.startsWith('pt') ? 'pt' : key.startsWith('es') ? 'es' : key.startsWith('fr') ? 'fr' : key.startsWith('it') ? 'it' : key.startsWith('nl') ? 'nl' : key.startsWith('ja') ? 'ja' : key.startsWith('en') ? 'en' : 'de';

  if (status === 'solved') return map.solved[l];
  if (status === 'waiting_customer' || hasWaiting) return map.waiting[l];
  return ui.steps_exhausted || map.exhausted[l];
}

function resumeStepFromFinal(steps, index, navigate) {
  const normalized = (steps || []).map((s, i) => {
    if (i === index) return { ...s, status: 'pending', result: '', note: s.note || '', timestamp: null };
    return s;
  });
  setSession({
    steps: normalized,
    currentStepIndex: index,
    status: 'troubleshooting',
  });
  navigate('/troubleshoot');
}



function WaitingReplyPanel({ session, steps, lang, navigate }) {
  const waitingSteps = (steps || []).map((s, index) => ({ ...s, index })).filter(s => s.status === 'waiting_customer');
  const [activeIndex, setActiveIndex] = useState(waitingSteps[0]?.index ?? null);
  const [reply, setReply] = useState('');
  const [reminderEmail, setReminderEmail] = useState('');

  if (!waitingSteps.length) return null;

  const active = waitingSteps.find(s => s.index === activeIndex) || waitingSteps[0];

  const continueFromReply = () => {
    const nextStep = inferNextStepFromReply(reply, session, lang);
    const updatedSteps = (steps || []).map((s, i) => i === active.index ? {
      ...s,
      status: 'done',
      customerReply: reply,
      note: [s.note, reply ? `Kundenrückmeldung: ${reply}` : 'Kundenrückmeldung eingegangen'].filter(Boolean).join(' | '),
      timestamp: new Date().toISOString(),
    } : s);

    const withNext = [...updatedSteps.slice(0, active.index + 1), nextStep, ...updatedSteps.slice(active.index + 1)];
    setSession({
      steps: withNext,
      currentStepIndex: active.index + 1,
      status: 'troubleshooting',
      customerReply: reply,
    });
    navigate('/troubleshoot');
  };

  const buildReminder = () => setReminderEmail(buildFollowupReminderEmail(session, active, lang));
  const copyReminder = () => {
    navigator.clipboard.writeText(reminderEmail);
    toast.success(finalWaitingText('copy', lang));
  };

  return (
    <Section title={`${finalWaitingText('waitingFor', lang)} · ${waitingSteps.length}`} defaultOpen={true}>
      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {waitingSteps.map((s) => (
            <button
              key={s.index}
              onClick={() => { setActiveIndex(s.index); setReply(''); setReminderEmail(''); }}
              className={`rounded-full px-3 py-1.5 text-[11px] transition-all ${active.index === s.index ? 'bg-amber-400/15 text-amber-300 border-amber-400/35' : 'bg-white/[0.04] text-white/40 border-white/10 hover:text-white/70'}`}
              style={{ borderWidth: 1 }}
            >
              {s.waitingForText || s.waitingNote || s.note || `Step ${s.index + 1}`}
            </button>
          ))}
        </div>

        <div className="rounded-2xl p-4" style={{ background: 'rgba(251,191,36,0.055)', border: '1px solid rgba(251,191,36,0.16)' }}>
          <p className="text-xs uppercase tracking-widest text-amber-300/70">{finalWaitingText('waitingFor', lang)}</p>
          <p className="mt-1 text-sm text-white/78">{active.waitingForText || active.waitingNote || active.note}</p>
        </div>

        <textarea
          value={reply}
          onChange={(e) => setReply(e.target.value)}
          placeholder={finalWaitingText('customerReply', lang)}
          className="w-full rounded-2xl px-4 py-3 text-sm text-white outline-none"
          style={{ minHeight: 88, background: 'rgba(0,0,0,0.26)', border: '1px solid rgba(255,255,255,0.10)', resize: 'vertical' }}
        />

        <div className="flex flex-wrap gap-2">
          <Button onClick={continueFromReply} className="bg-primary hover:bg-primary/90 text-white">
            {finalWaitingText('analyzeContinue', lang)}
          </Button>
          <Button onClick={buildReminder} variant="outline" className="border-white/10 text-white/65 hover:text-white">
            {finalWaitingText('reminder', lang)}
          </Button>
        </div>

        {reminderEmail && (
          <div className="rounded-xl overflow-hidden" style={{ background: 'rgba(248,248,252,0.98)', border: '1px solid rgba(251,191,36,0.25)' }}>
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-black/6">
              <span className="text-xs font-semibold text-black">{finalWaitingText('reminderTitle', lang)}</span>
              <Button size="sm" onClick={copyReminder} className="h-7 text-xs bg-primary hover:bg-primary/90 text-white">
                <Copy className="w-3.5 h-3.5 mr-1" />
                {finalWaitingText('copy', lang)}
              </Button>
            </div>
            <pre className="p-4 whitespace-pre-wrap text-[12px] leading-relaxed text-black font-sans">{reminderEmail}</pre>
          </div>
        )}
      </div>
    </Section>
  );
}


function StepHistoryList({ steps, lang, onResumeStep }) {
  if (!steps || steps.length === 0) return <p className="text-xs text-white/25 italic">No steps performed.</p>;

  return (
    <div className="space-y-2">
      {steps.map((s, i) => {
        const resolved = s.stepId
          ? resolveStep(s.stepId, lang)
          : { title: s.title || '(unnamed)', body: s.instruction || '' };
        const icon = STATUS_ICON[s.status] || STATUS_ICON.skipped;
        const statusColor = {
          solved: 'text-primary/70',
          done: 'text-primary/70',
          not_solved: 'text-secondary/70',
          not_possible: 'text-amber-400/70',
          waiting_customer: 'text-amber-400/70',
          skipped: 'text-white/25',
          blocked: 'text-white/25',
          pending: 'text-white/20',
        }[s.status] || 'text-white/30';

        return (
          <button
            key={i}
            type="button"
            onClick={() => onResumeStep && onResumeStep(i)}
            className="w-full flex items-start gap-2.5 px-3 py-2.5 rounded-xl text-left transition-colors hover:bg-white/[0.05]"
            style={{ background: 'rgba(255,255,255,0.025)' }}
            title={lang === 'de' ? 'An diesem Schritt fortsetzen' : 'Resume from this step'}
          >
            {icon}
            <div className="flex-1 min-w-0">
              <p className={`text-xs font-medium leading-snug ${statusColor}`}>{resolved.title}</p>
              {s.note && <p className="text-[10px] text-white/25 italic mt-0.5">{s.note}</p>}
            </div>
            <span className="text-[9px] text-white/20 uppercase tracking-wider shrink-0">{s.status?.replace('_', ' ')}</span>
          </button>
        );
      })}
    </div>
  );
}


function HardwareProcessPanel({ session, lang }) {
  const process = classifyProcess(session);
  const summary = buildProcessSummary(session, lang);
  const [emailText, setEmailText] = useState('');

  const build = () => setEmailText(buildHardwareProcessEmail(session, lang));
  const copy = () => { navigator.clipboard.writeText(emailText); toast.success(lang === 'en' ? 'Process email copied' : 'Prozess-E-Mail kopiert'); };

  return (
    <div className="space-y-3">
      <div className="rounded-xl p-4" style={{ background: process.recommendedProcess === 'advance_exchange' ? 'rgba(45,212,191,0.06)' : 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="flex items-center justify-between gap-2 mb-2">
          <p className="text-sm font-semibold text-white/75">{summary.title}</p>
          <span className="text-[9px] uppercase tracking-widest text-primary/70 border border-primary/20 rounded-full px-2 py-1">
            {process.recommendedProcess === 'advance_exchange' ? (lang === 'en' ? 'Ready' : 'Bereit') : (lang === 'en' ? 'Check' : 'Prüfen')}
          </span>
        </div>
        <p className="text-xs text-white/38 leading-relaxed">{summary.text}</p>
      </div>

      <Button onClick={build} className="w-full bg-primary/90 hover:bg-primary text-white h-10 text-sm">
        <Mail className="w-4 h-4 mr-2" />
        {lang === 'en' ? 'Create customer email for hardware process' : 'Kunden-E-Mail für Hardwareprozess erstellen'}
      </Button>

      {emailText && (
        <div className="rounded-xl overflow-hidden" style={{ background: 'rgba(248,248,252,0.98)', border: '1px solid rgba(45,212,191,0.2)' }}>
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-black/6">
            <span className="text-xs font-semibold text-black">{lang === 'en' ? 'Customer email' : 'Kunden-E-Mail'}</span>
            <Button size="sm" onClick={copy} className="h-7 text-xs bg-primary hover:bg-primary/90 text-white">
              <Copy className="w-3 h-3 mr-1.5" />
              {lang === 'en' ? 'Copy' : 'Kopieren'}
            </Button>
          </div>
          <pre className="p-4 text-xs text-black/70 leading-relaxed whitespace-pre-wrap font-sans">{emailText}</pre>
        </div>
      )}
    </div>
  );
}

// ── MAIN ─────────────────────────────────────────────────────

export default function FinalPage() {
  const navigate = useNavigate();
  const session = getSession();
  const settings = getSettings();
  const lang = (settings.emailLanguage || 'de').toLowerCase();
  const ui = getUI(lang);

  const brain = useMemo(
    () => runDecisionEngine(session, session.kbEntry || null, lang),
    [session, lang]
  );

  const steps = session?.steps || [];
  const completed = steps.filter(s => ['solved', 'done'].includes(s.status));
  const failed = steps.filter(s => ['not_solved', 'not_possible'].includes(s.status));
  const skipped = steps.filter(s => ['skipped', 'blocked'].includes(s.status));
  const pending = steps.filter(s => s.status === 'pending');

  const isSolved = session?.status === 'solved';
  const isExhausted = session?.status === 'exhausted';

  const [showEscalation, setShowEscalation] = useState(false);

  return (
    <div style={pageStyle} className="pt-14 pb-16 px-5">
      <div className="max-w-xl mx-auto space-y-4 pt-6">

        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <button
            onClick={() => {
              const resumeIndex = steps.findIndex(s => s.status === 'waiting_customer' || s.status === 'pending');
              if (resumeIndex >= 0) resumeStepFromFinal(steps, resumeIndex, navigate);
              else navigate('/troubleshoot');
            }}
            className="flex items-center gap-1.5 text-sm text-white/30 hover:text-white/60 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {ui.back || 'Back'}
          </button>
          {(session.model || session.device) && (
            <span className="text-[10px] font-bold text-primary/50 tracking-wider uppercase">
              {(session.model || session.device).toUpperCase()}
            </span>
          )}
        </div>

        {/* Status */}
        <div className={`flex items-center gap-2.5 rounded-2xl px-5 py-4 border ${
          isSolved ? 'border-primary/25 bg-primary/[0.05]' : (steps.some(s => s.status === 'waiting_customer') ? 'border-amber-400/25 bg-amber-400/[0.045]' : 'border-secondary/20 bg-secondary/[0.04]')
        }`}>
          {isSolved
            ? <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
            : steps.some(s => s.status === 'waiting_customer')
              ? <Clock className="w-5 h-5 text-amber-400 shrink-0" />
              : <AlertTriangle className="w-5 h-5 text-secondary shrink-0" />
          }
          <div>
            <p className={`text-sm font-semibold ${isSolved ? 'text-primary' : (steps.some(s => s.status === 'waiting_customer') ? 'text-amber-400' : 'text-secondary')}`}>
              {finalStatusText(session, ui, lang)}
            </p>
            <p className="text-[10px] text-white/30 mt-0.5">
              {completed.length} ✓ · {failed.length} ✗ · {steps.filter(s => s.status === 'waiting_customer').length} waiting · {skipped.length} skipped
            </p>
          </div>
        </div>

        <WaitingReplyPanel session={session} steps={steps} lang={lang} navigate={navigate} />

        {/* Step history */}
        <Section title={`${ui.ts_progress || 'Troubleshooting History'} · ${steps.filter(s => s.status !== 'pending').length} steps`}>
          <StepHistoryList steps={steps} lang={lang} onResumeStep={(index) => resumeStepFromFinal(steps, index, navigate)} />
        </Section>

        {/* Email builder */}
        <Section title={ui.customer_email || 'Customer Email'} defaultOpen={true}>
          <EmailBuilder session={session} brain={brain} lang={lang} />
        </Section>

        {/* Case summary */}
        <Section title={ui.case_summary || 'Case Summary'} defaultOpen={false}>
          <LocalCaseSummary session={session} lang={lang} />
        </Section>

        {/* Escalation — always available, dropdown-template based */}
        <Section title={ui.prepare_escalation || 'Escalation / Request'} defaultOpen={false}>
          <EscalationForm steps={steps} kbEntry={session.kbEntry} session={session} />
        </Section>

        {/* Save to KB */}
        <SaveToKBButton session={session} />

        {/* New case */}
        <div className="flex justify-center pt-2">
          <Button onClick={() => navigate('/')} variant="ghost" className="text-white/30 hover:text-white/60">
            <RotateCcw className="w-4 h-4 mr-2" />
            {ui.new_search}
          </Button>
        </div>

        {/* Debug strip */}
        <div className="rounded-xl px-4 py-3 text-[9px] font-mono text-white/15 space-y-0.5"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
          <div>MODE: LOCAL ONLY · AI USED: NO · AI CALLS THIS SESSION: 0</div>
          <div>LANGUAGE: {lang.toUpperCase()} · EMAIL: MODULE-BASED LOCAL ASSEMBLY</div>
          <div>KB MATCH: {session.kbEntry ? session.kbEntry.case_id || 'yes' : 'none'} · MODEL: {session.model || '?'}</div>
          <div>GENERATED FROM LOCAL MODULES: YES · MISSING TRANSLATIONS: {brain.missingInfo?.length > 0 ? 'CHECK' : 'NO'}</div>
        </div>

      </div>
    </div>
  );
}