'use client';

import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchApi } from '@/lib/api';
import { Product } from '@/components/ProductCard';
import MotionProductGrid from '@/components/motion/MotionProductGrid';
import {
  ShoppingBag,
  Search,
  X,
  PackageSearch,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
} from 'lucide-react';

interface ProductsResponse {
  success: boolean;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  products: Product[];
}

const CATEGORIES = [
  { id: 'ALL', name: '전체' },
  { id: 'shoes', name: '공식 레이싱화' },
  { id: 'nutrition', name: '에너지 & 뉴트리션' },
  { id: 'gear', name: '보호대 & 그립' },
  { id: 'equipment', name: '대회 공인 스테이션 장비' },
];

export default function ProductsPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchInput, setSearchInput] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<'newest' | 'price_asc' | 'price_desc'>('newest');
  const [page, setPage] = useState<number>(1);

  // 300ms debounce for live search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
      setPage(1);
    }, 300);

    return () => clearTimeout(handler);
  }, [searchInput]);

  const handleCategoryChange = (catId: string) => {
    setSelectedCategory(catId);
    setPage(1);
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSortOrder(e.target.value as 'newest' | 'price_asc' | 'price_desc');
    setPage(1);
  };

  const handleClearFilters = () => {
    setSelectedCategory('ALL');
    setSearchInput('');
    setDebouncedSearch('');
    setSortOrder('newest');
    setPage(1);
  };

  // Build query endpoint
  const queryParams = new URLSearchParams();
  queryParams.set('page', String(page));
  queryParams.set('limit', '20');
  queryParams.set('sort', sortOrder);
  if (selectedCategory !== 'ALL') {
    queryParams.set('categoryId', selectedCategory);
  }
  if (debouncedSearch) {
    queryParams.set('search', debouncedSearch);
  }

  const { data, isLoading, error } = useQuery<ProductsResponse>({
    queryKey: ['products', selectedCategory, debouncedSearch, sortOrder, page],
    queryFn: () => {
      const catParam = selectedCategory !== 'ALL' ? `&categoryId=${selectedCategory}` : '';
      const searchParam = debouncedSearch ? `&search=${encodeURIComponent(debouncedSearch)}` : '';
      return fetchApi<ProductsResponse>(
        `/api/v1/products?page=${page}&limit=20&sort=${sortOrder}${catParam}${searchParam}`
      );
    },
  });

  const products = data?.products || [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;

  // Generate pagination page list
  const getPageNumbers = () => {
    const pages: number[] = [];
    const maxVisible = 5;
    let start = Math.max(1, page - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);

    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="space-y-4 pb-6 border-b border-neutral-800">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-[#FFD700] text-xs font-black tracking-wider uppercase mb-1.5">
              <ShoppingBag className="w-4 h-4" />
              <span>HYROX OFFICIAL & VERIFIED GEAR</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black italic text-white tracking-tight">
              직매입 레이스 장비몰
            </h1>
            <p className="text-sm text-neutral-400 mt-1 max-w-2xl">
              슬레드 푸시/풀, 월볼, 러닝 8km 등 스테이션별 최고 성능을 보장하는 400여 종의 100% 정품 장비
            </p>
          </div>

          {/* Item Counter */}
          <div className="text-xs text-neutral-400 bg-neutral-900 border border-neutral-800 px-4 py-2 rounded-xl shrink-0 self-start md:self-auto">
            총 <strong className="text-[#FFD700] font-black text-sm">{total.toLocaleString('ko-KR')}개</strong>의 HYROX 직매입 장비
          </div>
        </div>

        {/* 5-Category Pill Tabs */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-none">
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => handleCategoryChange(cat.id)}
                className={`h-10 px-4 rounded-full text-sm font-semibold whitespace-nowrap transition-all duration-200 shrink-0 min-h-[44px] ${
                  isSelected
                    ? 'bg-[#FFD700] text-black shadow-md shadow-[#FFD700]/20 font-bold'
                    : 'bg-[#1F1F1F] text-[#A3A3A3] hover:text-white hover:bg-[#262626]'
                }`}
              >
                {cat.name}
              </button>
            );
          })}
        </div>

        {/* Search Bar & Sort Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          {/* Debounced Search Bar */}
          <div className="relative w-full sm:max-w-md">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="장비명 또는 키워드 검색 (예: 슬레드, 러닝화, 카본)..."
              className="w-full h-11 pl-10 pr-10 rounded-xl bg-[#141414] border border-[#262626] text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-[#FFD700] focus:ring-1 focus:ring-[#FFD700] transition-colors"
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => setSearchInput('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 text-neutral-400 hover:text-white rounded-lg transition-colors"
                aria-label="검색어 초기화"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
            <div className="relative w-full sm:w-auto">
              <div className="flex items-center space-x-2 bg-[#141414] border border-[#262626] rounded-xl px-3 h-11">
                <SlidersHorizontal className="w-4 h-4 text-neutral-400 shrink-0" />
                <select
                  value={sortOrder}
                  onChange={handleSortChange}
                  className="bg-transparent text-sm text-neutral-200 font-medium focus:outline-none cursor-pointer pr-2"
                  aria-label="상품 정렬"
                >
                  <option value="newest" className="bg-neutral-900 text-white">
                    최신순
                  </option>
                  <option value="price_asc" className="bg-neutral-900 text-white">
                    낮은 가격순
                  </option>
                  <option value="price_desc" className="bg-neutral-900 text-white">
                    높은 가격순
                  </option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Product Grid Area */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="bg-[#141414] border border-[#262626] rounded-xl overflow-hidden animate-pulse"
            >
              <div className="aspect-square bg-neutral-800/50 w-full" />
              <div className="p-4 space-y-3">
                <div className="h-3 w-16 bg-neutral-800 rounded" />
                <div className="h-4 w-3/4 bg-neutral-800 rounded" />
                <div className="h-3 w-24 bg-neutral-800 rounded" />
                <div className="pt-3 border-t border-[#262626] flex justify-between items-center">
                  <div className="h-5 w-20 bg-neutral-800 rounded" />
                  <div className="h-10 w-16 bg-neutral-800 rounded-xl" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="p-12 text-center rounded-2xl bg-neutral-900 border border-neutral-800 text-neutral-400 space-y-3">
          <p className="text-base font-semibold text-white">상품 목록을 불러오는 중 오류가 발생했습니다.</p>
          <button
            onClick={() => handleClearFilters()}
            className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-bold transition-colors"
          >
            다시 시도하기
          </button>
        </div>
      ) : products.length === 0 ? (
        <div className="py-20 px-6 text-center rounded-2xl bg-neutral-900/60 border border-neutral-800 space-y-5 max-w-lg mx-auto">
          <div className="w-16 h-16 mx-auto rounded-full bg-neutral-800/80 border border-neutral-700 flex items-center justify-center text-neutral-400">
            <PackageSearch className="w-8 h-8 text-neutral-400" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-white">
              {debouncedSearch
                ? `‘${debouncedSearch}’에 대한 검색 결과가 없습니다`
                : '선택하신 조건에 해당하는 상품이 없습니다'}
            </h3>
            <p className="text-sm text-neutral-400">
              검색어 철자를 확인하시거나 다른 카테고리를 선택해 보세요.
            </p>
          </div>
          <button
            onClick={handleClearFilters}
            className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-[#FFD700] hover:bg-yellow-400 text-black font-extrabold text-xs transition-colors min-h-[44px] shadow-lg shadow-yellow-500/10"
          >
            <RotateCcw className="w-4 h-4" />
            <span>전체 상품 보기</span>
          </button>
        </div>
      ) : (
        <MotionProductGrid products={products} />
      )}

      {/* 20-unit Pagination Button Bar */}
      {!isLoading && totalPages > 1 && (
        <div className="flex items-center justify-center space-x-1.5 pt-8 pb-4 border-t border-neutral-800">
          {/* Previous Page */}
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            aria-label="이전 페이지"
            className="min-w-[44px] min-h-[44px] px-3 py-2 rounded-xl border border-neutral-800 bg-neutral-900 text-neutral-400 hover:text-white hover:border-neutral-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Page Numbers */}
          {getPageNumbers().map((num) => (
            <button
              key={num}
              onClick={() => setPage(num)}
              aria-label={`${num}페이지`}
              aria-current={page === num ? 'page' : undefined}
              className={`min-w-[44px] min-h-[44px] px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                page === num
                  ? 'bg-[#FFD700] text-black shadow-md shadow-yellow-500/10 font-black'
                  : 'bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white hover:border-neutral-700'
              }`}
            >
              {num}
            </button>
          ))}

          {/* Next Page */}
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            aria-label="다음 페이지"
            className="min-w-[44px] min-h-[44px] px-3 py-2 rounded-xl border border-neutral-800 bg-neutral-900 text-neutral-400 hover:text-white hover:border-neutral-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
