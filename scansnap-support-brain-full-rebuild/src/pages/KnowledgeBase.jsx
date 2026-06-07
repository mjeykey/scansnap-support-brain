import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { knowledgeBase, searchKnowledgeBase, getKBEntryInLanguage } from '@/lib/localData';
import { getSettings } from '@/lib/sessionStore';
import { ArrowLeft, Search, Database, ChevronDown, ChevronUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const pageStyle = {
  background: 'radial-gradient(ellipse at 20% 50%, rgba(13,40,44,0.9) 0%, rgba(8,8,16,1) 50%, rgba(28,10,25,0.85) 100%)',
  minHeight: '100vh',
};

const priorityColors = {
  hoch:    'border-secondary/40 text-secondary bg-secondary/10',
  mittel:  'border-amber-400/40 text-amber-400 bg-amber-400/10',
  niedrig: 'border-primary/40 text-primary bg-primary/10',
};

function EntryCard({ entry, lang }) {
  const [expanded, setExpanded] = useState(false);
  const localized = getKBEntryInLanguage(entry, lang);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl overflow-hidden"
      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
    >
      <button
        className="w-full flex items-start justify-between gap-3 p-4 text-left"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1.5">
            <span className="text-[10px] font-mono text-white/30">{entry.case_id}</span>
            {(entry.models || []).slice(0, 2).map((m, i) => (
              <Badge key={i} variant="outline" className="text-[10px] border-white/15 text-white/50">{m}</Badge>
            ))}
            <Badge variant="outline" className={`text-[10px] ${priorityColors[entry.priority] || priorityColors.mittel}`}>
              {entry.priority}
            </Badge>
          </div>
          <h4 className="text-sm font-medium text-white/80">{localized.title || entry.case_id}</h4>
          <p className="text-[10px] text-white/30 mt-0.5">
            {localized.solution_steps?.length || 0} step(s)
            {localized.isMultilingual && <span className="text-primary ml-1">· {lang.toUpperCase()}</span>}
            {localized.fallback && <span className="text-amber-500/60 ml-1">· EN fallback</span>}
          </p>
        </div>
        <div className="shrink-0 mt-1 text-white/25">
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-white/5 pt-3">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-white/30 mb-1.5">Symptoms</p>
            <ul className="space-y-1">
              {(localized.symptoms || []).map((s, i) => (
                <li key={i} className="text-xs text-white/50 flex items-start gap-1.5">
                  <span className="text-primary mt-0.5">·</span>{s}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-white/30 mb-1.5">Causes</p>
            <ul className="space-y-1">
              {(localized.causes || []).map((u, i) => (
                <li key={i} className="text-xs text-white/50 flex items-start gap-1.5">
                  <span className="text-amber-500 mt-0.5">·</span>{u}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-white/30 mb-1.5">Solution Steps</p>
            <div className="space-y-1.5">
              {(localized.solution_steps || []).map((s, i) => (
                <div key={i} className="bg-white/[0.03] rounded-lg px-3 py-2">
                  <div className="flex items-start gap-2">
                    <span className="text-[10px] text-primary font-bold mt-0.5 shrink-0">{i + 1}</span>
                    <span className="text-xs text-white/60 leading-relaxed">{s}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-white/30 mb-1">Tags</p>
            <div className="flex flex-wrap gap-1.5">
              {(entry.tags || []).map((tag, i) => (
                <span key={i} className="text-[9px] px-2 py-0.5 rounded-full bg-white/[0.04] text-white/30 border border-white/[0.06]">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}

export default function KnowledgeBase() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [filtered, setFiltered] = useState(knowledgeBase);
  const settings = getSettings();
  const lang = (settings.emailLanguage || 'de').toLowerCase();

  const handleSearch = (val) => {
    setQuery(val);
    if (!val.trim()) {
      setFiltered(knowledgeBase);
      return;
    }
    const results = searchKnowledgeBase(val, '', '');
    setFiltered(results.length > 0 ? results : knowledgeBase.filter(e =>
      (e.title + (e.tags || []).join(' ') + (e.models || []).join(' ')).toLowerCase().includes(val.toLowerCase())
    ));
  };

  const hochCount = knowledgeBase.filter(e => e.priority === 'hoch').length;

  return (
    <div style={pageStyle} className="pt-14 pb-10 px-5">
      <div className="max-w-2xl mx-auto pt-4 space-y-5">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-1.5 text-sm text-white/40 hover:text-white/70 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Zurück
          </button>
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold text-white">Knowledge Base</span>
            <Badge variant="outline" className="text-[10px] border-primary/30 text-primary bg-primary/10">
              {knowledgeBase.length} entries
            </Badge>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" />
          <Input
            placeholder="Search knowledge base…"
            value={query}
            onChange={e => handleSearch(e.target.value)}
            className="pl-9 h-10 bg-white/[0.06] border-white/10 text-white placeholder:text-white/25 rounded-xl"
          />
        </div>

        <div className="flex gap-4 text-[11px] text-white/30 flex-wrap">
          <span>{filtered.length} shown</span>
          <span>·</span>
          <span>{hochCount} high priority</span>
          <span>·</span>
          <span>v4.0 multilingual</span>
          <span>·</span>
          <span className="text-primary">{lang.toUpperCase()} active</span>
        </div>

        <div className="space-y-2.5">
          {filtered.map(entry => (
            <EntryCard key={entry.case_id} entry={entry} lang={lang} />
          ))}
        </div>

        {filtered.length === 0 && (
          <p className="text-sm text-white/30 text-center py-8">No entries found.</p>
        )}
      </div>
    </div>
  );
}