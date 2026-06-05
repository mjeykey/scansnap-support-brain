import React, { useState, useEffect } from 'react';
import { getUsage } from '@/lib/usageStore';
import { Database, Sparkles } from 'lucide-react';

export default function UsageCounter() {
  const [usage, setUsage] = useState(getUsage());

  useEffect(() => {
    const interval = setInterval(() => setUsage(getUsage()), 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center gap-3 text-[10px] text-white/25">
      <span className="flex items-center gap-1">
        <Database className="w-2.5 h-2.5" />
        {usage.localSearches} lokal
      </span>
      <span className="flex items-center gap-1">
        <Sparkles className="w-2.5 h-2.5" />
        {usage.aiAnalyses} KI
      </span>
    </div>
  );
}