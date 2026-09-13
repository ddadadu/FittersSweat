'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { fetchApi } from '@/lib/api';
import { useCartStore } from '@/stores/useCartStore';
import { ShoppingBag, Star, ShoppingCart, Check } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  description: string;
  categoryId: string;
  price: number;
  stockQuantity: number;
  reviewCount: number;
}

const CATEGORIES = [
  { id: 'ALL', name: '전체 상품' },
  { id: 'shoes', name: '공식 레이싱화' },
  { id: 'nutrition', name: '에너지 & 뉴트리션' },
  { id: 'gear', name: '보호대 & 그립장비' },
];

export default function ProductsPage() {
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [addedId, setAddedId] = useState<string | null>(null);
  const addItem = useCartStore((state) => state.addItem);

  const { data, isLoading, error } = useQuery<{ success: boolean; products: Product[] }>({
    queryKey: ['products', selectedCategory],
    queryFn: () => {
      const endpoint = selectedCategory === 'ALL'
        ? '/api/v1/products'
        : `/api/v1/products?categoryId=${selectedCategory}`;
      return fetchApi(endpoint);
    },
  });

  const handleAddToCart = (product: Product, e: React.MouseEvent) => {
    e.preventDefault();
    addItem({
      productId: product.id,
      name: product.name,
      price: product.price,
      categoryId: product.categoryId,
    });
    setAddedId(product.id);
    setTimeout(() => setAddedId(null), 1500);
  };

  const products = data?.products || [];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-neutral-800">
        <div>
          <div className="flex items-center space-x-2 text-[#FFD700] text-sm font-bold mb-1">
            <ShoppingBag className="w-4 h-4" />
            <span>HYROX OFFICIAL & VERIFIED GEAR</span>
          </div>
          <h1 className="text-3xl font-black italic text-white tracking-tight">
            직매입 레이스 장비몰
          </h1>
          <p className="text-sm text-neutral-400 mt-1">
            슬레드 푸시/풀, 월볼, 러닝 8km 등 스테이션별 최고 성능을 보장하는 정품 장비
          </p>
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                selectedCategory === cat.id
                  ? 'bg-[#FFD700] text-black shadow-md shadow-yellow-500/10'
                  : 'bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Product Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="h-80 rounded-2xl bg-neutral-900 border border-neutral-800 animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="p-12 text-center rounded-2xl bg-neutral-900 border border-neutral-800 text-neutral-400">
          상품 목록을 불러오는 중 오류가 발생했습니다.
        </div>
      ) : products.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-neutral-900 border border-neutral-800 text-neutral-400">
          해당 카테고리의 상품이 준비 중입니다.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <div
              key={product.id}
              className="rounded-2xl bg-neutral-900 border border-neutral-800 p-6 flex flex-col justify-between hover:border-neutral-700 transition-all hover:shadow-xl group"
            >
              <div>
                {/* Category Badge & Stock */}
                <div className="flex items-center justify-between text-xs mb-3">
                  <span className="px-2.5 py-1 rounded-lg bg-neutral-800 text-neutral-300 font-semibold">
                    {product.categoryId.toUpperCase()}
                  </span>
                  <span className="text-xs text-neutral-400">
                    재고 {product.stockQuantity}개 남음
                  </span>
                </div>

                <Link href={`/products/${product.id}`} className="block group">
                  <h3 className="text-lg font-bold text-white group-hover:text-[#FFD700] transition-colors line-clamp-2 mb-2">
                    {product.name}
                  </h3>
                  <p className="text-xs text-neutral-400 line-clamp-2 leading-relaxed mb-4">
                    {product.description}
                  </p>
                </Link>

                <div className="flex items-center space-x-1.5 text-xs text-neutral-400 mb-4">
                  <Star className="w-3.5 h-3.5 fill-[#FFD700] text-[#FFD700]" />
                  <span className="font-bold text-neutral-200">5.0</span>
                  <span>({product.reviewCount}개 리뷰)</span>
                </div>
              </div>

              <div className="pt-4 border-t border-neutral-800 flex items-center justify-between gap-3">
                <div className="text-xl font-black text-white">
                  {product.price.toLocaleString('ko-KR')}
                  <span className="text-xs font-normal text-neutral-400 ml-1">원</span>
                </div>

                <button
                  onClick={(e) => handleAddToCart(product, e)}
                  className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                    addedId === product.id
                      ? 'bg-green-600 text-white'
                      : 'bg-[#FFD700] text-black hover:bg-yellow-400'
                  }`}
                >
                  {addedId === product.id ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>담김!</span>
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="w-3.5 h-3.5" />
                      <span>담기</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
