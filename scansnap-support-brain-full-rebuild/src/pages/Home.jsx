import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, ArrowLeft, Sparkles } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { resetSession, setSession, getSession, updateSettings } from '@/lib/sessionStore';
import { searchKnowledgeBase, getKBEntryInLanguage } from '@/lib/localData';
import { generateNextDynamicStep, classifyIssueCategory } from '@/lib/decisionEngine';
import { detectModelFromText } from '@/lib/modelDetector';
import { getExperienceSteps } from '@/lib/experienceEngine';
import brainNeon from '@/assets/brain-neon.png';

const BRAIN_LABELS = {
  de: 'Weiter', en: 'Next', pt: 'Continuar', es: 'Continuar',
  fr: 'Continuer', it: 'Continua', nl: 'Verder', ja: '次へ',
};

const BRAIN_IMG = brainNeon;

const LANGUAGES = [
  { code: 'de', label: 'Deutsch' },
  { code: 'en', label: 'English' },
  { code: 'pt', label: 'Português' },
  { code: 'es', label: 'Español' },
  { code: 'fr', label: 'Français' },
  { code: 'it', label: 'Italiano' },
  { code: 'nl', label: 'Nederlands' },
  { code: 'ja', label: '日本語' },
];


const CONNECTION_LABELS = {
  de: { USB:'USB', 'Wi-Fi':'WLAN / Wi‑Fi', LAN:'LAN', Cloud:'Cloud', unknown:'Unbekannt' },
  en: { USB:'USB', 'Wi-Fi':'Wi‑Fi', LAN:'LAN', Cloud:'Cloud', unknown:'Unknown' },
  pt: { USB:'USB', 'Wi-Fi':'Wi‑Fi (WLAN)', LAN:'LAN', Cloud:'Cloud', unknown:'Não tenho a certeza' },
  es: { USB:'USB', 'Wi-Fi':'Wi‑Fi (WLAN)', LAN:'LAN', Cloud:'Cloud', unknown:'No estoy seguro/a' },
  fr: { USB:'USB', 'Wi-Fi':'Wi‑Fi (WLAN)', LAN:'LAN', Cloud:'Cloud', unknown:'Je ne suis pas sûr/e' },
  it: { USB:'USB', 'Wi-Fi':'Wi‑Fi (WLAN)', LAN:'LAN', Cloud:'Cloud', unknown:'Non sono sicuro/a' },
  nl: { USB:'USB', 'Wi-Fi':'Wi‑Fi (WLAN)', LAN:'LAN', Cloud:'Cloud', unknown:'Ik weet het niet zeker' },
  ja: { USB:'USB', 'Wi-Fi':'Wi‑Fi（WLAN）', LAN:'LAN', Cloud:'Cloud', unknown:'不明' },
};
function connectionLabel(value, lang) {
  return CONNECTION_LABELS[lang]?.[value] || CONNECTION_LABELS.en[value] || value;
}

const CONNECTION_OPTIONS = [
  { value: 'USB', label: 'USB' },
  { value: 'Wi-Fi', label: 'WLAN / Wi‑Fi' },
  { value: 'LAN', label: 'LAN' },
  { value: 'Cloud', label: 'Cloud' },
  { value: 'unknown', label: 'Unbekannt' },
];

const COPY = {
  de: { hello:'Hallo 👋', nameQuestion:'Wie darf ich dich nennen?', namePlaceholder:'Name', scannerTitle:(n)=>`Hallo ${n||''} 👋`.trim(), scannerQuestion:'Mit welchem Scanner arbeiten wir heute?', scannerPlaceholder:'iX1600', connectionTitle:(n)=>`Danke ${n||''}.`.trim(), connectionQuestion:'Wie ist der Scanner verbunden?', problemTitle:'Verstanden.', problemQuestion:'Was passiert aktuell?', problemPlaceholder:'Beschreibe kurz die Fehlermeldung oder das Verhalten…', ready:(m,c)=>`Ich prüfe ${m||'den Scanner'} über ${c||'die gewählte Verbindung'}.`, analyzing:'Ich prüfe die Wissensdatenbank…', back:'Zurück' },
  en: { hello:'Hello 👋', nameQuestion:'What should I call you?', namePlaceholder:'Name', scannerTitle:(n)=>`Hello ${n||''} 👋`.trim(), scannerQuestion:'Which scanner are we working with today?', scannerPlaceholder:'iX1600', connectionTitle:(n)=>`Thank you ${n||''}.`.trim(), connectionQuestion:'How is the scanner connected?', problemTitle:'Understood.', problemQuestion:'What is happening right now?', problemPlaceholder:'Briefly describe the error message or behavior…', ready:(m,c)=>`I will check ${m||'the scanner'} via ${c||'the selected connection'}.`, analyzing:'Checking the knowledge base…', back:'Back' },
  pt: { hello:'Olá 👋', nameQuestion:'Como posso chamar-te?', namePlaceholder:'Nome', scannerTitle:(n)=>`Olá ${n||''} 👋`.trim(), scannerQuestion:'Com que scanner estamos a trabalhar hoje?', scannerPlaceholder:'iX1600', connectionTitle:(n)=>`Obrigada ${n||''}.`.trim(), connectionQuestion:'Como está o scanner ligado?', problemTitle:'Entendido.', problemQuestion:'O que está a acontecer agora?', problemPlaceholder:'Descreve brevemente a mensagem de erro ou o comportamento…', ready:(m,c)=>`Vou verificar ${m||'o scanner'} via ${c||'a ligação selecionada'}.`, analyzing:'A verificar a base de conhecimento…', back:'Voltar' },
  es: { hello:'Hola 👋', nameQuestion:'¿Cómo debo llamarte?', namePlaceholder:'Nombre', scannerTitle:(n)=>`Hola ${n||''} 👋`.trim(), scannerQuestion:'¿Con qué escáner estamos trabajando hoy?', scannerPlaceholder:'iX1600', connectionTitle:(n)=>`Gracias ${n||''}.`.trim(), connectionQuestion:'¿Cómo está conectado el escáner?', problemTitle:'Entendido.', problemQuestion:'¿Qué ocurre actualmente?', problemPlaceholder:'Describe brevemente el mensaje de error o el comportamiento…', ready:(m,c)=>`Voy a revisar ${m||'el escáner'} mediante ${c||'la conexión seleccionada'}.`, analyzing:'Consultando la base de conocimiento…', back:'Atrás' },
  fr: { hello:'Bonjour 👋', nameQuestion:'Comment puis-je t’appeler ?', namePlaceholder:'Nom', scannerTitle:(n)=>`Bonjour ${n||''} 👋`.trim(), scannerQuestion:'Avec quel scanner travaillons-nous aujourd’hui ?', scannerPlaceholder:'iX1600', connectionTitle:(n)=>`Merci ${n||''}.`.trim(), connectionQuestion:'Comment le scanner est-il connecté ?', problemTitle:'Compris.', problemQuestion:'Que se passe-t-il actuellement ?', problemPlaceholder:'Décris brièvement le message d’erreur ou le comportement…', ready:(m,c)=>`Je vais vérifier ${m||'le scanner'} via ${c||'la connexion sélectionnée'}.`, analyzing:'Consultation de la base de connaissances…', back:'Retour' },
  it: { hello:'Ciao 👋', nameQuestion:'Come posso chiamarti?', namePlaceholder:'Nome', scannerTitle:(n)=>`Ciao ${n||''} 👋`.trim(), scannerQuestion:'Con quale scanner stiamo lavorando oggi?', scannerPlaceholder:'iX1600', connectionTitle:(n)=>`Grazie ${n||''}.`.trim(), connectionQuestion:'Come è collegato lo scanner?', problemTitle:'Capito.', problemQuestion:'Che cosa sta succedendo ora?', problemPlaceholder:'Descrivi brevemente il messaggio di errore o il comportamento…', ready:(m,c)=>`Controllerò ${m||'lo scanner'} tramite ${c||'la connessione selezionata'}.`, analyzing:'Consulto la knowledge base…', back:'Indietro' },
  nl: { hello:'Hallo 👋', nameQuestion:'Hoe mag ik je noemen?', namePlaceholder:'Naam', scannerTitle:(n)=>`Hallo ${n||''} 👋`.trim(), scannerQuestion:'Met welke scanner werken we vandaag?', scannerPlaceholder:'iX1600', connectionTitle:(n)=>`Dank je ${n||''}.`.trim(), connectionQuestion:'Hoe is de scanner verbonden?', problemTitle:'Begrepen.', problemQuestion:'Wat gebeurt er op dit moment?', problemPlaceholder:'Beschrijf kort de foutmelding of het gedrag…', ready:(m,c)=>`Ik controleer ${m||'de scanner'} via ${c||'de geselecteerde verbinding'}.`, analyzing:'Kennisbank wordt gecontroleerd…', back:'Terug' },
  ja: { hello:'こんにちは 👋', nameQuestion:'どのようにお呼びすればよいですか？', namePlaceholder:'名前', scannerTitle:(n)=>`こんにちは ${n||''} 👋`.trim(), scannerQuestion:'今日はどのスキャナーを確認しますか？', scannerPlaceholder:'iX1600', connectionTitle:(n)=>`${n||''}、ありがとうございます。`.trim(), connectionQuestion:'スキャナーはどのように接続されていますか？', problemTitle:'承知しました。', problemQuestion:'現在どのような問題が発生していますか？', problemPlaceholder:'エラーメッセージや動作を簡単に入力してください…', ready:(m,c)=>`${m||'スキャナー'} を ${c||'選択された接続'} で確認します。`, analyzing:'ナレッジベースを確認しています…', back:'戻る' },
};

function tx(lang, key, ...args) {
  const dict = COPY[lang] || COPY.de;
  const value = dict[key] || COPY.de[key] || key;
  return typeof value === 'function' ? value(...args) : value;
}

function fieldWidthForStep(step) {
  if (step === 0) return '220px';
  if (step === 1) return '260px';
  return '100%';
}

function normalizeModelInput(value) {
  return (value || '').trim().replace(/^ix/i, 'iX');
}

const SUPPORT_PATHS = {
  SMART_ERROR5_CONTEXT: [
    { title: 'Fehlercode -5 einordnen', instruction: 'Tritt der Fehler bei USB, WLAN oder nach einem Firmwareupdate auf?', difficulty: 'easy', route: 'SMART_ERROR5_CONTEXT', order: 1 }
  ],
  USB_CONNECTION: [
    { title: 'Direkte USB-Verbindung prüfen', instruction: 'Verbinden Sie den Scanner direkt mit dem Computer. Verwenden Sie keinen USB-Hub, keine Dockingstation und kein Verlängerungskabel. Testen Sie anschließend erneut, ob ScanSnap Home den Scanner erkennt.', difficulty: 'easy', route: 'USB_CONNECTION', order: 1 },
    { title: 'Anderen USB-Anschluss und anderes USB-Kabel testen', instruction: 'Testen Sie einen anderen USB-Anschluss am Computer, vorzugsweise direkt am Gerät. Wenn möglich, testen Sie zusätzlich ein anderes USB-Kabel, um Kabel- oder Portprobleme auszuschließen.', difficulty: 'easy', route: 'USB_CONNECTION', order: 2 },
    { title: 'Prüfen, ob der Scanner im Windows-Geräte-Manager sichtbar ist', instruction: 'Öffnen Sie den Geräte-Manager und prüfen Sie, ob der Scanner, ein unbekanntes Gerät oder ein USB-Gerät mit Warnsymbol angezeigt wird. Notieren Sie bitte, wie der Scanner dort erscheint.', difficulty: 'medium', route: 'USB_CONNECTION', order: 3 },
    { title: 'Scanner in ScanSnap Home entfernen und erneut verbinden', instruction: 'Entfernen Sie den Scanner in ScanSnap Home aus der Scannerliste und verbinden Sie ihn danach erneut per direktem USB-Anschluss. Starten Sie anschließend Scanner und Computer neu und testen Sie erneut.', difficulty: 'medium', route: 'USB_CONNECTION', order: 4 },
    { title: 'ScanSnap Home bereinigen und neu installieren', instruction: 'Wenn der Scanner weiterhin nicht erkannt wird, führen Sie eine saubere Bereinigung von ScanSnap Home durch, starten Sie den Computer neu und installieren Sie anschließend die aktuelle Version mit Administratorrechten.', difficulty: 'medium', route: 'USB_CONNECTION', order: 5 },
    { title: 'Windows-Systemintegrität prüfen (SFC/DISM)', instruction: 'Erst wenn USB-Anschluss, Kabel, Geräte-Manager und ScanSnap Home als Ursache weitgehend ausgeschlossen wurden, prüfen Sie die Windows-Systemintegrität mit SFC und DISM. Dieser Schritt ist ein später Windows-Reparaturschritt, nicht der erste USB-Test.', difficulty: 'advanced', route: 'USB_CONNECTION', order: 6 }
  ],
  WIFI_CONNECTION: [
    { title: 'WLAN-Status am Scanner prüfen', instruction: 'Prüfen Sie zuerst, ob der Scanner mit dem WLAN verbunden ist und ob am Scanner ein WLAN-Status bzw. eine Verbindung angezeigt wird.', difficulty: 'easy', route: 'WIFI_CONNECTION', order: 1 },
    { title: 'Scanner und Computer im selben Netzwerk prüfen', instruction: 'Stellen Sie sicher, dass Scanner und Computer im selben Netzwerk bzw. Subnetz sind. Prüfen Sie bei Bedarf die IP-Adresse des Scanners.', difficulty: 'medium', route: 'WIFI_CONNECTION', order: 2 },
    { title: 'Router / 2,4-GHz-Netzwerk prüfen', instruction: 'Prüfen Sie Routereinstellungen wie 2,4 GHz, Band Steering, Client Isolation und Firewall-Regeln. Starten Sie Router, Scanner und Computer anschließend neu.', difficulty: 'medium', route: 'WIFI_CONNECTION', order: 3 },
    { title: 'Hotspot- oder Direktverbindungstest durchführen', instruction: 'Testen Sie den Scanner in einem einfachen alternativen Netzwerk, z. B. über einen mobilen Hotspot oder Direktverbindungsmodus, um Router- oder Netzwerkeinflüsse auszuschließen.', difficulty: 'medium', route: 'WIFI_CONNECTION', order: 4 }
  ],
  FIRMWARE_USB: [
    { title: 'Direkte USB-Verbindung für Firmwareprüfung sicherstellen', instruction: 'Stellen Sie sicher, dass der Scanner direkt per USB mit dem Computer verbunden ist. Firmwareprüfungen oder Firmwareupdates sollten nicht über WLAN durchgeführt werden.', difficulty: 'easy', route: 'FIRMWARE_USB', order: 1 },
    { title: 'Startzustand des Scanners prüfen', instruction: 'Prüfen Sie, ob der Scanner normal startet, auf einem Logo hängen bleibt oder eine Fehlermeldung/LED-Anzeige zeigt. Dieses Ergebnis entscheidet, ob ein normaler Firmwareupdate-Pfad oder Recovery-Pfad sinnvoll ist.', difficulty: 'easy', route: 'FIRMWARE_USB', order: 2 },
    { title: 'Firmwareupdate über ScanSnap Home prüfen', instruction: 'Wenn der Scanner normal startet und erkannt wird, prüfen Sie in ScanSnap Home unter Scanner-Informationen, ob ein Firmwareupdate angeboten wird. Führen Sie es nur über direkte USB-Verbindung aus.', difficulty: 'medium', route: 'FIRMWARE_USB', order: 3 },
    { title: 'ScanSnap Home bereinigen und neu installieren', instruction: 'Wenn das Firmwareupdate nicht korrekt abgeschlossen wird oder wiederholt angeboten wird, bereinigen Sie ScanSnap Home vollständig und installieren Sie es anschließend neu.', difficulty: 'medium', route: 'FIRMWARE_USB', order: 4 },
    { title: 'Firmware-Recovery nur bei bestätigtem Recovery-Zustand vorbereiten', instruction: 'Ein Firmware-Recovery-Schritt sollte erst erfolgen, wenn der Startzustand und die USB-Erkennung geprüft wurden und die Symptome zu einem Recovery-Fall passen.', difficulty: 'advanced', route: 'FIRMWARE_USB', order: 5 }
  ],
  OCR_ERROR: [
    { title: 'Testscan ohne OCR durchführen', instruction: 'Führen Sie zuerst einen Testscan ohne OCR/Texterkennung durch. So lässt sich prüfen, ob der Fehler im Scanprozess selbst oder im OCR-/Image-Processing liegt.', difficulty: 'easy', route: 'OCR_ERROR', order: 1 },
    { title: 'ScanSnap Home Cache und temporäre Dateien bereinigen', instruction: 'Schließen Sie ScanSnap Home und bereinigen Sie Cache-, Temp- und Image-Processing-Dateien. Starten Sie danach den Computer neu und testen Sie erneut.', difficulty: 'medium', route: 'OCR_ERROR', order: 2 },
    { title: 'OCR erneut mit kleinem Testdokument prüfen', instruction: 'Aktivieren Sie OCR wieder und testen Sie zunächst mit einem kleinen einfachen Dokument. Wenn nur OCR fehlschlägt, wird der OCR-/Kofax-Pfad weiter geprüft.', difficulty: 'medium', route: 'OCR_ERROR', order: 3 }
  ]
};


const ROUTE_STEP_TRANSLATIONS = {
  SMART_ERROR5_CONTEXT_1: {
    de:['Fehlercode -5 einordnen','Tritt der Fehler bei USB, WLAN oder nach einem Firmwareupdate auf?'],
    en:['Clarify error code -5','Does the error occur via USB, Wi‑Fi, or after a firmware update?'],
    pt:['Clarificar o erro -5','O erro ocorre por USB, Wi‑Fi ou após uma atualização de firmware?'],
    es:['Aclarar el error -5','¿El error ocurre por USB, Wi‑Fi o después de una actualización de firmware?'],
    fr:['Clarifier l’erreur -5','L’erreur apparaît-elle via USB, Wi‑Fi ou après une mise à jour firmware ?'],
    it:['Chiarire l’errore -5','L’errore si presenta via USB, Wi‑Fi o dopo un aggiornamento firmware?'],
    nl:['Foutcode -5 verduidelijken','Treedt de fout op via USB, Wi‑Fi of na een firmware-update?'],
    ja:['エラーコード -5 の状況を確認','USB、Wi‑Fi、またはファームウェア更新後に発生しますか？']
  },
  USB_CONNECTION_1:{de:['Direkte USB-Verbindung prüfen','Scanner direkt am Computer anschließen, ohne Hub, Dockingstation oder Verlängerung. Danach ScanSnap Home erneut prüfen.'],en:['Check direct USB connection','Connect the scanner directly to the computer without hub, dock, or extension cable. Then check ScanSnap Home again.'],pt:['Verificar USB direto','Liga o scanner diretamente ao computador, sem hub, dock ou extensão. Depois verifica o ScanSnap Home novamente.'],es:['Comprobar USB directo','Conecta el escáner directamente al ordenador, sin hub, dock ni alargador. Después comprueba ScanSnap Home otra vez.'],fr:['Vérifier l’USB direct','Connecte le scanner directement à l’ordinateur, sans hub, dock ni rallonge. Vérifie ensuite ScanSnap Home.'],it:['Controllare USB diretto','Collega lo scanner direttamente al computer, senza hub, dock o prolunga. Poi controlla ScanSnap Home.'],nl:['Directe USB controleren','Sluit de scanner rechtstreeks aan op de computer, zonder hub, dock of verlengkabel. Controleer daarna ScanSnap Home.'],ja:['USB直接接続を確認','スキャナーをPCに直接USB接続してください。ハブ、ドック、延長ケーブルは使わず、その後ScanSnap Homeを確認してください。']},
  USB_CONNECTION_2:{de:['Anderen USB-Anschluss und anderes USB-Kabel testen','Anderen USB-Port testen und, wenn möglich, ein anderes USB-Kabel verwenden.'],en:['Test another USB port and cable','Try another USB port and, if possible, another USB cable.'],pt:['Testar outra porta e cabo USB','Testa outra porta USB e, se possível, outro cabo USB.'],es:['Probar otro puerto y cable USB','Prueba otro puerto USB y, si es posible, otro cable USB.'],fr:['Tester un autre port et câble USB','Essaie un autre port USB et, si possible, un autre câble USB.'],it:['Provare altra porta e cavo USB','Prova un’altra porta USB e, se possibile, un altro cavo USB.'],nl:['Andere USB-poort en kabel testen','Probeer een andere USB-poort en indien mogelijk een andere USB-kabel.'],ja:['別のUSBポートとケーブルを確認','別のUSBポートを試し、可能であれば別のUSBケーブルも使用してください。']},
  USB_CONNECTION_3:{de:['Geräte-Manager-Erkennung prüfen','Im Windows-Geräte-Manager prüfen, ob der Scanner, ein unbekanntes Gerät oder ein USB-Gerät mit Warnsymbol erscheint.'],en:['Check Device Manager detection','Check Windows Device Manager for the scanner, an unknown device, or a USB device with warning symbol.'],pt:['Verificar no Gestor de Dispositivos','Verifica no Gestor de Dispositivos se aparece o scanner, um dispositivo desconhecido ou USB com aviso.'],es:['Comprobar en Administrador de dispositivos','Comprueba si aparece el escáner, un dispositivo desconocido o USB con advertencia.'],fr:['Vérifier dans le Gestionnaire de périphériques','Vérifie si le scanner, un périphérique inconnu ou USB avec avertissement apparaît.'],it:['Controllare in Gestione dispositivi','Verifica se compare lo scanner, un dispositivo sconosciuto o USB con avviso.'],nl:['Apparaatbeheer controleren','Controleer of de scanner, een onbekend apparaat of USB-apparaat met waarschuwing zichtbaar is.'],ja:['デバイスマネージャーで確認','スキャナー、不明なデバイス、または警告付きUSBデバイスが表示されるか確認してください。']},
  USB_CONNECTION_4:{de:['Scanner in ScanSnap Home entfernen und erneut verbinden','Scanner aus ScanSnap Home entfernen und danach erneut per direktem USB verbinden.'],en:['Remove and reconnect scanner in ScanSnap Home','Remove the scanner from ScanSnap Home and reconnect it via direct USB.'],pt:['Remover e voltar a ligar no ScanSnap Home','Remove o scanner do ScanSnap Home e volta a ligá-lo por USB direto.'],es:['Eliminar y reconectar en ScanSnap Home','Elimina el escáner en ScanSnap Home y vuelve a conectarlo por USB directo.'],fr:['Supprimer et reconnecter dans ScanSnap Home','Supprime le scanner dans ScanSnap Home puis reconnecte-le en USB direct.'],it:['Rimuovere e ricollegare in ScanSnap Home','Rimuovi lo scanner da ScanSnap Home e ricollegalo via USB diretto.'],nl:['Scanner verwijderen en opnieuw verbinden','Verwijder de scanner uit ScanSnap Home en verbind opnieuw via directe USB.'],ja:['ScanSnap Homeで削除して再接続','ScanSnap Homeからスキャナーを削除し、USB直接接続で再接続してください。']},
  USB_CONNECTION_5:{de:['ScanSnap Home bereinigen und neu installieren','ScanSnap Home vollständig bereinigen, Computer neu starten und aktuelle Version mit Administratorrechten installieren.'],en:['Clean up and reinstall ScanSnap Home','Fully clean ScanSnap Home, restart the computer, and install the latest version with administrator rights.'],pt:['Limpar e reinstalar ScanSnap Home','Limpa completamente o ScanSnap Home, reinicia o computador e instala a versão atual como administrador.'],es:['Limpiar y reinstalar ScanSnap Home','Limpia ScanSnap Home completamente, reinicia el ordenador e instala la versión actual como administrador.'],fr:['Nettoyer et réinstaller ScanSnap Home','Nettoie complètement ScanSnap Home, redémarre l’ordinateur et installe la version actuelle comme administrateur.'],it:['Pulire e reinstallare ScanSnap Home','Pulisci completamente ScanSnap Home, riavvia il computer e installa la versione attuale come amministratore.'],nl:['ScanSnap Home opschonen en opnieuw installeren','Schoon ScanSnap Home volledig op, herstart de computer en installeer de nieuwste versie als administrator.'],ja:['ScanSnap Homeをクリーンアップして再インストール','ScanSnap Homeを完全にクリーンアップし、PCを再起動して最新版を管理者権限でインストールしてください。']},
  USB_CONNECTION_6:{de:['Windows-Systemintegrität prüfen (SFC/DISM)','Erst nach USB-, Geräte-Manager- und ScanSnap-Home-Prüfung SFC/DISM ausführen.'],en:['Check Windows system integrity (SFC/DISM)','Run SFC/DISM only after USB, Device Manager, and ScanSnap Home checks.'],pt:['Verificar integridade do Windows (SFC/DISM)','Executa SFC/DISM só depois das verificações USB, Gestor de Dispositivos e ScanSnap Home.'],es:['Comprobar Windows (SFC/DISM)','Ejecuta SFC/DISM solo después de comprobar USB, Administrador de dispositivos y ScanSnap Home.'],fr:['Vérifier Windows (SFC/DISM)','Lance SFC/DISM seulement après les contrôles USB, Gestionnaire de périphériques et ScanSnap Home.'],it:['Verificare Windows (SFC/DISM)','Esegui SFC/DISM solo dopo controlli USB, Gestione dispositivi e ScanSnap Home.'],nl:['Windows controleren (SFC/DISM)','Voer SFC/DISM pas uit na USB-, Apparaatbeheer- en ScanSnap Home-controles.'],ja:['Windows整合性を確認（SFC/DISM）','USB、デバイスマネージャー、ScanSnap Home確認後にのみSFC/DISMを実行してください。']}
};

function localizeRouteStep(step, key, lang) {
  const pair = ROUTE_STEP_TRANSLATIONS[key]?.[lang] || ROUTE_STEP_TRANSLATIONS[key]?.en;
  return pair ? { ...step, stepId: key, title: pair[0], instruction: pair[1], smartQuestion: null } : { ...step, stepId: key, smartQuestion: null };
}

function detectSupportPath({ connectionType, problem, model }) {
  const text = `${problem || ''} ${model || ''}`.toLowerCase();
  const connection = String(connectionType || '').toLowerCase();

  const isError5 = /(?:fehler(?:code)?|error(?: code)?|code)?\s*-5\b|\b-5\b/.test(text);
  const hasFirmwareWords = /firmware|recovery|fw|firmwareupdate|firmware-update|update fehlgeschlagen|update failed|firmware.*failed|firmware.*abgebrochen|firmware.*hängt|standalone/.test(text);
  const hasUsbProblem = /usb|verbindung|connect|not detected|nicht erkannt|erkannt|disconnect|kommunikation|0x80211001/.test(text);
  const hasWifi = /wlan|wi-fi|wifi|router|cloud|netzwerk|network|ip|dhcp|wireless/.test(text);
  const hasOcr = /ocr|texterkennung|recognition|image processing|-6|erkennung/.test(text);

  if (hasOcr) return 'OCR_ERROR';
  if (isError5) {
    if (hasFirmwareWords && connection === 'usb') return 'FIRMWARE_USB';
    if (connection === 'usb') return 'USB_CONNECTION';
    if (connection === 'wi-fi' || connection === 'wifi' || connection === 'wlan' || hasWifi) return 'WIFI_CONNECTION';
    if (hasFirmwareWords) return 'FIRMWARE_USB';
    return 'SMART_ERROR5_CONTEXT';
  }
  if (hasFirmwareWords && connection === 'usb') return 'FIRMWARE_USB';
  if (connection === 'usb' && hasUsbProblem) return 'USB_CONNECTION';
  if ((connection === 'wi-fi' || connection === 'wlan' || connection === 'wifi') || hasWifi) return 'WIFI_CONNECTION';
  if (hasFirmwareWords) return 'FIRMWARE_USB';
  if (connection === 'usb') return 'USB_CONNECTION';
  return null;
}


function isPlainError5Case(problem) {
  const text = String(problem || '').toLowerCase();
  const isError5 = /(?:fehler(?:code)?|error(?: code)?|code)?\s*-5\b|\b-5\b/.test(text);
  const hasFirmwareContext = /firmware|recovery|fw|firmwareupdate|firmware-update|update fehlgeschlagen|update failed|firmware.*failed|firmware.*abgebrochen|firmware.*hängt|standalone/.test(text);
  return isError5 && !hasFirmwareContext;
}

function forcePathBeforeKnowledgeBase({ connectionType, problem }) {
  const connection = String(connectionType || '').toLowerCase();
  const text = String(problem || '').toLowerCase();

  if (isPlainError5Case(text)) {
    if (connection === 'usb') return 'USB_CONNECTION';
    if (connection === 'wi-fi' || connection === 'wifi' || connection === 'wlan') return 'WIFI_CONNECTION';
    if (/wlan|wi-fi|wifi|router|netzwerk|network|ip|dhcp|cloud/.test(text)) return 'WIFI_CONNECTION';
    return 'SMART_ERROR5_CONTEXT';
  }

  return null;
}

function makePathSteps(pathKey, lang = 'de') {
  return (SUPPORT_PATHS[pathKey] || []).map(step => {
    const key = `${pathKey}_${step.order || 1}`;
    return {
      ...localizeRouteStep(step, key, lang),
      status: 'pending',
      result: '',
      note: '',
      timestamp: null,
      source: 'daily_flow_route',
    };
  });
}


function background() {
  return `
    radial-gradient(circle at 50% 58%, rgba(65,80,210,0.22) 0%, transparent 24%),
    radial-gradient(circle at 14% 70%, rgba(0,245,255,0.28) 0%, transparent 31%),
    radial-gradient(circle at 86% 62%, rgba(255,42,191,0.30) 0%, transparent 35%),
    linear-gradient(135deg, #01040a 0%, #060717 42%, #090716 66%, #120310 100%)
  `;
}

function ProgressDots({ step }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-5">
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className={`rounded-full transition-all duration-300 ${i === step ? 'w-8 h-2 bg-fuchsia-400' : i < step ? 'w-2 h-2 bg-cyan-300/70' : 'w-2 h-2 bg-white/15'}`}
        />
      ))}
    </div>
  );
}

function BrainButton({ active, disabled, analyzing, onClick, language = 'de' }) {
  return (
    <motion.button
      type="button"
      aria-label={analyzing ? (language === 'en' ? 'Checking' : 'Prüfe') : (BRAIN_LABELS[language] || BRAIN_LABELS.en)}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className="flex flex-col items-center justify-center border-0 bg-transparent p-0 mx-auto select-none"
      style={{ marginTop: -4, cursor: disabled ? 'default' : 'pointer' }}
      animate={{ y: [0, -6, 0], scale: active ? [1, 1.012, 1] : [1, 1.004, 1] }}
      transition={{ duration: 4.8, repeat: Infinity, ease: 'easeInOut' }}
      whileHover={!disabled ? { scale: 1.025 } : {}}
      whileTap={!disabled ? { scale: 0.97 } : {}}
    >
      <img src={BRAIN_IMG} alt="Support Brain" style={{
          width: 'min(780px, 88vw)', height: 'auto', objectFit: 'contain', mixBlendMode: 'screen',
          opacity: active ? 0.98 : 0.64,
          WebkitMaskImage: 'radial-gradient(ellipse at center, black 0%, black 58%, rgba(0,0,0,0.76) 70%, transparent 96%)',
          maskImage: 'radial-gradient(ellipse at center, black 0%, black 58%, rgba(0,0,0,0.76) 70%, transparent 96%)',
          filter: active ? 'drop-shadow(0 0 30px rgba(0,245,255,0.72)) drop-shadow(0 0 54px rgba(255,42,191,0.72)) drop-shadow(0 0 105px rgba(120,95,255,0.30))' : 'drop-shadow(0 0 16px rgba(0,245,255,0.30)) drop-shadow(0 0 24px rgba(255,42,191,0.24))',
          transition: 'opacity 0.35s ease, filter 0.35s ease, transform 0.35s ease'
        }} />
    </motion.button>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const existingSession = getSession();

  const [language, setLanguage] = useState(existingSession.settings?.emailLanguage || 'de');
  const [step, setStep] = useState(0);
  const [analyzing, setAnalyzing] = useState(false);
  const [supporterName, setSupporterName] = useState(existingSession.supporterName || '');
  const [model, setModel] = useState(existingSession.model || '');
  const [connectionType, setConnectionType] = useState(existingSession.connectionType && existingSession.connectionType !== 'unknown' ? existingSession.connectionType : '');
  const [problem, setProblem] = useState(existingSession.problem || '');

  const detected = useMemo(() => detectModelFromText(`${model} ${problem}`), [model, problem]);
  const modelValue = normalizeModelInput(model || detected.detected || '');

  const currentValid =
    step === 0 ? supporterName.trim().length > 0 :
    step === 1 ? modelValue.trim().length > 1 :
    step === 2 ? !!connectionType :
    problem.trim().length > 3;

  const readyForAnalysis = supporterName.trim() && modelValue.trim() && connectionType && problem.trim().length > 3;

  const handleLanguage = (value) => {
    setLanguage(value);
    updateSettings({ emailLanguage: value });
  };

  const goBack = () => setStep((s) => Math.max(0, s - 1));

  const continueOrAnalyze = () => {
    if (!currentValid || analyzing) return;
    if (step < 3) {
      setStep((s) => s + 1);
      return;
    }
    handleAnalyze();
  };

  const buildSeedSteps = (topEntry, detectedModel, enrichedProblem) => {
    const forcedPath = forcePathBeforeKnowledgeBase({
      connectionType,
      problem: problem.trim(),
    });

    const pathKey = forcedPath || detectSupportPath({
      connectionType,
      problem: problem.trim(),
      model: detectedModel,
    });

    let seedSteps = pathKey ? makePathSteps(pathKey, language) : [];
    const hardLockError5 = !!forcedPath;

    if (topEntry && !hardLockError5) {
      const localized = getKBEntryInLanguage(topEntry, language);
      const kbSteps = (localized.solution_steps || []).map((s) => ({
        title: typeof s === 'string' ? s : s.title,
        instruction: typeof s === 'string' ? s : (s.instruction || s.title),
        difficulty: s.difficulty || 'medium',
        status: 'pending',
        result: '',
        note: '',
        timestamp: null,
        source: 'knowledge_base',
      }));

      const existingTitles = new Set(seedSteps.map(s => (s.title || '').toLowerCase()));
      const filteredKb = kbSteps.filter(s => {
        const title = (s.title || '').toLowerCase();
        const instruction = (s.instruction || '').toLowerCase();
        if (pathKey === 'USB_CONNECTION' && /sfc|dism|systemintegrität|windows-system/.test(title + ' ' + instruction)) return false;
        return !existingTitles.has(title);
      });

      seedSteps = [...seedSteps, ...filteredKb].slice(0, 7);
    }

    if (hardLockError5 && seedSteps.length > 0) {
      return seedSteps.slice(0, 7);
    }

    if (seedSteps.length === 0) {
      const tempSession = {
        problem: problem.trim(),
        steps: [],
        model: detectedModel,
        device: detectedModel,
        connectionType: connectionType || 'unknown',
        os: '',
      };
      const dynamicSteps = [];
      let nextStep = generateNextDynamicStep(tempSession, topEntry);
      while (nextStep && dynamicSteps.length < 5) {
        dynamicSteps.push({ ...nextStep, status: 'pending', result: '', note: '', timestamp: null, source: 'decision_engine' });
        nextStep = generateNextDynamicStep({ ...tempSession, steps: dynamicSteps }, topEntry);
      }
      seedSteps = dynamicSteps;
    }

    const contextSession = {
      model: detectedModel,
      device: detectedModel,
      connectionType,
      problem: problem.trim(),
      issueType: classifyIssueCategory(enrichedProblem, topEntry),
    };

    const experienceSteps = getExperienceSteps(contextSession, 2);
    const existingTitles = new Set(seedSteps.map((s) => (s.title || '').toLowerCase()));

    const uniqueExperience = experienceSteps.filter((s) => {
      const title = (s.title || '').toLowerCase();
      const instruction = (s.instruction || '').toLowerCase();
      if (existingTitles.has(title)) return false;
      if (pathKey === 'USB_CONNECTION' && /sfc|dism|systemintegrität|windows-system/.test(title + ' ' + instruction)) return false;
      return true;
    });

    if (pathKey && seedSteps.length > 2) {
      return [...seedSteps.slice(0, 2), ...uniqueExperience, ...seedSteps.slice(2)].slice(0, 8);
    }

    return [...uniqueExperience, ...seedSteps].slice(0, 7);
  };

  const handleAnalyze = () => {
    if (!readyForAnalysis || analyzing) return;
    setAnalyzing(true);
    updateSettings({ emailLanguage: language });

    const detectedModel = modelValue;
    const enrichedProblem = [detectedModel, connectionType, problem.trim()].filter(Boolean).join(' ');
    const plainError5 = isPlainError5Case(problem.trim());
    const kbResults = plainError5 ? [] : searchKnowledgeBase(enrichedProblem, detectedModel, '');
    const topEntry = kbResults[0] || null;
    const issueType = plainError5
      ? (connectionType === 'Wi-Fi' ? 'network' : connectionType === 'USB' ? 'usb' : 'unknown')
      : classifyIssueCategory(enrichedProblem, topEntry);
    const seedSteps = buildSeedSteps(topEntry, detectedModel, enrichedProblem);

    resetSession();
    setSession({
      supporterName: supporterName.trim(),
      problem: problem.trim(),
      knownFacts: {
        supporterName: supporterName.trim(),
        model: detectedModel,
        connectionType,
      },
      model: detectedModel,
      device: detectedModel,
      connectionType: connectionType || 'unknown',
      requestAi: false,
      status: 'troubleshooting',
      issueType,
      kbResults,
      kbEntry: topEntry,
      steps: seedSteps,
      performedSteps: [],
      missingInformation: [],
      currentStepIndex: 0,
      conversationMode: true,
    });

    setTimeout(() => navigate('/troubleshoot'), 650);
  };

  const cardStyle = {
    width: 'min(680px, calc(100vw - 36px))',
    borderRadius: 24,
    background: 'linear-gradient(135deg, rgba(8,16,35,0.78), rgba(25,10,35,0.72))',
    border: '1.5px solid rgba(0,245,230,0.55)',
    borderRight: '1.5px solid rgba(255,45,170,0.62)',
    backdropFilter: 'blur(28px)',
    WebkitBackdropFilter: 'blur(28px)',
    boxShadow: '0 0 38px rgba(0,245,230,0.18), 0 0 52px rgba(255,45,170,0.18), inset 0 1px 0 rgba(255,255,255,0.12)',
    padding: '30px 34px',
    color: 'rgba(255,255,255,0.92)',
  };

  const inputStyle = {
    width: '100%',
    height: 54,
    borderRadius: 18,
    border: '1px solid rgba(0,245,230,0.35)',
    background: 'rgba(3,8,18,0.42)',
    color: 'rgba(255,255,255,0.92)',
    outline: 'none',
    padding: '0 18px',
    fontSize: 15,
    boxShadow: 'inset 0 0 0 1px rgba(255,45,170,0.08)',
  };

  const title = step === 0 ? tx(language, 'hello')
    : step === 1 ? tx(language, 'scannerTitle', supporterName.trim())
    : step === 2 ? tx(language, 'connectionTitle', supporterName.trim())
    : tx(language, 'problemTitle');

  const question = step === 0 ? tx(language, 'nameQuestion')
    : step === 1 ? tx(language, 'scannerQuestion')
    : step === 2 ? tx(language, 'connectionQuestion')
    : tx(language, 'problemQuestion');

  return (
    <div style={{ minHeight: '100vh', width: '100%', overflow: 'hidden', position: 'relative', background: background() }}>
      <div style={{ position: 'absolute', inset: 0, zIndex: 1, background: 'radial-gradient(ellipse at 50% 75%, rgba(30,20,80,0.6) 0%, transparent 60%)', pointerEvents: 'none' }} />

      <div style={{ position: 'relative', zIndex: 2, minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ marginTop: '3vh' }}>
          <Select value={language} onValueChange={handleLanguage}>
            <SelectTrigger className="focus:ring-0 focus:ring-offset-0" style={{
              width: 230, height: 58, borderRadius: 999, background: 'rgba(3,8,18,0.52)',
              border: '1.5px solid rgba(0,245,230,0.7)', backdropFilter: 'blur(18px)', color: 'rgba(255,255,255,0.92)',
              fontSize: '0.95rem', fontWeight: 500, paddingLeft: 22, paddingRight: 20,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10
            }}>
              <Globe style={{ width: 16, height: 16, opacity: 0.6, flexShrink: 0 }} />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LANGUAGES.map((l) => <SelectItem key={l.code} value={l.code}>{l.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} style={{ marginTop: '5vh', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <ProgressDots step={step} />

          <div style={cardStyle}>
            {step > 0 && (
              <button
                type="button"
                onClick={goBack}
                className="mb-3 flex items-center gap-1.5 text-xs text-cyan-200/70 hover:text-cyan-100/90 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                {tx(language, 'back')}
              </button>
            )}

            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 18 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -18 }}
                transition={{ duration: 0.25 }}
                className="space-y-5"
              >
                <div>
                  <h2 className="text-2xl font-semibold leading-tight">{title}</h2>
                  <p className="text-lg text-white/70 mt-2">{question}</p>
                </div>

                {step === 0 && (
                  <input
                    style={{ ...inputStyle, width: fieldWidthForStep(0), display: 'block', margin: '0 auto' }}
                    value={supporterName}
                    onChange={(e) => setSupporterName(e.target.value)}
                    placeholder={tx(language, 'namePlaceholder')}
                    autoFocus
                    onKeyDown={(e) => { if (e.key === 'Enter') continueOrAnalyze(); }}
                  />
                )}

                {step === 1 && (
                  <input
                    style={{ ...inputStyle, width: fieldWidthForStep(1), display: 'block', margin: '0 auto' }}
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    placeholder={tx(language, 'scannerPlaceholder')}
                    autoFocus
                    onKeyDown={(e) => { if (e.key === 'Enter') continueOrAnalyze(); }}
                  />
                )}

                {step === 2 && (
                  <div className="grid grid-cols-2 gap-3">
                    {CONNECTION_OPTIONS.map((c) => (
                      <button
                        key={c.value}
                        onClick={() => setConnectionType(c.value)}
                        className={`rounded-2xl px-4 py-4 text-sm text-center transition-all ${connectionType === c.value ? 'bg-fuchsia-500/18 border-fuchsia-400/70 text-white shadow-[0_0_28px_rgba(255,45,170,0.22)]' : 'bg-black/20 border-cyan-300/18 text-white/76 hover:bg-cyan-400/8 hover:border-cyan-300/45'}`}
                        style={{ borderWidth: 1 }}
                      >
                        {connectionLabel(c.value, language)}
                      </button>
                    ))}
                  </div>
                )}

                {step === 3 && (
                  <>
                    <textarea
                      value={problem}
                      onChange={(e) => setProblem(e.target.value)}
                      placeholder={tx(language, 'problemPlaceholder')}
                      style={{ ...inputStyle, height: 96, padding: '14px', resize: 'none', lineHeight: 1.5 }}
                      onKeyDown={(e) => { if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') continueOrAnalyze(); }}
                      autoFocus
                    />
                    <p className="text-xs text-cyan-200/70">
                      {analyzing ? tx(language, 'analyzing') : tx(language, 'ready', modelValue, connectionType)}
                    </p>
                  </>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          <BrainButton
            language={language}
            active={currentValid || analyzing}
            disabled={!currentValid || analyzing}
            analyzing={analyzing}
            onClick={continueOrAnalyze}
          />
          <p className="text-center text-white/72 text-sm -mt-10 leading-relaxed">
            <span className="text-cyan-300 drop-shadow-[0_0_8px_rgba(0,245,255,0.75)]">✦</span> Dein Support. Intelligenter.<br />
            <span className="text-white/60">Schneller zur Lösung.</span>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
