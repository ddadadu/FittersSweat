'use client';

import React from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';

interface RecursiveQueryPillsProps {
  queries: string[];
  onSelect: (query: string) => void;
  disabled?: boolean;
}

export function RecursiveQueryPills({
  queries,
  onSelect,
  disabled = false,
}: RecursiveQueryPillsProps) {
  if (!queries || queries.length === 0) return null;

  return (
    <div className="w-full pt-1">
      <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 scrollbar-none">
        {queries.map((q, idx) => (
          <button
            key={idx}
            type="button"
            disabled={disabled}
            onClick={() => onSelect(q)}
            className="flex-shrink-0 min-h-[44px] px-3.5 py-2 rounded-full bg-[#262626] hover:bg-[#FFD700] text-neutral-200 hover:text-black text-xs font-semibold border border-neutral-700/60 hover:border-[#FFD700] transition-all flex items-center space-x-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFD700] disabled:opacity-50 disabled:cursor-not-allowed group"
          >
            <Sparkles className="w-3 h-3 text-[#FFD700] group-hover:text-black transition-colors" />
            <span className="truncate max-w-[220px]">{q}</span>
            <ArrowRight className="w-3 h-3 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
          </button>
        ))}
      </div>
    </div>
  );
}
