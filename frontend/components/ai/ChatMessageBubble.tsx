'use client';

import React from 'react';
import Link from 'next/link';
import { Bot, User, Sparkles, HelpCircle } from 'lucide-react';
import { ChatMessage, useAiChatStore } from '@/stores/useAiChatStore';
import { MiniProductCard } from './MiniProductCard';
import { ReviewAccordion } from './ReviewAccordion';
import { RecursiveQueryPills } from './RecursiveQueryPills';

function renderLink(label: string, href: string, key: string, isBold = false) {
  const cleanLabel = label.replace(/\*\*/g, '').trim();
  const isInternal = href.startsWith('/') || href.startsWith('#');
  const className = `inline-flex items-center gap-1 text-[#FFD700] hover:text-[#FFE44D] ${
    isBold ? 'font-bold' : 'font-semibold'
  } underline underline-offset-4 cursor-pointer transition-colors duration-200`;

  const handleClick = () => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      useAiChatStore.getState().setOpen(false);
    }
  };

  if (isInternal) {
    return (
      <Link key={key} href={href} onClick={handleClick} className={className}>
        {cleanLabel} ➔
      </Link>
    );
  }

  return (
    <a
      key={key}
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
    >
      {cleanLabel} ➔
    </a>
  );
}

/**
 * Lightweight inline markdown renderer for chat bubbles.
 * Parses [text](url) into Next.js Links / external links, and **text** into bold tags.
 * Ponytail: Zero external dependencies, pure native string manipulation & regex.
 */
function renderFormattedContent(content: string) {
  if (!content) return null;

  // Split by bold link **[...](...)**, normal link [...](...), or bold **...**
  // Note: \s* allows for optional space between ] and ( e.g. [name] (/events/1)
  const tokens = content.split(
    /(\*\*\[[^\]]+\]\s*\([^)]+\)\*\*|\[[^\]]+\]\s*\([^)]+\)|\*\*[^*]+\*\*)/g
  );

  return tokens.map((part, index) => {
    if (!part) return null;

    // 1. Bold link: **[label](href)** or **[label] (href)**
    const boldLinkMatch = part.match(/^\*\*\[([^\]]+)\]\s*\(([^)]+)\)\*\*$/);
    if (boldLinkMatch) {
      return renderLink(boldLinkMatch[1], boldLinkMatch[2], `blink-${index}`, true);
    }

    // 2. Normal link: [label](href) or [label] (href)
    const linkMatch = part.match(/^\[([^\]]+)\]\s*\(([^)]+)\)$/);
    if (linkMatch) {
      return renderLink(linkMatch[1], linkMatch[2], `link-${index}`, false);
    }

    // 3. Bold text: **text** (may also contain markdown links inside)
    const boldMatch = part.match(/^\*\*([^*]+)\*\*$/);
    if (boldMatch) {
      const inner = boldMatch[1];
      if (inner.includes('[') && (inner.includes('](') || inner.includes('] ('))) {
        const subTokens = inner.split(/(\[[^\]]+\]\s*\([^)]+\))/g);
        return (
          <strong key={`bold-${index}`} className="font-bold text-white">
            {subTokens.map((sub, sIdx) => {
              const subMatch = sub.match(/^\[([^\]]+)\]\s*\(([^)]+)\)$/);
              if (subMatch) {
                return renderLink(subMatch[1], subMatch[2], `sublink-${index}-${sIdx}`, true);
              }
              return sub;
            })}
          </strong>
        );
      }
      return (
        <strong key={`bold-${index}`} className="font-bold text-white">
          {inner}
        </strong>
      );
    }

    // 4. Plain text
    return <React.Fragment key={`text-${index}`}>{part}</React.Fragment>;
  });
}

interface ChatMessageBubbleProps {
  message: ChatMessage;
  onSelectQuery: (query: string) => void;
  isLast?: boolean;
}

export function ChatMessageBubble({
  message,
  onSelectQuery,
  isLast = false,
}: ChatMessageBubbleProps) {
  const isUser = message.role === 'user';

  if (isUser) {
    return (
      <div className="flex items-start justify-end space-x-2 my-3">
        <div className="bg-[#FFD700] text-black font-semibold text-xs sm:text-sm px-4 py-2.5 rounded-2xl rounded-tr-sm max-w-[85%] shadow-md break-keep leading-relaxed">
          {message.content}
        </div>
        <div className="w-7 h-7 rounded-full bg-[#262626] border border-neutral-700 flex items-center justify-center flex-shrink-0 mt-0.5">
          <User className="w-4 h-4 text-neutral-300" />
        </div>
      </div>
    );
  }

  // Assistant Message
  const hasProducts = message.products && message.products.length > 0;
  const hasReviews = message.reviews && message.reviews.length > 0;
  const categoryLabelMap: Record<string, string> = {
    nutrition: '에너지 & 뉴트리션',
    shoes: '러닝화 & 레이서',
    gear: '보호 기어 & 테이핑',
    equipment: '훈련 장비',
    all: '종합 레이스 처방',
    events: '대회 일정 & 레이스',
    general: '피터 일상 & 코칭',
  };

  const categoryLabel = message.detectedCategory
    ? categoryLabelMap[message.detectedCategory] || message.detectedCategory.toUpperCase()
    : null;

  return (
    <div className="flex items-start space-x-2 my-4">
      <div className="w-7 h-7 rounded-full bg-[#FFD700] flex items-center justify-center flex-shrink-0 mt-1 shadow-md shadow-[#FFD700]/20">
        <Bot className="w-4 h-4 text-black" />
      </div>

      <div className="flex-1 max-w-[92%] bg-[#1A1A1A] border border-[#2B2B2B] rounded-2xl rounded-tl-sm p-3.5 sm:p-4 space-y-3 shadow-xl">
        {/* Header with Coach Title & Category Pill */}
        <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
          <div className="flex items-center space-x-1.5">
            <span className="text-xs font-black text-white italic tracking-wide">
              FITTER<span className="text-[#FFD700]">COACH</span>
            </span>
            <span className="text-[10px] text-neutral-400 font-medium">수석 기어 피터</span>
          </div>
          {categoryLabel && (
            <span className="text-[10px] font-bold bg-[#262626] text-[#FFD700] px-2 py-0.5 rounded-full border border-neutral-700">
              {categoryLabel}
            </span>
          )}
        </div>

        {/* 1. Top: Mini Product Snap Cards (120px height) */}
        {hasProducts && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] text-neutral-400 font-medium px-0.5">
              <span>매칭 직매입 기어</span>
              <span className="text-[10px] text-neutral-500">좌우 스와이프 가능 ➔</span>
            </div>
            <div className="flex items-center space-x-2 overflow-x-auto pb-1.5 scrollbar-none">
              {message.products!.map((prod) => (
                <MiniProductCard key={prod.id} product={prod} />
              ))}
            </div>
          </div>
        )}

        {/* 2. Middle: Advisor Advice Text (max 500 chars) */}
        <div className="text-xs sm:text-sm text-neutral-200 leading-relaxed font-normal whitespace-pre-line break-keep">
          {renderFormattedContent(message.content)}
        </div>

        {/* 3. Lower: Racer Verified Reviews (Accordion Badge) */}
        {hasReviews && (
          <div className="space-y-1.5 pt-1">
            <p className="text-[11px] text-neutral-400 font-medium px-0.5">실전 완주 후기 검증</p>
            <div className="space-y-1.5">
              {message.reviews!.map((rev) => (
                <ReviewAccordion key={rev.id} review={rev} />
              ))}
            </div>
          </div>
        )}

        {/* 4. Bottom: Follow-up Question & Recursive Query Pills */}
        {(message.followUpQuestion || (message.suggestedQueries && message.suggestedQueries.length > 0)) && (
          <div className="pt-2 border-t border-neutral-800/80 space-y-2">
            {message.followUpQuestion && (
              <p className="text-xs font-semibold text-neutral-300 flex items-center space-x-1.5">
                <HelpCircle className="w-3.5 h-3.5 text-[#FFD700] flex-shrink-0" />
                <span className="break-keep">{message.followUpQuestion}</span>
              </p>
            )}
            {message.suggestedQueries && message.suggestedQueries.length > 0 && (
              <RecursiveQueryPills
                queries={message.suggestedQueries}
                onSelect={onSelectQuery}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
