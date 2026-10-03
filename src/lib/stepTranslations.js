// Generic troubleshooting step translations.
const stepTranslations = {
  verifyDeviceState: {
    de: { title: 'Gerätestatus prüfen', body: 'Schalten Sie das Gerät ein und beschreiben Sie genau, was angezeigt wird und wie es sich verhält.', difficulty: 'easy' },
    en: { title: 'Verify device state', body: 'Power on the device and describe exactly what is displayed and how it behaves.', difficulty: 'easy' },
    pt: { title: 'Verificar estado do dispositivo', body: 'Ligue o dispositivo e descreva exatamente o que é apresentado e como se comporta.', difficulty: 'easy' }
  },
  directUsbConnectionTest: {
    de: { title: 'Direkte USB-Verbindung testen', body: 'Verbinden Sie das Gerät direkt mit einem USB-Anschluss des Computers. Verwenden Sie keinen Hub oder Dock und testen Sie nach Möglichkeit ein anderes Kabel.', difficulty: 'easy' },
    en: { title: 'Test direct USB connection', body: 'Connect the device directly to a USB port on the computer. Do not use a hub or dock and try another cable if possible.', difficulty: 'easy' },
    pt: { title: 'Testar ligação USB direta', body: 'Ligue o dispositivo diretamente a uma porta USB do computador. Não use hub ou dock e teste outro cabo, se possível.', difficulty: 'easy' }
  },
  wifiConnectionTest: {
    de: { title: 'Netzwerkverbindung prüfen', body: 'Prüfen Sie, ob Gerät und Computer im selben Netzwerk sind. Starten Sie Gerät und Router neu und testen Sie erneut.', difficulty: 'easy' },
    en: { title: 'Check network connection', body: 'Check that the device and computer are on the same network. Restart the device and router, then test again.', difficulty: 'easy' },
    pt: { title: 'Verificar ligação de rede', body: 'Verifique se o dispositivo e o computador estão na mesma rede. Reinicie o dispositivo e o router e teste novamente.', difficulty: 'easy' }
  },
  collectErrorDetails: {
    de: { title: 'Fehlerdetails erfassen', body: 'Notieren Sie den genauen Fehlertext oder Fehlercode und erstellen Sie bei Bedarf einen Screenshot.', difficulty: 'easy' },
    en: { title: 'Collect error details', body: 'Note the exact error text or error code and take a screenshot if needed.', difficulty: 'easy' },
    pt: { title: 'Recolher detalhes do erro', body: 'Anote o texto ou código de erro exato e faça um screenshot, se necessário.', difficulty: 'easy' }
  }
};

export function resolveStep(stepId, lang='en') {
  const step=stepTranslations[stepId];
  if (!step) return { title: stepId || '', body: '', difficulty: 'medium' };
  return step[lang] || step.en || { title: stepId || '', body: '', difficulty: 'medium' };
}

export default stepTranslations;
