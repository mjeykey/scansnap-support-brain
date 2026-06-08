// ============================================================
// EMAIL MODULES — Local, deterministic, multilingual
// All customer emails are assembled from fixed approved modules.
// NO AI. NO generation. Same module = same wording every time.
// ============================================================

// ── Module definitions ───────────────────────────────────────
// Each module has a key, a category tag, and translations for all 9 languages.

export const EMAIL_MODULES = {

  greeting: {
    key: 'greeting',
    category: 'structure',
    label: { en: 'Greeting', de: 'Anrede', fr: 'Salutation', es: 'Saludo', pt: 'Saudação', it: 'Saluto', nl: 'Aanhef', ja: '挨拶', zh: '问候' },
    text: {
      de: 'Guten Tag,\n\nvielen Dank für Ihre Nachricht. Bitte führen Sie den folgenden nächsten Schritt durch und teilen Sie uns das Ergebnis mit.',
      en: 'Hello,\n\nThank you for your message. Please perform the following next step and let us know the result.',
      fr: 'Bonjour,\n\nMerci pour votre message. Veuillez effectuer l\'étape suivante et nous communiquer le résultat.',
      es: 'Hola,\n\nGracias por su mensaje. Realice el siguiente paso e indíquenos el resultado.',
      pt: 'Olá,\n\nObrigado pela sua mensagem. Execute o próximo passo abaixo e informe-nos do resultado.',
      it: 'Buongiorno,\n\nGrazie per il messaggio. Esegua il prossimo passaggio e ci comunichi il risultato.',
      nl: 'Goedendag,\n\nBedankt voor uw bericht. Voer de volgende stap uit en laat ons het resultaat weten.',
      ja: 'こんにちは。\n\nお問い合わせありがとうございます。次の手順を実行し、結果をお知らせください。',
      zh: '您好，\n\n感谢您的来信。请执行以下下一步操作，并告知我们结果。',
    },
  },

  closing: {
    key: 'closing',
    category: 'structure',
    label: { en: 'Closing', de: 'Abschluss', fr: 'Conclusion', es: 'Cierre', pt: 'Encerramento', it: 'Chiusura', nl: 'Afsluiting', ja: '結び', zh: '结束语' },
    text: {
      de: 'Bitte antworten Sie direkt auf diese E-Mail, damit kein neuer Vorgang entsteht. Wenn Sie uns telefonisch kontaktieren, nennen Sie bitte möglichst immer Ihre Fallnummer, damit wir Ihren bestehenden Vorgang direkt aufrufen können.\n\nMit freundlichen Grüßen\n\n[Supporter Name]\nPFU Tech Support Team',
      en: 'Please reply directly to this email so no duplicate case is created. If you contact us by phone, please mention your case number so we can locate the existing case immediately.\n\nBest regards\n\n[Supporter Name]\nPFU Tech Support Team',
      fr: 'Veuillez répondre directement à cet e-mail afin qu\'aucun doublon de dossier ne soit créé.\n\nCordialement\n\n[Supporter Name]\nPFU Tech Support Team',
      es: 'Por favor, responda directamente a este correo para que no se cree un caso duplicado.\n\nAtentamente\n\n[Supporter Name]\nPFU Tech Support Team',
      pt: 'Por favor, responda diretamente a este e-mail para que nenhum caso duplicado seja criado.\n\nAtenciosamente\n\n[Supporter Name]\nPFU Tech Support Team',
      it: 'La preghiamo di rispondere direttamente a questa e-mail affinché non venga creato un caso duplicato.\n\nCordiali saluti\n\n[Supporter Name]\nPFU Tech Support Team',
      nl: 'Antwoord alstublieft rechtstreeks op deze e-mail zodat er geen dubbel dossier wordt aangemaakt.\n\nMet vriendelijke groet\n\n[Supporter Name]\nPFU Tech Support Team',
      ja: 'このメールに直接ご返信ください。重複ケースを防ぐためです。\n\nよろしくお願いいたします。\n\n[Supporter Name]\nPFU Tech Support Team',
      zh: '请直接回复此邮件，以避免创建重复工单。\n\n此致\n\n[Supporter Name]\nPFU Tech Support Team',
    },
  },

  usb_direct: {
    key: 'usb_direct',
    category: 'troubleshooting',
    label: { en: 'USB Direct Connection', de: 'USB Direktverbindung', fr: 'Connexion USB directe', es: 'Conexión USB directa', pt: 'Conexão USB direta', it: 'Connessione USB diretta', nl: 'Directe USB-verbinding', ja: 'USB直接接続', zh: 'USB直接连接' },
    text: {
      de: 'Bitte schließen Sie den Scanner direkt an einen USB-Anschluss Ihres Computers an – ohne USB-Hub, Docking-Station oder Verlängerungskabel. Testen Sie verschiedene USB-Anschlüsse (vorzugsweise einen USB-Anschluss auf der Rückseite des Computers). Starten Sie danach den Scanner neu und prüfen Sie, ob er von ScanSnap Home erkannt wird.',
      en: 'Please connect the scanner directly to a USB port on your computer — without any USB hub, docking station, or extension cable. Try different USB ports (preferably a rear USB port on the computer). Restart the scanner and check if it is detected by ScanSnap Home.',
      fr: 'Veuillez connecter le scanner directement à un port USB de votre ordinateur — sans concentrateur USB, station d\'accueil ou câble d\'extension. Essayez différents ports USB (de préférence un port USB à l\'arrière de l\'ordinateur). Redémarrez le scanner et vérifiez s\'il est détecté par ScanSnap Home.',
      es: 'Por favor conecte el escáner directamente a un puerto USB de su ordenador, sin ningún hub USB, estación de acoplamiento ni cable de extensión. Pruebe diferentes puertos USB (preferiblemente un puerto USB en la parte trasera del ordenador). Reinicie el escáner y compruebe si ScanSnap Home lo detecta.',
      pt: 'Por favor, conecte o scanner diretamente a uma porta USB do seu computador, sem nenhum hub USB, estação de acoplamento ou cabo de extensão. Tente diferentes portas USB (de preferência uma porta USB na parte traseira do computador). Reinicie o scanner e verifique se o ScanSnap Home o detecta.',
      it: 'Si prega di collegare lo scanner direttamente a una porta USB del computer, senza hub USB, docking station o cavi di prolunga. Provi porte USB diverse (preferibilmente una porta USB sul retro del computer). Riavvii lo scanner e verifichi se viene rilevato da ScanSnap Home.',
      nl: 'Sluit de scanner rechtstreeks aan op een USB-poort van uw computer — zonder USB-hub, dockingstation of verlengkabel. Probeer verschillende USB-poorten (bij voorkeur een USB-poort aan de achterkant van de computer). Herstart de scanner en controleer of deze wordt herkend door ScanSnap Home.',
      ja: 'スキャナーをコンピューターのUSBポートに直接接続してください。USBハブ、ドッキングステーション、延長ケーブルは使用しないでください。別のUSBポート（できればコンピューター背面のポート）をお試しください。スキャナーを再起動し、ScanSnap Homeで認識されるか確認してください。',
      zh: '请将扫描仪直接连接到计算机的USB端口，不要使用USB集线器、扩展坞或延长线。尝试不同的USB端口（最好是计算机背面的USB端口）。重启扫描仪并检查ScanSnap Home是否能够识别它。',
    },
  },

  firmware_update_normal: {
    key: 'firmware_update_normal',
    category: 'troubleshooting',
    label: { en: 'Firmware Update (Standard)', de: 'Firmware-Aktualisierung (Standard)', fr: 'Mise à jour du firmware', es: 'Actualización de firmware', pt: 'Atualização de firmware', it: 'Aggiornamento firmware', nl: 'Firmware-update', ja: 'ファームウェア更新（標準）', zh: '固件更新（标准）' },
    text: {
      de: 'Bitte führen Sie eine Firmware-Aktualisierung über ScanSnap Home durch:\n1. Öffnen Sie ScanSnap Home\n2. Gehen Sie zu Einstellungen → Scanner-Informationen\n3. Falls ein Update verfügbar ist, führen Sie es über eine direkte USB-Verbindung durch (kein WLAN)\n4. Trennen Sie den Scanner während des Updates nicht vom Computer',
      en: 'Please perform a firmware update via ScanSnap Home:\n1. Open ScanSnap Home\n2. Go to Settings → Scanner Information\n3. If an update is available, apply it via a direct USB connection (not Wi-Fi)\n4. Do not disconnect the scanner during the update',
      fr: 'Veuillez effectuer une mise à jour du firmware via ScanSnap Home:\n1. Ouvrez ScanSnap Home\n2. Allez dans Paramètres → Informations sur le scanner\n3. Si une mise à jour est disponible, appliquez-la via une connexion USB directe (pas Wi-Fi)\n4. Ne déconnectez pas le scanner pendant la mise à jour',
      es: 'Por favor realice una actualización de firmware a través de ScanSnap Home:\n1. Abra ScanSnap Home\n2. Vaya a Configuración → Información del escáner\n3. Si hay una actualización disponible, aplíquela a través de una conexión USB directa (no Wi-Fi)\n4. No desconecte el escáner durante la actualización',
      pt: 'Por favor, realize uma atualização de firmware através do ScanSnap Home:\n1. Abra o ScanSnap Home\n2. Vá para Configurações → Informações do Scanner\n3. Se houver uma atualização disponível, aplique-a via conexão USB direta (não Wi-Fi)\n4. Não desconecte o scanner durante a atualização',
      it: 'Si prega di eseguire un aggiornamento del firmware tramite ScanSnap Home:\n1. Aprire ScanSnap Home\n2. Andare in Impostazioni → Informazioni scanner\n3. Se è disponibile un aggiornamento, applicarlo tramite connessione USB diretta (non Wi-Fi)\n4. Non disconnettere lo scanner durante l\'aggiornamento',
      nl: 'Voer een firmware-update uit via ScanSnap Home:\n1. Open ScanSnap Home\n2. Ga naar Instellingen → Scannerinformatie\n3. Als er een update beschikbaar is, pas deze toe via een directe USB-verbinding (niet via Wi-Fi)\n4. Verbreek de verbinding met de scanner niet tijdens de update',
      ja: 'ScanSnap Homeを通じてファームウェアの更新を行ってください：\n1. ScanSnap Homeを開く\n2. 設定 → スキャナー情報に移動\n3. 更新が利用可能な場合は、USB直接接続で適用（Wi-Fiは不可）\n4. 更新中はスキャナーを切断しないでください',
      zh: '请通过ScanSnap Home执行固件更新：\n1. 打开ScanSnap Home\n2. 进入设置 → 扫描仪信息\n3. 如果有更新可用，请通过直接USB连接应用（不要使用Wi-Fi）\n4. 更新过程中请勿断开扫描仪连接',
    },
  },

  sshomeclean: {
    key: 'sshomeclean',
    category: 'troubleshooting',
    label: { en: 'SSHomeClean Cleanup', de: 'SSHomeClean Bereinigung', fr: 'Nettoyage SSHomeClean', es: 'Limpieza SSHomeClean', pt: 'Limpeza SSHomeClean', it: 'Pulizia SSHomeClean', nl: 'SSHomeClean opschoning', ja: 'SSHomeClean クリーンアップ', zh: 'SSHomeClean清理' },
    text: {
      de: 'Bitte führen Sie eine vollständige Bereinigung von ScanSnap Home durch:\n1. Laden Sie das Tool SSHomeClean.exe von der PFU-Support-Seite herunter\n2. Führen Sie SSHomeClean.exe als Administrator aus\n3. Starten Sie den Computer nach der Bereinigung neu\n4. Installieren Sie ScanSnap Home anschließend neu (Download von der offiziellen PFU-Seite)\n5. Schließen Sie den Scanner nach der Neuinstallation per USB an',
      en: 'Please perform a full ScanSnap Home cleanup:\n1. Download the SSHomeClean.exe tool from the PFU support page\n2. Run SSHomeClean.exe as Administrator\n3. Restart the computer after the cleanup\n4. Reinstall ScanSnap Home (download from the official PFU website)\n5. Connect the scanner via USB after reinstallation',
      fr: 'Veuillez effectuer un nettoyage complet de ScanSnap Home:\n1. Téléchargez l\'outil SSHomeClean.exe depuis la page de support PFU\n2. Exécutez SSHomeClean.exe en tant qu\'Administrateur\n3. Redémarrez l\'ordinateur après le nettoyage\n4. Réinstallez ScanSnap Home (téléchargement depuis le site officiel PFU)\n5. Connectez le scanner via USB après la réinstallation',
      es: 'Por favor realice una limpieza completa de ScanSnap Home:\n1. Descargue la herramienta SSHomeClean.exe desde la página de soporte de PFU\n2. Ejecute SSHomeClean.exe como Administrador\n3. Reinicie el ordenador después de la limpieza\n4. Reinstale ScanSnap Home (descarga desde el sitio oficial de PFU)\n5. Conecte el escáner por USB después de la reinstalación',
      pt: 'Por favor, realize uma limpeza completa do ScanSnap Home:\n1. Baixe a ferramenta SSHomeClean.exe da página de suporte da PFU\n2. Execute SSHomeClean.exe como Administrador\n3. Reinicie o computador após a limpeza\n4. Reinstale o ScanSnap Home (download do site oficial da PFU)\n5. Conecte o scanner via USB após a reinstalação',
      it: 'Si prega di eseguire una pulizia completa di ScanSnap Home:\n1. Scaricare lo strumento SSHomeClean.exe dalla pagina di supporto PFU\n2. Eseguire SSHomeClean.exe come Amministratore\n3. Riavviare il computer dopo la pulizia\n4. Reinstallare ScanSnap Home (download dal sito ufficiale PFU)\n5. Collegare lo scanner tramite USB dopo la reinstallazione',
      nl: 'Voer een volledige ScanSnap Home-opschoning uit:\n1. Download de tool SSHomeClean.exe van de PFU-ondersteuningspagina\n2. Voer SSHomeClean.exe uit als Beheerder\n3. Start de computer opnieuw op na de opschoning\n4. Installeer ScanSnap Home opnieuw (download van de officiële PFU-website)\n5. Sluit de scanner na de herinstallatie aan via USB',
      ja: 'ScanSnap Homeの完全なクリーンアップを行ってください：\n1. PFUサポートページからSSHomeClean.exeをダウンロード\n2. SSHomeClean.exeを管理者として実行\n3. クリーンアップ後にコンピューターを再起動\n4. ScanSnap Homeを再インストール（公式PFUサイトからダウンロード）\n5. 再インストール後、USB経由でスキャナーを接続',
      zh: '请执行ScanSnap Home的完整清理：\n1. 从PFU支持页面下载SSHomeClean.exe工具\n2. 以管理员身份运行SSHomeClean.exe\n3. 清理后重启计算机\n4. 重新安装ScanSnap Home（从PFU官方网站下载）\n5. 重新安装后通过USB连接扫描仪',
    },
  },

  sfc_dism: {
    key: 'sfc_dism',
    category: 'troubleshooting',
    label: { en: 'Windows System Repair (SFC/DISM)', de: 'Windows Systemreparatur (SFC/DISM)', fr: 'Réparation système Windows (SFC/DISM)', es: 'Reparación del sistema Windows (SFC/DISM)', pt: 'Reparo do sistema Windows (SFC/DISM)', it: 'Riparazione sistema Windows (SFC/DISM)', nl: 'Windows systeemherstel (SFC/DISM)', ja: 'Windowsシステム修復（SFC/DISM）', zh: 'Windows系统修复（SFC/DISM）' },
    text: {
      de: 'Bitte führen Sie eine Windows-Systemintegritätsprüfung durch:\n1. Öffnen Sie die Eingabeaufforderung als Administrator\n2. Führen Sie aus: sfc /scannow — warten Sie auf den Abschluss\n3. Starten Sie den Computer neu\n4. Führen Sie aus: DISM /Online /Cleanup-Image /RestoreHealth — warten Sie ca. 10–20 Minuten\n5. Starten Sie den Computer erneut neu\n6. Wiederholen Sie sfc /scannow bis die Meldung erscheint: "Windows-Ressourcenschutz hat keine Integritätsverletzungen gefunden."\n7. Testen Sie danach erneut die Verbindung des Scanners',
      en: 'Please perform a Windows system integrity check:\n1. Open Command Prompt as Administrator\n2. Run: sfc /scannow — wait for completion\n3. Restart the computer\n4. Run: DISM /Online /Cleanup-Image /RestoreHealth — wait approx. 10–20 min\n5. Restart the computer again\n6. Repeat sfc /scannow until you see: "Windows Resource Protection did not find any integrity violations."\n7. After completion, test the scanner connection again',
      fr: 'Veuillez effectuer une vérification de l\'intégrité du système Windows:\n1. Ouvrez l\'Invite de commandes en tant qu\'Administrateur\n2. Exécutez: sfc /scannow — attendez la fin\n3. Redémarrez l\'ordinateur\n4. Exécutez: DISM /Online /Cleanup-Image /RestoreHealth — attendez environ 10 à 20 minutes\n5. Redémarrez à nouveau l\'ordinateur\n6. Répétez sfc /scannow jusqu\'à voir: "La Protection des ressources Windows n\'a détecté aucune violation d\'intégrité."\n7. Testez ensuite à nouveau la connexion du scanner',
      es: 'Por favor realice una comprobación de integridad del sistema Windows:\n1. Abra el Símbolo del sistema como Administrador\n2. Ejecute: sfc /scannow — espere a que termine\n3. Reinicie el ordenador\n4. Ejecute: DISM /Online /Cleanup-Image /RestoreHealth — espere aprox. 10-20 min\n5. Reinicie el ordenador de nuevo\n6. Repita sfc /scannow hasta ver: "Protección de recursos de Windows no encontró ninguna infracción de integridad."\n7. Luego pruebe de nuevo la conexión del escáner',
      pt: 'Por favor, execute uma verificação de integridade do sistema Windows:\n1. Abra o Prompt de Comando como Administrador\n2. Execute: sfc /scannow — aguarde a conclusão\n3. Reinicie o computador\n4. Execute: DISM /Online /Cleanup-Image /RestoreHealth — aguarde aprox. 10-20 min\n5. Reinicie o computador novamente\n6. Repita sfc /scannow até ver: "A Proteção de Recursos do Windows não encontrou violações de integridade."\n7. Após a conclusão, teste novamente a conexão do scanner',
      it: 'Si prega di eseguire un controllo dell\'integrità del sistema Windows:\n1. Aprire il Prompt dei comandi come Amministratore\n2. Eseguire: sfc /scannow — attendere il completamento\n3. Riavviare il computer\n4. Eseguire: DISM /Online /Cleanup-Image /RestoreHealth — attendere circa 10-20 min\n5. Riavviare nuovamente il computer\n6. Ripetere sfc /scannow fino a vedere: "Protezione risorse di Windows non ha trovato violazioni di integrità."\n7. Dopo il completamento, testare nuovamente la connessione dello scanner',
      nl: 'Voer een Windows systeemintegriteitscontrole uit:\n1. Open Opdrachtprompt als Beheerder\n2. Voer uit: sfc /scannow — wacht op voltooiing\n3. Start de computer opnieuw op\n4. Voer uit: DISM /Online /Cleanup-Image /RestoreHealth — wacht ca. 10-20 min\n5. Start de computer opnieuw op\n6. Herhaal sfc /scannow totdat u ziet: "Windows Resource Protection heeft geen integriteitsschendingen gevonden."\n7. Test daarna opnieuw de scannerverbinding',
      ja: 'Windowsシステム整合性チェックを実行してください：\n1. コマンドプロンプトを管理者として開く\n2. 実行：sfc /scannow — 完了を待つ\n3. コンピューターを再起動\n4. 実行：DISM /Online /Cleanup-Image /RestoreHealth — 約10〜20分待つ\n5. 再度コンピューターを再起動\n6. "Windowsリソース保護は、整合性違反を検出しませんでした。" と表示されるまでsfc /scannowを繰り返す\n7. 完了後、スキャナー接続を再テスト',
      zh: '请执行Windows系统完整性检查：\n1. 以管理员身份打开命令提示符\n2. 运行：sfc /scannow — 等待完成\n3. 重启计算机\n4. 运行：DISM /Online /Cleanup-Image /RestoreHealth — 等待约10-20分钟\n5. 再次重启计算机\n6. 重复sfc /scannow，直到看到："Windows资源保护未发现任何完整性违规。"\n7. 完成后，再次测试扫描仪连接',
    },
  },

  device_manager_usb: {
    key: 'device_manager_usb',
    category: 'troubleshooting',
    label: { en: 'Device Manager USB Rebuild', de: 'Gerätemanager USB-Bereinigung', fr: 'Reconstruction USB via Gestionnaire de périphériques', es: 'Reconstrucción USB en Administrador de dispositivos', pt: 'Reconstrução USB no Gerenciador de Dispositivos', it: 'Ricostruzione USB tramite Gestione dispositivi', nl: 'USB-herstel via Apparaatbeheer', ja: 'デバイスマネージャーUSB再構築', zh: '设备管理器USB重建' },
    text: {
      de: 'Bitte bereinigen Sie die USB-Einträge im Gerätemanager:\n1. Öffnen Sie den Gerätemanager (rechtsklick auf Start → Gerätemanager)\n2. Wählen Sie Ansicht → Ausgeblendete Geräte anzeigen\n3. Deinstallieren Sie alle Scanner- und ScanSnap-bezogenen Einträge (auch ausgegraute)\n4. Trennen Sie den Scanner und starten Sie den Computer neu\n5. Schließen Sie den Scanner nach dem Neustart direkt per USB an\n6. Versuchen Sie danach erneut das Firmware-Update oder die Verbindung',
      en: 'Please clean up USB entries in Device Manager:\n1. Open Device Manager (right-click Start → Device Manager)\n2. Select View → Show hidden devices\n3. Uninstall all scanner and ScanSnap-related entries (including greyed-out ones)\n4. Disconnect the scanner and restart the computer\n5. Reconnect the scanner directly via USB after the restart\n6. Then retry the firmware update or connection',
      fr: 'Veuillez nettoyer les entrées USB dans le Gestionnaire de périphériques:\n1. Ouvrez le Gestionnaire de périphériques (clic droit sur Démarrer → Gestionnaire de périphériques)\n2. Sélectionnez Affichage → Afficher les périphériques cachés\n3. Désinstallez toutes les entrées liées au scanner et à ScanSnap (y compris celles en grisé)\n4. Déconnectez le scanner et redémarrez l\'ordinateur\n5. Reconnectez le scanner directement via USB après le redémarrage\n6. Réessayez ensuite la mise à jour du firmware ou la connexion',
      es: 'Por favor limpie las entradas USB en el Administrador de dispositivos:\n1. Abra el Administrador de dispositivos (clic derecho en Inicio → Administrador de dispositivos)\n2. Seleccione Ver → Mostrar dispositivos ocultos\n3. Desinstale todas las entradas relacionadas con el escáner y ScanSnap (incluidas las atenuadas)\n4. Desconecte el escáner y reinicie el ordenador\n5. Vuelva a conectar el escáner directamente por USB después del reinicio\n6. Luego reintente la actualización de firmware o la conexión',
      pt: 'Por favor, limpe as entradas USB no Gerenciador de Dispositivos:\n1. Abra o Gerenciador de Dispositivos (clique direito em Iniciar → Gerenciador de Dispositivos)\n2. Selecione Exibir → Mostrar dispositivos ocultos\n3. Desinstale todas as entradas relacionadas ao scanner e ao ScanSnap (incluindo as acinzentadas)\n4. Desconecte o scanner e reinicie o computador\n5. Reconecte o scanner diretamente via USB após a reinicialização\n6. Tente novamente a atualização de firmware ou a conexão',
      it: 'Si prega di pulire le voci USB in Gestione dispositivi:\n1. Aprire Gestione dispositivi (clic destro su Start → Gestione dispositivi)\n2. Selezionare Visualizza → Mostra dispositivi nascosti\n3. Disinstallare tutte le voci relative allo scanner e a ScanSnap (incluse quelle disattivate)\n4. Disconnettere lo scanner e riavviare il computer\n5. Ricollegare lo scanner direttamente tramite USB dopo il riavvio\n6. Riprovare l\'aggiornamento del firmware o la connessione',
      nl: 'Verwijder USB-vermeldingen in Apparaatbeheer:\n1. Open Apparaatbeheer (rechtsklik op Start → Apparaatbeheer)\n2. Selecteer Weergave → Verborgen apparaten weergeven\n3. Verwijder alle scanner- en ScanSnap-gerelateerde vermeldingen (ook de grijze)\n4. Verbreek de verbinding met de scanner en start de computer opnieuw op\n5. Sluit de scanner na de herstart direct aan via USB\n6. Probeer daarna de firmware-update of verbinding opnieuw',
      ja: 'デバイスマネージャーでUSBエントリをクリーンアップしてください：\n1. デバイスマネージャーを開く（スタートを右クリック → デバイスマネージャー）\n2. 表示 → 非表示のデバイスを表示を選択\n3. スキャナーとScanSnap関連のすべてのエントリをアンインストール（グレー表示も含む）\n4. スキャナーを切断してコンピューターを再起動\n5. 再起動後、USB経由で直接スキャナーを再接続\n6. その後、ファームウェアの更新または接続を再試行',
      zh: '请清理设备管理器中的USB条目：\n1. 打开设备管理器（右键单击开始 → 设备管理器）\n2. 选择查看 → 显示隐藏设备\n3. 卸载所有与扫描仪和ScanSnap相关的条目（包括灰色条目）\n4. 断开扫描仪连接并重启计算机\n5. 重启后通过USB直接重新连接扫描仪\n6. 然后重试固件更新或连接',
    },
  },

  screenshot_request: {
    key: 'screenshot_request',
    category: 'request',
    label: { en: 'Request Screenshot/Video', de: 'Screenshot/Video anfordern', fr: 'Demande de capture d\'écran/vidéo', es: 'Solicitar captura de pantalla/vídeo', pt: 'Solicitar captura de tela/vídeo', it: 'Richiesta screenshot/video', nl: 'Screenshot/video opvragen', ja: 'スクリーンショット/動画の要求', zh: '请求截图/视频' },
    text: {
      de: 'Um das Problem besser analysieren zu können, bitten wir Sie:\n- Bitte senden Sie uns einen Screenshot der angezeigten Fehlermeldung\n- Falls möglich, senden Sie uns ein kurzes Video (max. 30 Sek.) des Scannerverhaltens\n- Bitte fotografieren Sie auch die aktuelle LED-Anzeige des Scanners',
      en: 'To better analyze the issue, please:\n- Send us a screenshot of any error message displayed\n- If possible, send a short video (max. 30 sec.) of the scanner behavior\n- Please also photograph the current LED indicator of the scanner',
      fr: 'Pour mieux analyser le problème, veuillez:\n- Nous envoyer une capture d\'écran du message d\'erreur affiché\n- Si possible, envoyer une courte vidéo (max. 30 sec.) du comportement du scanner\n- Photographier également l\'indicateur LED actuel du scanner',
      es: 'Para analizar mejor el problema, por favor:\n- Envíenos una captura de pantalla del mensaje de error mostrado\n- Si es posible, envíe un vídeo corto (máx. 30 seg.) del comportamiento del escáner\n- Fotografíe también el indicador LED actual del escáner',
      pt: 'Para melhor analisar o problema, por favor:\n- Envie-nos uma captura de tela da mensagem de erro exibida\n- Se possível, envie um vídeo curto (máx. 30 seg.) do comportamento do scanner\n- Fotografe também o indicador LED atual do scanner',
      it: 'Per analizzare meglio il problema, si prega di:\n- Inviarci uno screenshot del messaggio di errore visualizzato\n- Se possibile, inviare un breve video (max. 30 sec.) del comportamento dello scanner\n- Fotografare anche l\'indicatore LED corrente dello scanner',
      nl: 'Om het probleem beter te analyseren, verzoeken wij u:\n- Stuur ons een screenshot van het weergegeven foutbericht\n- Stuur indien mogelijk een korte video (max. 30 sec.) van het scannergedrag\n- Fotografeer ook de huidige LED-indicator van de scanner',
      ja: '問題をより詳しく分析するために、以下をお願いします：\n- 表示されているエラーメッセージのスクリーンショットを送ってください\n- 可能であれば、スキャナーの動作の短い動画（最大30秒）を送ってください\n- スキャナーの現在のLEDインジケーターの写真も撮影してください',
      zh: '为了更好地分析问题，请：\n- 向我们发送显示的错误消息截图\n- 如果可能，发送一段短视频（最多30秒）展示扫描仪的行为\n- 也请拍摄扫描仪当前的LED指示灯照片',
    },
  },

  missing_info_request: {
    key: 'missing_info_request',
    category: 'request',
    label: { en: 'Request Missing Information', de: 'Fehlende Informationen anfordern', fr: 'Demander les informations manquantes', es: 'Solicitar información faltante', pt: 'Solicitar informações ausentes', it: 'Richiedere informazioni mancanti', nl: 'Ontbrekende informatie opvragen', ja: '不足情報の要求', zh: '请求缺失信息' },
    text: {
      de: 'Für eine präzise Diagnose benötigen wir noch einige Informationen:\n- Genaue Modellbezeichnung des Scanners (z.B. iX1600, iX500)\n- Betriebssystem (Windows 10/11, macOS)\n- Art der Verbindung (USB oder WLAN)\n- Genaue Fehlerbeschreibung oder Fehlermeldung\n- Seit wann tritt das Problem auf?',
      en: 'For a precise diagnosis, we still need some information:\n- Exact scanner model name (e.g. iX1600, iX500)\n- Betriebssystem (Windows 10/11, macOS)\n- Connection type (USB or Wi-Fi)\n- Exact error description or error message\n- When did the issue first occur?',
      fr: 'Pour un diagnostic précis, nous avons encore besoin de quelques informations:\n- Nom exact du modèle de scanner (ex: iX1600, iX500)\n- Système d\'exploitation (Windows 10/11, macOS)\n- Type de connexion (USB ou Wi-Fi)\n- Description exacte de l\'erreur ou message d\'erreur\n- Depuis quand le problème se produit-il?',
      es: 'Para un diagnóstico preciso, necesitamos aún alguna información:\n- Nombre exacto del modelo del escáner (ej: iX1600, iX500)\n- Sistema operativo (Windows 10/11, macOS)\n- Tipo de conexión (USB o Wi-Fi)\n- Descripción exacta del error o mensaje de error\n- ¿Cuándo ocurrió el problema por primera vez?',
      pt: 'Para um diagnóstico preciso, ainda precisamos de algumas informações:\n- Nome exato do modelo do scanner (ex: iX1600, iX500)\n- Sistema operacional (Windows 10/11, macOS)\n- Tipo de conexão (USB ou Wi-Fi)\n- Descrição exata do erro ou mensagem de erro\n- Quando o problema ocorreu pela primeira vez?',
      it: 'Per una diagnosi precisa, abbiamo ancora bisogno di alcune informazioni:\n- Nome esatto del modello dello scanner (es: iX1600, iX500)\n- Sistema operativo (Windows 10/11, macOS)\n- Tipo di connessione (USB o Wi-Fi)\n- Descrizione esatta dell\'errore o messaggio di errore\n- Quando si è verificato il problema per la prima volta?',
      nl: 'Voor een nauwkeurige diagnose hebben we nog wat informatie nodig:\n- Exacte modelnaam van de scanner (bijv. iX1600, iX500)\n- Besturingssysteem (Windows 10/11, macOS)\n- Type verbinding (USB of Wi-Fi)\n- Exacte foutomschrijving of foutbericht\n- Wanneer deed het probleem zich voor het eerst voor?',
      ja: '正確な診断のために、まだいくつかの情報が必要です：\n- スキャナーの正確なモデル名（例：iX1600、iX500）\n- オペレーティングシステム（Windows 10/11、macOS）\n- 接続タイプ（USBまたはWi-Fi）\n- 正確なエラーの説明またはエラーメッセージ\n- 問題はいつ最初に発生しましたか？',
      zh: '为了精确诊断，我们还需要一些信息：\n- 扫描仪的确切型号名称（例如：iX1600、iX500）\n- 操作系统（Windows 10/11、macOS）\n- 连接类型（USB或Wi-Fi）\n- 确切的错误描述或错误消息\n- 问题首次出现是什么时候？',
    },
  },


  request_error_screenshot: {
    key: 'request_error_screenshot',
    category: 'request',
    label: { en: 'Error message screenshot', de: 'Fehlermeldung als Screenshot', pt: 'Screenshot da mensagem de erro', es: 'Captura del mensaje de error', fr: 'Capture du message d’erreur', it: 'Screenshot del messaggio di errore', nl: 'Screenshot van foutmelding', ja: 'エラーメッセージのスクリーンショット' },
    text: {
      de: 'Bitte senden Sie uns einen Screenshot der vollständigen Fehlermeldung.',
      en: 'Please send us a screenshot of the full error message.',
      pt: 'Por favor, envie-nos um screenshot da mensagem de erro completa.',
      es: 'Por favor, envíenos una captura completa del mensaje de error.',
      fr: 'Veuillez nous envoyer une capture complète du message d’erreur.',
      it: 'La preghiamo di inviarci uno screenshot completo del messaggio di errore.',
      nl: 'Stuur ons alstublieft een screenshot van de volledige foutmelding.',
      ja: '完全なエラーメッセージのスクリーンショットをお送りください。',
    },
  },

  request_device_manager_photo: {
    key: 'request_device_manager_photo',
    category: 'request',
    label: { en: 'Device Manager screenshot/photo', de: 'Geräte-Manager Screenshot/Foto', pt: 'Screenshot/foto do Gestor de Dispositivos', es: 'Captura/foto del Administrador de dispositivos', fr: 'Capture/photo du Gestionnaire de périphériques', it: 'Screenshot/foto di Gestione dispositivi', nl: 'Screenshot/foto van Apparaatbeheer', ja: 'デバイスマネージャーのスクリーンショット/写真' },
    text: {
      de: 'Bitte senden Sie uns bei USB-Problemen zusätzlich einen Screenshot oder ein Foto aus dem Windows-Geräte-Manager, auf dem der Scanner bzw. das unbekannte Gerät sichtbar ist.',
      en: 'For USB issues, please also send us a screenshot or photo from Windows Device Manager showing the scanner or unknown device.',
      pt: 'Em caso de problemas USB, envie-nos também um screenshot ou foto do Gestor de Dispositivos do Windows onde o scanner ou o dispositivo desconhecido esteja visível.',
      es: 'En caso de problemas USB, envíenos también una captura o foto del Administrador de dispositivos de Windows donde se vea el escáner o el dispositivo desconocido.',
      fr: 'En cas de problème USB, veuillez également nous envoyer une capture ou photo du Gestionnaire de périphériques Windows montrant le scanner ou le périphérique inconnu.',
      it: 'Per problemi USB, ci invii anche uno screenshot o una foto di Gestione dispositivi di Windows in cui sia visibile lo scanner o il dispositivo sconosciuto.',
      nl: 'Bij USB-problemen ontvangen wij graag ook een screenshot of foto van Windows Apparaatbeheer waarop de scanner of het onbekende apparaat zichtbaar is.',
      ja: 'USBの問題の場合は、スキャナーまたは不明なデバイスが表示されているWindowsデバイスマネージャーのスクリーンショットまたは写真もお送りください。',
    },
  },

  request_sshome_version: {
    key: 'request_sshome_version',
    category: 'request',
    label: { en: 'ScanSnap Home version', de: 'ScanSnap Home Version', pt: 'Versão do ScanSnap Home', es: 'Versión de ScanSnap Home', fr: 'Version de ScanSnap Home', it: 'Versione di ScanSnap Home', nl: 'ScanSnap Home-versie', ja: 'ScanSnap Homeバージョン' },
    text: {
      de: 'Bitte teilen Sie uns außerdem mit, welche ScanSnap Home Version aktuell installiert ist.',
      en: 'Please also let us know which ScanSnap Home version is currently installed.',
      pt: 'Por favor, indique-nos também qual versão do ScanSnap Home está instalada.',
      es: 'Por favor, indíquenos también qué versión de ScanSnap Home está instalada.',
      fr: 'Veuillez également nous indiquer quelle version de ScanSnap Home est installée.',
      it: 'Ci comunichi inoltre quale versione di ScanSnap Home è installata.',
      nl: 'Laat ons ook weten welke versie van ScanSnap Home momenteel is geïnstalleerd.',
      ja: '現在インストールされているScanSnap Homeのバージョンもお知らせください。',
    },
  },

  request_firmware_version: {
    key: 'request_firmware_version',
    category: 'request',
    label: { en: 'Firmware version', de: 'Firmware-Version', pt: 'Versão do firmware', es: 'Versión de firmware', fr: 'Version du firmware', it: 'Versione firmware', nl: 'Firmwareversie', ja: 'ファームウェアバージョン' },
    text: {
      de: 'Bitte teilen Sie uns zusätzlich die aktuell installierte Firmware-Version des Scanners mit.',
      en: 'Please also let us know the scanner firmware version currently installed.',
      pt: 'Por favor, indique-nos também a versão de firmware atualmente instalada no scanner.',
      es: 'Por favor, indíquenos también la versión de firmware instalada actualmente en el escáner.',
      fr: 'Veuillez également nous indiquer la version du firmware actuellement installée sur le scanner.',
      it: 'Ci comunichi inoltre la versione firmware attualmente installata nello scanner.',
      nl: 'Laat ons ook weten welke firmwareversie momenteel op de scanner is geïnstalleerd.',
      ja: 'スキャナーに現在インストールされているファームウェアバージョンもお知らせください。',
    },
  },

  request_os_version: {
    key: 'request_os_version',
    category: 'request',
    label: { en: 'Operating system', de: 'Betriebssystem', pt: 'Sistema operativo', es: 'Sistema operativo', fr: 'Système d’exploitation', it: 'Sistema operativo', nl: 'Besturingssysteem', ja: 'オペレーティングシステム' },
    text: {
      de: 'Bitte nennen Sie uns außerdem Ihr Betriebssystem inklusive Versionsstand.',
      en: 'Please also tell us which operating system and version you are using.',
      pt: 'Por favor, indique-nos também o sistema operativo e a versão utilizados.',
      es: 'Por favor, indíquenos también el sistema operativo y la versión utilizados.',
      fr: 'Veuillez également nous indiquer le système d’exploitation et la version utilisés.',
      it: 'Ci comunichi inoltre il sistema operativo e la versione utilizzati.',
      nl: 'Laat ons ook weten welk besturingssysteem en welke versie u gebruikt.',
      ja: 'ご利用のオペレーティングシステムとバージョンもお知らせください。',
    },
  },

  waiting_response: {
    key: 'waiting_response',
    category: 'status',
    label: { en: 'Awaiting Customer Response', de: 'Warte auf Kundenantwort', fr: 'En attente de réponse client', es: 'Esperando respuesta del cliente', pt: 'Aguardando resposta do cliente', it: 'In attesa di risposta del cliente', nl: 'Wachten op reactie klant', ja: 'お客様の返答待ち', zh: '等待客户回复' },
    text: {
      de: 'Bitte testen Sie die oben beschriebenen Schritte und teilen Sie uns das Ergebnis mit. Wir stehen für Rückfragen zur Verfügung.\n\nBitte antworten Sie auf diese E-Mail mit dem Ergebnis Ihres Tests.',
      en: 'Please test the steps described above and let us know the result. We are available for any questions.\n\nPlease reply to this email with the outcome of your test.',
      fr: 'Veuillez tester les étapes décrites ci-dessus et nous communiquer le résultat. Nous sommes disponibles pour toute question.\n\nVeuillez répondre à cet e-mail avec le résultat de votre test.',
      es: 'Por favor pruebe los pasos descritos anteriormente e infórmenos del resultado. Estamos disponibles para cualquier pregunta.\n\nPor favor responda a este correo con el resultado de su prueba.',
      pt: 'Por favor, teste as etapas descritas acima e nos informe o resultado. Estamos disponíveis para quaisquer dúvidas.\n\nPor favor, responda a este e-mail com o resultado do seu teste.',
      it: 'Si prega di testare i passaggi descritti sopra e di comunicarci il risultato. Siamo disponibili per qualsiasi domanda.\n\nSi prega di rispondere a questa e-mail con il risultato del test.',
      nl: 'Test de hierboven beschreven stappen en laat ons het resultaat weten. We staan klaar voor vragen.\n\nAntwoord op deze e-mail met de uitkomst van uw test.',
      ja: '上記の手順をテストし、結果をお知らせください。ご質問がございましたらお気軽にどうぞ。\n\nテストの結果をこのメールにご返信ください。',
      zh: '请测试上述步骤并告知我们结果。如有任何问题，我们随时为您提供帮助。\n\n请回复此邮件告知您的测试结果。',
    },
  },

  firmware_recovery_instructions: {
    key: 'firmware_recovery_instructions',
    category: 'troubleshooting',
    label: { en: 'Firmware Recovery Instructions', de: 'Firmware-Wiederherstellungsanleitung', fr: 'Instructions de récupération du firmware', es: 'Instrucciones de recuperación de firmware', pt: 'Instruções de recuperação de firmware', it: 'Istruzioni di ripristino firmware', nl: 'Firmware-herstelinstructies', ja: 'ファームウェア回復手順', zh: '固件恢复说明' },
    text: {
      de: 'Da der reguläre Update-Vorgang nicht erfolgreich war, ist eine spezielle Firmware-Wiederherstellung erforderlich:\n1. Schalten Sie den Scanner vollständig aus\n2. Halten Sie gleichzeitig den Sensor-Knopf oben UND den Leerer-Arm-Knopf gedrückt\n3. Schließen Sie das USB-Kabel direkt an den Computer an (kein Hub)\n4. Lassen Sie die Tasten nach 3 Sekunden los\n5. Führen Sie die eigenständige Firmware-Update-Datei aus\n6. Trennen Sie den Scanner NICHT während des Vorgangs',
      en: 'Since the standard update process was unsuccessful, a special firmware recovery is required:\n1. Power off the scanner completely\n2. Hold the top sensor button AND the empty arm button simultaneously\n3. Connect the USB cable directly to the computer (no hub)\n4. Release both buttons after 3 seconds\n5. Run the standalone firmware updater\n6. Do NOT disconnect the scanner during the process',
      fr: 'Puisque la procédure de mise à jour standard a échoué, une récupération spéciale du firmware est nécessaire:\n1. Éteignez complètement le scanner\n2. Maintenez simultanément le bouton de capteur supérieur ET le bouton de bras vide\n3. Connectez le câble USB directement à l\'ordinateur (sans hub)\n4. Relâchez les deux boutons après 3 secondes\n5. Lancez le programme de mise à jour du firmware autonome\n6. Ne déconnectez PAS le scanner pendant le processus',
      es: 'Dado que el proceso de actualización estándar no tuvo éxito, se requiere una recuperación especial del firmware:\n1. Apague completamente el escáner\n2. Mantenga presionado el botón del sensor superior Y el botón del brazo vacío simultáneamente\n3. Conecte el cable USB directamente al ordenador (sin hub)\n4. Suelte ambos botones después de 3 segundos\n5. Ejecute el actualizador de firmware independiente\n6. NO desconecte el escáner durante el proceso',
      pt: 'Como o processo de atualização padrão não teve sucesso, é necessária uma recuperação especial de firmware:\n1. Desligue o scanner completamente\n2. Mantenha pressionado o botão do sensor superior E o botão do braço vazio simultaneamente\n3. Conecte o cabo USB diretamente ao computador (sem hub)\n4. Solte ambos os botões após 3 segundos\n5. Execute o atualizador de firmware autônomo\n6. NÃO desconecte o scanner durante o processo',
      it: 'Poiché il processo di aggiornamento standard non ha avuto successo, è necessario un ripristino speciale del firmware:\n1. Spegnere completamente lo scanner\n2. Tenere premuto il pulsante del sensore superiore E il pulsante del braccio vuoto simultaneamente\n3. Collegare il cavo USB direttamente al computer (nessun hub)\n4. Rilasciare entrambi i pulsanti dopo 3 secondi\n5. Eseguire il programma di aggiornamento firmware autonomo\n6. NON disconnettere lo scanner durante il processo',
      nl: 'Omdat het standaard updateproces niet succesvol was, is een speciale firmware-herstel vereist:\n1. Zet de scanner volledig uit\n2. Houd tegelijkertijd de bovensensorknop EN de lege-armknop ingedrukt\n3. Sluit de USB-kabel rechtstreeks aan op de computer (geen hub)\n4. Laat beide knoppen na 3 seconden los\n5. Voer de zelfstandige firmware-updater uit\n6. Verbreek de verbinding met de scanner NIET tijdens het proces',
      ja: '標準の更新プロセスが成功しなかったため、特別なファームウェア回復が必要です：\n1. スキャナーを完全にオフにする\n2. 上部センサーボタンと空アームボタンを同時に押し続ける\n3. USBケーブルをコンピューターに直接接続（ハブなし）\n4. 3秒後に両方のボタンを離す\n5. スタンドアロンファームウェアアップデーターを実行\n6. プロセス中はスキャナーを切断しないでください',
      zh: '由于标准更新过程不成功，需要特殊的固件恢复：\n1. 完全关闭扫描仪\n2. 同时按住顶部传感器按钮和空臂按钮\n3. 将USB线直接连接到计算机（无集线器）\n4. 3秒后松开两个按钮\n5. 运行独立固件更新程序\n6. 在此过程中请勿断开扫描仪连接',
    },
  },

  resolved_confirmation: {
    key: 'resolved_confirmation',
    category: 'status',
    label: { en: 'Issue Resolved Confirmation', de: 'Bestätigung Problemlösung', fr: 'Confirmation résolution du problème', es: 'Confirmación resolución del problema', pt: 'Confirmação de resolução do problema', it: 'Conferma risoluzione del problema', nl: 'Bevestiging probleemoplossing', ja: '問題解決の確認', zh: '问题解决确认' },
    text: {
      de: 'Wir freuen uns, dass das Problem behoben werden konnte. Der Scanner sollte nun wieder einwandfrei funktionieren.\n\nSollte das Problem erneut auftreten, stehen wir Ihnen gerne zur Verfügung. Bitte wenden Sie sich in diesem Fall erneut an uns.',
      en: 'We are glad the issue could be resolved. The scanner should now be working correctly again.\n\nShould the issue occur again, please do not hesitate to contact us.',
      fr: 'Nous sommes ravis que le problème ait pu être résolu. Le scanner devrait maintenant fonctionner correctement à nouveau.\n\nSi le problème se reproduit, n\'hésitez pas à nous contacter.',
      es: 'Nos alegra que el problema se haya podido resolver. El escáner ahora debería funcionar correctamente de nuevo.\n\nSi el problema vuelve a ocurrir, no dude en contactarnos.',
      pt: 'Ficamos felizes que o problema pôde ser resolvido. O scanner agora deve estar funcionando corretamente novamente.\n\nSe o problema ocorrer novamente, não hesite em nos contatar.',
      it: 'Siamo lieti che il problema abbia potuto essere risolto. Lo scanner dovrebbe ora funzionare correttamente di nuovo.\n\nSe il problema si ripresenta, non esiti a contattarci.',
      nl: 'We zijn blij dat het probleem opgelost kon worden. De scanner zou nu weer correct moeten werken.\n\nMocht het probleem zich opnieuw voordoen, aarzel dan niet om contact met ons op te nemen.',
      ja: '問題が解決できてうれしいです。スキャナーは正常に動作するようになりました。\n\n問題が再度発生した場合は、お気軽にご連絡ください。',
      zh: '我们很高兴问题得到了解决。扫描仪现在应该能再次正常工作了。\n\n如果问题再次出现，请随时联系我们。',
    },
  },

};

// ── Helper: get module text in target language ───────────────
export function getModuleText(moduleKey, lang) {
  const mod = EMAIL_MODULES[moduleKey];
  if (!mod) return '';
  return mod.text[lang] || mod.text['en'] || '';
}


function filterKnownInfoLines(text, lang, session = {}) {
  const knownModel = session?.model || session?.device || session?.knownFacts?.model;
  const knownConnection = session?.connectionType || session?.knownFacts?.connectionType;
  const knownProblem = session?.problem;
  const knownOs = session?.os || session?.knownFacts?.os;

  return String(text || '')
    .split('\n')
    .filter(line => {
      const l = line.toLowerCase();
      if (knownModel && (l.includes('modellbezeichnung') || l.includes('scanner model') || l.includes('genaue modell'))) return false;
      if (knownConnection && (l.includes('art der verbindung') || l.includes('usb oder wlan') || l.includes('connectivity type'))) return false;
      if (knownProblem && (l.includes('genaue fehlerbeschreibung') || l.includes('fehlermeldung') || l.includes('error description'))) return false;
      if (knownOs && (l.includes('betriebssystem') || l.includes('operating system'))) return false;
      return true;
    })
    .join('\n')
    .replace(/\n{3,}/g, '\n\n');
}

// ── Assemble email from selected module keys ─────────────────
export function assembleEmail(selectedKeys, lang, supporterName = '', session = {}) {
  const parts = [];

  // Always start with greeting
  parts.push(getModuleText('greeting', lang));

  // Add selected content modules (skip structural ones — handled separately)
  const structural = ['greeting', 'closing'];
  const contentKeys = selectedKeys.filter(k => !structural.includes(k));
  for (const key of contentKeys) {
    const text = getModuleText(key, lang);
    if (text) parts.push(filterKnownInfoLines(text, lang, session));
  }

  // Always end with closing (replace PFU Support Team with supporter name if provided)
  let closing = getModuleText('closing', lang);
  if (supporterName) {
    closing = closing.replace('PFU Support Team', supporterName);
  }
  parts.push(closing);

  return parts.join('\n\n');
}

function completedOrFailedStepTitles(session = {}) {
  return (session.steps || [])
    .filter(s => ['done', 'not_solved', 'not_possible', 'solved'].includes(s.status))
    .map(s => `${s.title || ''} ${s.instruction || ''} ${s.stepId || ''}`.toLowerCase());
}

function alreadyDone(session, pattern) {
  const rx = new RegExp(pattern, 'i');
  return completedOrFailedStepTitles(session).some(t => rx.test(t));
}

// ── Auto-suggest modules based on session state ──────────────
export function suggestModules(session, brain) {
  const suggested = [];
  const steps = session?.steps || [];
  const category = brain?.category || '';
  const completedStepIds = steps.filter(s => ['solved', 'done', 'not_solved', 'not_possible'].includes(s.status)).map(s => s.stepId || '');
  const anyFailed = steps.some(s => ['not_solved', 'not_possible'].includes(s.status));

  const hasDone = (keyword) => completedStepIds.some(id => new RegExp(keyword, 'i').test(id)) ||
    steps.some(s => new RegExp(keyword, 'i').test(s.title || '') && s.status !== 'pending');

  if (hasDone('usb|directUsb') && !alreadyDone(session, 'usb|direct')) suggested.push('usb_direct');
  if (hasDone('firmware|standalone')) {
    if (brain?.fwDiag?.firmwareWorkflow === 'RECOVERY') {
      suggested.push('firmware_recovery_instructions');
    } else {
      suggested.push('firmware_update_normal');
    }
  }
  if (hasDone('sshome|cleanup|reinstall') && !alreadyDone(session, 'sshome|cleanup|reinstall|scansnap home')) suggested.push('sshomeclean');
  if (hasDone('sfc|dism|integrity|windows') && !alreadyDone(session, 'sfc|dism|integrity|windows')) suggested.push('sfc_dism');
  if (hasDone('deviceManager|usbStack|rebuildUsb') && !alreadyDone(session, 'deviceManager|usbStack|rebuildUsb|geräte-manager')) suggested.push('device_manager_usb');

  // Always suggest waiting_response unless solved
  if (session?.status !== 'solved') suggested.push('waiting_response');
  if (session?.status === 'solved') suggested.push('resolved_confirmation');

  // If missing info: only ask for what is really missing.
  const missing = Array.isArray(brain?.missingInfo) ? brain.missingInfo : [];
  const knownModel = session?.model || session?.device || session?.knownFacts?.model;
  const filteredMissing = missing.filter(item => {
    const t = String(item || '').toLowerCase();
    if (knownModel && (t.includes('model') || t.includes('modell') || t.includes('device') || t.includes('gerät'))) return false;
    if ((session?.os || session?.knownFacts?.os) && t.includes('operating')) return false;
    if ((session?.connectionType || session?.knownFacts?.connectionType) && (t.includes('connectivity') || t.includes('verbindung'))) return false;
    return true;
  });
  if (filteredMissing.length > 0) suggested.push('missing_info_request');


  const contextText = `${session?.problem || ''} ${session?.connectionType || ''} ${session?.issueType || ''} ${(session?.steps || []).map(s => `${s.title || ''} ${s.instruction || ''} ${s.stepId || ''}`).join(' ')}`.toLowerCase();
  if (/usb|geräte-manager|device manager|nicht erkannt|not detect|0x80211001/.test(contextText)) {
    suggested.push('request_device_manager_photo', 'request_error_screenshot', 'request_os_version', 'request_sshome_version');
  }
  if (/firmware|update|recovery/.test(contextText)) suggested.push('request_firmware_version');
  if (!session?.os && !session?.knownFacts?.os) suggested.push('request_os_version');


  // Screenshot only if state unclear, not just because model was already provided.
  if (brain?.scannerState === 'unknown') suggested.push('screenshot_request');

  return [...new Set(suggested)];
}