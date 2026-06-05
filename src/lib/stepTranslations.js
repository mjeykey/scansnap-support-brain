// ============================================================
// STEP TRANSLATIONS – Localized content for all dynamic stepIds
// The AI/engine returns a stepId; the frontend resolves it here.
// Supports: de, en, fr, es, pt, it, nl, ja, zh
// ============================================================

const stepTranslations = {
  verifyScannerState: {
    de: {
      title: 'Scannerstatus überprüfen',
      body: 'Schalten Sie den Scanner ein. Welche LEDs oder Displayanzeigen sehen Sie? Erscheint der Scanner im Geräte-Manager oder in ScanSnap Home? Beschreiben Sie den genauen Zustand (z. B. hängt am Logo, keine Reaktion, orangene LED).',
      difficulty: 'easy',
    },
    en: {
      title: 'Verify Scanner State',
      body: 'Power on the scanner. What LEDs or display text do you see? Does it appear in Device Manager or ScanSnap Home? Describe the exact symptom (e.g. stuck on logo, no power, orange LED only).',
      difficulty: 'easy',
    },
    fr: {
      title: 'Vérifier l\'état du scanner',
      body: 'Allumez le scanner. Quels voyants ou textes s\'affichent ? Apparaît-il dans le Gestionnaire de périphériques ou ScanSnap Home ? Décrivez le symptôme exact (ex. : bloqué sur le logo, aucune réaction, LED orange).',
      difficulty: 'easy',
    },
    es: {
      title: 'Verificar estado del escáner',
      body: 'Encienda el escáner. ¿Qué LEDs o texto en pantalla ve? ¿Aparece en el Administrador de dispositivos o en ScanSnap Home? Describa el síntoma exacto (p. ej., bloqueado en el logo, sin energía, solo LED naranja).',
      difficulty: 'easy',
    },
    pt: {
      title: 'Verificar estado do scanner',
      body: 'Ligue o scanner. Quais LEDs ou texto no ecrã aparecem? Aparece no Gestor de Dispositivos ou no ScanSnap Home? Descreva o sintoma exato (ex.: preso no logo, sem energia, apenas LED laranja).',
      difficulty: 'easy',
    },
    it: {
      title: 'Verificare lo stato dello scanner',
      body: 'Accendere lo scanner. Quali LED o testi vengono visualizzati? Appare in Gestione dispositivi o in ScanSnap Home? Descrivere il sintomo esatto (es.: bloccato sul logo, nessuna reazione, solo LED arancione).',
      difficulty: 'easy',
    },
    nl: {
      title: 'Scannerstatus controleren',
      body: 'Zet de scanner aan. Welke LED\'s of displaytekst ziet u? Verschijnt deze in Apparaatbeheer of ScanSnap Home? Beschrijf het exacte symptoom (bijv. vastgelopen op logo, geen stroom, alleen oranje LED).',
      difficulty: 'easy',
    },
    ja: {
      title: 'スキャナーの状態を確認する',
      body: 'スキャナーの電源を入れてください。LEDやディスプレイの表示はどうなっていますか？デバイスマネージャーまたはScanSnap Homeに表示されますか？症状を正確に説明してください（例：ロゴで停止、電源なし、オレンジのLEDのみ）。',
      difficulty: 'easy',
    },
    zh: {
      title: '验证扫描仪状态',
      body: '打开扫描仪电源。您看到哪些LED或显示文字？它是否出现在设备管理器或ScanSnap Home中？请描述具体症状（例如：停在logo界面、无电源、仅橙色LED）。',
      difficulty: 'easy',
    },
  },

  directUsbConnectionTest: {
    de: {
      title: 'Direkter USB-Anschluss testen',
      body: 'Verbinden Sie den Scanner direkt mit einem nativen USB-Anschluss des Computers (kein Hub, kein Dock, kein Verlängerungskabel). Testen Sie ein anderes USB-Kabel falls vorhanden. Prüfen Sie, ob der Scanner im Geräte-Manager erscheint.',
      difficulty: 'easy',
    },
    en: {
      title: 'Direct USB Connection Test',
      body: 'Connect the scanner directly to a native USB port on the computer (no hub, no dock, no extension cable). Try a different USB cable if available. Check if the scanner appears in Device Manager.',
      difficulty: 'easy',
    },
    fr: {
      title: 'Test de connexion USB directe',
      body: 'Connectez le scanner directement à un port USB natif de l\'ordinateur (sans hub, dock ni rallonge). Essayez un autre câble USB si disponible. Vérifiez si le scanner apparaît dans le Gestionnaire de périphériques.',
      difficulty: 'easy',
    },
    es: {
      title: 'Prueba de conexión USB directa',
      body: 'Conecte el escáner directamente a un puerto USB nativo del equipo (sin hub, dock ni cable de extensión). Pruebe con otro cable USB si dispone de uno. Compruebe si el escáner aparece en el Administrador de dispositivos.',
      difficulty: 'easy',
    },
    pt: {
      title: 'Teste de ligação USB direta',
      body: 'Ligue o scanner diretamente a uma porta USB nativa do computador (sem hub, dock ou cabo de extensão). Experimente um cabo USB diferente, se disponível. Verifique se o scanner aparece no Gestor de Dispositivos.',
      difficulty: 'easy',
    },
    it: {
      title: 'Test connessione USB diretta',
      body: 'Collegare lo scanner direttamente a una porta USB nativa del computer (senza hub, dock o cavo di prolunga). Provare un cavo USB diverso se disponibile. Verificare se lo scanner appare in Gestione dispositivi.',
      difficulty: 'easy',
    },
    nl: {
      title: 'Directe USB-verbindingstest',
      body: 'Sluit de scanner rechtstreeks aan op een native USB-poort van de computer (geen hub, dock of verlengkabel). Probeer een ander USB-kabel indien beschikbaar. Controleer of de scanner verschijnt in Apparaatbeheer.',
      difficulty: 'easy',
    },
    ja: {
      title: 'USB直接接続テスト',
      body: 'スキャナーをコンピューターのネイティブUSBポートに直接接続してください（ハブ、ドック、延長ケーブルなし）。可能であれば別のUSBケーブルを試してください。デバイスマネージャーにスキャナーが表示されるか確認してください。',
      difficulty: 'easy',
    },
    zh: {
      title: 'USB直接连接测试',
      body: '将扫描仪直接连接到计算机的原生USB端口（无集线器、扩展坞或延长线）。如有条件，请更换USB线缆进行测试。检查设备管理器中是否出现扫描仪。',
      difficulty: 'easy',
    },
  },

  rebuildUsbStack: {
    de: {
      title: 'USB-Stack neu aufbauen',
      body: 'Öffnen Sie den Geräte-Manager → Ansicht → Ausgeblendete Geräte anzeigen. Deinstallieren Sie alle ScanSnap-/Scannerbezogenen Einträge (auch ausgegraute). Trennen Sie den Scanner und starten Sie den Computer neu. Schließen Sie den Scanner nach dem Neustart über einen nativen USB-Anschluss an.',
      difficulty: 'medium',
    },
    en: {
      title: 'Rebuild USB Stack',
      body: 'Open Device Manager → View → Show hidden devices. Uninstall all ScanSnap and scanner-related entries (including greyed-out ones). Disconnect the scanner and restart the computer. Reconnect via a native USB port after reboot.',
      difficulty: 'medium',
    },
    fr: {
      title: 'Reconstruire la pile USB',
      body: 'Ouvrez le Gestionnaire de périphériques → Affichage → Afficher les périphériques cachés. Désinstallez toutes les entrées liées à ScanSnap (y compris les entrées grisées). Déconnectez le scanner et redémarrez l\'ordinateur. Reconnectez via un port USB natif après le redémarrage.',
      difficulty: 'medium',
    },
    es: {
      title: 'Reconstruir pila USB',
      body: 'Abra el Administrador de dispositivos → Ver → Mostrar dispositivos ocultos. Desinstale todas las entradas relacionadas con ScanSnap (incluidas las atenuadas). Desconecte el escáner y reinicie el equipo. Vuelva a conectar por un puerto USB nativo tras el reinicio.',
      difficulty: 'medium',
    },
    pt: {
      title: 'Reconstruir pilha USB',
      body: 'Abra o Gestor de Dispositivos → Ver → Mostrar dispositivos ocultos. Desinstale todas as entradas relacionadas com ScanSnap (incluindo as a cinzento). Desligue o scanner e reinicie o computador. Volte a ligar por uma porta USB nativa após o reinício.',
      difficulty: 'medium',
    },
    it: {
      title: 'Ricostruire lo stack USB',
      body: 'Aprire Gestione dispositivi → Visualizza → Mostra dispositivi nascosti. Disinstallare tutte le voci correlate a ScanSnap (incluse quelle in grigio). Scollegare lo scanner e riavviare il computer. Ricollegare tramite una porta USB nativa dopo il riavvio.',
      difficulty: 'medium',
    },
    nl: {
      title: 'USB-stack herbouwen',
      body: 'Open Apparaatbeheer → Beeld → Verborgen apparaten weergeven. Verwijder alle ScanSnap-gerelateerde vermeldingen (inclusief grijs weergegeven). Verbreek de verbinding met de scanner en herstart de computer. Sluit opnieuw aan via een native USB-poort na herstart.',
      difficulty: 'medium',
    },
    ja: {
      title: 'USBスタックの再構築',
      body: 'デバイスマネージャーを開き、「表示」→「非表示のデバイスを表示」を選択します。ScanSnap関連のすべてのエントリ（グレーアウトされたものも含む）をアンインストールします。スキャナーを切断してコンピューターを再起動し、再起動後にネイティブUSBポートで再接続してください。',
      difficulty: 'medium',
    },
    zh: {
      title: '重建USB堆栈',
      body: '打开设备管理器 → 查看 → 显示隐藏的设备。卸载所有ScanSnap相关条目（包括灰显的条目）。断开扫描仪并重启计算机。重启后通过原生USB端口重新连接。',
      difficulty: 'medium',
    },
  },

  ssHomeCleanup: {
    de: {
      title: 'ScanSnap Home bereinigen und neu installieren',
      body: 'Führen Sie SSHomeClean.exe aus, um ScanSnap Home vollständig zu entfernen. Starten Sie den Computer nach der Bereinigung neu. Installieren Sie ScanSnap Home als Administrator neu von der offiziellen PFU/Fujitsu-Downloadseite.',
      difficulty: 'medium',
    },
    en: {
      title: 'Clean and Reinstall ScanSnap Home',
      body: 'Run SSHomeClean.exe to fully remove ScanSnap Home and all local configuration. Restart the computer after cleanup. Reinstall ScanSnap Home as Administrator from the official PFU/Fujitsu download page.',
      difficulty: 'medium',
    },
    fr: {
      title: 'Nettoyer et réinstaller ScanSnap Home',
      body: 'Exécutez SSHomeClean.exe pour supprimer complètement ScanSnap Home et toute la configuration locale. Redémarrez l\'ordinateur après le nettoyage. Réinstallez ScanSnap Home en tant qu\'administrateur depuis la page de téléchargement officielle PFU/Fujitsu.',
      difficulty: 'medium',
    },
    es: {
      title: 'Limpiar y reinstalar ScanSnap Home',
      body: 'Ejecute SSHomeClean.exe para eliminar completamente ScanSnap Home y toda la configuración local. Reinicie el equipo tras la limpieza. Reinstale ScanSnap Home como Administrador desde la página de descarga oficial de PFU/Fujitsu.',
      difficulty: 'medium',
    },
    pt: {
      title: 'Limpar e reinstalar o ScanSnap Home',
      body: 'Execute o SSHomeClean.exe para remover completamente o ScanSnap Home e toda a configuração local. Reinicie o computador após a limpeza. Reinstale o ScanSnap Home como Administrador a partir da página de download oficial da PFU/Fujitsu.',
      difficulty: 'medium',
    },
    it: {
      title: 'Pulire e reinstallare ScanSnap Home',
      body: 'Eseguire SSHomeClean.exe per rimuovere completamente ScanSnap Home e tutta la configurazione locale. Riavviare il computer dopo la pulizia. Reinstallare ScanSnap Home come Amministratore dalla pagina di download ufficiale PFU/Fujitsu.',
      difficulty: 'medium',
    },
    nl: {
      title: 'ScanSnap Home opruimen en opnieuw installeren',
      body: 'Voer SSHomeClean.exe uit om ScanSnap Home en alle lokale configuratie volledig te verwijderen. Herstart de computer na de opruiming. Installeer ScanSnap Home opnieuw als Administrator via de officiële PFU/Fujitsu downloadpagina.',
      difficulty: 'medium',
    },
    ja: {
      title: 'ScanSnap Homeのクリーンアップと再インストール',
      body: 'SSHomeClean.exeを実行してScanSnap Homeとすべてのローカル設定を完全に削除します。クリーンアップ後にコンピューターを再起動します。PFU/富士通の公式ダウンロードページから管理者としてScanSnap Homeを再インストールしてください。',
      difficulty: 'medium',
    },
    zh: {
      title: '清理并重新安装ScanSnap Home',
      body: '运行SSHomeClean.exe以完全删除ScanSnap Home及所有本地配置。清理完成后重启计算机。从PFU/富士通官方下载页面以管理员身份重新安装ScanSnap Home。',
      difficulty: 'medium',
    },
  },

  firmwareStandaloneUpdate: {
    de: {
      title: 'Firmware-Standalone-Update durchführen',
      body: 'Verbinden Sie den Scanner über direktes USB (kein Hub). Laden Sie das Standalone-Firmware-Paket für Ihr Modell von der PFU/Fujitsu-Website herunter. Führen Sie das Updater-EXE direkt aus – nicht über ScanSnap Home. Trennen oder schalten Sie den Scanner während des Updates nicht ab.',
      difficulty: 'advanced',
    },
    en: {
      title: 'Run Standalone Firmware Update',
      body: 'Connect the scanner via direct USB (no hub). Download the standalone firmware package for your model from the PFU/Fujitsu website. Run the updater EXE directly — not via ScanSnap Home. Do not power off or disconnect during the update.',
      difficulty: 'advanced',
    },
    fr: {
      title: 'Exécuter la mise à jour firmware autonome',
      body: 'Connectez le scanner via USB direct (sans hub). Téléchargez le package firmware autonome pour votre modèle sur le site PFU/Fujitsu. Exécutez l\'EXE de mise à jour directement, pas via ScanSnap Home. Ne pas éteindre ni déconnecter pendant la mise à jour.',
      difficulty: 'advanced',
    },
    es: {
      title: 'Ejecutar actualización de firmware independiente',
      body: 'Conecte el escáner por USB directo (sin hub). Descargue el paquete de firmware independiente para su modelo desde el sitio web de PFU/Fujitsu. Ejecute el EXE del actualizador directamente, no a través de ScanSnap Home. No apague ni desconecte durante la actualización.',
      difficulty: 'advanced',
    },
    pt: {
      title: 'Executar atualização de firmware autónoma',
      body: 'Ligue o scanner via USB direto (sem hub). Descarregue o pacote de firmware autónomo para o seu modelo no site da PFU/Fujitsu. Execute o EXE do atualizador diretamente — não através do ScanSnap Home. Não desligue nem desconecte durante a atualização.',
      difficulty: 'advanced',
    },
    it: {
      title: 'Eseguire aggiornamento firmware standalone',
      body: 'Collegare lo scanner tramite USB diretto (senza hub). Scaricare il pacchetto firmware standalone per il proprio modello dal sito PFU/Fujitsu. Eseguire l\'EXE dell\'aggiornatore direttamente, non tramite ScanSnap Home. Non spegnere né scollegare durante l\'aggiornamento.',
      difficulty: 'advanced',
    },
    nl: {
      title: 'Standalone firmware-update uitvoeren',
      body: 'Sluit de scanner aan via directe USB (geen hub). Download het standalone firmware-pakket voor uw model van de PFU/Fujitsu website. Voer de updater EXE direct uit, niet via ScanSnap Home. Niet uitschakelen of loskoppelen tijdens de update.',
      difficulty: 'advanced',
    },
    ja: {
      title: 'スタンドアロンファームウェアアップデートの実行',
      body: 'スキャナーをUSBで直接接続してください（ハブなし）。PFU/富士通のウェブサイトからお使いのモデル用のスタンドアロンファームウェアパッケージをダウンロードします。ScanSnap Homeを経由せず、アップデーターのEXEを直接実行してください。アップデート中は電源を切ったり切断したりしないでください。',
      difficulty: 'advanced',
    },
    zh: {
      title: '运行独立固件更新',
      body: '通过直接USB连接扫描仪（无集线器）。从PFU/富士通网站下载适用于您型号的独立固件包。直接运行更新程序EXE，不要通过ScanSnap Home。更新过程中请勿关闭电源或断开连接。',
      difficulty: 'advanced',
    },
  },

  evaluateFirmwareRecovery: {
    de: {
      title: 'Firmware-Recovery bewerten',
      body: 'Das Standalone-Update ist fehlgeschlagen oder der Scanner wird nicht erkannt. Prüfen Sie, ob Ihr Modell die Button-Kombi-Recovery unterstützt (iX1500/iX1600: Top Sensor + Empty Arm). Wenn ja, führen Sie den Recovery-Vorgang gemäß Modell-spezifischer Anleitung durch.',
      difficulty: 'advanced',
    },
    en: {
      title: 'Evaluate Firmware Recovery',
      body: 'The standalone update has failed or the scanner is not detected. Check if your model supports button-combo recovery (iX1500/iX1600: Top Sensor + Empty Arm). If yes, perform the recovery procedure per model-specific instructions.',
      difficulty: 'advanced',
    },
    fr: {
      title: 'Évaluer la récupération firmware',
      body: 'La mise à jour autonome a échoué ou le scanner n\'est pas détecté. Vérifiez si votre modèle prend en charge la récupération par combinaison de touches (iX1500/iX1600 : Top Sensor + Empty Arm). Si oui, suivez la procédure de récupération spécifique au modèle.',
      difficulty: 'advanced',
    },
    es: {
      title: 'Evaluar recuperación de firmware',
      body: 'La actualización independiente ha fallado o el escáner no es detectado. Compruebe si su modelo admite la recuperación por combinación de botones (iX1500/iX1600: Top Sensor + Empty Arm). Si es así, siga el procedimiento de recuperación específico del modelo.',
      difficulty: 'advanced',
    },
    pt: {
      title: 'Avaliar recuperação de firmware',
      body: 'A atualização autónoma falhou ou o scanner não é detetado. Verifique se o seu modelo suporta recuperação por combinação de botões (iX1500/iX1600: Top Sensor + Empty Arm). Se sim, execute o procedimento de recuperação de acordo com as instruções específicas do modelo.',
      difficulty: 'advanced',
    },
    it: {
      title: 'Valutare il ripristino del firmware',
      body: 'L\'aggiornamento standalone è fallito o lo scanner non viene rilevato. Verificare se il modello supporta il ripristino tramite combinazione di tasti (iX1500/iX1600: Top Sensor + Empty Arm). In caso affermativo, eseguire la procedura di ripristino secondo le istruzioni specifiche del modello.',
      difficulty: 'advanced',
    },
    nl: {
      title: 'Firmware-herstel evalueren',
      body: 'De standalone update is mislukt of de scanner wordt niet gedetecteerd. Controleer of uw model knopcombi-herstel ondersteunt (iX1500/iX1600: Top Sensor + Empty Arm). Zo ja, voer de herstelprocedure uit volgens modelspecifieke instructies.',
      difficulty: 'advanced',
    },
    ja: {
      title: 'ファームウェアリカバリの評価',
      body: 'スタンドアロンアップデートが失敗したか、スキャナーが検出されません。お使いのモデルがボタンコンボリカバリに対応しているか確認してください（iX1500/iX1600：Top Sensor + Empty Arm）。対応している場合は、モデル固有の手順に従ってリカバリ手順を実行してください。',
      difficulty: 'advanced',
    },
    zh: {
      title: '评估固件恢复',
      body: '独立更新失败或扫描仪未被检测到。检查您的型号是否支持按键组合恢复（iX1500/iX1600：Top Sensor + Empty Arm）。如果支持，请按照特定型号的说明执行恢复程序。',
      difficulty: 'advanced',
    },
  },

  windowsSystemRepair: {
    de: {
      title: 'Windows-Systemintegrität reparieren (SFC/DISM)',
      body: `Öffnen Sie die Eingabeaufforderung als Administrator und führen Sie folgende Schritte der Reihe nach durch:

1) sfc /scannow
   → Warten Sie bis zum Abschluss.

2) Computer neu starten.

3) DISM /Online /Cleanup-Image /RestoreHealth
   → Warten Sie bis zum Abschluss (kann 10–20 Minuten dauern).

4) Computer neu starten.

5) sfc /scannow erneut ausführen.

6) Wiederholen Sie sfc /scannow, bis die Meldung erscheint:
   „Der Windows-Ressourcenschutz hat keine Integritätsverletzungen gefunden."

Testen Sie anschließend ScanSnap Home und die Scannerverbindung erneut.

Hinweis: Führen Sie keinen USB-Stack-Neuaufbau durch, bevor diese Reparatur nicht abgeschlossen ist — außer der Scanner ist im Geräte-Manager gar nicht sichtbar (reines USB-Enumerierungsproblem).`,
      difficulty: 'advanced',
    },
    en: {
      title: 'Windows System Integrity Repair (SFC/DISM)',
      body: `Open Command Prompt as Administrator and follow these steps in order:

1) sfc /scannow
   → Wait for completion.

2) Restart the computer.

3) DISM /Online /Cleanup-Image /RestoreHealth
   → Wait for completion (may take 10–20 minutes).

4) Restart the computer.

5) Run sfc /scannow again.

6) Repeat sfc /scannow until you see:
   "Windows Resource Protection did not find any integrity violations."

Then retest ScanSnap Home and the scanner connection.

Note: Do NOT proceed to USB-stack cleanup until this repair is complete — unless the scanner is completely invisible in Device Manager (pure USB enumeration failure).`,
      difficulty: 'advanced',
    },
    fr: {
      title: 'Réparation de l\'intégrité système Windows (SFC/DISM)',
      body: `Ouvrez l\'invite de commande en tant qu\'administrateur et suivez ces étapes dans l\'ordre :

1) sfc /scannow
   → Attendez la fin.

2) Redémarrez l\'ordinateur.

3) DISM /Online /Cleanup-Image /RestoreHealth
   → Attendez la fin (peut prendre 10 à 20 minutes).

4) Redémarrez l\'ordinateur.

5) Exécutez à nouveau sfc /scannow.

6) Répétez sfc /scannow jusqu\'à obtenir :
   « La Protection des ressources Windows n\'a trouvé aucune violation d\'intégrité. »

Testez ensuite à nouveau ScanSnap Home et la connexion du scanner.

Remarque : ne passez PAS au nettoyage de la pile USB avant la fin de cette réparation — sauf si le scanner est totalement invisible dans le Gestionnaire de périphériques.`,
      difficulty: 'advanced',
    },
    es: {
      title: 'Reparación de integridad del sistema Windows (SFC/DISM)',
      body: `Abra el símbolo del sistema como Administrador y siga estos pasos en orden:

1) sfc /scannow
   → Espere hasta que finalice.

2) Reinicie el equipo.

3) DISM /Online /Cleanup-Image /RestoreHealth
   → Espere hasta que finalice (puede tardar 10–20 minutos).

4) Reinicie el equipo.

5) Ejecute sfc /scannow de nuevo.

6) Repita sfc /scannow hasta ver:
   «La Protección de recursos de Windows no encontró ninguna infracción de integridad.»

A continuación, vuelva a probar ScanSnap Home y la conexión del escáner.

Nota: NO proceda a la limpieza de la pila USB hasta que esta reparación esté completa, salvo que el escáner no aparezca en absoluto en el Administrador de dispositivos.`,
      difficulty: 'advanced',
    },
    pt: {
      title: 'Reparação de integridade do sistema Windows (SFC/DISM)',
      body: `Abra a Linha de Comandos como Administrador e siga estes passos por ordem:

1) sfc /scannow
   → Aguarde a conclusão.

2) Reinicie o computador.

3) DISM /Online /Cleanup-Image /RestoreHealth
   → Aguarde a conclusão (pode demorar 10–20 minutos).

4) Reinicie o computador.

5) Execute sfc /scannow novamente.

6) Repita sfc /scannow até ver:
   "A Proteção de Recursos do Windows não encontrou nenhuma violação de integridade."

Depois, volte a testar o ScanSnap Home e a ligação do scanner.

Nota: NÃO avance para a limpeza da pilha USB antes de concluir esta reparação — a não ser que o scanner seja completamente invisível no Gestor de Dispositivos.`,
      difficulty: 'advanced',
    },
    it: {
      title: 'Riparazione integrità sistema Windows (SFC/DISM)',
      body: `Aprire il Prompt dei comandi come Amministratore e seguire questi passaggi nell\'ordine indicato:

1) sfc /scannow
   → Attendere il completamento.

2) Riavviare il computer.

3) DISM /Online /Cleanup-Image /RestoreHealth
   → Attendere il completamento (può richiedere 10–20 minuti).

4) Riavviare il computer.

5) Eseguire nuovamente sfc /scannow.

6) Ripetere sfc /scannow finché non viene visualizzato:
   "Protezione risorse di Windows non ha trovato violazioni di integrità."

Quindi testare nuovamente ScanSnap Home e la connessione dello scanner.

Nota: NON procedere alla pulizia dello stack USB fino al completamento di questa riparazione — a meno che lo scanner non sia completamente invisibile in Gestione dispositivi.`,
      difficulty: 'advanced',
    },
    nl: {
      title: 'Windows systeemintegriteitsreparatie (SFC/DISM)',
      body: `Open de opdrachtprompt als Administrator en volg deze stappen op volgorde:

1) sfc /scannow
   → Wacht op voltooiing.

2) Start de computer opnieuw op.

3) DISM /Online /Cleanup-Image /RestoreHealth
   → Wacht op voltooiing (kan 10–20 minuten duren).

4) Start de computer opnieuw op.

5) Voer opnieuw sfc /scannow uit.

6) Herhaal sfc /scannow totdat u ziet:
   "Windows-resourcebeveiliging heeft geen integriteitsproblemen gevonden."

Test daarna opnieuw ScanSnap Home en de scannerverbinding.

Opmerking: ga NIET over op USB-stack opschonen totdat deze reparatie is voltooid — tenzij de scanner volledig onzichtbaar is in Apparaatbeheer.`,
      difficulty: 'advanced',
    },
    ja: {
      title: 'Windowsシステム整合性の修復（SFC/DISM）',
      body: `管理者としてコマンドプロンプトを開き、以下の手順を順番に実行してください：

1) sfc /scannow
   → 完了するまで待ちます。

2) コンピューターを再起動します。

3) DISM /Online /Cleanup-Image /RestoreHealth
   → 完了するまで待ちます（10〜20分かかる場合があります）。

4) コンピューターを再起動します。

5) 再度 sfc /scannow を実行します。

6) 次のメッセージが表示されるまで sfc /scannow を繰り返します：
   「Windowsリソース保護は、整合性違反を検出しませんでした。」

その後、ScanSnap Homeとスキャナー接続を再テストしてください。

注意：この修復が完了するまでUSBスタックのクリーンアップに進まないでください。ただし、デバイスマネージャーでスキャナーがまったく表示されない場合（純粋なUSB列挙エラー）は除きます。`,
      difficulty: 'advanced',
    },
    zh: {
      title: 'Windows系统完整性修复（SFC/DISM）',
      body: `以管理员身份打开命令提示符，按顺序执行以下步骤：

1) sfc /scannow
   → 等待完成。

2) 重启计算机。

3) DISM /Online /Cleanup-Image /RestoreHealth
   → 等待完成（可能需要10–20分钟）。

4) 重启计算机。

5) 再次运行 sfc /scannow。

6) 重复 sfc /scannow，直到看到：
   "Windows 资源保护找不到任何完整性违规。"

然后重新测试 ScanSnap Home 和扫描仪连接。

注意：在完成此修复之前，请勿进行 USB 堆栈清理——除非扫描仪在设备管理器中完全不可见（纯 USB 枚举故障）。`,
      difficulty: 'advanced',
    },
  },

  recreateScannerProfiles: {
    de: {
      title: 'Scannerprofile neu erstellen',
      body: 'Öffnen Sie ScanSnap Home und löschen Sie alle bestehenden Profile. Erstellen Sie die benötigten Profile (z. B. Scan to Folder, ScanDirect) manuell neu. Prüfen Sie, ob die Zielordner und Cloud-Dienste korrekt verknüpft sind.',
      difficulty: 'medium',
    },
    en: {
      title: 'Recreate Scanner Profiles',
      body: 'Open ScanSnap Home and delete all existing profiles. Recreate the required profiles (e.g. Scan to Folder, ScanDirect) manually. Verify that target folders and cloud services are correctly linked.',
      difficulty: 'medium',
    },
    fr: {
      title: 'Recréer les profils du scanner',
      body: 'Ouvrez ScanSnap Home et supprimez tous les profils existants. Recréez manuellement les profils nécessaires (ex. : Scan vers dossier, ScanDirect). Vérifiez que les dossiers cibles et les services cloud sont correctement liés.',
      difficulty: 'medium',
    },
    es: {
      title: 'Recrear perfiles del escáner',
      body: 'Abra ScanSnap Home y elimine todos los perfiles existentes. Vuelva a crear manualmente los perfiles necesarios (p. ej., Escanear a carpeta, ScanDirect). Compruebe que las carpetas de destino y los servicios en la nube estén correctamente vinculados.',
      difficulty: 'medium',
    },
    pt: {
      title: 'Recriar perfis do scanner',
      body: 'Abra o ScanSnap Home e elimine todos os perfis existentes. Recrie manualmente os perfis necessários (ex.: Digitalizar para pasta, ScanDirect). Verifique se as pastas de destino e os serviços na nuvem estão corretamente ligados.',
      difficulty: 'medium',
    },
    it: {
      title: 'Ricreare i profili dello scanner',
      body: 'Aprire ScanSnap Home ed eliminare tutti i profili esistenti. Ricreare manualmente i profili necessari (es.: Scansione su cartella, ScanDirect). Verificare che le cartelle di destinazione e i servizi cloud siano correttamente collegati.',
      difficulty: 'medium',
    },
    nl: {
      title: 'Scannerprofielen opnieuw aanmaken',
      body: 'Open ScanSnap Home en verwijder alle bestaande profielen. Maak de benodigde profielen opnieuw aan (bijv. Scannen naar map, ScanDirect). Controleer of doelmappen en cloudservices correct zijn gekoppeld.',
      difficulty: 'medium',
    },
    ja: {
      title: 'スキャナープロファイルの再作成',
      body: 'ScanSnap Homeを開き、既存のすべてのプロファイルを削除します。必要なプロファイル（例：フォルダへのスキャン、ScanDirect）を手動で再作成します。ターゲットフォルダとクラウドサービスが正しくリンクされているか確認してください。',
      difficulty: 'medium',
    },
    zh: {
      title: '重新创建扫描仪配置文件',
      body: '打开ScanSnap Home并删除所有现有配置文件。手动重新创建所需的配置文件（例如：扫描到文件夹、ScanDirect）。验证目标文件夹和云服务是否正确关联。',
      difficulty: 'medium',
    },
  },

  disableUsbPowerManagement: {
    de: {
      title: 'USB-Energieverwaltung deaktivieren',
      body: 'Öffnen Sie den Geräte-Manager → USB-Controller → Eigenschaften des entsprechenden USB-Root-Hubs. Deaktivieren Sie unter "Energieverwaltung" die Option "Computer kann dieses Gerät ausschalten". Wiederholen Sie dies für alle USB-Root-Hubs.',
      difficulty: 'medium',
    },
    en: {
      title: 'Disable USB Power Management',
      body: 'Open Device Manager → USB Controllers → Properties of the relevant USB Root Hub. Under Power Management, uncheck "Allow the computer to turn off this device to save power". Repeat for all USB Root Hubs.',
      difficulty: 'medium',
    },
    fr: {
      title: 'Désactiver la gestion de l\'alimentation USB',
      body: 'Ouvrez le Gestionnaire de périphériques → Contrôleurs USB → Propriétés du hub USB Root concerné. Sous Gestion de l\'alimentation, décochez "Autoriser l\'ordinateur à éteindre ce périphérique pour économiser de l\'énergie". Répétez pour tous les hubs USB Root.',
      difficulty: 'medium',
    },
    es: {
      title: 'Deshabilitar administración de energía USB',
      body: 'Abra el Administrador de dispositivos → Controladores USB → Propiedades del concentrador raíz USB correspondiente. En Administración de energía, desmarque "Permitir que el equipo apague este dispositivo para ahorrar energía". Repita para todos los concentradores raíz USB.',
      difficulty: 'medium',
    },
    pt: {
      title: 'Desativar gestão de energia USB',
      body: 'Abra o Gestor de Dispositivos → Controladores USB → Propriedades do Hub Raiz USB relevante. Em Gestão de Energia, desmarque "Permitir que o computador desligue este dispositivo para poupar energia". Repita para todos os Hubs Raiz USB.',
      difficulty: 'medium',
    },
    it: {
      title: 'Disabilitare la gestione energetica USB',
      body: 'Aprire Gestione dispositivi → Controller USB → Proprietà dell\'hub radice USB pertinente. In Gestione alimentazione, deselezionare "Consenti al computer di spegnere il dispositivo per risparmiare energia". Ripetere per tutti gli hub radice USB.',
      difficulty: 'medium',
    },
    nl: {
      title: 'USB-energiebeheer uitschakelen',
      body: 'Open Apparaatbeheer → USB-controllers → Eigenschappen van de relevante USB-hoofdhub. Schakel onder Energiebeheer de optie "De computer mag dit apparaat uitschakelen om energie te besparen" uit. Herhaal dit voor alle USB-hoofdhubs.',
      difficulty: 'medium',
    },
    ja: {
      title: 'USB電源管理を無効にする',
      body: 'デバイスマネージャーを開き、USBコントローラー → 該当するUSBルートハブのプロパティを開きます。電源管理タブで「電力の節約のために、コンピューターでこのデバイスの電源をオフにできるようにする」のチェックを外します。すべてのUSBルートハブに対して繰り返してください。',
      difficulty: 'medium',
    },
    zh: {
      title: '禁用USB电源管理',
      body: '打开设备管理器 → USB控制器 → 相关USB根集线器的属性。在电源管理下，取消勾选"允许计算机关闭此设备以节约电源"。对所有USB根集线器重复此操作。',
      difficulty: 'medium',
    },
  },

  repairWifiConnection: {
    de: {
      title: 'WLAN-Verbindung zurücksetzen',
      body: 'Setzen Sie die WLAN-Einstellungen am Scanner zurück (Einstellungen → Netzwerk zurücksetzen). Führen Sie die WLAN-Einrichtung erneut durch und verbinden Sie den Scanner mit dem 2,4-GHz-Netz. Stellen Sie sicher, dass Band Steering auf dem Router deaktiviert ist.',
      difficulty: 'medium',
    },
    en: {
      title: 'Reset Wi-Fi Connection',
      body: 'Reset the Wi-Fi settings on the scanner (Settings → Reset Network). Re-run the Wi-Fi setup and connect to the 2.4GHz network. Ensure band steering is disabled on the router.',
      difficulty: 'medium',
    },
    fr: {
      title: 'Réinitialiser la connexion Wi-Fi',
      body: 'Réinitialisez les paramètres Wi-Fi du scanner (Paramètres → Réinitialiser le réseau). Relancez la configuration Wi-Fi et connectez-vous au réseau 2,4 GHz. Assurez-vous que le band steering est désactivé sur le routeur.',
      difficulty: 'medium',
    },
    es: {
      title: 'Restablecer conexión Wi-Fi',
      body: 'Restablezca la configuración Wi-Fi del escáner (Ajustes → Restablecer red). Vuelva a ejecutar la configuración Wi-Fi y conéctese a la red de 2,4 GHz. Asegúrese de que el band steering esté desactivado en el router.',
      difficulty: 'medium',
    },
    pt: {
      title: 'Repor ligação Wi-Fi',
      body: 'Reponha as definições Wi-Fi do scanner (Definições → Repor rede). Execute novamente a configuração Wi-Fi e ligue-se à rede de 2,4 GHz. Certifique-se de que o band steering está desativado no router.',
      difficulty: 'medium',
    },
    it: {
      title: 'Ripristinare la connessione Wi-Fi',
      body: 'Ripristinare le impostazioni Wi-Fi dello scanner (Impostazioni → Reimposta rete). Rieseguire la configurazione Wi-Fi e connettersi alla rete 2,4 GHz. Assicurarsi che il band steering sia disabilitato sul router.',
      difficulty: 'medium',
    },
    nl: {
      title: 'Wi-Fi-verbinding resetten',
      body: 'Reset de Wi-Fi-instellingen op de scanner (Instellingen → Netwerk resetten). Voer de Wi-Fi-instelling opnieuw uit en verbind met het 2,4 GHz-netwerk. Zorg ervoor dat band steering op de router is uitgeschakeld.',
      difficulty: 'medium',
    },
    ja: {
      title: 'Wi-Fi接続のリセット',
      body: 'スキャナーのWi-Fi設定をリセットします（設定 → ネットワークのリセット）。Wi-Fiセットアップを再実行し、2.4GHzネットワークに接続します。ルーターのバンドステアリングが無効になっていることを確認してください。',
      difficulty: 'medium',
    },
    zh: {
      title: '重置Wi-Fi连接',
      body: '重置扫描仪上的Wi-Fi设置（设置 → 重置网络）。重新运行Wi-Fi设置并连接到2.4GHz网络。确保路由器上的频段引导已禁用。',
      difficulty: 'medium',
    },
  },

  checkRouterBandSteering: {
    de: {
      title: 'Router Band Steering prüfen',
      body: 'Melden Sie sich in der Router-Verwaltungsoberfläche an. Deaktivieren Sie Band Steering / Smart Connect, falls aktiv. Erstellen Sie ein separates 2,4-GHz-SSID-Netzwerk. Verbinden Sie den Scanner mit dem dedizierten 2,4-GHz-Netz.',
      difficulty: 'medium',
    },
    en: {
      title: 'Check Router Band Steering',
      body: 'Log in to the router admin interface. Disable Band Steering / Smart Connect if active. Create a separate 2.4GHz SSID network. Connect the scanner to the dedicated 2.4GHz network.',
      difficulty: 'medium',
    },
    fr: {
      title: 'Vérifier le band steering du routeur',
      body: 'Connectez-vous à l\'interface d\'administration du routeur. Désactivez le Band Steering / Smart Connect s\'il est actif. Créez un réseau SSID 2,4 GHz séparé. Connectez le scanner au réseau 2,4 GHz dédié.',
      difficulty: 'medium',
    },
    es: {
      title: 'Verificar band steering del router',
      body: 'Inicie sesión en la interfaz de administración del router. Desactive Band Steering / Smart Connect si está activo. Cree una red SSID de 2,4 GHz separada. Conecte el escáner a la red de 2,4 GHz dedicada.',
      difficulty: 'medium',
    },
    pt: {
      title: 'Verificar band steering do router',
      body: 'Inicie sessão na interface de administração do router. Desative o Band Steering / Smart Connect se estiver ativo. Crie uma rede SSID de 2,4 GHz separada. Ligue o scanner à rede de 2,4 GHz dedicada.',
      difficulty: 'medium',
    },
    it: {
      title: 'Verificare il band steering del router',
      body: 'Accedere all\'interfaccia di amministrazione del router. Disabilitare il Band Steering / Smart Connect se attivo. Creare una rete SSID 2,4 GHz separata. Connettere lo scanner alla rete 2,4 GHz dedicata.',
      difficulty: 'medium',
    },
    nl: {
      title: 'Router band steering controleren',
      body: 'Log in op de router beheerpagina. Schakel Band Steering / Smart Connect uit indien actief. Maak een apart 2,4 GHz SSID-netwerk aan. Verbind de scanner met het speciale 2,4 GHz-netwerk.',
      difficulty: 'medium',
    },
    ja: {
      title: 'ルーターのバンドステアリング確認',
      body: 'ルーターの管理インターフェースにログインします。バンドステアリング / スマートコネクトが有効な場合は無効にします。別の2.4GHz SSIDネットワークを作成します。スキャナーを専用の2.4GHzネットワークに接続してください。',
      difficulty: 'medium',
    },
    zh: {
      title: '检查路由器频段引导',
      body: '登录路由器管理界面。如果频段引导/智能连接已启用，请将其禁用。创建一个单独的2.4GHz SSID网络。将扫描仪连接到专用的2.4GHz网络。',
      difficulty: 'medium',
    },
  },

  reauthCloudStorage: {
    de: {
      title: 'Cloud-Speicher neu authentifizieren',
      body: 'Öffnen Sie ScanSnap Home → Einstellungen → Cloud-Dienste. Trennen Sie den betroffenen Cloud-Dienst (OneDrive, Google Drive etc.) und melden Sie sich erneut an. Prüfen Sie, ob die Zielordner korrekt zugeordnet sind.',
      difficulty: 'medium',
    },
    en: {
      title: 'Re-authenticate Cloud Storage',
      body: 'Open ScanSnap Home → Settings → Cloud Services. Disconnect the affected cloud service (OneDrive, Google Drive, etc.) and sign in again. Verify that target folders are correctly mapped.',
      difficulty: 'medium',
    },
    fr: {
      title: 'Réauthentifier le stockage cloud',
      body: 'Ouvrez ScanSnap Home → Paramètres → Services cloud. Déconnectez le service cloud concerné (OneDrive, Google Drive, etc.) et reconnectez-vous. Vérifiez que les dossiers cibles sont correctement mappés.',
      difficulty: 'medium',
    },
    es: {
      title: 'Volver a autenticar almacenamiento en la nube',
      body: 'Abra ScanSnap Home → Ajustes → Servicios en la nube. Desconecte el servicio en la nube afectado (OneDrive, Google Drive, etc.) y vuelva a iniciar sesión. Compruebe que las carpetas de destino estén correctamente asignadas.',
      difficulty: 'medium',
    },
    pt: {
      title: 'Reautenticar armazenamento na nuvem',
      body: 'Abra o ScanSnap Home → Definições → Serviços na nuvem. Desconecte o serviço na nuvem afetado (OneDrive, Google Drive, etc.) e volte a iniciar sessão. Verifique se as pastas de destino estão corretamente mapeadas.',
      difficulty: 'medium',
    },
    it: {
      title: 'Riautenticare l\'archiviazione cloud',
      body: 'Aprire ScanSnap Home → Impostazioni → Servizi cloud. Disconnettere il servizio cloud interessato (OneDrive, Google Drive, ecc.) e accedere nuovamente. Verificare che le cartelle di destinazione siano correttamente mappate.',
      difficulty: 'medium',
    },
    nl: {
      title: 'Cloudopslag opnieuw verifiëren',
      body: 'Open ScanSnap Home → Instellingen → Cloudservices. Verbreek de verbinding met de betreffende cloudservice (OneDrive, Google Drive, enz.) en meld u opnieuw aan. Controleer of doelmappen correct zijn gekoppeld.',
      difficulty: 'medium',
    },
    ja: {
      title: 'クラウドストレージの再認証',
      body: 'ScanSnap Homeを開き、設定 → クラウドサービスを選択します。影響を受けるクラウドサービス（OneDrive、Google Driveなど）の接続を解除し、再度サインインします。ターゲットフォルダーが正しくマッピングされているか確認してください。',
      difficulty: 'medium',
    },
    zh: {
      title: '重新认证云存储',
      body: '打开ScanSnap Home → 设置 → 云服务。断开受影响的云服务（OneDrive、Google Drive等）并重新登录。验证目标文件夹是否正确映射。',
      difficulty: 'medium',
    },
  },

  cleanRollersAndGlass: {
    de: {
      title: 'Rollen und Glas reinigen',
      body: 'Öffnen Sie die Abdeckung des Scanners. Reinigen Sie die Transportrollen und die Glasfläche mit einem leicht feuchten, fusselfreien Tuch. Verwenden Sie bei Bedarf das mitgelieferte Reinigungstuch (F1). Lassen Sie alles trocknen bevor Sie den Scanner schließen.',
      difficulty: 'easy',
    },
    en: {
      title: 'Clean Rollers and Glass',
      body: 'Open the scanner cover. Clean the feed rollers and glass surface with a slightly damp, lint-free cloth. Use the supplied cleaning cloth (F1) if available. Allow everything to dry before closing the scanner.',
      difficulty: 'easy',
    },
    fr: {
      title: 'Nettoyer les rouleaux et la vitre',
      body: 'Ouvrez le capot du scanner. Nettoyez les rouleaux d\'alimentation et la surface en verre avec un chiffon légèrement humide et non pelucheux. Utilisez le chiffon de nettoyage fourni (F1) si disponible. Laissez sécher avant de fermer le scanner.',
      difficulty: 'easy',
    },
    es: {
      title: 'Limpiar rodillos y cristal',
      body: 'Abra la cubierta del escáner. Limpie los rodillos de alimentación y la superficie de cristal con un paño ligeramente húmedo y sin pelusa. Use el paño de limpieza suministrado (F1) si está disponible. Deje secar todo antes de cerrar el escáner.',
      difficulty: 'easy',
    },
    pt: {
      title: 'Limpar rolos e vidro',
      body: 'Abra a tampa do scanner. Limpe os rolos de alimentação e a superfície de vidro com um pano ligeiramente húmido e sem pelos. Use o pano de limpeza fornecido (F1) se disponível. Deixe secar tudo antes de fechar o scanner.',
      difficulty: 'easy',
    },
    it: {
      title: 'Pulire rulli e vetro',
      body: 'Aprire il coperchio dello scanner. Pulire i rulli di alimentazione e la superficie in vetro con un panno leggermente inumidito e privo di pelucchi. Usare il panno di pulizia fornito (F1) se disponibile. Lasciare asciugare tutto prima di chiudere lo scanner.',
      difficulty: 'easy',
    },
    nl: {
      title: 'Rollen en glas reinigen',
      body: 'Open de scannerklep. Reinig de invoerrollers en het glasoppervlak met een licht vochtig, pluisvrij doekje. Gebruik het meegeleverde reinigingsdoekje (F1) indien beschikbaar. Laat alles drogen voordat u de scanner sluit.',
      difficulty: 'easy',
    },
    ja: {
      title: 'ローラーとガラスの清掃',
      body: 'スキャナーのカバーを開けます。わずかに湿らせた糸くずの出ない布で、フィードローラーとガラス面を清掃してください。付属のクリーニングクロス（F1）があれば使用してください。スキャナーを閉じる前にすべてが乾いていることを確認してください。',
      difficulty: 'easy',
    },
    zh: {
      title: '清洁滚轮和玻璃',
      body: '打开扫描仪盖板。用稍微湿润的无绒布清洁进纸滚轮和玻璃表面。如有随附清洁布（F1），请使用。关闭扫描仪前请确保所有部件已干燥。',
      difficulty: 'easy',
    },
  },

  checkPaperPath: {
    de: {
      title: 'Papierpfad prüfen',
      body: 'Öffnen Sie den Scanner und prüfen Sie den Papierpfad auf Fremdkörper oder Papierfetzen. Stellen Sie sicher, dass die Führungsschienen korrekt eingestellt sind. Testen Sie mit einem einzelnen, sauberen DIN-A4-Blatt.',
      difficulty: 'easy',
    },
    en: {
      title: 'Check Paper Path',
      body: 'Open the scanner and inspect the paper path for foreign objects or paper fragments. Ensure the paper guides are correctly adjusted. Test with a single clean A4 sheet.',
      difficulty: 'easy',
    },
    fr: {
      title: 'Vérifier le chemin du papier',
      body: 'Ouvrez le scanner et inspectez le chemin du papier pour détecter des corps étrangers ou des fragments de papier. Assurez-vous que les guides papier sont correctement réglés. Testez avec une seule feuille A4 propre.',
      difficulty: 'easy',
    },
    es: {
      title: 'Verificar la ruta del papel',
      body: 'Abra el escáner e inspeccione la ruta del papel en busca de objetos extraños o fragmentos de papel. Asegúrese de que las guías del papel estén correctamente ajustadas. Pruebe con una sola hoja A4 limpia.',
      difficulty: 'easy',
    },
    pt: {
      title: 'Verificar o percurso do papel',
      body: 'Abra o scanner e inspecione o percurso do papel em busca de objetos estranhos ou fragmentos de papel. Certifique-se de que as guias de papel estão corretamente ajustadas. Teste com uma única folha A4 limpa.',
      difficulty: 'easy',
    },
    it: {
      title: 'Verificare il percorso della carta',
      body: 'Aprire lo scanner e ispezionare il percorso della carta per individuare corpi estranei o frammenti di carta. Assicurarsi che le guide carta siano correttamente regolate. Testare con un singolo foglio A4 pulito.',
      difficulty: 'easy',
    },
    nl: {
      title: 'Papierpad controleren',
      body: 'Open de scanner en controleer het papierpad op vreemde voorwerpen of papiersnippers. Zorg ervoor dat de papiergeleiders correct zijn afgesteld. Test met één schoon A4-vel.',
      difficulty: 'easy',
    },
    ja: {
      title: '用紙搬送路の確認',
      body: 'スキャナーを開き、異物や紙片がないか用紙搬送路を点検します。用紙ガイドが正しく調整されていることを確認してください。清潔なA4用紙1枚でテストしてください。',
      difficulty: 'easy',
    },
    zh: {
      title: '检查纸张路径',
      body: '打开扫描仪并检查纸张路径是否有异物或纸张碎片。确保纸张导轨调整正确。用一张干净的A4纸进行测试。',
      difficulty: 'easy',
    },
  },
};

/**
 * Resolve a stepId to localized title + body + difficulty.
 * Falls back to English if the requested language is not found.
 * Returns a safe fallback object if the stepId is unknown.
 */
export function resolveStep(stepId, lang = 'en') {
  const step = stepTranslations[stepId];
  if (!step) {
    return { title: stepId, body: '', difficulty: 'medium' };
  }
  const l = (lang || 'en').toLowerCase();
  return step[l] || step['en'] || { title: stepId, body: '', difficulty: 'medium' };
}

export default stepTranslations;