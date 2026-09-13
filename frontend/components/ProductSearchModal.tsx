'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { Search, X, Package, Check, Loader2 } from 'lucide-react';
import { fetchApi } from '@/lib/api';

export interface SearchProduct {
  id: string;
  name: string;
  description?: string | null;
  categoryId: string;
  price: number;
  stockQuantity?: number;
  imageUrl?: string | null;
}

interface ProductSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectProduct: (product: SearchProduct) => void;
  selectedProductIds?: string[];
}

const CATEGORIES = [
  { id: 'ALL', label: '전체' },
  { id: 'shoes', label: '러닝/레이스화' },
  { id: 'nutrition', label: '에너지/보충제' },
  { id: 'gear', label: '의류/레이스 기어' },
  { id: 'equipment', label: '트레이닝 장비' },
];

export default function ProductSearchModal({
  isOpen,
  onClose,
  onSelectProduct,
  selectedProductIds = [],
}: ProductSearchModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [products, setProducts] = useState<SearchProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [imgErrors, setImgErrors] = useState<Record<string, boolean>>({});
  const searchInputRef = useRef<HTMLInputElement>(null);

  // 1. Lock background scroll on mount / open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      // Auto focus search input
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  // 2. Escape key handling
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // 3. 300ms Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // 4. Fetch products when debouncedSearch or category changes
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (debouncedSearch.trim()) {
          params.set('search', debouncedSearch.trim());
        }
        if (selectedCategory && selectedCategory !== 'ALL') {
          params.set('categoryId', selectedCategory);
        }
        params.set('limit', '10');

        const res = await fetchApi<{ success: boolean; products: SearchProduct[] }>(
          `/api/v1/products?${params.toString()}`
        );

        if (isMounted && res.products) {
          setProducts(res.products);
        }
      } catch (err) {
        console.error('Failed to search products:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchProducts();
    return () => {
      isMounted = false;
    };
  }, [isOpen, debouncedSearch, selectedCategory]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            onClick={(e) => e.stopPropagation()}
            className="relative z-10 w-full max-w-2xl bg-[#141414] border border-[#262626] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
          >
            {/* Modal Header */}
            <div className="p-5 border-b border-[#262626] flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black text-white flex items-center gap-2">
                  <span>직매입 장비 검색 & 태깅</span>
                  <span className="text-xs font-bold text-black bg-[#FFD700] px-2 py-0.5 rounded">
                    400+ GEAR
                  </span>
                </h2>
                <p className="text-xs text-[#A3A3A3] mt-1">
                  완주 후기에 착용한 공식 직매입 장비를 태그하여 레이서들에게 추천하세요.
                </p>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-[#A3A3A3] hover:text-white hover:bg-[#1F1F1F] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFD700]"
                aria-label="모달 닫기"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search Input Bar */}
            <div className="p-5 pb-3 space-y-3">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#737373]" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="장비명 또는 브랜드 검색 (예: 푸마, 니슬리브, 에너지젤)..."
                  className="w-full bg-[#1F1F1F] border border-[#333333] focus:border-[#FFD700] focus:ring-1 focus:ring-[#FFD700] rounded-xl pl-10 pr-10 py-3 text-sm text-white placeholder:text-[#737373] outline-none transition-all"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#737373] hover:text-white p-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Category Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                {CATEGORIES.map((cat) => {
                  const isActive = selectedCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFD700] ${
                        isActive
                          ? 'bg-[#FFD700] text-black shadow-sm'
                          : 'bg-[#1F1F1F] text-[#A3A3A3] hover:text-white hover:bg-[#262626] border border-[#333333]'
                      }`}
                    >
                      {cat.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Products List Scroll Area */}
            <div className="flex-1 overflow-y-auto p-5 pt-2 space-y-2.5 divide-y divide-[#262626]/50">
              {loading ? (
                <div className="py-12 flex flex-col items-center justify-center text-[#737373] gap-2">
                  <Loader2 className="w-6 h-6 animate-spin text-[#FFD700]" />
                  <span className="text-xs">장비 카탈로그를 조회 중입니다...</span>
                </div>
              ) : products.length === 0 ? (
                <div className="py-12 flex flex-col items-center justify-center text-[#737373] gap-2">
                  <Package className="w-8 h-8 stroke-1 text-[#525252]" />
                  <span className="text-sm text-[#A3A3A3]">검색된 장비가 없습니다.</span>
                  <span className="text-xs">다른 검색어나 카테고리를 선택해 보세요.</span>
                </div>
              ) : (
                products.map((prod) => {
                  const isAlreadySelected = selectedProductIds.includes(prod.id);
                  const hasValidImage = !!prod.imageUrl && !imgErrors[prod.id];

                  return (
                    <div
                      key={prod.id}
                      className="pt-2.5 first:pt-0 flex items-center justify-between gap-3 group hover:bg-white/[0.02] p-2 rounded-xl transition-colors"
                    >
                      {/* Product Thumbnail + Info */}
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="relative aspect-square w-12 h-12 bg-[#1F1F1F] border border-[#333333] rounded-lg overflow-hidden shrink-0 flex items-center justify-center">
                          {hasValidImage ? (
                            <Image
                              src={prod.imageUrl!}
                              alt={prod.name}
                              width={48}
                              height={48}
                              className="w-full h-full object-cover"
                              unoptimized
                              onError={() => {
                                setImgErrors((prev) => ({ ...prev, [prod.id]: true }));
                              }}
                            />
                          ) : (
                            <Package className="w-5 h-5 text-[#737373]" />
                          )}
                        </div>

                        <div className="min-w-0 flex-1 space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-[#FFD700] bg-[#FFD700]/10 border border-[#FFD700]/30 px-1.5 py-0.2 rounded">
                              {prod.categoryId}
                            </span>
                          </div>
                          <h4 className="text-sm font-semibold text-white truncate group-hover:text-[#FFD700] transition-colors">
                            {prod.name}
                          </h4>
                          <p className="text-xs font-bold text-[#FFD700]">
                            {Number(prod.price).toLocaleString()}원
                          </p>
                        </div>
                      </div>

                      {/* Select Action Button */}
                      <div>
                        {isAlreadySelected ? (
                          <span className="min-h-[44px] min-w-[76px] px-3 py-2 flex items-center justify-center gap-1 bg-[#1F1F1F] border border-[#333333] text-[#737373] text-xs font-bold rounded-lg cursor-not-allowed">
                            <Check className="w-3.5 h-3.5 text-emerald-500" />
                            선택됨
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              onSelectProduct(prod);
                              onClose();
                            }}
                            className="min-h-[44px] min-w-[76px] px-4 py-2 bg-[#FFD700] hover:bg-[#FFD700]/90 text-black font-bold text-xs rounded-lg transition-all shadow-md hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFD700]"
                          >
                            선택
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-[#262626] bg-[#0F0F0F] flex items-center justify-between text-xs text-[#737373]">
              <span>ESC를 누르면 검색창이 닫힙니다.</span>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-[#A3A3A3] hover:text-white transition-colors"
              >
                닫기
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
