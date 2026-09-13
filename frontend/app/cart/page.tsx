'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/stores/useCartStore';
import { Trash2, ArrowRight, ShoppingBag, ShieldCheck } from 'lucide-react';

export default function CartPage() {
  const router = useRouter();
  const { items, updateQuantity, removeItem, clearCart, getTotalAmount } = useCartStore();

  const totalAmount = getTotalAmount();

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center space-y-6">
        <div className="w-16 h-16 mx-auto rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-500">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-white">장바구니가 비어 있습니다</h1>
          <p className="text-sm text-neutral-400">
            HYROX 레이스에서 기록을 단축해줄 필수 장비를 둘러보세요.
          </p>
        </div>
        <Link
          href="/products"
          className="inline-flex items-center space-x-2 px-6 py-3 rounded-xl bg-[#FFD700] text-black font-extrabold text-xs hover:bg-yellow-400 transition-colors"
        >
          <span>장비 둘러보기</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
        <h1 className="text-2xl font-black italic text-white tracking-tight">
          장바구니 ({items.length}개)
        </h1>
        <button
          onClick={clearCart}
          className="text-xs text-neutral-400 hover:text-rose-400 transition-colors"
        >
          장바구니 전체 비우기
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Item List */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <div
              key={item.productId}
              className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-between gap-4"
            >
              <div className="space-y-1 flex-1">
                <span className="text-[10px] font-bold uppercase text-[#FFD700]">
                  {item.categoryId}
                </span>
                <h3 className="font-bold text-sm text-white">{item.name}</h3>
                <div className="text-xs font-semibold text-neutral-400">
                  개당 {item.price.toLocaleString('ko-KR')}원
                </div>
              </div>

              {/* Quantity Controls */}
              <div className="flex items-center space-x-3">
                <div className="flex items-center border border-neutral-700 rounded-lg bg-neutral-950">
                  <button
                    onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                    className="px-2.5 py-1 text-xs font-bold text-neutral-400 hover:text-white"
                  >
                    -
                  </button>
                  <span className="px-2.5 text-xs font-bold text-white">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                    className="px-2.5 py-1 text-xs font-bold text-neutral-400 hover:text-white"
                  >
                    +
                  </button>
                </div>

                <div className="text-right min-w-[80px]">
                  <div className="text-sm font-bold text-white">
                    {(item.price * item.quantity).toLocaleString('ko-KR')}원
                  </div>
                </div>

                <button
                  onClick={() => removeItem(item.productId)}
                  className="p-1.5 text-neutral-500 hover:text-rose-400 transition-colors"
                  title="삭제"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Order Summary */}
        <div className="rounded-2xl bg-neutral-900 border border-neutral-800 p-6 space-y-6 h-fit">
          <h2 className="text-base font-bold text-white pb-3 border-b border-neutral-800">
            주문 요약
          </h2>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between text-neutral-400">
              <span>상품 금액</span>
              <span className="font-semibold text-neutral-200">
                {totalAmount.toLocaleString('ko-KR')}원
              </span>
            </div>
            <div className="flex justify-between text-neutral-400">
              <span>배송비</span>
              <span className="font-semibold text-green-400">무료 (HYROX 특별 혜택)</span>
            </div>
            <div className="pt-3 border-t border-neutral-800 flex justify-between text-sm font-bold text-white">
              <span>최종 결제 예정 금액</span>
              <span className="text-lg font-black text-[#FFD700]">
                {totalAmount.toLocaleString('ko-KR')}원
              </span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 flex items-center space-x-2 text-[11px] text-neutral-400">
            <ShieldCheck className="w-4 h-4 text-[#FFD700] flex-shrink-0" />
            <span>토스페이먼츠 100% 안전 에스크로 결제</span>
          </div>

          <button
            onClick={() => router.push('/checkout')}
            className="w-full py-3.5 rounded-xl bg-[#FFD700] hover:bg-yellow-400 text-black font-extrabold text-xs transition-colors shadow-lg shadow-yellow-500/10 flex items-center justify-center space-x-1.5"
          >
            <span>주문서 작성 및 결제</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
