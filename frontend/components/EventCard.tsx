'use client';

import React from 'react';
import Link from 'next/link';
import { Calendar, MapPin, Heart, ExternalLink, ArrowRight } from 'lucide-react';

export interface EventItem {
  id: string;
  name: string;
  cityCode: string;
  startDate: string;
  endDate: string;
  eventUrl: string | null;
  status: string;
}

interface EventCardProps {
  event: EventItem;
  isInterested?: boolean;
  onToggleInterest?: (id: string) => void;
}

export default function EventCard({ event, isInterested = false, onToggleInterest }: EventCardProps) {
  const start = new Date(event.startDate);
  const now = new Date();
  const diffTime = start.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  const dDayText = diffDays > 0 ? `D-${diffDays}` : diffDays === 0 ? 'D-DAY' : '종료';
  const cityLabel = event.cityCode === 'SEL' ? '서울 (Seoul)' : event.cityCode === 'ICN' ? '인천 송도 (Incheon)' : event.cityCode;

  return (
    <div className="rounded-2xl bg-neutral-900 border border-neutral-800 p-6 flex flex-col justify-between hover:border-neutral-700 transition-all hover:shadow-xl hover:shadow-black/50 group">
      <div>
        <div className="flex items-center justify-between mb-4">
          <span className="px-3 py-1 rounded-full text-xs font-black bg-[#FFD700] text-black">
            {dDayText}
          </span>
          <button
            onClick={() => onToggleInterest && onToggleInterest(event.id)}
            className={`p-2 rounded-full border transition-colors ${
              isInterested
                ? 'bg-rose-500/10 border-rose-500 text-rose-500'
                : 'border-neutral-700 text-neutral-400 hover:text-white hover:border-neutral-500'
            }`}
            title={isInterested ? '관심 대회 취소' : '관심 대회 등록'}
          >
            <Heart className={`w-4 h-4 ${isInterested ? 'fill-rose-500' : ''}`} />
          </button>
        </div>

        <h3 className="text-xl font-bold text-white mb-3 group-hover:text-[#FFD700] transition-colors line-clamp-2">
          {event.name}
        </h3>

        <div className="space-y-2 text-sm text-neutral-400 mb-6">
          <div className="flex items-center space-x-2">
            <MapPin className="w-4 h-4 text-[#FFD700]" />
            <span>{cityLabel}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-[#FFD700]" />
            <span>
              {new Date(event.startDate).toLocaleDateString('ko-KR')} ~{' '}
              {new Date(event.endDate).toLocaleDateString('ko-KR')}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 pt-4 border-t border-neutral-800">
        <Link
          href={`/events/${event.id}`}
          className="flex-1 flex items-center justify-center space-x-1.5 py-2.5 px-4 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-bold transition-colors"
        >
          <span>대회 정보 & 후기</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
        {event.eventUrl && (
          <a
            href={event.eventUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2.5 rounded-xl border border-neutral-700 hover:border-[#FFD700] text-neutral-300 hover:text-[#FFD700] transition-colors"
            title="공식 홈페이지 바로가기"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        )}
      </div>
    </div>
  );
}
