'use client';

import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchApi } from '@/lib/api';
import EventCard, { EventItem } from '@/components/EventCard';
import { useAuthStore } from '@/stores/useAuthStore';
import { showToast } from '@/stores/useToastStore';
import { Trophy, Filter, RotateCcw } from 'lucide-react';

export default function EventsPage() {
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuthStore();

  // 필터 상태 관리 (대륙, 국가, 도시, 부문, 진행상태)
  const [selectedContinent, setSelectedContinent] = useState<string>('ALL');
  const [selectedCountry, setSelectedCountry] = useState<string>('ALL');
  const [selectedCity, setSelectedCity] = useState<string>('ALL');
  const [selectedDivision, setSelectedDivision] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  // 1. 전체 대회 목록 조회
  const { data, isLoading, error } = useQuery<{ success: boolean; events: EventItem[] }>({
    queryKey: ['events'],
    queryFn: () => fetchApi('/api/v1/events'),
  });

  // 2. 로그인 회원 관심 대회 목록 조회 (동기화)
  const { data: interestedData } = useQuery<{ success: boolean; events: EventItem[] }>({
    queryKey: ['interestedEvents'],
    queryFn: () => fetchApi('/api/v1/events/interested'),
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

  const events = useMemo(() => data?.events || [], [data]);

  // 종료 여부 판별 헬퍼 (종료일 자정 기준)
  const isEventPast = (e: EventItem) => {
    const end = new Date(e.endDate);
    end.setHours(23, 59, 59, 999);
    return Date.now() > end.getTime();
  };

  // 대륙 목록 동적 추출
  const continentOptions = useMemo(() => {
    const set = new Set<string>();
    events.forEach((e) => {
      if (e.continent) set.add(e.continent);
    });
    return Array.from(set).sort();
  }, [events]);

  // 선택된 대륙, 부문, 상태에 따른 국가 목록 동적 추출
  const countryOptions = useMemo(() => {
    const set = new Set<string>();
    events.forEach((e) => {
      const matchContinent = selectedContinent === 'ALL' || e.continent === selectedContinent;
      const matchDivision = selectedDivision === 'ALL' || e.division === selectedDivision;
      const past = isEventPast(e);
      const matchStatus =
        selectedStatus === 'ALL' ||
        (selectedStatus === 'PAST' ? past : !past);

      if (matchContinent && matchDivision && matchStatus) {
        if (e.country) set.add(e.country);
      }
    });
    return Array.from(set).sort();
  }, [events, selectedContinent, selectedDivision, selectedStatus]);

  // 선택된 국가, 부문, 상태에 따른 도시 목록 동적 추출
  const cityOptions = useMemo(() => {
    const set = new Set<string>();
    events.forEach((e) => {
      const matchContinent = selectedContinent === 'ALL' || e.continent === selectedContinent;
      const matchCountry = selectedCountry === 'ALL' || e.country === selectedCountry;
      const matchDivision = selectedDivision === 'ALL' || e.division === selectedDivision;
      const past = isEventPast(e);
      const matchStatus =
        selectedStatus === 'ALL' ||
        (selectedStatus === 'PAST' ? past : !past);

      if (matchContinent && matchCountry && matchDivision && matchStatus) {
        if (e.city) set.add(e.city);
      }
    });
    return Array.from(set).sort();
  }, [events, selectedContinent, selectedCountry, selectedDivision, selectedStatus]);

  // 상위 필터 변경 핸들러 (하위 필터 연동 리셋)
  const handleContinentChange = (continent: string) => {
    setSelectedContinent(continent);
    setSelectedCountry('ALL');
    setSelectedCity('ALL');
  };

  const handleCountryChange = (country: string) => {
    setSelectedCountry(country);
    setSelectedCity('ALL');
  };

  const handleResetFilters = () => {
    setSelectedContinent('ALL');
    setSelectedCountry('ALL');
    setSelectedCity('ALL');
    setSelectedDivision('ALL');
    setSelectedStatus('ALL');
  };

  // 5단 필터링 적용된 대회 목록
  const filteredEvents = useMemo(() => {
    return events.filter((e) => {
      if (selectedContinent !== 'ALL' && e.continent !== selectedContinent) return false;
      if (selectedCountry !== 'ALL' && e.country !== selectedCountry) return false;
      if (selectedCity !== 'ALL' && e.city !== selectedCity) return false;
      if (selectedDivision !== 'ALL' && e.division !== selectedDivision) return false;
      if (selectedStatus !== 'ALL') {
        const past = isEventPast(e);
        if (selectedStatus === 'PAST' && !past) return false;
        if (selectedStatus === 'UPCOMING' && past) return false;
      }
      return true;
    });
  }, [events, selectedContinent, selectedCountry, selectedCity, selectedDivision, selectedStatus]);

  const isFiltered =
    selectedContinent !== 'ALL' ||
    selectedCountry !== 'ALL' ||
    selectedCity !== 'ALL' ||
    selectedDivision !== 'ALL' ||
    selectedStatus !== 'ALL';

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="pb-6 border-b border-neutral-800 space-y-4">
        <div className="flex items-center space-x-2 text-[#FFD700] text-sm font-bold">
          <Trophy className="w-4 h-4" />
          <span>2026 RACE SCHEDULE</span>
        </div>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black italic text-white tracking-tight">
              HYROX 공식 대회 일정
            </h1>
            <p className="text-sm text-neutral-400 mt-1">
              전 세계 110여 개 공식 HYROX 일정과 얼리버드 접수 현황을 대륙, 국가, 도시별로 필터링하여 확인하세요.
            </p>
          </div>
          <div className="text-xs text-neutral-400">
            총 <span className="text-[#FFD700] font-bold text-sm">{filteredEvents.length}</span>개의 대회
          </div>
        </div>

        {/* 5단 연동 드롭다운 필터바 */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 items-center">
          {/* 1. 대륙 선택 */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-neutral-400 flex items-center gap-1">
              <Filter className="w-3 h-3 text-[#FFD700]" /> 대륙 (Continent)
            </label>
            <select
              value={selectedContinent}
              onChange={(e) => handleContinentChange(e.target.value)}
              className="w-full bg-neutral-800 border border-neutral-700 text-white rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-[#FFD700] transition-colors"
            >
              <option value="ALL">전체 대륙</option>
              {continentOptions.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* 2. 지역/국가 선택 */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-neutral-400">지역/국가 (Country)</label>
            <select
              value={selectedCountry}
              onChange={(e) => handleCountryChange(e.target.value)}
              className="w-full bg-neutral-800 border border-neutral-700 text-white rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-[#FFD700] transition-colors"
            >
              <option value="ALL">전체 국가</option>
              {countryOptions.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* 3. 도시 선택 */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-neutral-400">도시 (City)</label>
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="w-full bg-neutral-800 border border-neutral-700 text-white rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-[#FFD700] transition-colors"
            >
              <option value="ALL">전체 도시</option>
              {cityOptions.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* 4. 부문 선택 */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-neutral-400">부문 (Division)</label>
            <select
              value={selectedDivision}
              onChange={(e) => setSelectedDivision(e.target.value)}
              className="w-full bg-neutral-800 border border-neutral-700 text-white rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-[#FFD700] transition-colors"
            >
              <option value="ALL">전체 부문</option>
              <option value="Adults">성인부 (Adults)</option>
              <option value="Youngstars">청소년부 (Youngstars)</option>
            </select>
          </div>

          {/* 5. 진행 상태 선택 */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-neutral-400">진행 상태 (Status)</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full bg-neutral-800 border border-neutral-700 text-white rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-[#FFD700] transition-colors"
            >
              <option value="ALL">전체 상태</option>
              <option value="UPCOMING">진행 예정 (Upcoming)</option>
              <option value="PAST">종료 (Completed)</option>
            </select>
          </div>

          {/* 초기화 버튼 */}
          <div className="sm:col-span-2 md:col-span-3 lg:col-span-1 flex items-end">
            <button
              type="button"
              onClick={handleResetFilters}
              disabled={!isFiltered}
              className={`w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition-colors ${
                isFiltered
                  ? 'bg-neutral-800 hover:bg-neutral-700 text-[#FFD700] border border-neutral-700'
                  : 'bg-neutral-800/40 text-neutral-500 border border-neutral-800 cursor-not-allowed'
              }`}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>필터 초기화</span>
            </button>
          </div>
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="h-64 rounded-2xl bg-neutral-900 border border-neutral-800 animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="p-8 text-center rounded-2xl bg-neutral-900 border border-neutral-800 text-neutral-400">
          대회 일정을 불러오는 데 실패했습니다. 잠시 후 다시 시도해 주세요.
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-neutral-900 border border-neutral-800 text-neutral-400 space-y-3">
          <p>선택하신 조건에 해당하는 대회가 없습니다.</p>
          <button
            type="button"
            onClick={handleResetFilters}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#FFD700] text-black font-bold text-xs"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>전체 대회 보기</span>
          </button>
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
