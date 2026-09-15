'use client';

import React from 'react';
import { Sparkles } from 'lucide-react';
import { useAiChatStore } from '@/stores/useAiChatStore';

export function AiCoachFab() {
  const { toggleOpen, isOpen } = useAiChatStore();

  // If drawer is already open, hide the FAB to prevent clutter
  if (isOpen) return null;

  return (
    <button
      type="button"
      onClick={toggleOpen}
      aria-label="AI 기어 코치 대화창 열기"
      className="fixed bottom-6 right-6 z-40 group flex items-center space-x-2 bg-[#FFD700] hover:bg-[#FFE033] text-black font-black py-3 px-4 rounded-full shadow-2xl shadow-[#FFD700]/30 hover:scale-105 active:scale-95 transition-all duration-200 border-2 border-black/20 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FFD700]/50"
    >
      <div className="relative">
        <Sparkles className="w-5 h-5 text-black animate-pulse" />
        <span className="absolute -top-1 -right-1 w-2 h-2 bg-black rounded-full" />
      </div>
      <span className="text-xs sm:text-sm tracking-tight font-black uppercase">
        AI 코치
      </span>
    </button>
  );
}
