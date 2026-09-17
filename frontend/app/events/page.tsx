'use client';

import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchApi } from '@/lib/api';
import EventCard, { EventItem } from '@/components/EventCard';
import { useAuthStore } from '@/stores/useAuthStore';
import { showToast } from '@/stores/useToastStore';
import { Trophy, Filter } from 'lucide-react';

export default function EventsPage() {
  const queryClient = useQueryClient();
  const [filterCity, setFilterCity] = useState<string>('ALL');
  const { isAuthenticated } = useAuthStore();

  // 1. 전체 대회 목록 조회
  const { data, isLoading, error } = useQuery<{ success: boolean; events: EventItem[] }>({
    queryKey: ['events'],
    queryFn: () => fetchApi('/api/v1/events'),
  });

  // 2. 로그인 회원 관심 대회 목록 조회 (동기화)
  const { data: interestedData } = useQuery<{ success: boolean; events: EventItem[] }>({
    queryKey: ['interestedEvents'],
    queryFn: () => fetchApi('/api/v1/events/interested'),
    enabled: isAuthenticated,
  });

  const interestedSet = useMemo(() => {
    return new Set((interestedData?.events || []).map((e) => e.id));
  }, [interestedData]);

  const toggleInterestMutation = useMutation({
    mutationFn: (eventId: string) =>
      fetchApi<{ success: boolean; isInterested: boolean }>(`/api/v1/events/${eventId}/interested`, {
        method: 'POST',
      }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['interestedEvents'] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
      showToast(
        res.isInterested ? '관심 대회로 등록되었습니다.' : '관심 대회가 해제되었습니다.',
        'success'
      );
    },
    onError: (err: any) => {
      showToast(err.message || '관심 대회 등록에 실패했습니다.', 'error');
    },
  });

  const events = data?.events || [];
  const filteredEvents = filterCity === 'ALL' 
    ? events 
    : events.filter((e) => e.cityCode === filterCity);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-neutral-800">
        <div>
          <div className="flex items-center space-x-2 text-[#FFD700] text-sm font-bold mb-1">
            <Trophy className="w-4 h-4" />
            <span>2026 RACE SCHEDULE</span>
          </div>
          <h1 className="text-3xl font-black italic text-white tracking-tight">
            HYROX 공식 대회 일정
          </h1>
          <p className="text-sm text-neutral-400 mt-1">
            국내 및 아시아 지역 공식 HYROX 일정과 얼리버드 접수 현황을 확인하세요.
          </p>
        </div>

        {/* City Filter Pills */}
        <div className="flex items-center space-x-2 bg-neutral-900 p-1.5 rounded-xl border border-neutral-800 self-start sm:self-auto">
          <Filter className="w-3.5 h-3.5 text-neutral-400 ml-2 mr-1" />
          {['ALL', 'SEL', 'ICN'].map((city) => (
            <button
              key={city}
              onClick={() => setFilterCity(city)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                filterCity === city
                  ? 'bg-[#FFD700] text-black'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              {city === 'ALL' ? '전체 도시' : city === 'SEL' ? '서울' : '인천 송도'}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-64 rounded-2xl bg-neutral-900 border border-neutral-800 animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="p-8 text-center rounded-2xl bg-neutral-900 border border-neutral-800 text-neutral-400">
          대회 일정을 불러오는 데 실패했습니다. 잠시 후 다시 시도해 주세요.
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-neutral-900 border border-neutral-800 text-neutral-400">
          해당 조건의 대회가 없습니다.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              isInterested={interestedSet.has(event.id)}
              onToggleInterest={(id) => toggleInterestMutation.mutate(id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
