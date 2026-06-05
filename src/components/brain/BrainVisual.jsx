import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const ANALYSIS_MESSAGES = {
  de: ['Analysiere…', 'Prüfe mögliche Ursachen…', 'Durchsuche Wissensdatenbank…', 'Bereite Schritte vor…'],
  en: ['Analyzing…', 'Checking possible causes…', 'Searching knowledge base…', 'Preparing guidance…'],
  pt: ['Analisando…', 'Verificando causas…', 'Consultando base de dados…', 'Preparando orientações…'],
  es: ['Analizando…', 'Verificando causas…', 'Consultando base de datos…', 'Preparando orientación…'],
  fr: ['Analyse en cours…', 'Vérification des causes…', 'Recherche dans la base…', 'Préparation des étapes…'],
  it: ['Analisi in corso…', 'Verifica delle cause…', 'Ricerca nella base…', 'Preparazione passi…'],
  nl: ['Analyseren…', 'Mogelijke oorzaken controleren…', 'Kennisbank doorzoeken…', 'Stappen voorbereiden…'],
  ja: ['分析中…', '原因を確認中…', 'ナレッジベースを検索中…', '手順を準備中…'],
  zh: ['正在分析…', '检查可能原因…', '搜索知识库…', '准备指导步骤…'],
};

export default function BrainVisual({ isAnalyzing, disabled, onClick, language = 'en' }) {
  const [msgIndex, setMsgIndex] = useState(0);
  const [ripples, setRipples]   = useState([]);
  const messages = ANALYSIS_MESSAGES[language] || ANALYSIS_MESSAGES['en'];

  useEffect(() => {
    if (!isAnalyzing) { setMsgIndex(0); return; }
    const interval = setInterval(() => setMsgIndex(i => (i + 1) % messages.length), 1800);
    return () => clearInterval(interval);
  }, [isAnalyzing, language]);

  const handleClick = () => {
    if (disabled) return;
    setRipples(r => [...r, Date.now()]);
    setTimeout(() => setRipples(r => r.slice(1)), 1400);
    onClick();
  };

  return (
    <div className="relative flex flex-col items-center">
      <div className="relative flex items-center justify-center" style={{ width: 300, height: 300 }}>

        {/* Ripple on click */}
        {ripples.map(id => (
          <motion.div
            key={id}
            className="absolute rounded-full"
            style={{ width: 200, height: 200, border: '1px solid rgba(160,180,255,0.45)' }}
            initial={{ scale: 0.8, opacity: 0.9 }}
            animate={{ scale: 2.6, opacity: 0 }}
            transition={{ duration: 1.4, ease: 'easeOut' }}
          />
        ))}

        {/* Brain — pure SVG, no image assets */}
        <motion.button
          onClick={handleClick}
          disabled={disabled}
          className="relative z-10 focus:outline-none select-none"
          style={{ cursor: disabled ? 'default' : 'pointer' }}
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
          whileHover={!disabled ? { scale: 1.05 } : {}}
          whileTap={!disabled ? { scale: 0.96 } : {}}
        >
          <motion.svg
            viewBox="0 0 200 180"
            width="260"
            height="260"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{ opacity: disabled && !isAnalyzing ? 0.35 : 1, display: 'block' }}
            animate={isAnalyzing
              ? { filter: ['drop-shadow(0 0 22px rgba(120,160,255,0.9)) drop-shadow(0 0 50px rgba(255,100,200,0.7))', 'drop-shadow(0 0 44px rgba(120,160,255,1)) drop-shadow(0 0 90px rgba(255,100,200,0.9))', 'drop-shadow(0 0 22px rgba(120,160,255,0.9)) drop-shadow(0 0 50px rgba(255,100,200,0.7))'] }
              : { filter: ['drop-shadow(0 0 10px rgba(120,160,255,0.45)) drop-shadow(0 0 25px rgba(255,100,200,0.3))', 'drop-shadow(0 0 24px rgba(120,160,255,0.7)) drop-shadow(0 0 50px rgba(255,100,200,0.5))', 'drop-shadow(0 0 10px rgba(120,160,255,0.45)) drop-shadow(0 0 25px rgba(255,100,200,0.3))'] }
            }
            transition={{ duration: isAnalyzing ? 1.3 : 4.5, repeat: Infinity, ease: 'easeInOut' }}
          >
            <defs>
              {/* Left hemisphere — cyan/blue */}
              <radialGradient id="lgL" cx="35%" cy="40%" r="70%">
                <stop offset="0%" stopColor="#a8d8ff" stopOpacity="1" />
                <stop offset="40%" stopColor="#60a0f0" stopOpacity="0.95" />
                <stop offset="100%" stopColor="#3060c0" stopOpacity="0.8" />
              </radialGradient>
              {/* Right hemisphere — pink/magenta */}
              <radialGradient id="lgR" cx="65%" cy="40%" r="70%">
                <stop offset="0%" stopColor="#ffb0e0" stopOpacity="1" />
                <stop offset="40%" stopColor="#e060b0" stopOpacity="0.95" />
                <stop offset="100%" stopColor="#b040a0" stopOpacity="0.8" />
              </radialGradient>
              {/* Center seam glow */}
              <radialGradient id="seam" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
                <stop offset="60%" stopColor="#d0c0ff" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
              </radialGradient>
              {/* Sheen overlay */}
              <radialGradient id="sheen" cx="50%" cy="20%" r="60%">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
              </radialGradient>
              <linearGradient id="foldL" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#90c8ff" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#4080e0" stopOpacity="0.5" />
              </linearGradient>
              <linearGradient id="foldR" x1="100%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#ffb0e0" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#d050a0" stopOpacity="0.5" />
              </linearGradient>
            </defs>

            {/* ── Left hemisphere body ── */}
            <path
              d="M100 28
                 C88 20, 68 20, 54 30
                 C38 42, 30 58, 32 76
                 C34 94, 44 108, 58 118
                 C68 124, 80 128, 90 127
                 L100 126 Z"
              fill="url(#lgL)"
            />
            {/* ── Right hemisphere body ── */}
            <path
              d="M100 28
                 C112 20, 132 20, 146 30
                 C162 42, 170 58, 168 76
                 C166 94, 156 108, 142 118
                 C132 124, 120 128, 110 127
                 L100 126 Z"
              fill="url(#lgR)"
            />

            {/* ── Left cortex folds ── */}
            <path d="M56 38 C48 50, 44 64, 46 78" stroke="url(#foldL)" strokeWidth="2.5" strokeLinecap="round" fill="none" strokeDasharray="36">
              <animate attributeName="stroke-dashoffset" values="36;0;-36;0;36" dur="3.4s" repeatCount="indefinite" />
            </path>
            <path d="M40 56 C36 68, 38 82, 44 94" stroke="url(#foldL)" strokeWidth="2" strokeLinecap="round" fill="none" strokeDasharray="28">
              <animate attributeName="stroke-dashoffset" values="0;28;0" dur="4.6s" repeatCount="indefinite" />
            </path>
            <path d="M68 32 C64 46, 62 62, 64 76" stroke="url(#foldL)" strokeWidth="1.8" strokeLinecap="round" fill="none" strokeDasharray="40">
              <animate attributeName="stroke-dashoffset" values="40;0;40" dur="3.8s" repeatCount="indefinite" />
            </path>
            <path d="M76 100 C70 110, 68 118, 72 124" stroke="url(#foldL)" strokeWidth="1.5" strokeLinecap="round" fill="none" strokeDasharray="22">
              <animate attributeName="stroke-dashoffset" values="22;0;22" dur="4s" repeatCount="indefinite" />
            </path>
            <path d="M50 88 C48 98, 50 108, 56 116" stroke="url(#foldL)" strokeWidth="1.6" strokeLinecap="round" fill="none" strokeDasharray="25">
              <animate attributeName="stroke-dashoffset" values="0;-25;0" dur="3.2s" repeatCount="indefinite" />
            </path>

            {/* ── Right cortex folds ── */}
            <path d="M144 38 C152 50, 156 64, 154 78" stroke="url(#foldR)" strokeWidth="2.5" strokeLinecap="round" fill="none" strokeDasharray="36">
              <animate attributeName="stroke-dashoffset" values="0;36;0;-36;0" dur="3.6s" repeatCount="indefinite" />
            </path>
            <path d="M160 56 C164 68, 162 82, 156 94" stroke="url(#foldR)" strokeWidth="2" strokeLinecap="round" fill="none" strokeDasharray="28">
              <animate attributeName="stroke-dashoffset" values="28;0;28" dur="4.4s" repeatCount="indefinite" />
            </path>
            <path d="M132 32 C136 46, 138 62, 136 76" stroke="url(#foldR)" strokeWidth="1.8" strokeLinecap="round" fill="none" strokeDasharray="40">
              <animate attributeName="stroke-dashoffset" values="0;40;0" dur="4s" repeatCount="indefinite" />
            </path>
            <path d="M124 100 C130 110, 132 118, 128 124" stroke="url(#foldR)" strokeWidth="1.5" strokeLinecap="round" fill="none" strokeDasharray="22">
              <animate attributeName="stroke-dashoffset" values="0;22;0" dur="4.2s" repeatCount="indefinite" />
            </path>
            <path d="M150 88 C152 98, 150 108, 144 116" stroke="url(#foldR)" strokeWidth="1.6" strokeLinecap="round" fill="none" strokeDasharray="25">
              <animate attributeName="stroke-dashoffset" values="-25;0;-25" dur="3.4s" repeatCount="indefinite" />
            </path>

            {/* ── Center seam glow ── */}
            <ellipse cx="100" cy="77" rx="5" ry="50" fill="url(#seam)" />
            <line x1="100" y1="28" x2="100" y2="126" stroke="rgba(255,255,255,0.3)" strokeWidth="0.8" />

            {/* ── Glossy sheen ── */}
            <ellipse cx="78" cy="42" rx="16" ry="9" fill="rgba(255,255,255,0.18)" />
            <ellipse cx="122" cy="42" rx="16" ry="9" fill="rgba(255,255,255,0.18)" />

            {/* ── Ambient particle dots ── */}
            {[[36,72,0],[164,68,0.3],[42,98,0.6],[158,96,0.9],[100,140,1.2]].map(([cx,cy,delay], i) => (
              <motion.circle key={i} cx={cx} cy={cy} r="1.8" fill="rgba(255,255,255,0.7)"
                animate={{ opacity: [0, 0.9, 0], scale: [0.5, 1.4, 0.5] }}
                transition={{ duration: 2.4, repeat: Infinity, delay, ease: 'easeInOut' }}
              />
            ))}
          </motion.svg>
        </motion.button>
      </div>

      {/* Message area */}
      <div className="h-8 flex items-center justify-center mt-1">
        <AnimatePresence mode="wait">
          {isAnalyzing ? (
            <motion.div
              key="analyzing"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="flex items-center gap-3"
            >
              <AnimatePresence mode="wait">
                <motion.p
                  key={msgIndex}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  transition={{ duration: 0.35 }}
                  className="text-xs font-light tracking-widest"
                  style={{ color: 'rgba(244,180,254,0.85)' }}
                >
                  {messages[msgIndex]}
                </motion.p>
              </AnimatePresence>
              <div className="flex gap-1">
                {[0, 1, 2].map(i => (
                  <motion.div
                    key={i}
                    className="w-1 h-1 rounded-full"
                    style={{ background: 'rgba(244,180,254,0.7)' }}
                    animate={{ opacity: [0.2, 1, 0.2], scale: [0.8, 1.3, 0.8] }}
                    transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.22 }}
                  />
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.p
              key="hint"
              initial={{ opacity: 0 }}
              animate={{ opacity: disabled ? 0 : 0.45 }}
              exit={{ opacity: 0 }}
              className="text-[11px] tracking-widest uppercase font-light"
              style={{ color: 'rgba(255,255,255,0.5)', letterSpacing: '0.18em' }}
            >
              ·  ·  ·
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}