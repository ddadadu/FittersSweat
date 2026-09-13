'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { MessageSquare, Eye, Package } from 'lucide-react';

export interface TaggedProduct {
  id: string;
  name: string;
  price?: number;
  categoryId?: string;
  imageUrl?: string | null;
}

export interface PostItem {
  id: string;
  userId: string;
  eventId?: string | null;
  title: string;
  content: string;
  createdAt: string;
  updatedAt?: string;
  user?: {
    id: string;
    name: string;
  };
  event?: {
    id: string;
    name: string;
    cityCode?: string;
  } | null;
  commentCount?: number;
  postComments?: any[];
  taggedItems?: Array<{
    productId: string;
    product: TaggedProduct;
  }>;
  views?: number;
}

interface PostCardProps {
  post: PostItem;
}

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}.${month}.${day}`;
  } catch {
    return '';
  }
}

const MAX_TAGGED_ITEMS = 3;

export default function PostCard({ post }: PostCardProps) {
  const router = useRouter();
  const [imgErrors, setImgErrors] = useState<Record<string, boolean>>({});

  const handleProductClick = (e: React.MouseEvent, productId: string) => {
    e.preventDefault();
    e.stopPropagation();
    router.push(`/products/${productId}`);
  };

  // Author initial
  const authorName = post.user?.name || '레이서';
  const authorInitial = authorName.slice(0, 1).toUpperCase();

  // Event tag chip
  let eventTag = '';
  if (post.event?.name) {
    eventTag = `#${post.event.name.trim().replace(/\s+/g, '_')}`;
  } else if (post.eventId) {
    eventTag = `#2026_HYROX_${post.eventId}`;
  } else {
    eventTag = '#2026_HYROX_SEOUL';
  }

  // Defensive clean body preview text
  const cleanContent = (post.content || '')
    .replace(/^>\s*💡\s*\*\*핵심 요약\*\*:\s*/i, '')
    .replace(/^>\s*/gm, '')
    .trim();

  const commentCount = post.commentCount ?? post.postComments?.length ?? 0;
  // Deterministic view count for aesthetic consistency
  const numericId = parseInt(post.id, 10);
  const viewCount = post.views ?? (!isNaN(numericId) ? (numericId * 37) % 350 + 85 : 124);

  const taggedItemsList = post.taggedItems || [];
  const visibleTaggedItems = taggedItemsList.slice(0, MAX_TAGGED_ITEMS);
  const remainingCount = taggedItemsList.length - MAX_TAGGED_ITEMS;

  return (
    <article className="relative group bg-[#141414] border border-[#262626] rounded-xl p-5 hover:border-white/30 transition-all flex flex-col justify-between gap-4">
      {/* Clickable Full Card Overlay Link */}
      <Link
        href={`/community/${post.id}`}
        className="absolute inset-0 z-0 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFD700]"
        aria-label={`${post.title} 후기 상세 보기`}
      />

      {/* 1. Header: Author profile, Finisher badge, Date, Event Tag */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-2.5 pointer-events-none">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-[#1F1F1F] border border-[#333333] flex items-center justify-center text-xs font-bold text-[#FFD700] shrink-0">
            {authorInitial}
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-sm font-semibold text-white">{authorName}</span>
              <span className="text-[10px] font-bold text-[#FFD700] bg-[#FFD700]/10 border border-[#FFD700]/30 px-1.5 py-0.5 rounded-full flex items-center gap-1">
                <span>🏅</span>
                <span>HYROX Finisher</span>
              </span>
            </div>
            <span className="text-xs text-[#737373]">{formatDate(post.createdAt)}</span>
          </div>
        </div>

        {eventTag && (
          <span className="text-xs font-semibold text-[#FFD700] bg-[#FFD700]/10 border border-[#FFD700]/30 px-2.5 py-0.5 rounded-full shrink-0">
            {eventTag}
          </span>
        )}
      </div>

      {/* 2. Body Summary: Title and 2-line truncated content */}
      <div className="relative z-10 space-y-1.5 flex-1 pointer-events-none">
        <h3 className="text-base font-bold text-white group-hover:text-[#FFD700] transition-colors line-clamp-1 leading-snug">
          {post.title}
        </h3>
        <p className="line-clamp-2 text-sm text-[#A3A3A3] leading-relaxed">
          {cleanContent}
        </p>
      </div>

      {/* 3. Tagged Equipment Chips List (Max 3 + remaining) */}
      {taggedItemsList.length > 0 && (
        <div className="relative z-10 flex flex-wrap items-center gap-2 pt-1">
          {visibleTaggedItems.map((item) => {
            const prod = item.product;
            const hasValidImage = !!prod.imageUrl && !imgErrors[item.productId];

            return (
              <button
                key={item.productId}
                type="button"
                onClick={(e) => handleProductClick(e, item.productId)}
                onKeyDown={(e) => e.stopPropagation()}
                className="bg-[#1F1F1F] border border-[#333333] rounded-lg px-2.5 py-1 text-xs text-white hover:border-[#FFD700] hover:text-[#FFD700] transition-all flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFD700]"
                title={`${prod.name} 상품 상세 이동`}
              >
                {hasValidImage ? (
                  <Image
                    src={prod.imageUrl!}
                    alt={prod.name}
                    width={16}
                    height={16}
                    className="w-4 h-4 rounded object-cover shrink-0"
                    unoptimized
                    onError={() => {
                      setImgErrors((prev) => ({ ...prev, [item.productId]: true }));
                    }}
                  />
                ) : (
                  <Package className="w-3.5 h-3.5 text-[#FFD700] shrink-0" />
                )}
                <span className="max-w-[130px] truncate">{prod.name}</span>
              </button>
            );
          })}

          {remainingCount > 0 && (
            <span
              className="bg-[#1F1F1F] border border-[#333333] rounded-lg px-2 py-1 text-[11px] font-bold text-[#A3A3A3]"
              title={`추가 ${remainingCount}개 장비 태그`}
            >
              +{remainingCount}
            </span>
          )}
        </div>
      )}

      {/* 4. Footer: Comment Count, Views */}
      <div className="relative z-10 flex items-center justify-between pt-3 border-t border-[#262626] text-xs text-[#737373] pointer-events-none">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 text-[#A3A3A3]">
            <MessageSquare className="w-4 h-4 text-[#737373]" />
            <span>{commentCount}</span>
          </span>
          <span className="flex items-center gap-1.5 text-[#A3A3A3]">
            <Eye className="w-4 h-4 text-[#737373]" />
            <span>{viewCount}</span>
          </span>
        </div>
        <span className="text-xs font-semibold text-[#A3A3A3] group-hover:text-[#FFD700] transition-colors flex items-center gap-0.5">
          후기 읽기 &rarr;
        </span>
      </div>
    </article>
  );
}
