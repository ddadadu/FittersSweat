'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowLeft,
  Plus,
  X,
  Package,
  AlertCircle,
  Loader2,
  Trophy,
  CheckCircle2,
} from 'lucide-react';
import ProductSearchModal, { SearchProduct } from '@/components/ProductSearchModal';
import { fetchApi, ensureAuthToken } from '@/lib/api';
import { useAuthStore } from '@/stores/useAuthStore';

interface HyroxEvent {
  id: string;
  name: string;
  cityCode: string;
  startDate: string;
  endDate: string;
}

export default function NewCommunityPostPage() {
  const router = useRouter();

  // Form states
  const [events, setEvents] = useState<HyroxEvent[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedProducts, setSelectedProducts] = useState<SearchProduct[]>([]);

  // Validation & Loading states
  const [titleError, setTitleError] = useState<string | null>(null);
  const [contentError, setContentError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Unload protection flag
  const isSubmittingRef = useRef(false);

  // 1. Fetch Events for dropdown
  useEffect(() => {
    async function loadEvents() {
      try {
        const res = await fetchApi<{ success: boolean; events: HyroxEvent[] }>('/api/v1/events');
        if (res.events && res.events.length > 0) {
          setEvents(res.events);
          setSelectedEventId(res.events[0].id);
        }
      } catch (err) {
        console.error('Failed to load events:', err);
      }
    }
    loadEvents();
  }, []);

  // 2. Prevent accidental navigation (beforeunload listener)
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isSubmittingRef.current) return;
      if (title.trim() || content.trim() || selectedProducts.length > 0) {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [title, content, selectedProducts]);

  // Product selection handler
  const handleSelectProduct = (product: SearchProduct) => {
    if (!selectedProducts.some((p) => p.id === product.id)) {
      setSelectedProducts((prev) => [...prev, product]);
    }
  };

  const handleRemoveProduct = (productId: string) => {
    setSelectedProducts((prev) => prev.filter((p) => p.id !== productId));
  };

  // Submit handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    let hasError = false;
    if (!title.trim()) {
      setTitleError('제목을 입력해주세요.');
      hasError = true;
    } else {
      setTitleError(null);
    }

    if (!content.trim()) {
      setContentError('본문 내용을 입력해주세요. (훈련 루틴, 스테이션 시간 단축 팁 등)');
      hasError = true;
    } else {
      setContentError(null);
    }

    if (hasError) return;

    setIsSubmitting(true);
    isSubmittingRef.current = true;

    try {
      const token = await ensureAuthToken();
      if (!token) {
        setSubmitError('게시글을 등록하려면 로그인이 필요합니다.');
        useAuthStore.getState().setAuthModalOpen(true, 'login');
        setIsSubmitting(false);
        isSubmittingRef.current = false;
        return;
      }

      const payload = {
        title: title.trim(),
        content: content.trim(),
        eventId: selectedEventId ? selectedEventId : undefined,
        productIds: selectedProducts.map((p) => p.id),
      };

      const res = await fetchApi<{ success: boolean; post: { id: string } }>(
        '/api/v1/posts',
        {
          method: 'POST',
          body: JSON.stringify(payload),
        }
      );

      if (res.post?.id) {
        // Automatic routing to new post detail
        router.push(`/community/${res.post.id}`);
      } else {
        throw new Error('게시글 등록 결과를 확인할 수 없습니다.');
      }
    } catch (err: any) {
      console.error('Failed to create post:', err);
      isSubmittingRef.current = false;
      setSubmitError(err.message || '게시글 등록 중 오류가 발생했습니다.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white py-8 sm:py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Navigation Back Link */}
        <div>
          <Link
            href="/community"
            className="min-h-[44px] inline-flex items-center gap-2 text-xs font-bold text-[#A3A3A3] hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFD700] rounded-lg px-2 -ml-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>커뮤니티 목록으로 돌아가기</span>
          </Link>
        </div>

        {/* Page Title & Intro */}
        <div className="space-y-2 border-b border-[#262626] pb-6">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black uppercase tracking-widest text-black bg-[#FFD700] px-2.5 py-0.5 rounded">
              WRITE POST
            </span>
            <span className="text-xs text-[#A3A3A3]">완주 후기 & 훈련 노하우</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            HYROX 레이서 완주 후기 작성
          </h1>
          <p className="text-sm text-[#A3A3A3] leading-relaxed">
            출전한 대회와 착용한 공식 직매입 장비를 태그하고, 다음 레이서를 위한 스테이션 공략 팁을 공유하세요.
          </p>
        </div>

        {/* Post Creation Form */}
        <form onSubmit={handleSubmit} className="space-y-6 bg-[#141414] border border-[#262626] rounded-2xl p-6 sm:p-8">
          {submitError && (
            <div className="p-4 bg-rose-950/40 border border-rose-800/60 rounded-xl flex items-center gap-3 text-rose-300 text-sm">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{submitError}</span>
            </div>
          )}

          {/* 1. Event Selection Dropdown */}
          <div className="space-y-2">
            <label htmlFor="event-select" className="block text-xs font-bold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
              <Trophy className="w-4 h-4 text-[#FFD700]" />
              <span>참가 대회 선택</span>
            </label>
            <select
              id="event-select"
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="w-full bg-[#1F1F1F] border border-[#333333] focus:border-[#FFD700] focus:ring-1 focus:ring-[#FFD700] rounded-xl px-4 py-3 text-sm text-white outline-none transition-all cursor-pointer"
            >
              <option value="">대회를 선택하지 않음</option>
              {events.map((evt) => (
                <option key={evt.id} value={evt.id}>
                  {evt.name} ({evt.cityCode})
                </option>
              ))}
            </select>
          </div>

          {/* 2. Post Title Field */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="post-title" className="block text-xs font-bold text-neutral-300 uppercase tracking-wider">
                제목 <span className="text-[#FFD700]">*</span>
              </label>
              <span className="text-[11px] text-[#737373]">
                {title.length}/200
              </span>
            </div>
            <input
              id="post-title"
              type="text"
              maxLength={200}
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (titleError) setTitleError(null);
              }}
              placeholder="예: [송도 더블즈] 슬레드 푸시 152kg 극복 팁 및 추천 레이스화 후기"
              className={`w-full bg-[#1F1F1F] border rounded-xl px-4 py-3 text-sm text-white placeholder:text-[#737373] outline-none transition-all ${
                titleError
                  ? 'border-[#EF4444] ring-1 ring-[#EF4444]'
                  : 'border-[#333333] focus:border-[#FFD700] focus:ring-1 focus:ring-[#FFD700]'
              }`}
            />
            {titleError && (
              <p className="text-xs text-[#EF4444] flex items-center gap-1 pt-1">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{titleError}</span>
              </p>
            )}
          </div>

          {/* 3. Post Content Field */}
          <div className="space-y-2">
            <label htmlFor="post-content" className="block text-xs font-bold text-neutral-300 uppercase tracking-wider">
              본문 내용 <span className="text-[#FFD700]">*</span>
            </label>
            <textarea
              id="post-content"
              rows={10}
              value={content}
              onChange={(e) => {
                setContent(e.target.value);
                if (contentError) setContentError(null);
              }}
              placeholder="훈련 루틴, 각 스테이션(스키에르그, 슬레드 푸시/풀, 버피 브로드점프, 로잉, 파머스 캐리, 샌드백 런지, 월볼) 시간 단축 팁과 페이싱 전략을 자유롭게 작성해 주세요."
              className={`w-full bg-[#1F1F1F] border rounded-xl p-4 text-sm text-white placeholder:text-[#737373] outline-none transition-all resize-y ${
                contentError
                  ? 'border-[#EF4444] ring-1 ring-[#EF4444]'
                  : 'border-[#333333] focus:border-[#FFD700] focus:ring-1 focus:ring-[#FFD700]'
              }`}
            />
            {contentError && (
              <p className="text-xs text-[#EF4444] flex items-center gap-1 pt-1">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{contentError}</span>
              </p>
            )}
          </div>

          {/* 4. Equipment Tagging Section */}
          <div className="space-y-3 pt-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <label className="block text-xs font-bold text-neutral-300 uppercase tracking-wider">
                  착용한 직매입 장비 태깅
                </label>
                <p className="text-xs text-[#A3A3A3] mt-0.5">
                  직접 착용하고 기록 단축에 기여한 공식 장비를 태그해 다른 레이서에게 추천하세요.
                </p>
              </div>

              {/* [사용 장비 태그 추가] Button */}
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="min-h-[44px] inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-[#1F1F1F] hover:bg-[#FFD700] hover:text-black border border-[#333333] hover:border-[#FFD700] text-xs font-bold text-white rounded-xl transition-all shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFD700]"
              >
                <Plus className="w-4 h-4" />
                <span>사용 장비 태그 추가</span>
              </button>
            </div>

            {/* Tagged Items Chips List */}
            <div className="p-4 bg-[#1A1A1A] border border-[#262626] rounded-xl">
              {selectedProducts.length === 0 ? (
                <div className="py-4 text-center text-[#737373] space-y-1">
                  <Package className="w-7 h-7 mx-auto stroke-1 text-[#525252]" />
                  <p className="text-xs text-[#A3A3A3]">태그된 직매입 장비가 없습니다.</p>
                  <p className="text-[11px]">위 [사용 장비 태그 추가] 버튼을 눌러 장비를 검색하세요.</p>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2.5">
                  {selectedProducts.map((prod) => (
                    <div
                      key={prod.id}
                      className="bg-[#141414] border border-[#333333] rounded-xl pl-3 pr-2 py-2 flex items-center gap-2 text-xs text-white group shadow-sm"
                    >
                      <div className="w-6 h-6 rounded bg-[#262626] overflow-hidden shrink-0 flex items-center justify-center">
                        {prod.imageUrl ? (
                          <Image
                            src={prod.imageUrl}
                            alt={prod.name}
                            width={24}
                            height={24}
                            className="w-full h-full object-cover"
                            unoptimized
                          />
                        ) : (
                          <Package className="w-3.5 h-3.5 text-[#FFD700]" />
                        )}
                      </div>
                      <span className="font-semibold max-w-[160px] truncate">{prod.name}</span>
                      <span className="text-[10px] text-[#FFD700] font-bold">
                        {Number(prod.price).toLocaleString()}원
                      </span>

                      {/* Remove tag chip button */}
                      <button
                        type="button"
                        onClick={() => handleRemoveProduct(prod.id)}
                        className="min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg text-[#737373] hover:text-white hover:bg-[#262626] transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#FFD700]"
                        aria-label={`${prod.name} 태그 삭제`}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Form Actions: Cancel & Submit CTA Buttons */}
          <div className="flex items-center justify-end gap-3 pt-6 border-t border-[#262626]">
            <Link
              href="/community"
              className="min-h-[44px] px-6 py-2.5 bg-[#1F1F1F] hover:bg-[#262626] border border-[#333333] hover:border-white/30 text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center"
            >
              취소
            </Link>

            <button
              type="submit"
              disabled={isSubmitting}
              className="min-h-[44px] px-7 py-2.5 bg-[#FFD700] hover:bg-[#FFD700]/90 disabled:bg-[#262626] disabled:text-[#737373] text-black font-extrabold text-sm rounded-xl transition-all shadow-lg shadow-[#FFD700]/10 hover:shadow-[#FFD700]/25 flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFD700]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>게시글 등록 중...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>게시글 등록</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Product Search Modal */}
        <ProductSearchModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSelectProduct={handleSelectProduct}
          selectedProductIds={selectedProducts.map((p) => p.id)}
        />
      </div>
    </div>
  );
}
