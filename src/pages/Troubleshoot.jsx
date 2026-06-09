import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import BrainPanel from '@/components/troubleshoot/BrainPanel';
import { getSession, setSession, getSettings } from '@/lib/sessionStore';
import { generateNextDynamicStep, runDecisionEngine } from '@/lib/decisionEngine';
import { playAction, playSuccess } from '@/lib/sounds';
import { base44 } from '@/api/base44Client';
import { ArrowLeft, History, SlidersHorizontal, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getUI } from '@/lib/uiTranslations';
import { recordSuccessfulStep } from '@/lib/experienceEngine';
import brainNeon from '@/assets/brain-neon.png';

const pageStyle = {
  background: `
    radial-gradient(circle at 10% 62%, rgba(0,245,230,0.22) 0%, transparent 28%),
    radial-gradient(circle at 92% 55%, rgba(255,20,150,0.28) 0%, transparent 34%),
    linear-gradient(135deg, #02040a 0%, #070615 42%, #0c102e 65%, #09020d 100%)
  `,
  minHeight: '100vh',
};

function cleanTitle(step) {
  const raw = String(step?.title || step?.instruction || step?.body || step?.stepId || 'Schritt').trim();
  return raw
    .replace(/^Ich prüfe gerade\s*[„"']?/i, '')
    .replace(/[„"']$/g, '')
    .replace(/[.]+$/g, '')
    .trim();
}



function langKey(lang = 'de') {
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

function pickLang(map, lang = 'de') {
  const key = langKey(lang);
  return map[key] || map.en || map.de || '';
}

function topicLabel(topic, lang = 'de') {
  const labels = {
    de: { usb:'USB', wifi:'Wi‑Fi', firmware:'Firmware', software:'ScanSnap Home', ocr:'OCR', windows:'Windows', device_manager:'Geräte-Manager', unknown:'diese Spur' },
    en: { usb:'USB', wifi:'Wi‑Fi', firmware:'firmware', software:'ScanSnap Home', ocr:'OCR', windows:'Windows', device_manager:'Device Manager', unknown:'this path' },
    pt: { usb:'USB', wifi:'Wi‑Fi', firmware:'firmware', software:'ScanSnap Home', ocr:'OCR', windows:'Windows', device_manager:'Gestor de Dispositivos', unknown:'esta pista' },
    es: { usb:'USB', wifi:'Wi‑Fi', firmware:'firmware', software:'ScanSnap Home', ocr:'OCR', windows:'Windows', device_manager:'Administrador de dispositivos', unknown:'esta pista' },
    fr: { usb:'USB', wifi:'Wi‑Fi', firmware:'firmware', software:'ScanSnap Home', ocr:'OCR', windows:'Windows', device_manager:'Gestionnaire de périphériques', unknown:'cette piste' },
    it: { usb:'USB', wifi:'Wi‑Fi', firmware:'firmware', software:'ScanSnap Home', ocr:'OCR', windows:'Windows', device_manager:'Gestione dispositivi', unknown:'questa pista' },
    nl: { usb:'USB', wifi:'Wi‑Fi', firmware:'firmware', software:'ScanSnap Home', ocr:'OCR', windows:'Windows', device_manager:'Apparaatbeheer', unknown:'dit spoor' },
    ja: { usb:'USB', wifi:'Wi‑Fi', firmware:'ファームウェア', software:'ScanSnap Home', ocr:'OCR', windows:'Windows', device_manager:'デバイスマネージャー', unknown:'この確認ルート' },
  };
  return labels[langKey(lang)]?.[topic] || labels.en[topic] || topic;
}

function topicOfStep(step) {
  const text = `${step?.route || ''} ${step?.stepId || ''} ${step?.title || ''} ${step?.instruction || ''} ${step?.body || ''}`.toLowerCase();

  if (/wlan|wi-fi|wifi|router|network|netzwerk|rede|red|réseau|rete|netwerk|ip|dhcp/.test(text)) return 'wifi';
  if (/geräte-manager|device manager|gestor de dispositivos|administrador de dispositivos|gestionnaire de périphériques|gestione dispositivi|apparaatbeheer|デバイス/.test(text)) return 'device_manager';
  if (/firmware|recovery|top sensor|empty arm|update|atualização|actualización|mise à jour|aggiornamento/.test(text)) return 'firmware';
  if (/ocr|texterkennung|reconhecimento|reconocimiento|reconnaissance|image processing/.test(text)) return 'ocr';
  if (/sfc|dism|windows-system|systemintegrität|integrity/.test(text)) return 'windows';
  if (/sshome|cleanup|bereinigung|neu installieren|reinstall|scansnap home|reinstalar|réinstaller|reinstallare/.test(text)) return 'software';
  if (/usb|direkt|direct|anschluss|kabel|cable|cabo|câble/.test(text)) return 'usb';
  return 'unknown';
}

function detectTopicShift(steps, index) {
  if (!Array.isArray(steps) || index <= 0 || !steps[index] || !steps[index - 1]) return null;
  const from = topicOfStep(steps[index - 1]);
  const to = topicOfStep(steps[index]);
  if (!from || !to || from === 'unknown' || to === 'unknown' || from === to) return null;
  return { from, to };
}

function detectiveQuestion(name, shift, lang = 'de') {
  const n = (name || '').trim();
  const prefix = n ? `${n}, ` : '';
  const to = topicLabel(shift?.to || 'unknown', lang);
  const from = topicLabel(shift?.from || 'unknown', lang);
  const key = langKey(lang);

  const special = {
    de: {
      wifi: `${prefix}lass uns kurz die Wi‑Fi-Spur prüfen. Vielleicht liegt der Fehler eher in der Verbindung.`,
      firmware: `${prefix}hier taucht eine Firmware-Spur auf. Sollen wir dieser Richtung nachgehen?`,
      device_manager: `${prefix}bevor wir raten, schauen wir kurz, was Windows wirklich sieht.`,
      windows: `${prefix}das könnte in Richtung Windows-System gehen. Sollen wir diese Spur prüfen?`,
      software: `${prefix}vielleicht sitzt der Fehler eher in ScanSnap Home. Wollen wir dort nachsehen?`,
      ocr: `${prefix}das sieht nach einer OCR-Spur aus. Sollen wir dort weitermachen?`,
      fallback: `${prefix}wir wechseln gerade von ${from} zu ${to}. Sollen wir diese Spur prüfen?`,
    },
    en: {
      wifi: `${prefix}this looks like a possible Wi‑Fi path. Shall we check that lead for a moment?`,
      firmware: `${prefix}there may be a firmware lead here. Shall we follow it?`,
      device_manager: `${prefix}before we guess, shall we check what Windows actually sees?`,
      windows: `${prefix}this may point toward Windows. Shall we check that lead?`,
      software: `${prefix}the issue may sit in ScanSnap Home. Shall we look there?`,
      ocr: `${prefix}this looks like an OCR lead. Shall we continue there?`,
      fallback: `${prefix}we may have a new lead: ${to}. Shall we check it?`,
    },
    pt: {
      wifi: `${prefix}vamos verificar brevemente a pista do Wi‑Fi. Talvez o problema esteja mais na ligação.`,
      firmware: `${prefix}aqui aparece uma pista de firmware. Queres seguir nessa direção?`,
      device_manager: `${prefix}antes de adivinhar, vamos ver rapidamente o que o Windows realmente deteta.`,
      windows: `${prefix}isto pode apontar para o sistema Windows. Vamos verificar essa pista?`,
      software: `${prefix}talvez o problema esteja no ScanSnap Home. Queres verificar isso?`,
      ocr: `${prefix}isto parece uma pista de OCR. Continuamos por aí?`,
      fallback: `${prefix}apareceu uma nova pista: ${to}. Vamos verificar?`,
    },
    es: {
      wifi: `${prefix}vamos a revisar brevemente la pista de Wi‑Fi. Puede que el problema esté en la conexión.`,
      firmware: `${prefix}aquí aparece una pista de firmware. ¿Seguimos por esa dirección?`,
      device_manager: `${prefix}antes de suponer, veamos qué detecta realmente Windows.`,
      windows: `${prefix}esto puede apuntar al sistema Windows. ¿Revisamos esa pista?`,
      software: `${prefix}quizá el problema esté en ScanSnap Home. ¿Lo comprobamos?`,
      ocr: `${prefix}esto parece una pista de OCR. ¿Continuamos por ahí?`,
      fallback: `${prefix}aparece una nueva pista: ${to}. ¿La revisamos?`,
    },
    fr: {
      wifi: `${prefix}vérifions brièvement la piste Wi‑Fi. Le problème vient peut-être plutôt de la connexion.`,
      firmware: `${prefix}une piste firmware apparaît ici. On la suit ?`,
      device_manager: `${prefix}avant de deviner, regardons ce que Windows détecte réellement.`,
      windows: `${prefix}cela peut pointer vers Windows. On vérifie cette piste ?`,
      software: `${prefix}le problème se situe peut-être dans ScanSnap Home. On regarde ?`,
      ocr: `${prefix}cela ressemble à une piste OCR. On continue dans ce sens ?`,
      fallback: `${prefix}nouvelle piste détectée : ${to}. On la vérifie ?`,
    },
    it: {
      wifi: `${prefix}controlliamo brevemente la pista Wi‑Fi. Forse il problema è nella connessione.`,
      firmware: `${prefix}qui compare una pista firmware. La seguiamo?`,
      device_manager: `${prefix}prima di ipotizzare, vediamo cosa rileva davvero Windows.`,
      windows: `${prefix}potrebbe puntare a Windows. Controlliamo questa pista?`,
      software: `${prefix}il problema potrebbe essere in ScanSnap Home. Verifichiamo lì?`,
      ocr: `${prefix}sembra una pista OCR. Continuiamo da lì?`,
      fallback: `${prefix}c’è una nuova pista: ${to}. La controlliamo?`,
    },
    nl: {
      wifi: `${prefix}laten we kort het Wi‑Fi-spoor controleren. Misschien zit het probleem eerder in de verbinding.`,
      firmware: `${prefix}hier verschijnt een firmware-spoor. Zullen we dat volgen?`,
      device_manager: `${prefix}voordat we gokken, kijken we wat Windows echt ziet.`,
      windows: `${prefix}dit kan richting Windows wijzen. Zullen we dat spoor controleren?`,
      software: `${prefix}het probleem kan in ScanSnap Home zitten. Zullen we daar kijken?`,
      ocr: `${prefix}dit lijkt op een OCR-spoor. Gaan we daar verder?`,
      fallback: `${prefix}er is een nieuw spoor: ${to}. Zullen we het controleren?`,
    },
    ja: {
      wifi: `${prefix}Wi‑Fi側の可能性を少し確認しましょう。原因が接続側にあるかもしれません。`,
      firmware: `${prefix}ファームウェア側の可能性があります。この方向で確認しますか？`,
      device_manager: `${prefix}推測する前に、Windowsでどう認識されているか確認しましょう。`,
      windows: `${prefix}Windows側の可能性があります。この確認ルートを見ますか？`,
      software: `${prefix}ScanSnap Home側に原因があるかもしれません。確認しますか？`,
      ocr: `${prefix}OCR側の可能性があります。そちらを確認しますか？`,
      fallback: `${prefix}新しい確認ルートがあります：${to}。確認しますか？`,
    },
  };
  return special[key]?.[shift?.to] || special[key]?.fallback || special.en.fallback;
}

function quietStepHint(step, index, lang = 'de') {
  const topic = topicOfStep(step);
  const text = `${step?.title || ''} ${step?.instruction || ''}`.toLowerCase();
  const key = langKey(lang);

  const hints = {
    de: {
      usb: 'Wir starten mit dem einfachsten Check.',
      device_manager: 'Hier reicht ein kurzer Blick – dann wissen wir deutlich mehr.',
      firmware: 'Diesen Schritt bitte ruhig und sauber durchführen.',
      recovery: 'Das ist ein sensibler Schritt. Nimm dir dafür ruhig einen Moment.',
    },
    en: {
      usb: 'This is the cleanest first check.',
      device_manager: 'This tells us what Windows can actually see.',
      firmware: 'This step should be done carefully and only via direct USB.',
      recovery: 'This is a sensitive step. Take a calm moment for it.',
    },
    pt: {
      usb: 'Começamos pela verificação mais simples.',
      device_manager: 'Aqui basta uma verificação rápida – depois sabemos muito mais.',
      firmware: 'Faz este passo com calma e com a ligação USB direta.',
      recovery: 'Este é um passo sensível. Faz com calma.',
    },
    es: {
      usb: 'Empezamos con la comprobación más sencilla.',
      device_manager: 'Con una mirada rápida sabremos mucho más.',
      firmware: 'Haz este paso con calma y solo mediante USB directo.',
      recovery: 'Este paso es delicado. Tómate un momento.',
    },
    fr: {
      usb: 'On commence par le contrôle le plus simple.',
      device_manager: 'Un rapide coup d’œil suffit pour mieux comprendre.',
      firmware: 'Fais cette étape calmement et uniquement en USB direct.',
      recovery: 'C’est une étape sensible. Prends un moment.',
    },
    it: {
      usb: 'Iniziamo dal controllo più semplice.',
      device_manager: 'Qui basta un rapido controllo per capire molto di più.',
      firmware: 'Esegui questo passaggio con calma e solo tramite USB diretto.',
      recovery: 'Questo è un passaggio delicato. Prenditi un momento.',
    },
    nl: {
      usb: 'We beginnen met de eenvoudigste controle.',
      device_manager: 'Een korte blik is genoeg om veel meer te weten.',
      firmware: 'Voer deze stap rustig uit en alleen via directe USB.',
      recovery: 'Dit is een gevoelige stap. Neem er even rustig de tijd voor.',
    },
    ja: {
      usb: 'まず一番シンプルな確認から始めます。',
      device_manager: 'ここを少し確認すれば、かなり状況が見えてきます。',
      firmware: 'この手順は落ち着いて、USB直接接続で行ってください。',
      recovery: 'これは慎重に行う手順です。落ち着いて進めてください。',
    },
  };

  if (/recovery|top sensor|empty arm/.test(text)) return hints[key]?.recovery || hints.en.recovery;
  if (index === 0 && topic === 'usb') return hints[key]?.usb || hints.en.usb;
  if (topic === 'device_manager') return hints[key]?.device_manager || hints.en.device_manager;
  if (topic === 'firmware') return hints[key]?.firmware || hints.en.firmware;
  return '';
}


function isError5ContextStep(step) {
  const text = `${step?.route || ''} ${step?.stepId || ''} ${step?.title || ''} ${step?.instruction || ''}`.toLowerCase();
  return /smart_error5_context|fehlercode -5|error code -5|fehler -5|\b-5\b/.test(text);
}


const ERROR5_BRANCH_LABELS = {
  de: { usb: 'USB', wifi: 'WLAN / Wi‑Fi', firmware: 'Nach Firmwareupdate', unsure: 'Noch unklar' },
  en: { usb: 'USB', wifi: 'Wi‑Fi', firmware: 'After firmware update', unsure: 'Not clear yet' },
  pt: { usb: 'USB', wifi: 'Wi‑Fi', firmware: 'Após atualização de firmware', unsure: 'Ainda não está claro' },
  es: { usb: 'USB', wifi: 'Wi‑Fi', firmware: 'Después de actualización de firmware', unsure: 'Aún no está claro' },
  fr: { usb: 'USB', wifi: 'Wi‑Fi', firmware: 'Après mise à jour firmware', unsure: 'Pas encore clair' },
  it: { usb: 'USB', wifi: 'Wi‑Fi', firmware: 'Dopo aggiornamento firmware', unsure: 'Non ancora chiaro' },
  nl: { usb: 'USB', wifi: 'Wi‑Fi', firmware: 'Na firmware-update', unsure: 'Nog niet duidelijk' },
  ja: { usb: 'USB', wifi: 'Wi‑Fi', firmware: 'ファームウェア更新後', unsure: 'まだ不明' },
};



function actionLabel(keyName, lang = 'de') {
  const labels = {
    solved: { de:'Hat geholfen', en:'Solved', pt:'Ajudou', es:'Ha ayudado', fr:'A aidé', it:'Ha aiutato', nl:'Heeft geholpen', ja:'解決した' },
    not_possible: { de:'Nicht möglich', en:'Not possible', pt:'Não é possível', es:'No es posible', fr:'Pas possible', it:'Non possibile', nl:'Niet mogelijk', ja:'できない' },
    waiting: { de:'Warte auf Rückmeldung', en:'Waiting for reply', pt:'A aguardar resposta', es:'Esperando respuesta', fr:'En attente de réponse', it:'In attesa di risposta', nl:'Wachten op antwoord', ja:'回答待ち' },
    new_lead: { de:'Neue Spur erkannt', en:'New lead detected', pt:'Nova pista encontrada', es:'Nueva pista detectada', fr:'Nouvelle piste détectée', it:'Nuova pista rilevata', nl:'Nieuw spoor gevonden', ja:'新しい確認ルート' },
    yes_lead: { de:'Ja, Spur prüfen', en:'Yes, check this lead', pt:'Sim, verificar pista', es:'Sí, revisar pista', fr:'Oui, vérifier', it:'Sì, controlla', nl:'Ja, controleren', ja:'はい、確認する' },
    no_back: { de:'Nein, zurück', en:'No, go back', pt:'Não, voltar', es:'No, volver', fr:'Non, retour', it:'No, indietro', nl:'Nee, terug', ja:'いいえ、戻る' },
    classify_error5: { de:'Fehler -5 einordnen', en:'Classify error -5', pt:'Classificar erro -5', es:'Clasificar error -5', fr:'Classer l’erreur -5', it:'Classificare errore -5', nl:'Fout -5 indelen', ja:'エラー -5 を分類' },
  };
  return labels[keyName]?.[langKey(lang)] || labels[keyName]?.en || keyName;
}


const WAITING_OPTIONS = [
  { key: 'error_screenshot', label: { de:'Fehlermeldung / Screenshot', en:'Error message / screenshot', pt:'Mensagem de erro / screenshot', es:'Mensaje de error / captura', fr:'Message d’erreur / capture', it:'Messaggio di errore / screenshot', nl:'Foutmelding / screenshot', ja:'エラーメッセージ / スクリーンショット' } },
  { key: 'device_manager', label: { de:'Geräte-Manager Screenshot', en:'Device Manager screenshot', pt:'Screenshot do Gestor de Dispositivos', es:'Captura del Administrador de dispositivos', fr:'Capture du Gestionnaire de périphériques', it:'Screenshot di Gestione dispositivi', nl:'Screenshot van Apparaatbeheer', ja:'デバイスマネージャーのスクリーンショット' } },
  { key: 'sshome_version', label: { de:'ScanSnap Home Version', en:'ScanSnap Home version', pt:'Versão do ScanSnap Home', es:'Versión de ScanSnap Home', fr:'Version de ScanSnap Home', it:'Versione ScanSnap Home', nl:'ScanSnap Home-versie', ja:'ScanSnap Homeバージョン' } },
  { key: 'firmware_version', label: { de:'Firmware-Version', en:'Firmware version', pt:'Versão do firmware', es:'Versión de firmware', fr:'Version du firmware', it:'Versione firmware', nl:'Firmwareversie', ja:'ファームウェアバージョン' } },
  { key: 'os_version', label: { de:'OS-Version', en:'OS version', pt:'Versão do sistema operativo', es:'Versión del sistema operativo', fr:'Version du système d’exploitation', it:'Versione sistema operativo', nl:'OS-versie', ja:'OSバージョン' } },
  { key: 'scanner_led', label: { de:'Scanner-Display / LED', en:'Scanner display / LED', pt:'Display / LED do scanner', es:'Pantalla / LED del escáner', fr:'Écran / LED du scanner', it:'Display / LED dello scanner', nl:'Scannerdisplay / LED', ja:'スキャナー画面 / LED' } },
  { key: 'general_reply', label: { de:'Kundenantwort allgemein', en:'General customer reply', pt:'Resposta geral do cliente', es:'Respuesta general del cliente', fr:'Réponse générale du client', it:'Risposta generale del cliente', nl:'Algemene klantreactie', ja:'一般的なお客様返信' } },
  { key: 'custom', label: { de:'Eigene Notiz', en:'Custom note', pt:'Nota própria', es:'Nota propia', fr:'Note personnalisée', it:'Nota personalizzata', nl:'Eigen notitie', ja:'任意メモ' } },
];

function waitingText(key, lang = 'de') {
  const item = WAITING_OPTIONS.find(o => o.key === key);
  if (!item) return key;
  return item.label?.[langKey(lang)] || item.label?.en || item.label?.de || key;
}

function waitingUi(keyName, lang = 'de') {
  const labels = {
    title: { de:'Worauf warten wir?', en:'What are we waiting for?', pt:'De que resposta estamos à espera?', es:'¿Qué estamos esperando?', fr:'Qu’attendons-nous ?', it:'Cosa stiamo aspettando?', nl:'Waar wachten we op?', ja:'何を待っていますか？' },
    hint: { de:'Wähle nur die Info, ohne die dieser Schritt nicht sauber weitergeht.', en:'Select only the information needed to continue this step.', pt:'Seleciona apenas a informação necessária para continuar este passo.', es:'Selecciona solo la información necesaria para continuar este paso.', fr:'Sélectionne uniquement l’information nécessaire pour continuer cette étape.', it:'Seleziona solo l’informazione necessaria per continuare questo passaggio.', nl:'Selecteer alleen de informatie die nodig is om verder te gaan.', ja:'この手順を続けるために必要な情報だけを選択してください。' },
    note: { de:'Zusatznotiz optional', en:'Optional note', pt:'Nota opcional', es:'Nota opcional', fr:'Note facultative', it:'Nota opzionale', nl:'Optionele notitie', ja:'任意メモ' },
    save: { de:'Warten speichern', en:'Save waiting point', pt:'Guardar ponto de espera', es:'Guardar punto de espera', fr:'Enregistrer le point d’attente', it:'Salva punto di attesa', nl:'Wachtpunt opslaan', ja:'待機ポイントを保存' },
    cancel: { de:'Abbrechen', en:'Cancel', pt:'Cancelar', es:'Cancelar', fr:'Annuler', it:'Annulla', nl:'Annuleren', ja:'キャンセル' },
  };
  return labels[keyName]?.[langKey(lang)] || labels[keyName]?.en || keyName;
}


function error5BranchSteps(branch, lang = 'de') {
  const key = langKey(lang);

  const branchData = {
    usb: {
      de: [
        ['Direkte USB-Verbindung prüfen', 'Scanner direkt am Computer anschließen, ohne Hub, Dockingstation oder Verlängerung. Danach ScanSnap Home erneut prüfen.'],
        ['Anderen USB-Anschluss und anderes USB-Kabel testen', 'Anderen USB-Port testen und, wenn möglich, ein anderes USB-Kabel verwenden. Danach erneut prüfen, ob der Scanner erkannt wird.'],
        ['Geräte-Manager-Erkennung prüfen', 'Im Windows-Geräte-Manager prüfen, ob der Scanner, ein unbekanntes Gerät oder ein USB-Gerät mit Warnsymbol erscheint. Diese Information ist wichtig für die weitere Eingrenzung.'],
        ['Scanner in ScanSnap Home entfernen und erneut verbinden', 'Scanner aus ScanSnap Home entfernen und danach erneut per direktem USB verbinden. Anschließend Scanner und Computer neu starten.'],
        ['ScanSnap Home bereinigen und neu installieren', 'Wenn der Scanner weiterhin nicht erkannt wird, ScanSnap Home vollständig bereinigen, den Computer neu starten und die aktuelle Version mit Administratorrechten neu installieren.'],
      ],
      en: [
        ['Check direct USB connection', 'Connect the scanner directly to the computer without a hub, dock, or extension cable. Then check ScanSnap Home again.'],
        ['Test another USB port and another USB cable', 'Try another USB port and, if possible, another USB cable. Then check again whether the scanner is detected.'],
        ['Check Device Manager detection', 'Check Windows Device Manager for the scanner, an unknown device, or a USB device with warning symbol. This information is important for narrowing the issue down.'],
        ['Remove and reconnect the scanner in ScanSnap Home', 'Remove the scanner from ScanSnap Home and reconnect it via direct USB. Then restart the scanner and computer.'],
        ['Clean up and reinstall ScanSnap Home', 'If the scanner is still not detected, clean up ScanSnap Home completely, restart the computer, and reinstall the latest version with administrator rights.'],
      ],
      pt: [
        ['Verificar ligação USB direta', 'Liga o scanner diretamente ao computador, sem hub, docking station ou extensão. Depois verifica novamente no ScanSnap Home.'],
        ['Testar outra porta USB e outro cabo USB', 'Testa outra porta USB e, se possível, outro cabo USB. Depois verifica novamente se o scanner é detetado.'],
        ['Verificar deteção no Gestor de Dispositivos', 'No Windows, verifica no Gestor de Dispositivos se aparece o scanner, um dispositivo desconhecido ou um dispositivo USB com símbolo de aviso.'],
        ['Remover e voltar a ligar o scanner no ScanSnap Home', 'Remove o scanner da lista no ScanSnap Home e liga-o novamente por USB direto. Depois reinicia o scanner e o computador.'],
        ['Limpar e reinstalar o ScanSnap Home', 'Se o scanner continuar sem ser detetado, limpa completamente o ScanSnap Home, reinicia o computador e instala a versão atual com direitos de administrador.'],
      ],
      es: [
        ['Comprobar conexión USB directa', 'Conecta el escáner directamente al ordenador, sin hub, dock ni alargador. Después comprueba ScanSnap Home otra vez.'],
        ['Probar otro puerto USB y otro cable USB', 'Prueba otro puerto USB y, si es posible, otro cable USB. Después comprueba de nuevo si el escáner se detecta.'],
        ['Comprobar detección en Administrador de dispositivos', 'En Windows, comprueba si aparece el escáner, un dispositivo desconocido o un dispositivo USB con símbolo de advertencia.'],
        ['Eliminar y reconectar el escáner en ScanSnap Home', 'Elimina el escáner de ScanSnap Home y vuelve a conectarlo por USB directo. Después reinicia el escáner y el ordenador.'],
        ['Limpiar y reinstalar ScanSnap Home', 'Si el escáner sigue sin detectarse, limpia ScanSnap Home completamente, reinicia el ordenador e instala la versión actual con derechos de administrador.'],
      ],
      fr: [
        ['Vérifier la connexion USB directe', 'Connecte le scanner directement à l’ordinateur, sans hub, dock ni rallonge. Vérifie ensuite ScanSnap Home.'],
        ['Tester un autre port USB et un autre câble USB', 'Essaie un autre port USB et, si possible, un autre câble USB. Vérifie ensuite si le scanner est détecté.'],
        ['Vérifier la détection dans le Gestionnaire de périphériques', 'Dans Windows, vérifie si le scanner, un périphérique inconnu ou un périphérique USB avec avertissement apparaît.'],
        ['Supprimer et reconnecter le scanner dans ScanSnap Home', 'Supprime le scanner dans ScanSnap Home puis reconnecte-le en USB direct. Redémarre ensuite le scanner et l’ordinateur.'],
        ['Nettoyer et réinstaller ScanSnap Home', 'Si le scanner n’est toujours pas détecté, nettoie complètement ScanSnap Home, redémarre l’ordinateur et installe la version actuelle avec les droits administrateur.'],
      ],
      it: [
        ['Controllare la connessione USB diretta', 'Collega lo scanner direttamente al computer, senza hub, dock o prolunga. Poi controlla di nuovo ScanSnap Home.'],
        ['Provare un’altra porta USB e un altro cavo USB', 'Prova un’altra porta USB e, se possibile, un altro cavo USB. Poi controlla se lo scanner viene rilevato.'],
        ['Controllare il rilevamento in Gestione dispositivi', 'In Windows, verifica se compare lo scanner, un dispositivo sconosciuto o un dispositivo USB con simbolo di avviso.'],
        ['Rimuovere e ricollegare lo scanner in ScanSnap Home', 'Rimuovi lo scanner da ScanSnap Home e ricollegalo via USB diretto. Poi riavvia scanner e computer.'],
        ['Pulire e reinstallare ScanSnap Home', 'Se lo scanner non viene ancora rilevato, pulisci completamente ScanSnap Home, riavvia il computer e installa la versione attuale con diritti di amministratore.'],
      ],
      nl: [
        ['Directe USB-verbinding controleren', 'Sluit de scanner rechtstreeks aan op de computer, zonder hub, dock of verlengkabel. Controleer daarna ScanSnap Home opnieuw.'],
        ['Andere USB-poort en USB-kabel testen', 'Probeer een andere USB-poort en indien mogelijk een andere USB-kabel. Controleer daarna opnieuw of de scanner wordt gedetecteerd.'],
        ['Detectie in Apparaatbeheer controleren', 'Controleer in Windows Apparaatbeheer of de scanner, een onbekend apparaat of een USB-apparaat met waarschuwing zichtbaar is.'],
        ['Scanner verwijderen en opnieuw verbinden in ScanSnap Home', 'Verwijder de scanner uit ScanSnap Home en verbind hem opnieuw via directe USB. Herstart daarna scanner en computer.'],
        ['ScanSnap Home opschonen en opnieuw installeren', 'Als de scanner nog steeds niet wordt gedetecteerd, schoon ScanSnap Home volledig op, herstart de computer en installeer de nieuwste versie met administratorrechten.'],
      ],
      ja: [
        ['USB直接接続を確認', 'ハブ、ドック、延長ケーブルを使わず、スキャナーをPCに直接USB接続してください。その後ScanSnap Homeを再確認します。'],
        ['別のUSBポートとUSBケーブルを試す', '別のUSBポートを試し、可能であれば別のUSBケーブルも使用してください。その後スキャナーが認識されるか確認します。'],
        ['デバイスマネージャーで認識を確認', 'Windowsのデバイスマネージャーで、スキャナー、不明なデバイス、または警告付きUSBデバイスが表示されるか確認してください。'],
        ['ScanSnap Homeで削除して再接続', 'ScanSnap Homeからスキャナーを削除し、USB直接接続で再接続してください。その後スキャナーとPCを再起動します。'],
        ['ScanSnap Homeをクリーンアップして再インストール', 'それでも認識されない場合は、ScanSnap Homeを完全にクリーンアップし、PCを再起動して最新版を管理者権限でインストールしてください。'],
      ],
    },

    wifi: {
      de: [
        ['WLAN-Status am Scanner prüfen', 'Prüfen, ob der Scanner mit dem WLAN verbunden ist und ob am Scanner ein WLAN-Status bzw. eine Verbindung angezeigt wird.'],
        ['Scanner und Computer im selben Netzwerk prüfen', 'Sicherstellen, dass Scanner und Computer im selben Netzwerk bzw. Subnetz sind. Falls möglich, die IP-Adresse des Scanners prüfen.'],
        ['Router / 2,4-GHz-Netzwerk prüfen', 'Routereinstellungen wie 2,4 GHz, Band Steering, Client Isolation und Firewall-Regeln prüfen. Danach Router, Scanner und Computer neu starten.'],
        ['WLAN-Verbindung neu registrieren', 'Die WLAN-Verbindung des Scanners neu einrichten und anschließend in ScanSnap Home erneut prüfen, ob der Scanner gefunden wird.'],
        ['Hotspot- oder alternatives Netzwerk testen', 'Zum Ausschluss von Router- oder Netzwerkeinflüssen den Scanner testweise in einem einfachen alternativen Netzwerk prüfen, z. B. mobiler Hotspot.'],
      ],
      en: [
        ['Check Wi‑Fi status on the scanner', 'Check whether the scanner is connected to Wi‑Fi and whether a Wi‑Fi status or connection is shown on the scanner.'],
        ['Check scanner and computer are on the same network', 'Make sure scanner and computer are on the same network/subnet. If possible, check the scanner IP address.'],
        ['Check router / 2.4 GHz network', 'Check router settings such as 2.4 GHz, band steering, client isolation and firewall rules. Then restart router, scanner and computer.'],
        ['Register the Wi‑Fi connection again', 'Set up the scanner Wi‑Fi connection again and then check in ScanSnap Home whether the scanner is found.'],
        ['Test hotspot or alternate network', 'To exclude router/network influence, test the scanner in a simple alternate network, e.g. mobile hotspot.'],
      ],
      pt: [
        ['Verificar o estado do Wi‑Fi no scanner', 'Verifica se o scanner está ligado ao Wi‑Fi e se aparece um estado de ligação no scanner.'],
        ['Verificar se scanner e computador estão na mesma rede', 'Confirma se scanner e computador estão na mesma rede ou sub-rede. Se possível, verifica o endereço IP do scanner.'],
        ['Verificar router / rede 2,4 GHz', 'Verifica definições do router como rede de 2,4 GHz, band steering, isolamento de clientes e regras de firewall. Depois reinicia router, scanner e computador.'],
        ['Registar novamente a ligação Wi‑Fi', 'Configura novamente a ligação Wi‑Fi do scanner e depois verifica no ScanSnap Home se o scanner é encontrado.'],
        ['Testar hotspot ou rede alternativa', 'Para excluir influência do router ou da rede, testa o scanner numa rede alternativa simples, por exemplo hotspot móvel.'],
      ],
      es: [
        ['Comprobar estado Wi‑Fi del escáner', 'Comprueba si el escáner está conectado al Wi‑Fi y si muestra un estado de conexión.'],
        ['Comprobar que escáner y ordenador están en la misma red', 'Asegúrate de que escáner y ordenador están en la misma red o subred. Si es posible, comprueba la dirección IP del escáner.'],
        ['Comprobar router / red 2,4 GHz', 'Comprueba ajustes del router como 2,4 GHz, band steering, aislamiento de clientes y reglas de firewall. Después reinicia router, escáner y ordenador.'],
        ['Registrar de nuevo la conexión Wi‑Fi', 'Configura de nuevo la conexión Wi‑Fi del escáner y comprueba en ScanSnap Home si se encuentra el escáner.'],
        ['Probar hotspot o red alternativa', 'Para descartar influencia del router o la red, prueba el escáner en una red alternativa sencilla, por ejemplo un hotspot móvil.'],
      ],
      fr: [
        ['Vérifier l’état Wi‑Fi du scanner', 'Vérifie si le scanner est connecté au Wi‑Fi et si un état de connexion apparaît sur le scanner.'],
        ['Vérifier que scanner et ordinateur sont sur le même réseau', 'Assure-toi que le scanner et l’ordinateur sont sur le même réseau ou sous-réseau. Si possible, vérifie l’adresse IP du scanner.'],
        ['Vérifier le routeur / réseau 2,4 GHz', 'Vérifie les paramètres du routeur comme 2,4 GHz, band steering, isolation client et règles firewall. Redémarre ensuite routeur, scanner et ordinateur.'],
        ['Enregistrer de nouveau la connexion Wi‑Fi', 'Configure de nouveau la connexion Wi‑Fi du scanner puis vérifie dans ScanSnap Home si le scanner est trouvé.'],
        ['Tester un hotspot ou un réseau alternatif', 'Pour exclure une influence du routeur ou du réseau, teste le scanner dans un réseau alternatif simple, par exemple un hotspot mobile.'],
      ],
      it: [
        ['Controllare lo stato Wi‑Fi dello scanner', 'Verifica se lo scanner è connesso al Wi‑Fi e se sullo scanner appare uno stato di connessione.'],
        ['Controllare che scanner e computer siano sulla stessa rete', 'Assicurati che scanner e computer siano nella stessa rete o sottorete. Se possibile, controlla l’indirizzo IP dello scanner.'],
        ['Controllare router / rete 2,4 GHz', 'Controlla impostazioni router come 2,4 GHz, band steering, isolamento client e regole firewall. Poi riavvia router, scanner e computer.'],
        ['Registrare di nuovo la connessione Wi‑Fi', 'Configura di nuovo la connessione Wi‑Fi dello scanner e controlla in ScanSnap Home se viene trovato.'],
        ['Testare hotspot o rete alternativa', 'Per escludere influenze del router o della rete, testa lo scanner in una rete alternativa semplice, ad esempio hotspot mobile.'],
      ],
      nl: [
        ['Wi‑Fi-status op de scanner controleren', 'Controleer of de scanner met Wi‑Fi is verbonden en of er een verbindingsstatus op de scanner wordt getoond.'],
        ['Controleren of scanner en computer op hetzelfde netwerk zitten', 'Zorg dat scanner en computer op hetzelfde netwerk of subnet zitten. Controleer indien mogelijk het IP-adres van de scanner.'],
        ['Router / 2,4 GHz-netwerk controleren', 'Controleer routerinstellingen zoals 2,4 GHz, band steering, client isolation en firewallregels. Herstart daarna router, scanner en computer.'],
        ['Wi‑Fi-verbinding opnieuw registreren', 'Stel de Wi‑Fi-verbinding van de scanner opnieuw in en controleer daarna in ScanSnap Home of de scanner wordt gevonden.'],
        ['Hotspot of alternatief netwerk testen', 'Om router- of netwerkinvloed uit te sluiten, test de scanner in een eenvoudig alternatief netwerk, bijvoorbeeld mobiele hotspot.'],
      ],
      ja: [
        ['スキャナーのWi‑Fi状態を確認', 'スキャナーがWi‑Fiに接続されているか、接続状態が表示されているか確認してください。'],
        ['スキャナーとPCが同じネットワークか確認', 'スキャナーとPCが同じネットワークまたはサブネットにあることを確認してください。可能であればスキャナーのIPアドレスも確認します。'],
        ['ルーター / 2.4 GHzネットワークを確認', '2.4 GHz、バンドステアリング、クライアント分離、ファイアウォール設定を確認してください。その後ルーター、スキャナー、PCを再起動します。'],
        ['Wi‑Fi接続を再登録', 'スキャナーのWi‑Fi接続を再設定し、その後ScanSnap Homeでスキャナーが見つかるか確認してください。'],
        ['ホットスポットまたは別ネットワークをテスト', 'ルーターやネットワークの影響を除外するため、モバイルホットスポットなど簡単な別ネットワークでテストしてください。'],
      ],
    },

    firmware: {
      de: [
        ['Direkte USB-Verbindung für Firmwareprüfung sicherstellen', 'Scanner direkt per USB mit dem Computer verbinden. Firmwareprüfungen oder Firmwareupdates nicht über WLAN durchführen.'],
        ['Startzustand des Scanners prüfen', 'Prüfen, ob der Scanner normal startet, auf einem Logo hängen bleibt oder eine Fehlermeldung/LED-Anzeige zeigt. Dieses Ergebnis entscheidet, ob der normale Update-Pfad oder Recovery-Pfad sinnvoll ist.'],
        ['Firmwareupdate über ScanSnap Home prüfen', 'Wenn der Scanner normal startet und erkannt wird, in ScanSnap Home unter Scanner-Informationen prüfen, ob ein Firmwareupdate angeboten wird. Update nur über direkte USB-Verbindung ausführen.'],
        ['ScanSnap Home bereinigen und neu installieren', 'Wenn das Firmwareupdate nicht korrekt abgeschlossen wird oder wiederholt angeboten wird, ScanSnap Home vollständig bereinigen und anschließend neu installieren.'],
        ['Firmware-Recovery nur bei bestätigtem Recovery-Zustand vorbereiten', 'Firmware-Recovery erst durchführen, wenn Startzustand und USB-Erkennung geprüft wurden und die Symptome wirklich zu einem Recovery-Fall passen.'],
      ],
      en: [
        ['Ensure direct USB connection for firmware check', 'Connect the scanner directly to the computer via USB. Do not perform firmware checks or updates via Wi‑Fi.'],
        ['Check scanner startup state', 'Check whether the scanner starts normally, gets stuck on a logo, or shows an error/LED indication. This determines whether the normal update path or recovery path is appropriate.'],
        ['Check firmware update via ScanSnap Home', 'If the scanner starts normally and is detected, check Scanner Information in ScanSnap Home for available firmware updates. Update only via direct USB.'],
        ['Clean up and reinstall ScanSnap Home', 'If the firmware update does not complete correctly or is repeatedly offered, clean up ScanSnap Home completely and reinstall it.'],
        ['Prepare firmware recovery only if recovery state is confirmed', 'Only perform firmware recovery once startup state and USB detection have been checked and the symptoms fit a recovery case.'],
      ],
      pt: [
        ['Garantir ligação USB direta para verificar o firmware', 'Liga o scanner diretamente ao computador por USB. Não faças verificações ou atualizações de firmware por Wi‑Fi.'],
        ['Verificar o estado de arranque do scanner', 'Verifica se o scanner arranca normalmente, fica preso no logótipo ou mostra uma mensagem de erro/LED. Este resultado define se faz sentido seguir pelo update normal ou pelo recovery.'],
        ['Verificar atualização de firmware pelo ScanSnap Home', 'Se o scanner arranca normalmente e é detetado, verifica nas informações do scanner no ScanSnap Home se há atualização de firmware. Executa apenas por USB direto.'],
        ['Limpar e reinstalar o ScanSnap Home', 'Se a atualização de firmware não terminar corretamente ou voltar a ser oferecida, limpa completamente o ScanSnap Home e reinstala-o.'],
        ['Preparar recovery de firmware só se o estado estiver confirmado', 'Recovery de firmware só deve ser preparado depois de verificar o estado de arranque e a deteção USB, e apenas se os sintomas forem compatíveis.'],
      ],
      es: [
        ['Garantizar conexión USB directa para comprobar firmware', 'Conecta el escáner directamente al ordenador por USB. No realices comprobaciones o actualizaciones de firmware por Wi‑Fi.'],
        ['Comprobar estado de inicio del escáner', 'Comprueba si el escáner arranca normalmente, se queda en el logotipo o muestra un error/LED. Esto decide si corresponde actualización normal o recovery.'],
        ['Comprobar actualización de firmware en ScanSnap Home', 'Si el escáner arranca normalmente y se detecta, comprueba en la información del escáner si hay actualización de firmware. Ejecuta solo por USB directo.'],
        ['Limpiar y reinstalar ScanSnap Home', 'Si la actualización no termina correctamente o se ofrece repetidamente, limpia ScanSnap Home completamente y reinstálalo.'],
        ['Preparar recovery solo con estado confirmado', 'El recovery de firmware solo debe hacerse tras comprobar inicio y detección USB, y si los síntomas encajan realmente.'],
      ],
      fr: [
        ['Assurer une connexion USB directe pour le firmware', 'Connecte le scanner directement à l’ordinateur par USB. Ne fais pas de vérification ou mise à jour firmware par Wi‑Fi.'],
        ['Vérifier l’état de démarrage du scanner', 'Vérifie si le scanner démarre normalement, reste bloqué sur le logo ou affiche une erreur/LED. Cela décide entre mise à jour normale et recovery.'],
        ['Vérifier la mise à jour firmware via ScanSnap Home', 'Si le scanner démarre normalement et est détecté, vérifie dans les informations du scanner si une mise à jour firmware est proposée. Fais-la seulement en USB direct.'],
        ['Nettoyer et réinstaller ScanSnap Home', 'Si la mise à jour ne se termine pas correctement ou revient sans cesse, nettoie complètement ScanSnap Home et réinstalle-le.'],
        ['Préparer le recovery seulement si confirmé', 'Le recovery firmware ne doit être préparé qu’après vérification du démarrage et de la détection USB, et si les symptômes correspondent.'],
      ],
      it: [
        ['Garantire connessione USB diretta per il firmware', 'Collega lo scanner direttamente al computer tramite USB. Non eseguire controlli o aggiornamenti firmware via Wi‑Fi.'],
        ['Controllare lo stato di avvio dello scanner', 'Verifica se lo scanner si avvia normalmente, resta sul logo o mostra errore/LED. Questo decide tra aggiornamento normale e recovery.'],
        ['Controllare aggiornamento firmware da ScanSnap Home', 'Se lo scanner si avvia normalmente ed è rilevato, controlla nelle informazioni scanner se è disponibile un aggiornamento firmware. Eseguilo solo via USB diretto.'],
        ['Pulire e reinstallare ScanSnap Home', 'Se l’aggiornamento non termina correttamente o viene riproposto, pulisci completamente ScanSnap Home e reinstallalo.'],
        ['Preparare recovery solo se confermato', 'Il recovery firmware va fatto solo dopo aver controllato avvio e rilevamento USB, e solo se i sintomi corrispondono.'],
      ],
      nl: [
        ['Directe USB-verbinding voor firmwarecontrole garanderen', 'Verbind de scanner rechtstreeks via USB met de computer. Voer firmwarecontroles of updates niet via Wi‑Fi uit.'],
        ['Opstartstatus van de scanner controleren', 'Controleer of de scanner normaal start, op het logo blijft hangen of een fout/LED toont. Dit bepaalt of normale update of recovery passend is.'],
        ['Firmware-update via ScanSnap Home controleren', 'Als de scanner normaal start en wordt gedetecteerd, controleer in ScanSnap Home bij scannerinformatie of een firmware-update wordt aangeboden. Alleen via directe USB uitvoeren.'],
        ['ScanSnap Home opschonen en opnieuw installeren', 'Als de update niet correct voltooit of steeds opnieuw wordt aangeboden, schoon ScanSnap Home volledig op en installeer opnieuw.'],
        ['Recovery alleen voorbereiden als status bevestigd is', 'Firmware-recovery pas voorbereiden na controle van opstartstatus en USB-detectie, en alleen als de symptomen passen.'],
      ],
      ja: [
        ['ファームウェア確認のためUSB直接接続を確保', 'スキャナーをPCにUSBで直接接続してください。ファームウェア確認や更新はWi‑Fi経由で行わないでください。'],
        ['スキャナーの起動状態を確認', 'スキャナーが通常起動するか、ロゴで止まるか、エラー/LED表示があるか確認します。これにより通常更新かリカバリーか判断します。'],
        ['ScanSnap Homeでファームウェア更新を確認', '通常起動して認識される場合、ScanSnap Homeのスキャナー情報で更新があるか確認します。更新はUSB直接接続でのみ行います。'],
        ['ScanSnap Homeをクリーンアップして再インストール', '更新が正常に完了しない、または繰り返し表示される場合は、ScanSnap Homeを完全にクリーンアップして再インストールします。'],
        ['状態確認後のみファームウェアリカバリーを準備', '起動状態とUSB認識を確認し、症状がリカバリーケースに合う場合のみ準備します。'],
      ],
    },

    unsure: {
      de: [
        ['Fehlerkontext präzisieren', 'Zuerst klären, ob Fehler -5 bei USB, WLAN oder nach einem Firmwareupdate auftritt. Ohne diese Information sollte noch kein spezieller Lösungspfad gestartet werden.'],
        ['Screenshot der Fehlermeldung anfordern', 'Screenshot der vollständigen Fehlermeldung sowie kurze Beschreibung anfordern, wann der Fehler erscheint.'],
        ['Verbindungstyp und ScanSnap Home Version prüfen', 'Verbindungstyp, Betriebssystem und installierte ScanSnap Home Version notieren, damit der passende Pfad gewählt werden kann.'],
      ],
      en: [
        ['Clarify error context', 'First clarify whether error -5 occurs via USB, Wi‑Fi, or after a firmware update. Without this information, no specific path should be started yet.'],
        ['Request screenshot of the error message', 'Request a screenshot of the full error message and a short description of when the error appears.'],
        ['Check connection type and ScanSnap Home version', 'Record connection type, operating system and installed ScanSnap Home version so the correct path can be selected.'],
      ],
      pt: [
        ['Clarificar o contexto do erro', 'Primeiro é preciso esclarecer se o erro -5 ocorre por USB, Wi‑Fi ou após uma atualização de firmware. Sem esta informação, ainda não se deve iniciar um caminho técnico específico.'],
        ['Pedir screenshot da mensagem de erro', 'Pedir um screenshot completo da mensagem de erro e uma breve descrição de quando o erro aparece.'],
        ['Verificar tipo de ligação e versão do ScanSnap Home', 'Registar tipo de ligação, sistema operativo e versão instalada do ScanSnap Home para escolher o caminho correto.'],
      ],
      es: [
        ['Aclarar el contexto del error', 'Primero hay que aclarar si el error -5 ocurre por USB, Wi‑Fi o después de una actualización de firmware. Sin esta información no se debe iniciar una ruta específica.'],
        ['Solicitar captura del mensaje de error', 'Solicita una captura completa del error y una breve descripción de cuándo aparece.'],
        ['Comprobar tipo de conexión y versión de ScanSnap Home', 'Registra tipo de conexión, sistema operativo y versión instalada de ScanSnap Home para elegir la ruta correcta.'],
      ],
      fr: [
        ['Clarifier le contexte de l’erreur', 'Il faut d’abord savoir si l’erreur -5 apparaît en USB, en Wi‑Fi ou après une mise à jour firmware. Sans cela, aucun chemin spécifique ne doit être lancé.'],
        ['Demander une capture du message d’erreur', 'Demande une capture complète du message d’erreur et une brève description du moment où il apparaît.'],
        ['Vérifier le type de connexion et la version ScanSnap Home', 'Note le type de connexion, le système d’exploitation et la version ScanSnap Home installée pour choisir le bon chemin.'],
      ],
      it: [
        ['Chiarire il contesto dell’errore', 'Prima bisogna capire se l’errore -5 compare via USB, Wi‑Fi o dopo un aggiornamento firmware. Senza questa informazione non va avviato un percorso specifico.'],
        ['Richiedere screenshot del messaggio di errore', 'Richiedi uno screenshot completo dell’errore e una breve descrizione di quando compare.'],
        ['Controllare tipo di connessione e versione ScanSnap Home', 'Registra tipo di connessione, sistema operativo e versione installata di ScanSnap Home per scegliere il percorso corretto.'],
      ],
      nl: [
        ['Foutcontext verduidelijken', 'Eerst verduidelijken of fout -5 via USB, Wi‑Fi of na een firmware-update optreedt. Zonder deze informatie nog geen specifiek pad starten.'],
        ['Screenshot van foutmelding vragen', 'Vraag een volledige screenshot van de foutmelding en een korte beschrijving wanneer de fout verschijnt.'],
        ['Verbindingstype en ScanSnap Home-versie controleren', 'Noteer verbindingstype, besturingssysteem en geïnstalleerde ScanSnap Home-versie om het juiste pad te kiezen.'],
      ],
      ja: [
        ['エラー状況を確認', 'まずエラー -5 がUSB、Wi‑Fi、またはファームウェア更新後に発生するか確認します。これが不明な場合は特定の手順に進みません。'],
        ['エラーメッセージのスクリーンショットを依頼', '完全なエラーメッセージのスクリーンショットと、いつ表示されるかの簡単な説明を依頼します。'],
        ['接続タイプとScanSnap Homeバージョンを確認', '正しい手順を選ぶため、接続タイプ、OS、ScanSnap Homeのバージョンを確認します。'],
      ],
    },
  };

  const list = branchData[branch]?.[key] || branchData[branch]?.en || branchData.unsure[key] || branchData.unsure.en;

  return list.map((item, index) => ({
    title: item[0],
    instruction: item[1],
    difficulty: index < 2 ? 'easy' : index < 4 ? 'medium' : 'advanced',
    status: 'pending',
    result: '',
    note: '',
    timestamp: null,
    source: `error5_${branch}_branch`,
    route: branch === 'wifi' ? 'WIFI_CONNECTION' : branch === 'firmware' ? 'FIRMWARE_USB' : branch === 'usb' ? 'USB_CONNECTION' : 'SMART_ERROR5_CONTEXT',
    stepId: `ERROR5_${branch.toUpperCase()}_${index + 1}`,
    order: index + 1,
  }));
}


export default function Troubleshoot() {
  const navigate = useNavigate();
  const [session, setLocalSession] = useState(getSession());
  const [showBrain, setShowBrain] = useState(false);
  const [acceptedTopicShifts, setAcceptedTopicShifts] = useState({});
  const [waitingPromptOpen, setWaitingPromptOpen] = useState(false);
  const [selectedWaitingKeys, setSelectedWaitingKeys] = useState([]);
  const [waitingNoteDraft, setWaitingNoteDraft] = useState('');

  const { steps, currentStepIndex, problem, rootCause, issueType, status, kbEntry } = session;

  const settings = getSettings();
  const language = (settings.emailLanguage || 'de').toLowerCase();
  const ui = getUI(language);

  const brain = useMemo(
    () => runDecisionEngine(session, kbEntry || null, language),
    [session, kbEntry, language]
  );

  useEffect(() => {
    if (!steps || steps.length === 0) navigate('/');
  }, [steps, navigate]);

  const updateSession = (data) => {
    const updated = setSession(data);
    setLocalSession(updated);
  };

  const goPreviousStep = () => {
    if (currentStepIndex <= 0) {
      navigate('/');
      return;
    }
    const newIndex = currentStepIndex - 1;
    const updatedSteps = steps.map((step, index) => {
      if (index >= newIndex) {
        return {
          ...step,
          status: 'pending',
          result: '',
          note: '',
          timestamp: null,
        };
      }
      return step;
    });
    updateSession({
      steps: updatedSteps,
      currentStepIndex: newIndex,
      status: 'troubleshooting',
    });
  };

  const handleError5Branch = (branch) => {
    const branchSteps = error5BranchSteps(branch, language);
    const current = steps[currentStepIndex];

    const updatedSteps = [
      ...steps.slice(0, currentStepIndex),
      {
        ...current,
        status: 'done',
        note: branch === 'usb'
          ? 'Fehler -5 tritt bei USB auf.'
          : branch === 'wifi'
            ? 'Fehler -5 tritt bei WLAN/Wi-Fi auf.'
            : branch === 'firmware'
              ? 'Fehler -5 tritt nach bzw. im Zusammenhang mit Firmwareupdate auf.'
              : 'Fehler -5 Kontext noch unklar.',
        timestamp: new Date().toISOString(),
      },
      ...branchSteps,
    ];

    const performedSteps = [
      ...(session.performedSteps || []),
      {
        title: current?.title || 'Fehlercode -5 einordnen',
        status: 'done',
        note: branch === 'usb'
          ? 'Auswahl: USB'
          : branch === 'wifi'
            ? 'Auswahl: WLAN / Wi-Fi'
            : branch === 'firmware'
              ? 'Auswahl: Nach Firmwareupdate'
              : 'Auswahl: Noch unklar',
        timestamp: new Date().toISOString(),
      }
    ];

    updateSession({
      steps: updatedSteps,
      performedSteps,
      currentStepIndex: currentStepIndex + 1,
      status: 'troubleshooting',
      issueType: branch === 'wifi' ? 'network' : branch === 'firmware' ? 'firmware' : branch === 'usb' ? 'usb' : 'unknown',
      error5Branch: branch,
    });
  };


  const saveWaitingPoint = () => {
    const keys = selectedWaitingKeys.length ? selectedWaitingKeys : ['general_reply'];
    const waitingForText = keys.map(k => waitingText(k, language)).join(', ');
    const note = waitingNoteDraft.trim() || `${waitingUi('title', language)} ${waitingForText}`;

    const updatedSteps = [...steps];
    updatedSteps[currentStepIndex] = {
      ...updatedSteps[currentStepIndex],
      status: 'waiting_customer',
      waitingFor: keys,
      waitingForText,
      waitingNote: note,
      note: note,
      timestamp: new Date().toISOString(),
    };

    const performedSteps = [
      ...(session.performedSteps || []),
      {
        title: updatedSteps[currentStepIndex].title || updatedSteps[currentStepIndex].stepId || 'Waiting point',
        status: 'waiting_customer',
        waitingFor: keys,
        waitingForText,
        note,
        timestamp: new Date().toISOString(),
      }
    ];

    playAction();
    updateSession({ steps: updatedSteps, performedSteps, status: 'waiting_customer' });
    setWaitingPromptOpen(false);
    setSelectedWaitingKeys([]);
    setWaitingNoteDraft('');
    setTimeout(() => navigate('/final'), 300);
  };


  const handleStepResult = async (result, note = '') => {
    if (result === 'waiting_customer') {
      setWaitingPromptOpen(true);
      setSelectedWaitingKeys([]);
      setWaitingNoteDraft('');
      return;
    }

    const updatedSteps = [...steps];
    updatedSteps[currentStepIndex] = {
      ...updatedSteps[currentStepIndex],
      status: result,
      note,
      timestamp: new Date().toISOString(),
    };

    const performedSteps = [
      ...(session.performedSteps || []),
      {
        title: (updatedSteps[currentStepIndex].title && updatedSteps[currentStepIndex].title !== 'Step')
          ? updatedSteps[currentStepIndex].title
          : (updatedSteps[currentStepIndex].instruction || updatedSteps[currentStepIndex].body || updatedSteps[currentStepIndex].stepId || 'Nicht benannter Schritt'),
        status: result,
        note: note || '',
        timestamp: new Date().toISOString(),
      }
    ];

    if (result === 'solved') {
      playSuccess();
      recordSuccessfulStep({ ...session, steps: updatedSteps }, updatedSteps[currentStepIndex]);
      updateSession({ steps: updatedSteps, performedSteps, status: 'solved' });
      try {
        await base44.entities.SolvedCase.create({
          problem,
          device: session.device || 'Unknown',
          os: session.os || 'Unknown',
          connection_type: session.connectionType || 'Unknown',
          issue_type: issueType,
          root_cause: rootCause,
          steps: updatedSteps,
          solution_step_index: currentStepIndex,
          solved: true,
        });
      } catch {}
      setTimeout(() => navigate('/final'), 500);
      return;
    }

    playAction();
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < updatedSteps.length) {
      updateSession({ steps: updatedSteps, performedSteps, currentStepIndex: nextIndex, status: 'troubleshooting' });
    } else {
      const currentSession = { ...getSession(), steps: updatedSteps };
      const dynamicStep = generateNextDynamicStep(currentSession, kbEntry);
      if (dynamicStep) {
        const withDynamic = [...updatedSteps, dynamicStep];
        updateSession({ steps: withDynamic, performedSteps, currentStepIndex: withDynamic.length - 1, status: 'troubleshooting' });
      } else {
        updateSession({ steps: updatedSteps, performedSteps, status: 'exhausted' });
        setTimeout(() => navigate('/final'), 300);
      }
    }
  };

  if (!steps || steps.length === 0) return null;

  const currentStep = steps[currentStepIndex];
  const isWaiting = status === 'waiting_customer';
  const isActive = status === 'troubleshooting' || isWaiting;
  const stepTitle = cleanTitle(currentStep);
  const stepInstruction = String(currentStep?.instruction || currentStep?.body || '').trim();
  const personName = session?.supporterName || '';
  const topicShift = detectTopicShift(steps, currentStepIndex);
  const showTopicShiftPrompt = !!topicShift && !acceptedTopicShifts[currentStepIndex];
  const stepHint = quietStepHint(currentStep, currentStepIndex, language);
  const isError5ChoiceStep = isError5ContextStep(currentStep);
  const stepDots = steps.length > 1 ? steps.map((s, i) => ({
    isDone: ['solved', 'not_solved', 'not_possible', 'skipped', 'waiting_customer', 'blocked'].includes(s.status),
    isCurrent: i === currentStepIndex,
    isFailed: ['not_solved', 'not_possible'].includes(s.status),
  })) : [];

  return (
    <div style={pageStyle} className="pt-8 pb-8 px-5">
      <div className="max-w-3xl mx-auto space-y-5 pt-4">
        <div className="flex items-center justify-between">
          <button
            onClick={() => {
              if (isActive && currentStepIndex > 0) goPreviousStep();
              else navigate('/');
            }}
            className="flex items-center gap-1.5 text-sm text-white/30 hover:text-white/60 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {ui.back || 'Zurück'}
          </button>
          <div className="flex items-center gap-2">
            {(session.model || session.device) && (
              <span className="text-[10px] font-bold text-primary/60 tracking-wider uppercase">
                {(session.model || session.device).toUpperCase()}
              </span>
            )}
            <Link to="/history">
              <button className="p-1.5 rounded-lg text-white/20 hover:text-white/50 transition-colors">
                <History className="w-4 h-4" />
              </button>
            </Link>
            <button
              onClick={() => setShowBrain((b) => !b)}
              className={`p-1.5 rounded-lg transition-colors ${showBrain ? 'text-primary/60' : 'text-white/20 hover:text-white/40'}`}
              title="Technical Analysis"
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>
          </div>
        </div>

        {stepDots.length > 1 && (
          <div className="flex items-center gap-1.5 px-1">
            {stepDots.map((dot, i) => (
              <div
                key={i}
                className={`rounded-full transition-all duration-300 ${
                  dot.isCurrent  ? 'w-5 h-1.5 bg-primary' :
                  dot.isFailed   ? 'w-1.5 h-1.5 bg-secondary/50' :
                  dot.isDone     ? 'w-1.5 h-1.5 bg-primary/40' :
                  'w-1.5 h-1.5 bg-white/10'
                }`}
              />
            ))}
          </div>
        )}

        {isActive && currentStepIndex > 0 && (
          <button
            onClick={goPreviousStep}
            className="flex items-center gap-1.5 text-xs text-white/35 hover:text-white/65 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            {language === 'de' ? 'Vorheriger Schritt' : language === 'pt' ? 'Passo anterior' : 'Previous step'}
          </button>
        )}

        {isActive && currentStep && (
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStepIndex}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -18 }}
              transition={{ duration: 0.25 }}
              className="px-3 py-8 md:px-8 md:py-10"
            >
              <div className="text-center max-w-3xl mx-auto">
                {isError5ChoiceStep ? (
                  <div className="min-h-[560px] flex flex-col items-center justify-center">
                    <p className="text-[11px] uppercase tracking-[0.28em] text-primary/70 mb-5">
                      {actionLabel('classify_error5', language)}
                    </p>
                    <h1 className="text-3xl md:text-5xl font-semibold text-white leading-tight">
                      {stepTitle}
                    </h1>
                    {stepInstruction && (
                      <p className="mt-7 text-xl md:text-2xl text-white/88 leading-relaxed max-w-3xl">
                        {stepInstruction}
                      </p>
                    )}

                    <motion.img
                      src={brainNeon}
                      alt="Support Brain"
                      className="mt-14 w-72 md:w-96 object-contain"
                      animate={{ y: [0, -10, -14, -8, 0], x: [0, 3, -2, 2, 0], rotate: [0, -0.35, 0.3, -0.18, 0], scale: [1, 1.012, 1.018, 1.01, 1] }}
                      transition={{ duration: 8.8, repeat: Infinity, ease: 'easeInOut' }}
                      style={{
                        mixBlendMode: 'screen',
                        opacity: 0.86,
                        WebkitMaskImage: 'radial-gradient(ellipse at center, black 0%, black 30%, rgba(0,0,0,0.70) 46%, rgba(0,0,0,0.20) 60%, transparent 76%)',
                        maskImage: 'radial-gradient(ellipse at center, black 0%, black 30%, rgba(0,0,0,0.70) 46%, rgba(0,0,0,0.20) 60%, transparent 76%)',
                        clipPath: 'ellipse(48% 43% at 50% 50%)',
                        filter: 'brightness(0.92) contrast(1.14) drop-shadow(0 0 54px rgba(45,212,191,0.82)) drop-shadow(0 0 120px rgba(236,72,153,0.62)) drop-shadow(0 0 175px rgba(80,110,255,0.44))'
                      }}
                    />

                    <div className="mt-12 flex flex-wrap items-center justify-center gap-x-8 gap-y-4 text-lg">
                      <button onClick={() => handleError5Branch('usb')} className="text-primary hover:text-primary/80 transition-colors">
                        {ERROR5_BRANCH_LABELS[language]?.usb || ERROR5_BRANCH_LABELS.de.usb}
                      </button>
                      <button onClick={() => handleError5Branch('wifi')} className="text-white/80 hover:text-white transition-colors">
                        {ERROR5_BRANCH_LABELS[language]?.wifi || ERROR5_BRANCH_LABELS.de.wifi}
                      </button>
                      <button onClick={() => handleError5Branch('firmware')} className="text-amber-400 hover:text-amber-300 transition-colors">
                        {ERROR5_BRANCH_LABELS[language]?.firmware || ERROR5_BRANCH_LABELS.de.firmware}
                      </button>
                      <button onClick={() => handleError5Branch('unsure')} className="text-white/45 hover:text-white/70 transition-colors">
                        {ERROR5_BRANCH_LABELS[language]?.unsure || ERROR5_BRANCH_LABELS.de.unsure}
                      </button>
                    </div>
                  </div>
                ) : showTopicShiftPrompt ? (
                  <div className="min-h-[560px] flex flex-col items-center justify-center">
                    <p className="text-[11px] uppercase tracking-[0.28em] text-primary/70 mb-5">
                      {actionLabel('new_lead', language)}
                    </p>
                    <h1 className="text-3xl md:text-5xl font-semibold text-white leading-tight">
                      {topicLabel(topicShift.to, language)}
                    </h1>
                    <p className="mt-7 text-xl md:text-2xl text-white/88 leading-relaxed max-w-2xl">
                      {detectiveQuestion(personName, topicShift, language)}
                    </p>

                    <motion.img
                      src={brainNeon}
                      alt="Support Brain"
                      className="mt-14 w-72 md:w-96 object-contain"
                      animate={{ y: [0, -10, -14, -8, 0], x: [0, 3, -2, 2, 0], rotate: [0, -0.35, 0.3, -0.18, 0], scale: [1, 1.012, 1.018, 1.01, 1] }}
                      transition={{ duration: 8.8, repeat: Infinity, ease: 'easeInOut' }}
                      style={{
                        mixBlendMode: 'screen',
                        opacity: 0.86,
                        WebkitMaskImage: 'radial-gradient(ellipse at center, black 0%, black 30%, rgba(0,0,0,0.70) 46%, rgba(0,0,0,0.20) 60%, transparent 76%)',
                        maskImage: 'radial-gradient(ellipse at center, black 0%, black 30%, rgba(0,0,0,0.70) 46%, rgba(0,0,0,0.20) 60%, transparent 76%)',
                        clipPath: 'ellipse(48% 43% at 50% 50%)',
                        filter: 'brightness(0.92) contrast(1.14) drop-shadow(0 0 54px rgba(45,212,191,0.82)) drop-shadow(0 0 120px rgba(236,72,153,0.62)) drop-shadow(0 0 175px rgba(80,110,255,0.44))'
                      }}
                    />

                    <div className="mt-12 flex flex-wrap items-center justify-center gap-x-10 gap-y-4 text-lg">
                      <button
                        onClick={() => setAcceptedTopicShifts(prev => ({ ...prev, [currentStepIndex]: true }))}
                        className="text-primary hover:text-primary/80 transition-colors"
                      >
                        {actionLabel('yes_lead', language)}
                      </button>
                      <button
                        onClick={goPreviousStep}
                        className="text-white/70 hover:text-white transition-colors"
                      >
                        {actionLabel('no_back', language)}
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <h1 className="text-3xl md:text-5xl font-semibold text-white leading-tight">
                      {stepTitle}
                    </h1>

                    {stepHint && (
                      <p className="mt-6 text-lg md:text-xl text-white/82 leading-relaxed">
                        {stepHint}
                      </p>
                    )}

                    {stepInstruction && (
                      <div className="mt-8 px-2 py-2 text-white/92 text-lg md:text-xl leading-relaxed">
                        {stepInstruction}
                      </div>
                    )}

                    <motion.button
                      onClick={() => handleStepResult('not_solved')}
                      className="group mt-16 relative inline-flex items-center justify-center bg-transparent border-0 p-0 rounded-full focus:outline-none"
                      title={language === 'de' ? 'Nächsten Schritt öffnen' : 'Open next step'}
                      animate={{ y: [0, -11, -15, -9, 0], x: [0, 3, -2, 2, 0], rotate: [0, -0.35, 0.3, -0.18, 0], scale: [1, 1.012, 1.018, 1.01, 1] }}
                      transition={{ duration: 9.2, repeat: Infinity, ease: 'easeInOut' }}
                    >
                      <span
                        aria-hidden="true"
                        className="absolute inset-[-18%] rounded-full blur-3xl opacity-70"
                        style={{
                          background: 'radial-gradient(ellipse at center, rgba(45,212,191,0.30) 0%, rgba(236,72,153,0.22) 42%, transparent 72%)'
                        }}
                      />
                      <img
                        src={brainNeon}
                        alt="Continue"
                        className="w-72 md:w-96 object-contain opacity-95 transition-transform duration-300 group-hover:scale-[1.035]"
                        style={{
                          mixBlendMode: 'screen',
                          opacity: 0.86,
                          WebkitMaskImage: 'radial-gradient(ellipse at center, black 0%, black 30%, rgba(0,0,0,0.70) 46%, rgba(0,0,0,0.20) 60%, transparent 76%)',
                          maskImage: 'radial-gradient(ellipse at center, black 0%, black 30%, rgba(0,0,0,0.70) 46%, rgba(0,0,0,0.20) 60%, transparent 76%)',
                          clipPath: 'ellipse(48% 43% at 50% 50%)',
                        filter: 'brightness(0.92) contrast(1.14) drop-shadow(0 0 58px rgba(45,212,191,0.86)) drop-shadow(0 0 130px rgba(236,72,153,0.62)) drop-shadow(0 0 185px rgba(85,105,255,0.45))'
                        }}
                      />
                    </motion.button>

                    <div className="mt-12 flex flex-wrap items-center justify-center gap-x-9 gap-y-3 text-lg">
                      <button
                        onClick={() => handleStepResult('solved')}
                        className="text-primary hover:text-primary/80 transition-colors"
                      >
                        {actionLabel('solved', language)}
                      </button>
                      <button
                        onClick={() => handleStepResult('not_possible')}
                        className="text-white/70 hover:text-white transition-colors"
                      >
                        {actionLabel('not_possible', language)}
                      </button>
                      <button
                        onClick={() => handleStepResult('waiting_customer')}
                        className="text-amber-400 hover:text-amber-300 transition-colors"
                      >
                        {actionLabel('waiting', language)}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        )}

        {isWaiting && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <Button
              onClick={() => navigate('/final')}
              className="w-full bg-white/5 hover:bg-white/10 text-white/60 border border-white/10 h-11"
              variant="outline"
            >
              <ArrowRight className="w-4 h-4 mr-2" />
              {ui.generate_email || 'Build Customer Email & Summary'}
            </Button>
          </motion.div>
        )}

        <AnimatePresence>
          {showBrain && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="relative overflow-visible">
                <div
                  className="pointer-events-none absolute left-1/2 -translate-x-1/2 top-[240px] w-[640px] h-[430px] rounded-full blur-3xl opacity-75"
                  style={{
                    background: 'radial-gradient(circle at center, rgba(69,226,255,0.18) 0%, rgba(177,79,255,0.15) 28%, rgba(27,13,48,0.10) 52%, transparent 76%)',
                    filter: 'blur(48px)',
                  }}
                />
                <BrainPanel brain={brain} />
                <div
                  className="pointer-events-none absolute left-1/2 -translate-x-1/2 top-[210px] w-[700px] h-[500px]"
                  style={{
                    background: 'radial-gradient(circle at center, rgba(0,0,0,0) 0%, rgba(3,5,14,0) 26%, rgba(4,6,17,0.12) 38%, rgba(4,6,17,0.42) 58%, rgba(4,6,17,0.86) 76%, rgba(4,6,17,0.96) 100%)',
                    borderRadius: '9999px',
                    filter: 'blur(18px)',
                    mixBlendMode: 'multiply',
                  }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {waitingPromptOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-5" style={{ background: 'rgba(0,0,0,0.64)', backdropFilter: 'blur(10px)' }}>
            <motion.div
              initial={{ opacity: 0, y: 18, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className="w-full max-w-lg rounded-3xl p-6"
              style={{ background: 'linear-gradient(135deg, rgba(5,10,24,0.96), rgba(18,6,22,0.96))', border: '1px solid rgba(120,240,255,0.16)', boxShadow: '0 0 70px rgba(45,212,191,0.14)' }}
            >
              <p className="text-xl font-semibold text-white">{waitingUi('title', language)}</p>
              <p className="mt-2 text-sm text-white/50 leading-relaxed">{waitingUi('hint', language)}</p>

              <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-2">
                {WAITING_OPTIONS.map((item) => {
                  const active = selectedWaitingKeys.includes(item.key);
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => setSelectedWaitingKeys(prev => active ? prev.filter(k => k !== item.key) : [...prev, item.key])}
                      className={`rounded-2xl px-4 py-3 text-sm text-left transition-all ${active ? 'bg-primary/15 border-primary/45 text-white' : 'bg-white/[0.035] border-white/10 text-white/65 hover:text-white hover:border-white/20'}`}
                      style={{ borderWidth: 1 }}
                    >
                      {waitingText(item.key, language)}
                    </button>
                  );
                })}
              </div>

              <textarea
                value={waitingNoteDraft}
                onChange={(e) => setWaitingNoteDraft(e.target.value)}
                placeholder={waitingUi('note', language)}
                className="mt-4 w-full rounded-2xl px-4 py-3 text-sm text-white outline-none"
                style={{ minHeight: 78, background: 'rgba(0,0,0,0.26)', border: '1px solid rgba(255,255,255,0.10)', resize: 'vertical' }}
              />

              <div className="mt-5 flex items-center justify-end gap-3">
                <button onClick={() => setWaitingPromptOpen(false)} className="text-sm text-white/45 hover:text-white/75">
                  {waitingUi('cancel', language)}
                </button>
                <Button onClick={saveWaitingPoint} className="bg-primary hover:bg-primary/90 text-white">
                  {waitingUi('save', language)}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}
