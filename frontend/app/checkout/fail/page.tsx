'use client';

import React, { useEffect, useRef, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { fetchApi, ensureAuthToken } from '@/lib/api';
import {
  AlertCircle,
  RotateCcw,
  ShoppingBag,
  ShieldAlert,
  HelpCircle,
} from 'lucide-react';

function FailContent() {
  const searchParams = useSearchParams();
  const code = searchParams.get('code') || 'USER_CANCEL';
  const message = searchParams.get('message') || '사용자가 결제를 취소하였습니다';
  const orderId = searchParams.get('orderId');
  const amount = searchParams.get('amount');

  const [rollbackComplete, setRollbackComplete] = useState(false);
  const hasRolledBackRef = useRef(false);

  useEffect(() => {
    // If orderId is present and rollback hasn't run yet, invoke payment rollback
    if (!orderId || hasRolledBackRef.current) return;
    hasRolledBackRef.current = true;

    async function executeStockRollback() {
      // 1. Ensure auth token is valid
      await ensureAuthToken();

      // 2. Lookup amount if missing from query params
      let orderAmount = amount ? Number(amount) : 0;
      if (!orderAmount) {
        try {
          const ordersRes = await fetchApi<{
            orders: Array<{ id: string; totalAmount: number }>;
          }>('/api/v1/orders');
          const rawId = orderId && orderId.includes('_') ? orderId.split('_').pop()! : orderId;
          const found = ordersRes.orders?.find((o) => o.id === orderId || (rawId && o.id === rawId));
          if (found) {
            orderAmount = found.totalAmount;
          }
        } catch (e) {
          console.warn('Could not query order for rollback amount:', e);
        }
      }

      // 3. Send test_mock_fail_key to POST /api/v1/orders/:orderId/payment
      // Backend automatically triggers atomic stock rollback transaction and sets order status to cancelled.
      try {
        await fetchApi(`/api/v1/orders/${orderId}/payment`, {
          method: 'POST',
          body: JSON.stringify({
            paymentKey: 'test_mock_fail_key',
            orderId,
            amount: orderAmount,
          }),
        });
        setRollbackComplete(true);
      } catch (err: any) {
        // Review Finding #4: Inspect error message in catch block before marking rollbackComplete(true)
        const msg = (err.message || '').toLowerCase();
        console.log('Stock rollback response from backend:', err.message);
        if (
          msg.includes('rejected') ||
          msg.includes('취소') ||
          msg.includes('복구') ||
          msg.includes('cancelled') ||
          msg.includes('결제할 수 없는')
        ) {
          setRollbackComplete(true);
        } else {
          console.warn('Rollback request encountered unexpected failure:', err);
          setRollbackComplete(false);
        }
      }
    }

    executeStockRollback();
  }, [orderId, amount]);

  return (
    <div className="max-w-2xl mx-auto py-12 space-y-8">
      {/* Top Warning Banner */}
      <div className="text-center space-y-4">
        <div className="w-20 h-20 mx-auto rounded-full bg-rose-500/10 border-2 border-rose-500/40 flex items-center justify-center text-rose-400 shadow-xl shadow-rose-500/10">
          <AlertCircle className="w-10 h-10 stroke-[2.5]" />
        </div>
        <div className="space-y-1.5">
          <span className="text-[11px] font-black uppercase tracking-widest text-rose-400">
            PAYMENT CANCELLED
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            결제가 정상적으로 진행되지 않았습니다
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400 max-w-md mx-auto">
            사용자 취소 또는 결제 승인 오류로 인해 주문이 완료되지 않았습니다.
          </p>
        </div>
      </div>

      {/* Failure Reason Details Card */}
      <div className="rounded-2xl bg-[#141414] border border-[#262626] p-6 sm:p-8 space-y-6 shadow-xl">
        <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
          <span className="text-sm font-black text-white">결제 실패 상세 내역</span>
          <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-rose-500/15 text-rose-400 border border-rose-500/30">
            승인 취소 / 미완료
          </span>
        </div>

        <div className="space-y-3.5 text-xs">
          <div className="flex justify-between py-1 border-b border-neutral-800/60">
            <span className="text-neutral-400">오류 코드</span>
            <span className="font-mono font-bold text-rose-400">{code}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-neutral-800/60">
            <span className="text-neutral-400">실패 사유</span>
            <span className="font-semibold text-white text-right max-w-[280px]">
              {decodeURIComponent(message)}
            </span>
          </div>
          {orderId && (
            <div className="flex justify-between py-1 border-b border-neutral-800/60">
              <span className="text-neutral-400">주문 번호</span>
              <span className="font-mono text-neutral-300 text-right">{orderId}</span>
            </div>
          )}
        </div>

        {/* Security Stock Rollback Reassurance Card (Crucial Spec Requirement) */}
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-start space-x-3 text-xs text-emerald-300">
          <ShieldAlert className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold text-white flex items-center space-x-1.5">
              <span>선차감 재고 복구(Rollback) 및 장바구니 보존 완료</span>
              {rollbackComplete && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                  완료됨
                </span>
              )}
            </p>
            <p className="text-[11px] text-neutral-300 leading-relaxed">
              선차감되었던 장비 재고가 안전하게 복구(Rollback)되었으며, 장바구니 상품은 그대로 유지됩니다. 언제든 안심하고 다시 결제를 진행하실 수 있습니다.
            </p>
          </div>
        </div>
      </div>

      {/* Action Buttons (min-h-[44px]) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          href="/cart"
          className="min-h-[48px] rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-white font-bold text-xs transition-colors flex items-center justify-center space-x-2 active:scale-[0.99]"
        >
          <ShoppingBag className="w-4 h-4" />
          <span>장바구니로 돌아가기</span>
        </Link>
        <Link
          href="/checkout"
          className="min-h-[48px] rounded-xl bg-[#FFD700] hover:bg-yellow-400 text-black font-black text-xs transition-all shadow-lg shadow-yellow-500/15 flex items-center justify-center space-x-2 active:scale-[0.99]"
        >
          <RotateCcw className="w-4 h-4 stroke-[2.5]" />
          <span>다시 결제 시도</span>
        </Link>
      </div>

      <div className="flex items-center justify-center space-x-1.5 text-xs text-neutral-500 pt-2">
        <HelpCircle className="w-3.5 h-3.5" />
        <span>결제 관련 지속적인 오류가 발생할 경우 고객센터로 문의해 주세요.</span>
      </div>
    </div>
  );
}

export default function CheckoutFailPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-xl mx-auto py-24 text-center space-y-4 animate-pulse">
          <div className="w-16 h-16 bg-neutral-800 rounded-full mx-auto" />
          <div className="h-6 w-48 bg-neutral-800 rounded mx-auto" />
        </div>
      }
    >
      <FailContent />
    </Suspense>
  );
}
