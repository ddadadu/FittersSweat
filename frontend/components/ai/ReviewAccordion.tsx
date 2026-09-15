'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Award, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { VerifiedReview } from '@/stores/useAiChatStore';

interface ReviewAccordionProps {
  review: VerifiedReview;
}

export function ReviewAccordion({ review }: ReviewAccordionProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="w-full bg-[#1F1F1F] border border-[#262626] rounded-xl overflow-hidden text-xs">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full min-h-[44px] px-3 py-2 flex items-center justify-between text-left hover:bg-neutral-800/60 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFD700]"
        aria-expanded={isOpen}
      >
        <div className="flex items-center space-x-2 truncate mr-2">
          <Award className="w-4 h-4 text-[#FFD700] flex-shrink-0" />
          <span className="font-bold text-neutral-200 truncate">
            {review.title}
          </span>
        </div>
        <div className="flex items-center space-x-1 text-neutral-400 flex-shrink-0">
          <span className="text-[10px]">팁 {isOpen ? '접기' : '보기'}</span>
          {isOpen ? (
            <ChevronUp className="w-3.5 h-3.5" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5" />
          )}
        </div>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-t border-[#262626] bg-[#141414]/90 px-3 py-2.5 space-y-2"
          >
            <p className="text-neutral-300 leading-relaxed break-keep font-medium">
              {review.content}
            </p>
            <div className="flex items-center justify-between pt-1 border-t border-neutral-800 text-[11px] text-neutral-500">
              <span>작성자: {review.userName} 레이서</span>
              <Link
                href={`/community/${review.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-1 text-[#FFD700] hover:underline"
              >
                <span>원문 후기 보기</span>
                <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
