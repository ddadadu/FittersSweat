'use client';

import React, { useEffect, useRef, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useCartStore } from '@/stores/useCartStore';
import { fetchApi, ensureAuthToken } from '@/lib/api';
import {
  CheckCircle2,
  AlertCircle,
  ShoppingBag,
  PackageCheck,
  ShieldCheck,
  Calendar,
  CreditCard,
  Truck,
  ExternalLink,
} from 'lucide-react';

function SuccessContent() {
  const searchParams = useSearchParams();
  const paymentKey = searchParams.get('paymentKey');
  const orderId = searchParams.get('orderId');
  const amount = searchParams.get('amount');

  const [status, setStatus] = useState<'loading' | 'success' | 'already_paid' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [approvedDate, setApprovedDate] = useState<string>('');

  // Review Finding #3: Idempotent guard to prevent duplicate payment confirmation calls in React 18 Strict Mode
  const hasConfirmedRef = useRef(false);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!orderId || !paymentKey || !amount) {
      setStatus('error');
      setErrorMessage('결제 승인에 필요한 주문 파라미터가 누락되었습니다.');
      return;
    }

    if (hasConfirmedRef.current) return;
    hasConfirmedRef.current = true;

    async function confirmPayment() {
      // 1. Ensure auth token is available
      await ensureAuthToken();

      // 2. Call backend approval endpoint: POST /api/v1/orders/:orderId/payment
      try {
        await fetchApi(`/api/v1/orders/${orderId}/payment`, {
          method: 'POST',
          body: JSON.stringify({
            paymentKey,
            orderId,
            amount: Number(amount),
          }),
        });

        // Fix 5: Clear cart immediately upon successful payment response
        useCartStore.getState().clearCart();
        if (isMountedRef.current) {
          setApprovedDate(new Date().toLocaleString('ko-KR'));
          setStatus('success');
        }
      } catch (err: any) {
        const msg = err.message || '';
        // Fix 1: Only treat as already_paid if genuinely paid (exclude cancelled orders)
        const isAlreadyPaid =
          (msg.includes('paid') && !msg.includes('cancelled')) ||
          msg.includes('already paid') ||
          msg.includes('이미 결제') ||
          msg.includes('주문 상태입니다: paid');

        if (isAlreadyPaid) {
          useCartStore.getState().clearCart();
          if (isMountedRef.current) {
            setApprovedDate(new Date().toLocaleString('ko-KR'));
            setStatus('already_paid');
          }
        } else {
          if (isMountedRef.current) {
            setStatus('error');
            setErrorMessage(msg || '결제 승인 처리 중 오류가 발생했습니다.');
          }
        }
      }
    }

    confirmPayment();
  }, [orderId, paymentKey, amount]);

  if (status === 'loading') {
    return (
      <div className="max-w-xl mx-auto py-24 text-center space-y-6">
        <div className="w-16 h-16 border-4 border-[#FFD700] border-t-transparent rounded-full animate-spin mx-auto" />
        <div className="space-y-2">
          <h1 className="text-2xl font-black text-white tracking-tight">
            결제 승인을 진행하고 있습니다
          </h1>
          <p className="text-xs text-neutral-400">
            토스페이먼츠 및 HYROX 직매입 재고 시스템과 안전하게 통신 중입니다. 잠시만 기다려 주세요.
          </p>
        </div>
      </div>
    );
  }

  // Review Finding #7: Use AlertCircle instead of CheckCircle2 when status is error
  if (status === 'error') {
    return (
      <div className="max-w-xl mx-auto py-20 text-center space-y-6">
        <div className="w-20 h-20 mx-auto rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 shadow-xl">
          <AlertCircle className="w-10 h-10 text-rose-400" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-black text-white tracking-tight">
            결제 승인 처리 실패
          </h1>
          <p className="text-sm text-rose-300 max-w-md mx-auto">
            {errorMessage}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
          <Link
            href="/cart"
            className="w-full sm:w-auto min-h-[44px] px-6 py-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-xs transition-colors flex items-center justify-center"
          >
            장바구니로 이동
          </Link>
          <Link
            href="/checkout"
            className="w-full sm:w-auto min-h-[44px] px-6 py-3 rounded-xl bg-[#FFD700] hover:bg-yellow-400 text-black font-black text-xs transition-colors flex items-center justify-center"
          >
            다시 결제 시도
          </Link>
        </div>
      </div>
    );
  }

  // Success / Already Paid view
  return (
    <div className="max-w-2xl mx-auto py-12 space-y-8">
      {/* Top Banner */}
      <div className="text-center space-y-4">
        <div className="w-20 h-20 mx-auto rounded-full bg-[#141414] border-2 border-[#FFD700]/50 flex items-center justify-center text-[#FFD700] shadow-xl shadow-yellow-500/10">
          <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
        </div>
        <div className="space-y-1.5">
          <span className="text-[11px] font-black uppercase tracking-widest text-[#FFD700]">
            ORDER COMPLETE
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            결제가 안전하게 완료되었습니다!
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400 max-w-md mx-auto">
            주문하신 HYROX 직매입 레이스 장비의 결제 승인이 정상 완료되었습니다.
          </p>
        </div>
      </div>

      {/* Official Receipt Card */}
      <div className="rounded-2xl bg-[#141414] border border-[#262626] p-6 sm:p-8 space-y-6 shadow-xl">
        <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
          <div className="flex items-center space-x-2">
            <PackageCheck className="w-5 h-5 text-[#FFD700]" />
            <span className="text-sm font-black text-white">결제 영수증</span>
          </div>
          <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            승인 완료 (PAID)
          </span>
        </div>

        <div className="space-y-3.5 text-xs">
          <div className="flex justify-between py-1 border-b border-neutral-800/60">
            <span className="text-neutral-400">주문 번호</span>
            <span className="font-mono font-bold text-white text-right break-all max-w-[240px]">
              {orderId}
            </span>
          </div>
          <div className="flex justify-between py-1 border-b border-neutral-800/60">
            <span className="text-neutral-400">결제 승인 키 (Payment Key)</span>
            <span className="font-mono text-neutral-300 text-right truncate max-w-[240px]" title={paymentKey || ''}>
              {paymentKey}
            </span>
          </div>
          <div className="flex justify-between py-1 border-b border-neutral-800/60">
            <span className="text-neutral-400">결제 수단</span>
            <span className="font-semibold text-white flex items-center space-x-1">
              <CreditCard className="w-3.5 h-3.5 text-[#FFD700]" />
              <span>토스페이먼츠 안전 결제</span>
            </span>
          </div>
          <div className="flex justify-between py-1 border-b border-neutral-800/60">
            <span className="text-neutral-400">승인 일시</span>
            <span className="font-medium text-neutral-300 flex items-center space-x-1">
              <Calendar className="w-3.5 h-3.5 text-neutral-400" />
              <span>{approvedDate || new Date().toLocaleString('ko-KR')}</span>
            </span>
          </div>
          <div className="flex justify-between py-2 items-baseline">
            <span className="text-sm font-bold text-white">최종 결제 승인 금액</span>
            <div className="text-right">
              <span className="text-2xl font-black text-[#FFD700]">
                {Number(amount || 0).toLocaleString('ko-KR')}
              </span>
              <span className="text-xs font-normal text-neutral-400 ml-1">원</span>
            </div>
          </div>
        </div>

        {/* Shipping Logistics Guide */}
        <div className="p-4 rounded-xl bg-neutral-950/80 border border-neutral-800 flex items-start space-x-3 text-xs text-neutral-300">
          <Truck className="w-5 h-5 text-[#FFD700] shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold text-white">HYROX 공식 물류센터 직배송 안내</p>
            <p className="text-[11px] text-neutral-400 leading-relaxed">
              주문하신 상품은 당일 포장 검수 후 영업일 기준 1~2일 이내에 지정하신 배송지로 신속하고 안전하게 출고됩니다.
            </p>
          </div>
        </div>
      </div>

      {/* Action Buttons (min-h-[44px]) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          href="/mypage"
          className="min-h-[48px] rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-white font-bold text-xs transition-colors flex items-center justify-center space-x-2 active:scale-[0.99]"
        >
          <span>내 주문 내역 확인</span>
          <ExternalLink className="w-4 h-4" />
        </Link>
        <Link
          href="/products"
          className="min-h-[48px] rounded-xl bg-[#FFD700] hover:bg-yellow-400 text-black font-black text-xs transition-all shadow-lg shadow-yellow-500/15 flex items-center justify-center space-x-2 active:scale-[0.99]"
        >
          <ShoppingBag className="w-4 h-4 stroke-[2.5]" />
          <span>쇼핑 계속하기</span>
        </Link>
      </div>

      <div className="flex items-center justify-center space-x-2 text-xs text-neutral-500 pt-2">
        <ShieldCheck className="w-4 h-4 text-[#FFD700]" />
        <span>토스페이먼츠 구매안전(에스크로) 서비스가 적용된 주문입니다.</span>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-xl mx-auto py-24 text-center space-y-4 animate-pulse">
          <div className="w-16 h-16 bg-neutral-800 rounded-full mx-auto" />
          <div className="h-6 w-48 bg-neutral-800 rounded mx-auto" />
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}
