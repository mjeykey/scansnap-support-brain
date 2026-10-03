// Generic email modules only. Product- and manufacturer-specific content was removed.
export const EMAIL_MODULES = {
  greeting: {
    key: 'greeting', category: 'structure',
    text: {
      de: 'Guten Tag,\n\nvielen Dank für Ihre Nachricht.',
      en: 'Hello,\n\nThank you for your message.',
      pt: 'Olá,\n\nObrigado pela sua mensagem.'
    }
  },
  closing: {
    key: 'closing', category: 'structure',
    text: {
      de: 'Bitte antworten Sie direkt auf diese E-Mail und teilen Sie uns das Ergebnis mit.\n\nMit freundlichen Grüßen\n[Supporter Name]',
      en: 'Please reply directly to this email and let us know the result.\n\nBest regards\n[Supporter Name]',
      pt: 'Por favor, responda diretamente a este e-mail e informe-nos do resultado.\n\nAtenciosamente\n[Supporter Name]'
    }
  },
  usb_direct: {
    key: 'usb_direct', category: 'troubleshooting',
    text: {
      de: 'Bitte verbinden Sie das Gerät direkt mit einem USB-Anschluss des Computers, ohne Hub, Dockingstation oder Verlängerung. Testen Sie nach Möglichkeit einen anderen USB-Anschluss und ein anderes Kabel.',
      en: 'Please connect the device directly to a USB port on the computer, without a hub, docking station or extension. If possible, try another USB port and cable.',
      pt: 'Ligue o dispositivo diretamente a uma porta USB do computador, sem hub, dock ou extensão. Se possível, teste outra porta USB e outro cabo.'
    }
  },
  wifi_check: {
    key: 'wifi_check', category: 'troubleshooting',
    text: {
      de: 'Bitte prüfen Sie, ob Gerät und Computer mit demselben Netzwerk verbunden sind. Starten Sie Gerät und Router neu und testen Sie die Verbindung erneut.',
      en: 'Please check that the device and computer are connected to the same network. Restart the device and router, then test the connection again.',
      pt: 'Verifique se o dispositivo e o computador estão ligados à mesma rede. Reinicie o dispositivo e o router e teste novamente.'
    }
  },
  request_error: {
    key: 'request_error', category: 'request',
    text: {
      de: 'Bitte senden Sie uns den genauen Wortlaut der Fehlermeldung oder einen Screenshot.',
      en: 'Please send us the exact error message or a screenshot.',
      pt: 'Envie-nos a mensagem de erro exata ou um screenshot.'
    }
  },
  request_missing_info: {
    key: 'request_missing_info', category: 'request',
    text: {
      de: 'Bitte teilen Sie uns Modell, Betriebssystem, Verbindungsart und eine kurze Beschreibung des Problems mit.',
      en: 'Please provide the model, operating system, connection type and a short description of the issue.',
      pt: 'Indique-nos o modelo, sistema operativo, tipo de ligação e uma breve descrição do problema.'
    }
  },
  waiting_response: {
    key: 'waiting_response', category: 'status',
    text: {
      de: 'Bitte testen Sie den beschriebenen Schritt und teilen Sie uns das Ergebnis mit.',
      en: 'Please test the described step and let us know the result.',
      pt: 'Teste o passo descrito e informe-nos do resultado.'
    }
  }
};

export function getModuleText(moduleKey, lang='en') {
  const mod = EMAIL_MODULES[moduleKey];
  if (!mod) return '';
  return mod.text[lang] || mod.text.en || '';
}

export function assembleEmail(selectedKeys=[], lang='en', supporterName='') {
  const parts=[getModuleText('greeting',lang)];
  for (const key of selectedKeys) {
    if (!['greeting','closing'].includes(key)) {
      const text=getModuleText(key,lang);
      if (text) parts.push(text);
    }
  }
  let closing=getModuleText('closing',lang);
  if (supporterName) closing=closing.replace('[Supporter Name]',supporterName);
  parts.push(closing);
  return parts.filter(Boolean).join('\n\n');
}

export function suggestModules(session={}, brain={}) {
  const out=[];
  const connection=String(session.connectionType || session.connection || '').toLowerCase();
  if (connection.includes('usb')) out.push('usb_direct');
  if (connection.includes('wifi') || connection.includes('wi-fi') || connection.includes('wlan')) out.push('wifi_check');
  if (!session.problem) out.push('request_error');
  if (!session.model || !session.os || !connection) out.push('request_missing_info');
  out.push('waiting_response');
  return [...new Set(out)];
}
