'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ShoppingBag, Check } from 'lucide-react';
import { useCartStore } from '@/stores/useCartStore';
import { RecommendedProduct } from '@/stores/useAiChatStore';

interface MiniProductCardProps {
  product: RecommendedProduct;
}

export function MiniProductCard({ product }: MiniProductCardProps) {
  const [added, setAdded] = useState(false);
  const addItem = useCartStore((state) => state.addItem);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem(
      {
        productId: product.id,
        name: product.name,
        price: product.price,
        categoryId: product.categoryId,
        imageUrl: product.imageUrl,
        stockQuantity: product.stockQuantity,
      },
      1
    );
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <div className="flex-shrink-0 w-[140px] bg-[#141414] border border-[#262626] rounded-xl p-2.5 flex flex-col justify-between hover:border-[#FFD700]/60 transition-all group">
      <Link href={`/products/${product.id}`} className="block">
        <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-neutral-900 mb-2 border border-neutral-800">
          <Image
            src={
              product.imageUrl ||
              'https://res.cloudinary.com/dhfbch1ya/image/upload/v1789278762/fittersweat/products/shoes_sample.jpg'
            }
            alt={product.name}
            fill
            sizes="140px"
            className="object-cover group-hover:scale-105 transition-transform duration-200"
          />
          {product.isSocialVerified && (
            <span className="absolute top-1 left-1 bg-[#FFD700] text-black text-[9px] font-black px-1.5 py-0.5 rounded shadow">
              완주검증
            </span>
          )}
        </div>
        <h4
          className="text-xs font-bold text-white line-clamp-1 group-hover:text-[#FFD700] transition-colors"
          title={product.name}
        >
          {product.name}
        </h4>
        <p className="text-xs font-black text-[#FFD700] mt-0.5">
          {Number(product.price).toLocaleString()}원
        </p>
      </Link>

      <button
        onClick={handleAddToCart}
        type="button"
        aria-label={`${product.name} 장바구니에 담기`}
        className={`mt-2 w-full min-h-[36px] py-1.5 px-2 rounded-lg text-[11px] font-bold flex items-center justify-center space-x-1 transition-all ${
          added
            ? 'bg-[#10B981] text-white'
            : 'bg-[#262626] text-white hover:bg-[#FFD700] hover:text-black'
        }`}
      >
        {added ? (
          <>
            <Check className="w-3.5 h-3.5" />
            <span>담김!</span>
          </>
        ) : (
          <>
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>+ 담기</span>
          </>
        )}
      </button>
    </div>
  );
}
