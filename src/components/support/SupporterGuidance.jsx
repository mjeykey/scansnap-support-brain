// ============================================================
// SupporterGuidance – Personalized assistant panel
// Greets the supporter by name, shows current phase, encourages
// ============================================================

import React from 'react';
import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';

const MESSAGES = {
  de: {
    greeting: (name) => name ? `Hi ${name}, ich schaue mir den Fall mit dir an.` : `Schön, dass du da bist. Ich helfe dir durch den Fall.`,
    phases: [
      '① Modell & Verbindungstyp prüfen',
      '② Fehlerbild verstehen',
      '③ Wahrscheinlichste Ursache eingrenzen',
      '④ Passenden KB-Eintrag laden',
      '⑤ Nächsten sinnvollen Schritt zeigen',
    ],
    microcopy: [
      'Keine Sorge, wir prüfen das logisch Schritt für Schritt.',
      'Guter Hinweis – ich prüfe zuerst die wahrscheinlichste Ursache.',
      'Wir springen nicht direkt zur Eskalation – wir prüfen sauber weiter.',
      'Ich zeige dir den nächsten sinnvollen Schritt.',
      'Du hast schon wichtige Informationen gesammelt.',
    ],
    phaseLabel: 'Analyse-Reihenfolge',
  },
  en: {
    greeting: (name) => name ? `Hi ${name}, let's go through this case step by step.` : `Let's work through this case together.`,
    phases: [
      '① Check model & connection type',
      '② Understand the symptom',
      '③ Narrow down the likely cause',
      '④ Load matching KB entry',
      '⑤ Show the next logical support step',
    ],
    microcopy: [
      'No worries, we\'ll check this step by step.',
      'Good clue — I\'ll check the most likely cause first.',
      'We won\'t jump to escalation too early.',
      'I\'ll show you the next logical support step.',
      'You\'ve already gathered important information.',
    ],
    phaseLabel: 'Analysis flow',
  },
  pt: {
    greeting: (name) => name ? `Olá ${name}, vamos analisar este caso passo a passo.` : `Vamos analisar este caso juntos.`,
    phases: [
      '① Verificar modelo e tipo de conexão',
      '② Entender o sintoma',
      '③ Identificar a causa mais provável',
      '④ Carregar entrada KB correspondente',
      '⑤ Mostrar o próximo passo lógico',
    ],
    microcopy: [
      'Sem preocupações, vamos verificar isso passo a passo.',
      'Boa dica — vou verificar a causa mais provável primeiro.',
      'Não vamos escalar muito cedo.',
      'Vou mostrar o próximo passo lógico de suporte.',
      'Você já reuniu informações importantes.',
    ],
    phaseLabel: 'Fluxo de análise',
  },
  es: {
    greeting: (name) => name ? `Hola ${name}, vamos a analizar este caso paso a paso.` : `Vamos a trabajar juntos en este caso.`,
    phases: [
      '① Verificar modelo y tipo de conexión',
      '② Comprender el síntoma',
      '③ Identificar la causa más probable',
      '④ Cargar entrada KB correspondiente',
      '⑤ Mostrar el siguiente paso lógico',
    ],
    microcopy: [
      'No te preocupes, lo revisaremos paso a paso.',
      'Buena pista — primero verificaré la causa más probable.',
      'No escalaremos demasiado pronto.',
      'Te mostraré el siguiente paso lógico de soporte.',
      'Ya has reunido información importante.',
    ],
    phaseLabel: 'Flujo de análisis',
  },
  fr: {
    greeting: (name) => name ? `Bonjour ${name}, on va analyser ce cas étape par étape.` : `Travaillons ensemble sur ce cas.`,
    phases: [
      '① Vérifier le modèle et le type de connexion',
      '② Comprendre le symptôme',
      '③ Identifier la cause la plus probable',
      '④ Charger l\'entrée KB correspondante',
      '⑤ Afficher la prochaine étape logique',
    ],
    microcopy: [
      'Pas d\'inquiétude, on vérifie ça étape par étape.',
      'Bon indice — je vérifie d\'abord la cause la plus probable.',
      'On ne va pas escalader trop tôt.',
      'Je te montre la prochaine étape logique.',
      'Tu as déjà rassemblé des informations importantes.',
    ],
    phaseLabel: 'Flux d\'analyse',
  },
  it: {
    greeting: (name) => name ? `Ciao ${name}, analizziamo questo caso passo dopo passo.` : `Lavoriamo insieme su questo caso.`,
    phases: [
      '① Verificare modello e tipo di connessione',
      '② Comprendere il sintomo',
      '③ Identificare la causa più probabile',
      '④ Caricare la voce KB corrispondente',
      '⑤ Mostrare il passo logico successivo',
    ],
    microcopy: [
      'Nessuna preoccupazione, lo verificheremo passo dopo passo.',
      'Buon indizio — verifico prima la causa più probabile.',
      'Non escaleremo troppo presto.',
      'Ti mostro il prossimo passo logico di supporto.',
      'Hai già raccolto informazioni importanti.',
    ],
    phaseLabel: 'Flusso di analisi',
  },
  nl: {
    greeting: (name) => name ? `Hallo ${name}, laten we deze zaak stap voor stap doorlopen.` : `Laten we samen aan deze zaak werken.`,
    phases: [
      '① Model en verbindingstype controleren',
      '② Het symptoom begrijpen',
      '③ De meest waarschijnlijke oorzaak bepalen',
      '④ Overeenkomend KB-item laden',
      '⑤ De volgende logische stap tonen',
    ],
    microcopy: [
      'Geen zorgen, we controleren dit stap voor stap.',
      'Goede aanwijzing — ik controleer eerst de meest waarschijnlijke oorzaak.',
      'We escaleren niet te vroeg.',
      'Ik toon je de volgende logische ondersteuningsstap.',
      'Je hebt al belangrijke informatie verzameld.',
    ],
    phaseLabel: 'Analysestroom',
  },
  ja: {
    greeting: (name) => name ? `こんにちは ${name}さん、一緒にこのケースを順番に確認しましょう。` : `このケースを一緒に確認しましょう。`,
    phases: [
      '① モデルと接続タイプを確認',
      '② 症状を理解する',
      '③ 最も可能性の高い原因を特定',
      '④ 一致するKBエントリを読み込む',
      '⑤ 次の論理的なサポートステップを表示',
    ],
    microcopy: [
      '心配しないでください、順番に確認します。',
      '良い手がかりです — まず最も可能性の高い原因を確認します。',
      '早まってエスカレーションしません。',
      '次の論理的なサポートステップを示します。',
      '重要な情報がすでに集まっています。',
    ],
    phaseLabel: '分析フロー',
  },
  zh: {
    greeting: (name) => name ? `您好 ${name}，我们一步一步地分析这个案例。` : `让我们一起处理这个案例。`,
    phases: [
      '① 检查型号和连接类型',
      '② 了解症状',
      '③ 确定最可能的原因',
      '④ 加载匹配的知识库条目',
      '⑤ 显示下一个逻辑支持步骤',
    ],
    microcopy: [
      '别担心，我们会一步一步地检查。',
      '好线索 — 我首先检查最可能的原因。',
      '我们不会过早升级。',
      '我会向您展示下一个逻辑支持步骤。',
      '您已经收集了重要信息。',
    ],
    phaseLabel: '分析流程',
  },
};

function getMicrocopy(lang, hasName, hasProblem, hasResults) {
  const m = MESSAGES[lang] || MESSAGES['en'];
  if (hasResults) return m.microcopy[3]; // next step
  if (hasProblem) return m.microcopy[0]; // checking step by step
  if (hasName) return m.microcopy[4];    // already gathered info
  return m.microcopy[0];
}

export default function SupporterGuidance({ supporterName, language, hasProblem, hasResults }) {
  const lang = (language || 'de').toLowerCase();
  const m = MESSAGES[lang] || MESSAGES['en'];
  const micro = getMicrocopy(lang, !!supporterName, hasProblem, hasResults);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="w-full rounded-2xl p-4 space-y-3"
      style={{
        background: 'rgba(45,212,191,0.05)',
        border: '1px solid rgba(45,212,191,0.12)',
      }}
    >
      {/* Greeting */}
      <div className="flex items-start gap-2.5">
        <Heart className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
        <div className="space-y-1">
          <p className="text-sm font-medium text-white/85 leading-snug">
            {m.greeting(supporterName)}
          </p>
          <p className="text-xs text-primary/70 leading-relaxed italic">
            {micro}
          </p>
        </div>
      </div>

      {/* Analysis phases */}
      <div className="border-t border-white/5 pt-3">
        <p className="text-[9px] font-bold uppercase tracking-widest text-white/20 mb-2">{m.phaseLabel}</p>
        <ol className="space-y-1">
          {m.phases.map((phase, i) => (
            <li
              key={i}
              className={`text-[11px] leading-relaxed transition-colors ${
                i === 0 && !hasProblem ? 'text-primary/80 font-medium' :
                i === 1 && hasProblem && !hasResults ? 'text-primary/80 font-medium' :
                i === 3 && hasResults ? 'text-primary/80 font-medium' :
                'text-white/25'
              }`}
            >
              {phase}
            </li>
          ))}
        </ol>
      </div>
    </motion.div>
  );
}