'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useCartStore } from '@/stores/useCartStore';
import {
  Trash2,
  ArrowRight,
  ShoppingBag,
  ShieldCheck,
  Sparkles,
  Package,
  RotateCcw,
} from 'lucide-react';

export default function CartPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const { items, updateQuantity, removeItem, clearCart, getTotalAmount } = useCartStore();

  useEffect(() => {
    setMounted(true);
  }, []);

  const totalAmount = getTotalAmount();

  if (!mounted) {
    return (
      <div className="max-w-4xl mx-auto py-16 space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-neutral-800 rounded" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {[1, 2].map((n) => (
              <div key={n} className="h-28 bg-[#141414] border border-[#262626] rounded-2xl" />
            ))}
          </div>
          <div className="h-64 bg-[#141414] border border-[#262626] rounded-2xl" />
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto py-20 text-center space-y-6">
        <div className="w-20 h-20 mx-auto rounded-full bg-[#141414] border border-[#262626] flex items-center justify-center text-neutral-500 shadow-xl">
          <ShoppingBag className="w-9 h-9 text-[#FFD700]/70" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            장바구니가 비어 있습니다
          </h1>
          <p className="text-sm text-neutral-400 max-w-md mx-auto leading-relaxed">
            HYROX 레이스에서 기록을 단축해줄 검증된 레이싱화, 뉴트리션, 스테이션 장비를 둘러보세요.
          </p>
        </div>
        <div>
          <Link
            href="/products"
            className="inline-flex items-center space-x-2 px-6 py-3.5 rounded-xl bg-[#FFD700] hover:bg-yellow-400 text-black font-black text-xs transition-colors shadow-lg shadow-yellow-500/10 min-h-[44px]"
          >
            <span>장비 둘러보기</span>
            <ArrowRight className="w-4 h-4 stroke-[2.5]" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black italic text-white tracking-tight">
            장바구니 ({items.length}개 품목)
          </h1>
          <p className="text-xs text-neutral-400 mt-1">
            주문서 작성 전 담은 장비의 수량을 확인해 주세요.
          </p>
        </div>
        <button
          onClick={clearCart}
          className="text-xs font-semibold text-neutral-400 hover:text-rose-400 transition-colors px-3 py-2 rounded-lg hover:bg-rose-500/10 min-h-[44px] flex items-center space-x-1"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>전체 비우기</span>
        </button>
      </div>

      {/* Free Shipping 100% Achieved Promotion Bar */}
      <div className="p-4 rounded-2xl bg-[#141414] border border-[#262626] space-y-2.5 shadow-md">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2 text-[#FFD700] font-bold">
            <Sparkles className="w-4 h-4" />
            <span>무료배송 100% 달성!</span>
          </div>
          <span className="text-neutral-300 font-semibold">전 품목 배송비 0원 적용</span>
        </div>
        <div className="w-full bg-neutral-800/80 h-2.5 rounded-full overflow-hidden">
          <div className="bg-gradient-to-r from-yellow-500 via-[#FFD700] to-yellow-300 h-full w-full rounded-full transition-all duration-500 shadow-sm" />
        </div>
        <p className="text-[11px] text-neutral-400">
          🎉 FITTERSWEAT 단독 혜택: HYROX 레이서 전 품목 무료 직배송 프로모션이 적용되었습니다.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Animated Cart Items List */}
        <div className="lg:col-span-2 space-y-4">
          <AnimatePresence mode="popLayout">
            {items.map((item) => (
              <motion.div
                key={item.productId}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{
                  layout: { duration: 0.25, ease: 'easeOut' },
                  opacity: { duration: 0.2 },
                }}
                className="p-4 sm:p-5 rounded-2xl bg-[#141414] border border-[#262626] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group hover:border-neutral-700 transition-colors shadow-sm"
              >
                {/* Left: 1:1 Thumbnail (64x64px) & Info */}
                <div className="flex items-center space-x-4 flex-1 min-w-0">
                  {/* 1:1 64x64px Thumbnail */}
                  <div className="w-16 h-16 rounded-xl aspect-square overflow-hidden bg-neutral-950 border border-neutral-800 shrink-0 relative shadow-inner">
                    {item.imageUrl ? (
                      <Image
                        src={item.imageUrl}
                        alt={item.name}
                        fill
                        sizes="64px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-neutral-600 bg-neutral-900">
                        <Package className="w-6 h-6 stroke-1 text-[#FFD700]/50" />
                      </div>
                    )}
                  </div>

                  {/* Title & Unit Price */}
                  <div className="space-y-1 min-w-0 flex-1">
                    <span className="text-[10px] font-black uppercase tracking-wider text-[#FFD700]">
                      {item.categoryId.toUpperCase()}
                    </span>
                    <Link
                      href={`/products/${item.productId}`}
                      className="block font-bold text-sm text-white hover:text-[#FFD700] transition-colors truncate"
                    >
                      {item.name}
                    </Link>
                    <div className="text-xs text-neutral-400 font-medium">
                      개당 {item.price.toLocaleString('ko-KR')}원
                    </div>
                  </div>
                </div>

                {/* Right: Quantity Controls, Subtotal & Remove Action */}
                <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto space-x-3 pt-3 sm:pt-0 border-t sm:border-t-0 border-neutral-800">
                  {/* Quantity Controller (min 44x44px touch target) */}
                  <div className="flex items-center border border-neutral-700 rounded-xl bg-neutral-900 overflow-hidden shrink-0">
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                      disabled={item.quantity <= 1}
                      aria-label={`${item.name} 수량 1 감소`}
                      className="min-w-[44px] min-h-[44px] flex items-center justify-center text-sm font-bold text-neutral-300 hover:text-white hover:bg-neutral-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      -
                    </button>
                    <span className="min-w-[36px] text-center text-xs font-black text-white">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                      aria-label={`${item.name} 수량 1 증가`}
                      className="min-w-[44px] min-h-[44px] flex items-center justify-center text-sm font-bold text-neutral-300 hover:text-white hover:bg-neutral-800 transition-colors"
                    >
                      +
                    </button>
                  </div>

                  {/* Subtotal */}
                  <div className="text-right min-w-[90px] shrink-0">
                    <div className="text-sm font-black text-white">
                      {(item.price * item.quantity).toLocaleString('ko-KR')}
                      <span className="text-xs font-normal text-neutral-400 ml-0.5">원</span>
                    </div>
                  </div>

                  {/* Remove Button (min 44x44px touch target) */}
                  <button
                    type="button"
                    onClick={() => removeItem(item.productId)}
                    aria-label={`${item.name} 장바구니에서 삭제`}
                    className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-neutral-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors shrink-0"
                    title="삭제"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Right Column: Order Summary Card */}
        <div className="rounded-2xl bg-[#141414] border border-[#262626] p-6 space-y-6 sticky top-24 shadow-xl">
          <h2 className="text-base font-black text-white pb-3 border-b border-neutral-800">
            주문 금액 요약
          </h2>

          <div className="space-y-3.5 text-xs">
            <div className="flex justify-between text-neutral-400">
              <span>총 상품 금액</span>
              <span className="font-bold text-neutral-200">
                {totalAmount.toLocaleString('ko-KR')}원
              </span>
            </div>
            <div className="flex justify-between text-neutral-400">
              <span>배송비</span>
              <span className="font-bold text-green-400">0원 (무료 배송 프로모션)</span>
            </div>
            <div className="pt-3.5 border-t border-neutral-800 flex justify-between items-baseline">
              <span className="text-sm font-bold text-white">최종 결제 금액</span>
              <div className="text-right">
                <span className="text-2xl font-black text-[#FFD700]">
                  {totalAmount.toLocaleString('ko-KR')}
                </span>
                <span className="text-sm font-normal text-neutral-400 ml-1">원</span>
              </div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 flex items-center space-x-2 text-[11px] text-neutral-400">
            <ShieldCheck className="w-4 h-4 text-[#FFD700] shrink-0" />
            <span>토스페이먼츠 100% 안전 에스크로 결제 보증</span>
          </div>

          {/* Full-width 52px CTA Button */}
          <button
            type="button"
            onClick={() => router.push('/checkout')}
            className="w-full min-h-[52px] rounded-xl bg-[#FFD700] hover:bg-yellow-400 text-black font-black text-sm transition-all shadow-lg shadow-yellow-500/15 flex items-center justify-center space-x-2 active:scale-[0.99]"
          >
            <span>주문서 작성 및 결제</span>
            <ArrowRight className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>
      </div>
    </div>
  );
}
