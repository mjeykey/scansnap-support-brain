import React from 'react';
import { motion } from 'framer-motion';

export default function ScannerVisual({ isAnalyzing, disabled, onClick }) {
  return (
    <div className="relative flex items-center justify-center">
      {/* Glow rings */}
      {isAnalyzing && (
        <>
          <motion.div
            className="absolute w-48 h-48 rounded-full border-2 border-primary/30"
            animate={{ scale: [1, 1.6], opacity: [0.5, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeOut' }}
          />
          <motion.div
            className="absolute w-48 h-48 rounded-full border-2 border-secondary/30"
            animate={{ scale: [1, 1.4], opacity: [0.4, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeOut', delay: 0.5 }}
          />
        </>
      )}

      {/* Scanner body */}
      <motion.button
        onClick={onClick}
        disabled={disabled}
        className={`relative w-40 h-28 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 shadow-lg flex flex-col items-center justify-center gap-1 transition-all ${
          disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer hover:shadow-xl hover:border-primary/40'
        }`}
        whileHover={!disabled ? { scale: 1.03 } : {}}
        whileTap={!disabled ? { scale: 0.97 } : {}}
      >
        {/* Scanner lid */}
        <motion.div
          className="w-32 h-2 rounded-full bg-gradient-to-r from-primary via-secondary to-primary"
          animate={isAnalyzing ? { opacity: [0.4, 1, 0.4] } : { opacity: 1 }}
          transition={isAnalyzing ? { duration: 1.5, repeat: Infinity } : {}}
        />

        {/* Scanner slot */}
        <div className="w-28 h-1 bg-slate-300 rounded-full mt-1" />

        {/* Scanner body detail */}
        <div className="flex gap-1 mt-2">
          <div className="w-1.5 h-1.5 rounded-full bg-primary" />
          <div className="w-1.5 h-1.5 rounded-full bg-secondary" />
          <div className="w-1.5 h-1.5 rounded-full bg-accent" />
        </div>

        {/* Scanning line */}
        {isAnalyzing && (
          <motion.div
            className="absolute left-4 right-4 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent"
            animate={{ top: ['30%', '70%', '30%'] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          />
        )}

        {/* Label */}
        <span className="text-[10px] font-medium text-muted-foreground tracking-widest mt-1">
          SCANSNAP
        </span>
      </motion.button>

      {/* Click hint */}
      {!isAnalyzing && !disabled && (
        <motion.p
          className="absolute -bottom-8 text-xs text-muted-foreground"
          animate={{ opacity: [0.4, 0.8, 0.4] }}
          transition={{ duration: 2.5, repeat: Infinity }}
        >
          Click to analyze
        </motion.p>
      )}
    </div>
  );
}