import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { getKBStats } from '@/lib/localData';

// KB stats computed once
const kbStats = getKBStats();

export default function DebugPanel({ result }) {
  const [open, setOpen] = useState(false);
  const [showKb, setShowKb] = useState(false);
  const d = result?._debug;
  if (!d) return null;

  return (
    <div className="mt-1 space-y-1">
      {/* Per-result debug */}
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-wider text-black/25 hover:text-black/50"
      >
        Debug result
        {open ? <ChevronUp className="w-2.5 h-2.5" /> : <ChevronDown className="w-2.5 h-2.5" />}
      </button>

      {open && (
        <div className="bg-black/[0.03] rounded-lg p-3 text-[10px] font-mono text-black/50 space-y-1.5">
          <div className="flex gap-4 flex-wrap">
            <span><span className="text-black/30">entry</span> {d.entry_id}</span>
            <span><span className="text-black/30">case</span> {d.case_id}</span>
            <span><span className="text-primary font-bold">score {d.score}</span></span>
            {d.firmware_focused && <span className="text-amber-500 font-semibold">⚡ firmware-mode</span>}
          </div>

          {d.normalized_query && (
            <div>
              <span className="text-black/30">normalized query: </span>
              <span className="text-black/60">"{d.normalized_query}"</span>
            </div>
          )}

          {d.translation_applied && (
            <div className="text-amber-600">
              ↳ translated: "{d.translation_applied}"
            </div>
          )}

          {d.phrases?.length > 0 && (
            <div>
              <span className="text-green-600 font-semibold">phrases: </span>
              {d.phrases.join(' · ')}
            </div>
          )}

          {d.matched?.length > 0 && (
            <div>
              <span className="text-blue-500 font-semibold">matched: </span>
              {d.matched.join(' · ')}
            </div>
          )}

          {d.penalties?.length > 0 && (
            <div>
              <span className="text-red-500 font-semibold">penalties: </span>
              {d.penalties.join(' · ')}
            </div>
          )}
        </div>
      )}

      {/* KB health stats */}
      <button
        onClick={() => setShowKb(!showKb)}
        className="flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-wider text-black/20 hover:text-black/45"
      >
        KB health ({kbStats.total} entries)
        {showKb ? <ChevronUp className="w-2.5 h-2.5" /> : <ChevronDown className="w-2.5 h-2.5" />}
      </button>

      {showKb && (
        <div className="bg-black/[0.02] rounded-lg p-3 text-[10px] font-mono text-black/40 space-y-1">
          <div className="font-semibold text-black/50">Total: {kbStats.total} entries</div>
          <div className="grid grid-cols-2 gap-x-4">
            {Object.entries(kbStats.keywordCounts).map(([kw, count]) => (
              <div key={kw}>
                <span className={count > 0 ? 'text-primary' : 'text-red-400'}>{kw}:</span> {count}
              </div>
            ))}
          </div>
          <div className="mt-1 text-black/30">First 5 titles:</div>
          {kbStats.first10titles.slice(0, 5).map((t, i) => (
            <div key={i} className="truncate">{i + 1}. {t}</div>
          ))}
        </div>
      )}
    </div>
  );
}