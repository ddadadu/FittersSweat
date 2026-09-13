'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { PenSquare, Search, X, MessageSquareDashed, RotateCcw, Loader2 } from 'lucide-react';
import PostCard, { PostItem } from '@/components/PostCard';
import { fetchApi } from '@/lib/api';

interface HyroxEvent {
  id: string;
  name: string;
  cityCode: string;
  startDate: string;
  endDate: string;
  status: string;
}

export default function CommunityPage() {
  const [events, setEvents] = useState<HyroxEvent[]>([]);
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'latest' | 'comments'>('latest');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingEvents, setLoadingEvents] = useState<boolean>(true);

  // 1. Fetch Events for filter pills
  useEffect(() => {
    async function loadEvents() {
      try {
        const res = await fetchApi<{ success: boolean; events: HyroxEvent[] }>('/api/v1/events');
        if (res.events) {
          setEvents(res.events);
        }
      } catch (err) {
        console.error('Failed to load events:', err);
      } finally {
        setLoadingEvents(false);
      }
    }
    loadEvents();
  }, []);

  // 2. 300ms Debounce for search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // 3. Fetch Posts when selectedEventId changes
  useEffect(() => {
    async function loadPosts() {
      setLoading(true);
      try {
        const query = selectedEventId !== 'ALL' ? `?eventId=${selectedEventId}` : '';
        const res = await fetchApi<{ success: boolean; posts: PostItem[] }>(`/api/v1/posts${query}`);
        if (res.posts) {
          setPosts(res.posts);
        }
      } catch (err) {
        console.error('Failed to load community posts:', err);
      } finally {
        setLoading(false);
      }
    }
    loadPosts();
  }, [selectedEventId]);

  // 4. Client-side search filtering and sorting
  const filteredPosts = useMemo(() => {
    let result = posts;

    // Filter by search query
    if (debouncedSearch.trim()) {
      const query = debouncedSearch.toLowerCase().trim();
      result = result.filter((p) => {
        const matchTitle = p.title?.toLowerCase().includes(query);
        const matchContent = p.content?.toLowerCase().includes(query);
        const matchAuthor = p.user?.name?.toLowerCase().includes(query);
        const matchTags = p.taggedItems?.some((ti) =>
          ti.product?.name?.toLowerCase().includes(query)
        );
        return matchTitle || matchContent || matchAuthor || matchTags;
      });
    }

    // Apply sorting
    return [...result].sort((a, b) => {
      if (sortBy === 'comments') {
        const countA = a.commentCount ?? a.postComments?.length ?? 0;
        const countB = b.commentCount ?? b.postComments?.length ?? 0;
        if (countB !== countA) {
          return countB - countA;
        }
        // Tie-breaker: newest first
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      // 'latest' default: newest first
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [posts, debouncedSearch, sortBy]);

  const handleResetFilter = () => {
    setSelectedEventId('ALL');
    setSearchTerm('');
    setSortBy('latest');
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white py-8 sm:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-[#262626]">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-widest text-black bg-[#FFD700] px-2.5 py-0.5 rounded">
                COMMUNITY
              </span>
              <span className="text-xs text-[#A3A3A3] font-medium">HYROX RACERS HUB</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
              HYROX 레이서 커뮤니티
            </h1>
            <p className="text-sm sm:text-base text-[#A3A3A3] leading-relaxed">
              완주 레이서들의 생생한 스테이션 공략 노하우와 실제 레이스에서 검증된 직매입 장비 후기를 확인하세요.
            </p>
          </div>

          {/* CTA: [완주 후기 작성하기] */}
          <Link
            href="/community/new"
            className="min-h-[44px] inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#FFD700] hover:bg-[#FFD700]/90 text-black font-extrabold text-sm rounded-xl transition-all shadow-lg shadow-[#FFD700]/10 hover:shadow-[#FFD700]/25 hover:scale-[1.02] active:scale-[0.98] shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFD700]"
          >
            <PenSquare className="w-4 h-4" />
            <span>완주 후기 작성하기</span>
          </Link>
        </div>

        {/* Filter & Search Bar */}
        <div className="space-y-4">
          {/* Event Filter Pills Tab */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
            <button
              type="button"
              onClick={() => setSelectedEventId('ALL')}
              className={`min-h-[40px] px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFD700] ${
                selectedEventId === 'ALL'
                  ? 'bg-[#FFD700] text-black shadow-md shadow-[#FFD700]/15'
                  : 'bg-[#141414] text-[#A3A3A3] hover:text-white hover:bg-[#1F1F1F] border border-[#262626]'
              }`}
            >
              전체 대회
            </button>

            {events.map((evt) => {
              const isSelected = selectedEventId === evt.id;
              return (
                <button
                  key={evt.id}
                  type="button"
                  onClick={() => setSelectedEventId(evt.id)}
                  className={`min-h-[40px] px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFD700] ${
                    isSelected
                      ? 'bg-[#FFD700] text-black shadow-md shadow-[#FFD700]/15'
                      : 'bg-[#141414] text-[#A3A3A3] hover:text-white hover:bg-[#1F1F1F] border border-[#262626]'
                  }`}
                >
                  {evt.name}
                </button>
              );
            })}
          </div>

          {/* Counter, Search Input & Sort Controls */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-[#A3A3A3]">
                총 <strong className="text-white font-black">{filteredPosts.length}</strong>개의 완주 후기
              </span>
              {selectedEventId !== 'ALL' && (
                <span className="text-xs bg-[#1F1F1F] border border-[#333333] text-[#FFD700] px-2 py-0.5 rounded-full">
                  필터 적용됨
                </span>
              )}
            </div>

            {/* Right Tools: Search Box & Sort Dropdown */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full md:w-auto">
              {/* Search Box */}
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#737373]" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="후기 제목, 훈련팁, 장비 검색..."
                  aria-label="후기 검색"
                  className="w-full bg-[#141414] border border-[#262626] focus:border-[#FFD700] focus:ring-1 focus:ring-[#FFD700] rounded-xl pl-10 pr-10 py-2.5 text-sm text-white placeholder:text-[#737373] outline-none transition-all"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#737373] hover:text-white p-1"
                    aria-label="검색어 지우기"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Sort Dropdown */}
              <div className="relative shrink-0">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'latest' | 'comments')}
                  aria-label="게시글 정렬 기준"
                  className="min-h-[44px] bg-[#141414] border border-[#262626] focus:border-[#FFD700] focus:ring-1 focus:ring-[#FFD700] text-white rounded-xl px-4 py-2.5 text-xs font-bold outline-none transition-all cursor-pointer w-full sm:w-auto"
                >
                  <option value="latest" className="bg-[#141414] text-white">
                    최신순
                  </option>
                  <option value="comments" className="bg-[#141414] text-white">
                    댓글 많은순
                  </option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Post Cards Feed Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="bg-[#141414] border border-[#262626] rounded-xl p-5 space-y-4 animate-pulse h-64"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#262626]" />
                  <div className="space-y-1.5 flex-1">
                    <div className="w-24 h-3 bg-[#262626] rounded" />
                    <div className="w-16 h-2.5 bg-[#1F1F1F] rounded" />
                  </div>
                </div>
                <div className="w-3/4 h-5 bg-[#262626] rounded" />
                <div className="space-y-2">
                  <div className="w-full h-3 bg-[#1F1F1F] rounded" />
                  <div className="w-4/5 h-3 bg-[#1F1F1F] rounded" />
                </div>
                <div className="w-1/3 h-6 bg-[#262626] rounded-lg mt-4" />
              </div>
            ))}
          </div>
        ) : filteredPosts.length === 0 ? (
          /* Empty State */
          <div className="py-20 flex flex-col items-center justify-center text-center p-8 bg-[#141414] border border-[#262626] rounded-2xl space-y-4">
            <div className="w-16 h-16 rounded-full bg-[#1F1F1F] flex items-center justify-center text-[#737373]">
              <MessageSquareDashed className="w-8 h-8 stroke-1 text-[#FFD700]" />
            </div>
            <div className="space-y-1.5 max-w-sm">
              <h3 className="text-lg font-bold text-white">작성된 완주 후기가 없습니다</h3>
              <p className="text-sm text-[#A3A3A3]">
                선택한 필터나 검색 조건에 해당하는 글이 없습니다. 다른 조건으로 검색해 보세요.
              </p>
            </div>
            <button
              type="button"
              onClick={handleResetFilter}
              className="min-h-[44px] inline-flex items-center gap-2 px-5 py-2.5 bg-[#1F1F1F] hover:bg-[#262626] border border-[#333333] hover:border-white/30 text-white font-semibold text-xs rounded-xl transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>전체 후기 보기</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredPosts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
