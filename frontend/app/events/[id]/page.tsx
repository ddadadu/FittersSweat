'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { fetchApi } from '@/lib/api';
import Link from 'next/link';
import { Calendar, MapPin, ExternalLink, ArrowLeft, MessageSquare, Plus, ShoppingBag } from 'lucide-react';

interface EventDetail {
  id: string;
  name: string;
  cityCode: string;
  startDate: string;
  endDate: string;
  eventUrl: string | null;
  status: string;
  posts: Array<{
    id: string;
    title: string;
    content: string;
    createdAt: string;
  }>;
}

export default function EventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.id as string;

  const { data, isLoading, error } = useQuery<{ success: boolean; event: EventDetail }>({
    queryKey: ['event', eventId],
    queryFn: () => fetchApi(`/api/v1/events/${eventId}`),
    enabled: !!eventId,
  });

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-neutral-800 rounded-lg" />
        <div className="h-48 bg-neutral-900 rounded-2xl border border-neutral-800" />
      </div>
    );
  }

  if (error || !data?.event) {
    return (
      <div className="p-12 text-center rounded-2xl bg-neutral-900 border border-neutral-800 text-neutral-400 space-y-4">
        <p>대회 정보를 찾을 수 없습니다.</p>
        <button
          onClick={() => router.back()}
          className="px-4 py-2 rounded-xl bg-neutral-800 text-white text-sm font-bold hover:bg-neutral-700"
        >
          돌아가기
        </button>
      </div>
    );
  }

  const event = data.event;
  const cityLabel = event.cityCode === 'SEL' ? '서울' : event.cityCode === 'ICN' ? '인천 송도' : event.cityCode;

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Back button */}
      <Link
        href="/events"
        className="inline-flex items-center space-x-1.5 text-xs font-semibold text-neutral-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>대회 목록으로</span>
      </Link>

      {/* Main Info Card */}
      <div className="rounded-3xl bg-neutral-900 border border-neutral-800 p-8 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <span className="px-3.5 py-1 rounded-full text-xs font-black bg-[#FFD700] text-black">
            {event.status.toUpperCase()}
          </span>
          {event.eventUrl && (
            <a
              href={event.eventUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-[#FFD700] text-black text-xs font-extrabold hover:bg-yellow-400 transition-colors shadow-md"
            >
              <span>공식 참가접수 바로가기</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>

        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
          {event.name}
        </h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-neutral-800">
          <div className="flex items-center space-x-3 text-neutral-300">
            <div className="p-2.5 rounded-xl bg-neutral-800 text-[#FFD700]">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-neutral-400">개최 지역</div>
              <div className="font-bold text-sm">{cityLabel}</div>
            </div>
          </div>
          <div className="flex items-center space-x-3 text-neutral-300">
            <div className="p-2.5 rounded-xl bg-neutral-800 text-[#FFD700]">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-neutral-400">대회 기간</div>
              <div className="font-bold text-sm">
                {new Date(event.startDate).toLocaleDateString('ko-KR')} ~{' '}
                {new Date(event.endDate).toLocaleDateString('ko-KR')}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-4">
        <Link
          href={`/products`}
          className="flex-1 flex items-center justify-center space-x-2 p-4 rounded-2xl bg-neutral-900 border border-neutral-800 hover:border-[#FFD700] transition-colors text-sm font-bold text-neutral-200 hover:text-[#FFD700]"
        >
          <ShoppingBag className="w-4 h-4" />
          <span>이 대회 필수 추천 장비 둘러보기</span>
        </Link>
        <Link
          href={`/community/new?eventId=${event.id}`}
          className="flex-1 flex items-center justify-center space-x-2 p-4 rounded-2xl bg-neutral-900 border border-neutral-800 hover:border-[#FFD700] transition-colors text-sm font-bold text-neutral-200 hover:text-[#FFD700]"
        >
          <Plus className="w-4 h-4" />
          <span>이 대회 참가 팁 / 동행 모집 글쓰기</span>
        </Link>
      </div>

      {/* Related Posts Section */}
      <div className="space-y-4 pt-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <MessageSquare className="w-4 h-4 text-[#FFD700]" />
            <h2 className="text-lg font-bold text-white">대회 관련 커뮤니티 이야기</h2>
          </div>
          <span className="text-xs text-neutral-400">{event.posts?.length || 0}개의 글</span>
        </div>

        {event.posts?.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-neutral-900/50 border border-neutral-800 text-neutral-400 text-sm">
            아직 등록된 후기나 팁이 없습니다. 첫 번째 글을 작성해 보세요!
          </div>
        ) : (
          <div className="space-y-3">
            {event.posts.map((p) => (
              <Link
                key={p.id}
                href={`/community/${p.id}`}
                className="block p-4 rounded-2xl bg-neutral-900 border border-neutral-800 hover:border-neutral-700 transition-colors"
              >
                <h3 className="font-bold text-sm text-neutral-100 hover:text-[#FFD700] transition-colors">
                  {p.title}
                </h3>
                <p className="text-xs text-neutral-400 line-clamp-1 mt-1">{p.content}</p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
