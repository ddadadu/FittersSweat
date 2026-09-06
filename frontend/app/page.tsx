'use client';

import Link from 'next/link';
import { Trophy, Zap, Sparkles, ArrowRight, ShieldCheck } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="space-y-16 py-6">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-neutral-900 via-neutral-950 to-black border border-neutral-800 p-8 sm:p-14 text-center sm:text-left flex flex-col lg:flex-row items-center justify-between gap-10">
        <div className="space-y-6 max-w-2xl">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-[#FFD700]/10 border border-[#FFD700]/30 text-[#FFD700] text-xs font-bold tracking-wide">
            <span className="animate-pulse">●</span>
            <span>NEXT RACE: AirAsia HYROX Seoul 2026 (D-68)</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black italic tracking-tight leading-none text-white">
            HYROX 피니셔를 위한<br />
            <span className="text-[#FFD700]">올인원 커머스 & AI 추천</span>
          </h1>

          <p className="text-base sm:text-lg text-neutral-300 leading-relaxed">
            국내 최초 HYROX 특화 플랫폼. 공식 대회 일정 확인부터 8개 스테이션별 검증된 직매입 장비, 
            그리고 레이서 전용 벡터 AI 검색 추천까지 한곳에서 경험하세요.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 pt-2">
            <Link
              href="/search"
              className="inline-flex items-center justify-center space-x-2 px-6 py-3.5 rounded-xl bg-[#FFD700] text-black font-extrabold text-sm hover:bg-yellow-400 transition-all transform hover:-translate-y-0.5 shadow-lg shadow-yellow-500/20"
            >
              <Sparkles className="w-4 h-4" />
              <span>AI 맞춤 장비 추천받기</span>
            </Link>
            <Link
              href="/events"
              className="inline-flex items-center justify-center space-x-2 px-6 py-3.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-sm border border-neutral-700 transition-all"
            >
              <span>2026 대회 일정 보기</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Hero Visual Box */}
        <div className="w-full lg:w-96 rounded-2xl bg-[#1A1A1A] border border-neutral-700 p-6 space-y-4 shadow-2xl">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-800 text-xs font-semibold text-neutral-400">
            <span>HYROX STATIONS</span>
            <span className="text-[#FFD700]">8 STATIONS / 8KM</span>
          </div>
          <div className="grid grid-cols-2 gap-2.5 text-xs">
            {['1km SkiErg', '50m Sled Push', '50m Sled Pull', '80m Burpee Broad', '1km Row', '200m Farmers Carry', '100m Sandbag Lunge', '100 Wall Balls'].map((station, idx) => (
              <div key={station} className="p-2.5 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center space-x-2">
                <span className="w-4 h-4 rounded-full bg-neutral-800 text-[10px] flex items-center justify-center text-[#FFD700] font-bold">
                  {idx + 1}
                </span>
                <span className="font-medium text-neutral-200 truncate">{station}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3 Key Pillars */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-3 hover:border-neutral-700 transition-colors">
          <div className="w-10 h-10 rounded-xl bg-[#FFD700]/10 text-[#FFD700] flex items-center justify-center">
            <Trophy className="w-5 h-5" />
          </div>
          <h2 className="text-lg font-bold text-white">실시간 대회 스크래핑 & 일정</h2>
          <p className="text-sm text-neutral-400 leading-relaxed">
            공식 사이트 크롤링을 통해 서울, 송도 등 국내외 HYROX 공식 대회 일정과 얼리버드 티켓 오픈 알림을 실시간 제공합니다.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-3 hover:border-neutral-700 transition-colors">
          <div className="w-10 h-10 rounded-xl bg-green-500/10 text-green-400 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h2 className="text-lg font-bold text-white">100% 정품 직매입 & 빠른 배송</h2>
          <p className="text-sm text-neutral-400 leading-relaxed">
            PUMA Deviate NITRO 레이스화, SIS 에너지젤, 그립 장갑 등 실제 레이서들이 검증한 필수 장비를 직매입하여 토스페이먼츠로 안전 결제합니다.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-3 hover:border-neutral-700 transition-colors">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
            <Zap className="w-5 h-5" />
          </div>
          <h2 className="text-lg font-bold text-white">AI 벡터 코사인 RAG 검색</h2>
          <p className="text-sm text-neutral-400 leading-relaxed">
            OpenAI 1536차원 임베딩과 PostgreSQL pgvector를 결합하여 내 체형과 목표 시간에 꼭 맞는 장비와 레이스 전략을 실시간 스트리밍으로 추천합니다.
          </p>
        </div>
      </section>
    </div>
  );
}
