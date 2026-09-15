'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  X,
  RotateCcw,
  Sparkles,
  Send,
  Loader2,
  AlertTriangle,
  Lock,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAiChatStore } from '@/stores/useAiChatStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { ChatMessageBubble } from './ChatMessageBubble';

export function AiCoachDrawer() {
  const {
    isOpen,
    setOpen,
    messages,
    isLoading,
    error,
    clearError,
    sendMessage,
    resetConversation,
    warningCount,
    isBanned,
    guestQueryCount,
  } = useAiChatStore();

  const { isAuthenticated, setAuthModalOpen } = useAuthStore();
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isLoading]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 250);
    }
  }, [isOpen]);

  // Handle Escape key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, setOpen]);

  // Lock body scroll on mobile when open
  useEffect(() => {
    if (isOpen && typeof window !== 'undefined' && window.innerWidth < 640) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || isBanned) return;
    const query = input;
    setInput('');
    await sendMessage(query);
  };

  const handleSelectQuery = async (query: string) => {
    if (isLoading || isBanned) return;
    await sendMessage(query);
  };

  const isGuestExceeded = !isAuthenticated && guestQueryCount >= 10;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop (visible on mobile / semi-transparent overlay) */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 lg:bg-black/30"
            aria-hidden="true"
          />

          {/* Left Slide-over Drawer */}
          <motion.aside
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 26, stiffness: 280 }}
            className="fixed top-0 left-0 h-full w-full sm:max-w-[440px] bg-[#141414] border-r border-[#262626] z-50 flex flex-col shadow-2xl text-white select-text"
            role="dialog"
            aria-modal="true"
            aria-label="AI 기어 코치 대화창"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3.5 border-b border-[#262626] bg-[#171717]">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-[#FFD700] flex items-center justify-center shadow-md shadow-[#FFD700]/20">
                  <Sparkles className="w-4 h-4 text-black" />
                </div>
                <div>
                  <div className="flex items-center space-x-1.5">
                    <h2 className="text-sm font-black italic tracking-wider text-white">
                      FITTER<span className="text-[#FFD700]">COACH</span>
                    </h2>
                    <span className="text-[10px] uppercase font-bold bg-[#FFD700]/20 text-[#FFD700] px-1.5 py-0.5 rounded">
                      HYROX AI
                    </span>
                  </div>
                  <p className="text-[10px] text-neutral-400">1:1 실시간 맞춤 장비 처방</p>
                </div>
              </div>

              <div className="flex items-center space-x-1">
                <button
                  type="button"
                  onClick={resetConversation}
                  className="p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFD700]"
                  title="새 대화 시작"
                  aria-label="새 대화 시작"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFD700]"
                  aria-label="대화창 닫기"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Error / Warning Alert Banner (Macro rate limit or Guest limit) */}
            {error && (
              <div className="px-4 py-2.5 bg-rose-500/10 border-b border-rose-500/30 flex items-start justify-between text-xs text-rose-300">
                <div className="flex items-start space-x-2 mr-2">
                  <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                  <span className="leading-snug break-keep font-medium">{error}</span>
                </div>
                <button
                  type="button"
                  onClick={clearError}
                  className="text-rose-400 hover:text-rose-200 p-1"
                  aria-label="알림 닫기"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Scrollable Messages Area */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2 scrollbar-thin scrollbar-thumb-neutral-700">
              {messages.map((msg, index) => (
                <ChatMessageBubble
                  key={msg.id || index}
                  message={msg}
                  onSelectQuery={handleSelectQuery}
                  isLast={index === messages.length - 1}
                />
              ))}

              {isLoading && (
                <div className="flex items-center space-x-2.5 my-3 text-neutral-400 text-xs py-2 px-3 bg-[#1A1A1A] rounded-xl border border-neutral-800 max-w-[200px]">
                  <Loader2 className="w-4 h-4 animate-spin text-[#FFD700]" />
                  <span>맞춤 장비 분석 중...</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Guest 10-Query Teaser Limit Modal Overlay */}
            {isGuestExceeded && (
              <div className="mx-4 my-2 p-4 rounded-xl bg-gradient-to-r from-amber-500/10 via-neutral-900 to-amber-500/10 border border-[#FFD700]/40 text-center space-y-2.5 shadow-lg">
                <div className="w-8 h-8 rounded-full bg-[#FFD700] text-black flex items-center justify-center mx-auto">
                  <Lock className="w-4 h-4" />
                </div>
                <h3 className="text-xs font-bold text-white">
                  비회원 10회 무료 체험 완료
                </h3>
                <p className="text-[11px] text-neutral-300 leading-relaxed break-keep">
                  더 깊이 있는 1:1 맞춤 레이스 피팅과 일일 100회 쿼터를 위해 1초 간편 로그인하세요!
                </p>
                <button
                  type="button"
                  onClick={() => setAuthModalOpen(true, 'login')}
                  className="w-full py-2 px-3 rounded-lg bg-[#FFD700] text-black font-black text-xs hover:bg-[#FFE033] transition-colors shadow"
                >
                  ⚡ 1초 간편 로그인하기
                </button>
              </div>
            )}

            {/* Sticky Bottom Input Bar */}
            <div className="p-3 border-t border-[#262626] bg-[#171717]">
              <form onSubmit={handleSubmit} className="flex items-center space-x-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  disabled={isLoading || isBanned || isGuestExceeded}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={
                    isBanned
                      ? '이용이 제한되었습니다.'
                      : isGuestExceeded
                      ? '로그인 후 대화를 이어가세요.'
                      : '피팅 고민, 필요 장비를 입력하세요...'
                  }
                  className="flex-1 min-h-[44px] px-3.5 py-2 rounded-xl bg-[#1F1F1F] border border-[#333333] text-sm text-white placeholder-neutral-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFD700] disabled:opacity-50 transition-all"
                  aria-label="AI 질문 입력"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isLoading || isBanned || isGuestExceeded}
                  className="min-h-[44px] min-w-[44px] px-3 py-2 rounded-xl bg-[#FFD700] text-black font-black flex items-center justify-center hover:bg-[#FFE033] transition-colors disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFD700]"
                  aria-label="메시지 전송"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>

              <div className="flex items-center justify-between mt-2 px-1 text-[10px] text-neutral-500">
                <span>⚡ Gemini 1.5 Flash 기반 레이스 AI</span>
                {warningCount > 0 && (
                  <span className="text-amber-400 font-medium">
                    경고 {warningCount}/5회
                  </span>
                )}
              </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
