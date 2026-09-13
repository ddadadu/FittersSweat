'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Star, ShoppingCart, Check, Package } from 'lucide-react';
import { useCartStore } from '@/stores/useCartStore';

export interface Product {
  id: string;
  name: string;
  description?: string | null;
  categoryId: string;
  price: number;
  stockQuantity: number;
  imageUrl?: string | null;
  brandLogoUrl?: string | null;
  detailImageUrl?: string | null;
  reviewCount?: number;
  rating?: number;
}

interface ProductCardProps {
  product: Product;
}

const CATEGORY_NAMES: Record<string, string> = {
  shoes: 'SHOES',
  nutrition: 'NUTRITION',
  gear: 'GEAR',
  equipment: 'EQUIPMENT',
};

export default function ProductCard({ product }: ProductCardProps) {
  const [imgError, setImgError] = useState(false);
  const [isAdded, setIsAdded] = useState(false);
  const addItem = useCartStore((state) => state.addItem);

  const brand = product.name.split(' ')[0] || 'HYROX';
  const categoryLabel = CATEGORY_NAMES[product.categoryId?.toLowerCase() || ''] || product.categoryId?.toUpperCase() || 'GEAR';
  const rating = product.rating ?? 5.0;
  const isOutOfStock = product.stockQuantity <= 0;
  const isLowStock = product.stockQuantity > 0 && product.stockQuantity <= 5;
  const hasValidImage = !!product.imageUrl && !imgError;

  const handleAddToCart = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (isOutOfStock) return;

    addItem({
      productId: product.id,
      name: product.name,
      price: product.price,
      categoryId: product.categoryId,
      imageUrl: product.imageUrl || undefined,
      stockQuantity: product.stockQuantity,
    });

    setIsAdded(true);
    setTimeout(() => {
      setIsAdded(false);
    }, 1500);
  };

  return (
    <div className="relative bg-[#141414] border border-[#262626] rounded-xl overflow-hidden group cursor-pointer transition-all duration-200 hover:border-[#FFD700]/50 hover:shadow-xl hover:shadow-[#FFD700]/5 flex flex-col justify-between h-full">
      {/* Clickable Full Card Overlay Link */}
      <Link
        href={`/products/${product.id}`}
        className="absolute inset-0 z-0 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFD700]"
        aria-label={`${product.name} 상세 보기`}
      />

      {/* Top Visual Area: 1:1 aspect-square for CLS 0 */}
      <div className="relative aspect-square w-full bg-neutral-900 overflow-hidden pointer-events-none">
        {hasValidImage ? (
          <Image
            src={product.imageUrl!}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-neutral-900 to-neutral-950 text-neutral-700 transition-transform duration-300 group-hover:scale-105">
            <Package className="w-12 h-12 stroke-1" />
            <span className="text-[10px] font-bold text-neutral-600 tracking-widest mt-2 uppercase">
              FITTERSWEAT GEAR
            </span>
          </div>
        )}

        {/* Top Badges Overlay (z-10 for crisp visual stacking) */}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none z-10">
          {/* Category Chip */}
          <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-black/75 backdrop-blur-md text-[#FFD700] border border-[#FFD700]/30 shadow-sm">
            {categoryLabel}
          </span>

          {/* Stock Urgency Badge */}
          {isOutOfStock ? (
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-950/80 backdrop-blur-md text-rose-400 border border-rose-800/50 shadow-sm">
              품절
            </span>
          ) : isLowStock ? (
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950/85 backdrop-blur-md text-amber-400 border border-amber-600/50 shadow-sm animate-pulse">
              품절 임박: {product.stockQuantity}개 남음
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-black/60 backdrop-blur-md text-neutral-300 border border-neutral-700/50 shadow-sm">
              재고 {product.stockQuantity}개
            </span>
          )}
        </div>
      </div>

      {/* Bottom Info Section */}
      <div className="p-4 flex flex-col flex-1 justify-between gap-3 relative z-10 pointer-events-none">
        <div className="space-y-1.5">
          {/* Brand */}
          <div className="text-xs text-[#737373] uppercase font-bold tracking-wider">
            {brand}
          </div>

          {/* Product Name */}
          <h3 className="text-sm font-semibold text-white line-clamp-1 group-hover:text-[#FFD700] transition-colors leading-snug">
            {product.name}
          </h3>

          {/* Rating & Review Count */}
          <div className="flex items-center space-x-1.5 text-xs text-neutral-400">
            <Star className="w-3.5 h-3.5 fill-[#FFD700] text-[#FFD700] shrink-0" />
            <span className="font-bold text-neutral-200">{rating.toFixed(1)}</span>
            <span className="text-neutral-500">({product.reviewCount ?? 0}개 리뷰)</span>
          </div>
        </div>

        {/* Price & Quick Cart Action */}
        <div className="pt-3 border-t border-[#262626] flex items-center justify-between gap-2 pointer-events-auto">
          <div className="text-base font-extrabold text-white shrink-0">
            {product.price.toLocaleString('ko-KR')}
            <span className="text-xs font-normal text-neutral-400 ml-0.5">원</span>
          </div>

          {/* Quick Add to Cart Button (min 44x44px touch target) */}
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={isOutOfStock}
            aria-label={`${product.name} 장바구니에 담기`}
            className={`min-w-[44px] min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-black flex items-center justify-center space-x-1.5 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFD700] ${
              isAdded
                ? 'bg-green-600 text-white scale-105 shadow-md shadow-green-600/30'
                : isOutOfStock
                ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed border border-neutral-700'
                : 'bg-[#FFD700] text-black hover:bg-yellow-400 active:scale-95 shadow-md shadow-yellow-500/10'
            }`}
          >
            {isAdded ? (
              <>
                <Check className="w-4 h-4 stroke-[2.5]" />
                <span className="hidden sm:inline">담김!</span>
              </>
            ) : (
              <>
                <ShoppingCart className="w-4 h-4" />
                <span>{isOutOfStock ? '품절' : '담기'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
