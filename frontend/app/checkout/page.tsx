'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { loadTossPayments, ANONYMOUS } from '@tosspayments/tosspayments-sdk';
import { useCartStore } from '@/stores/useCartStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { fetchApi, ensureAuthToken } from '@/lib/api';
import {
  ShoppingBag,
  ArrowRight,
  ShieldCheck,
  Package,
  AlertCircle,
  CreditCard,
  Truck,
  User,
  MapPin,
  ChevronLeft,
  Search,
  CheckCircle2,
} from 'lucide-react';
import { openDaumPostcodePopup, loadDaumPostcodeScript } from '@/lib/daumPostcode';
import { showToast } from '@/stores/useToastStore';

interface OrderFormState {
  ordererName: string;
  ordererPhone: string;
  ordererEmail: string;
  recipientName: string;
  recipientPhone: string;
  postcode: string;
  shippingAddress: string;
  shippingDetailAddress: string;
  deliveryRequest: string;
}

const TOSS_CLIENT_KEY =
  process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY || 'test_ck_D5GePWvyJnrK0W0k6q8gLzN97Eoq';

export default function CheckoutPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const { items, getTotalAmount } = useCartStore();
  const { user: storeUser, isAuthenticated } = useAuthStore();

  const [form, setForm] = useState<OrderFormState>({
    ordererName: '',
    ordererPhone: '',
    ordererEmail: '',
    recipientName: '',
    recipientPhone: '',
    postcode: '',
    shippingAddress: '',
    shippingDetailAddress: '',
    deliveryRequest: '',
  });

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [sameAsOrderer, setSameAsOrderer] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [agreedTerms, setAgreedTerms] = useState({
    all: false,
    orderTerms: false,
    privacyTerms: false,
  });
  const [termsError, setTermsError] = useState(false);

  const totalAmount = getTotalAmount();

  // Pre-fill basic orderer info if user is already logged in
  useEffect(() => {
    if (storeUser) {
      setForm((prev) => ({
        ...prev,
        ordererName: prev.ordererName || storeUser.name || '',
        ordererEmail: prev.ordererEmail || storeUser.email || '',
        ordererPhone: prev.ordererPhone || storeUser.phone || '',
      }));
    }
  }, [storeUser]);

  const handleFillFromMyInfo = async () => {
    let currentUser = storeUser;
    try {
      const res = await fetchApi<{ success: boolean; user: any }>('/api/v1/auth/me');
      if (res?.user) {
        currentUser = res.user;
      }
    } catch {
      // ignore network errors and fallback to storeUser
    }

    if (!currentUser) {
      showToast('로그인 후 이용 가능한 기능입니다.', 'warning');
      return;
    }

    setForm((prev) => {
      const next = { ...prev };
      if (currentUser.name) next.ordererName = currentUser.name;
      if (currentUser.phone) next.ordererPhone = currentUser.phone;
      if (currentUser.email) next.ordererEmail = currentUser.email;

      if (currentUser.address) {
        next.postcode = currentUser.postcode || '';
        next.shippingAddress = currentUser.address || '';
        next.shippingDetailAddress = currentUser.addressDetail || '';
        if (!next.recipientName) next.recipientName = currentUser.name || '';
        if (!next.recipientPhone) next.recipientPhone = currentUser.phone || '';
      }
      return next;
    });

    setFieldErrors((prev) => {
      const next = { ...prev };
      if (currentUser.name) delete next.ordererName;
      if (currentUser.phone) delete next.ordererPhone;
      if (currentUser.email) delete next.ordererEmail;
      if (currentUser.address) {
        delete next.postcode;
        delete next.shippingAddress;
        if (currentUser.name) delete next.recipientName;
        if (currentUser.phone) delete next.recipientPhone;
      }
      return next;
    });

    if (!currentUser.phone && !currentUser.address) {
      showToast('주문자 정보가 입력되었습니다. 마이페이지에서 연락처와 기본 배송지를 등록해 보세요.', 'info');
    } else if (!currentUser.address) {
      showToast('주문자 정보가 입력되었습니다. 배송지는 마이페이지에서 등록하거나 직접 입력할 수 있습니다.', 'info');
    } else {
      showToast('내 정보(주문자 및 기본 배송지)가 성공적으로 입력되었습니다.', 'success');
    }
  };

  // 1. Mount & Auth Guard: Ensure valid token exists; auto-refresh if expired; preload Daum Postcode script
  useEffect(() => {
    setMounted(true);
    ensureAuthToken().catch((err) =>
      console.warn('Auto auth validation notice:', err)
    );
    loadDaumPostcodeScript().catch(() => {});
  }, []);

  const handleAllTermsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setAgreedTerms({
      all: checked,
      orderTerms: checked,
      privacyTerms: checked,
    });
    if (checked) {
      setTermsError(false);
    }
  };

  const handleSingleTermChange =
    (key: 'orderTerms' | 'privacyTerms') =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const checked = e.target.checked;
      setAgreedTerms((prev) => {
        const next = { ...prev, [key]: checked };
        next.all = next.orderTerms && next.privacyTerms;
        return next;
      });
      setTermsError(false);
    };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => {
      const next = { ...prev, [name]: value };
      if (sameAsOrderer) {
        if (name === 'ordererName') next.recipientName = value;
        if (name === 'ordererPhone') next.recipientPhone = value;
      }
      return next;
    });

    if (fieldErrors[name]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const handleSameAsOrdererChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const checked = e.target.checked;
    setSameAsOrderer(checked);
    if (checked) {
      setForm((prev) => ({
        ...prev,
        recipientName: prev.ordererName,
        recipientPhone: prev.ordererPhone,
      }));
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next.recipientName;
        delete next.recipientPhone;
        return next;
      });
    }
  };

  const handleOpenPostcodeSearch = async () => {
    try {
      await openDaumPostcodePopup((result) => {
        setForm((prev) => ({
          ...prev,
          postcode: result.zonecode,
          shippingAddress: result.fullAddress,
        }));
        setFieldErrors((prev) => {
          const next = { ...prev };
          delete next.postcode;
          delete next.shippingAddress;
          return next;
        });
        setTimeout(() => {
          document.getElementById('shippingDetailAddress')?.focus();
        }, 100);
      });
    } catch (err) {
      console.warn('Failed to open Daum Postcode popup:', err);
    }
  };

  // Form Validation and Order Creation
  const validateAndCreateOrder = async (): Promise<string | null> => {
    const errors: Record<string, string> = {};
    const phoneRegex = /^01[016789]-?\d{3,4}-?\d{4}$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!form.ordererName.trim()) {
      errors.ordererName = '주문자 성명을 입력해 주세요.';
    }
    if (!form.ordererPhone.trim()) {
      errors.ordererPhone = '주문자 연락처를 입력해 주세요.';
    } else if (!phoneRegex.test(form.ordererPhone.trim())) {
      errors.ordererPhone = '올바른 휴대폰 번호를 입력해 주세요 (예: 010-1234-5678).';
    }
    if (!form.ordererEmail.trim()) {
      errors.ordererEmail = '주문자 이메일을 입력해 주세요.';
    } else if (!emailRegex.test(form.ordererEmail.trim())) {
      errors.ordererEmail = '올바른 이메일 형식을 입력해 주세요 (예: runner@example.com).';
    }

    if (!form.recipientName.trim()) {
      errors.recipientName = '수령인 성명을 입력해 주세요.';
    }
    if (!form.recipientPhone.trim()) {
      errors.recipientPhone = '수령인 연락처를 입력해 주세요.';
    } else if (!phoneRegex.test(form.recipientPhone.trim())) {
      errors.recipientPhone = '올바른 수령인 연락처를 입력해 주세요 (예: 010-1234-5678).';
    }

    if (!form.postcode.trim() || !form.shippingAddress.trim()) {
      errors.shippingAddress = '우편번호 검색을 통해 배송지 기본 주소를 입력해 주세요.';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      const firstKey = Object.keys(errors)[0];
      const firstMsg = errors[firstKey];
      setErrorMessage(firstMsg);

      if (typeof document !== 'undefined') {
        const el = document.getElementById(firstKey);
        if (el) {
          el.focus();
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }
      return null;
    }

    setFieldErrors({});

    // Ensure valid active JWT token exists via ensureAuthToken (auto-renews if expired)
    const token = await ensureAuthToken();
    if (!token) {
      setErrorMessage('주문을 진행하려면 로그인이 필요합니다.');
      useAuthStore.getState().setAuthModalOpen(true, 'login');
      if (typeof window !== 'undefined') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
      return null;
    }

    try {
      const orderPayload = {
        items: items.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
        })),
        recipientName: form.recipientName || form.ordererName,
        recipientPhone: form.recipientPhone || form.ordererPhone,
        postcode: form.postcode,
        address: form.shippingAddress,
        addressDetail: form.shippingDetailAddress,
      };

      const res = await fetchApi<{
        success: boolean;
        order: { id: string; totalAmount: number };
      }>('/api/v1/orders', {
        method: 'POST',
        body: JSON.stringify(orderPayload),
      });

      if (!res.success || !res.order) {
        throw new Error('주문 생성 응답이 올바르지 않습니다.');
      }

      return res.order.id;
    } catch (err: any) {
      const msg = err.message || '주문 생성 중 오류가 발생했습니다.';
      setErrorMessage(msg);
      if (typeof window !== 'undefined') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
      return null;
    }
  };

  // 1. Official Toss Payment Flow (Standard Payment Window)
  const handlePayment = async () => {
    setErrorMessage(null);
    setTermsError(false);

    // Validate terms agreement
    if (!agreedTerms.orderTerms || !agreedTerms.privacyTerms) {
      setTermsError(true);
      setErrorMessage('주문 및 결제 진행을 위해 필수 약관에 동의해 주세요.');
      if (typeof document !== 'undefined') {
        const el = document.getElementById('orderTerms');
        el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    setIsSubmitting(true);

    let orderId: string | null = null;
    try {
      orderId = await validateAndCreateOrder();
      if (!orderId) {
        setIsSubmitting(false);
        return;
      }

      const orderName =
        items.length === 1
          ? items[0].name
          : `${items[0].name} 외 ${items.length - 1}건`;

      const formattedOrderId = `FS_${String(orderId).padStart(6, '0')}`;

      const tossPayments = await loadTossPayments(TOSS_CLIENT_KEY);
      const payment = tossPayments.payment({ customerKey: ANONYMOUS });

      await payment.requestPayment({
        method: 'CARD',
        amount: {
          currency: 'KRW',
          value: totalAmount,
        },
        orderId: formattedOrderId,
        orderName,
        successUrl: `${window.location.origin}/checkout/success`,
        failUrl: `${window.location.origin}/checkout/fail?amount=${totalAmount}`,
        customerEmail: form.ordererEmail,
        customerName: form.ordererName,
      });
    } catch (err: any) {
      console.error('Payment request failed or cancelled:', err);
      // Review Finding #1: On requestPayment rejection/cancellation, route to fail page with orderId for stock rollback
      const code = err.code || 'USER_CANCEL';
      const msg =
        err.message || '사용자가 결제를 취소하였거나 결제 진행 중 오류가 발생했습니다.';
      if (orderId) {
        const rollbackOrderId = `FS_${String(orderId).padStart(6, '0')}`;
        router.push(
          `/checkout/fail?code=${encodeURIComponent(code)}&message=${encodeURIComponent(msg)}&orderId=${rollbackOrderId}&amount=${totalAmount}`
        );
      } else {
        setErrorMessage(msg);
        setIsSubmitting(false);
      }
    }
  };

  // Loading skeleton while mounting
  if (!mounted) {
    return (
      <div className="max-w-6xl mx-auto py-16 space-y-8 animate-pulse">
        <div className="h-8 w-64 bg-neutral-800 rounded-lg" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="h-48 bg-[#141414] border border-[#262626] rounded-2xl" />
            <div className="h-64 bg-[#141414] border border-[#262626] rounded-2xl" />
          </div>
          <div className="h-96 bg-[#141414] border border-[#262626] rounded-2xl" />
        </div>
      </div>
    );
  }

  // Empty cart guard
  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto py-20 text-center space-y-6">
        <div className="w-20 h-20 mx-auto rounded-full bg-[#141414] border border-[#262626] flex items-center justify-center text-neutral-500 shadow-xl">
          <ShoppingBag className="w-9 h-9 text-[#FFD700]/70" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            주문할 상품이 없습니다
          </h1>
          <p className="text-sm text-neutral-400 max-w-md mx-auto leading-relaxed">
            장바구니가 비어 있습니다. 먼저 HYROX 공식 직매입 장비를 장바구니에 담은 후
            결제를 진행해 주세요.
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
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      {/* Top Header & Breadcrumbs */}
      <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <Link
              href="/cart"
              className="inline-flex items-center text-xs font-semibold text-neutral-400 hover:text-white transition-colors py-1.5"
            >
              <ChevronLeft className="w-4 h-4 mr-0.5" />
              장바구니로 돌아가기
            </Link>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black italic text-white tracking-tight">
            주문서 작성 및 결제
          </h1>
        </div>
      </div>

      {/* Error Banner Modal / Alert (Review Finding #8: min 44x44px touch target on dismiss) */}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-between space-x-3 text-rose-300 animate-fadeIn">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div className="text-sm">
              <span className="font-bold">결제 오류 안내: </span>
              <span>{errorMessage}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            aria-label="오류 안내 닫기"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center text-xs text-rose-400 hover:text-rose-200 font-bold px-3 py-2 rounded-lg hover:bg-rose-500/10 transition-colors shrink-0"
          >
            닫기
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left 2 Columns: Forms and Toss Widget */}
        <div className="lg:col-span-2 space-y-6">
          {/* 1. 주문자 정보 (Review Finding #6: id, htmlFor, aria-label) */}
          <div className="p-6 rounded-2xl bg-[#141414] border border-[#262626] space-y-4 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <div className="flex items-center space-x-2">
                <User className="w-4 h-4 text-[#FFD700]" />
                <h2 className="text-base font-black text-white">주문자 정보</h2>
              </div>
              <button
                type="button"
                onClick={handleFillFromMyInfo}
                className="inline-flex items-center px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-[#FFD700] text-neutral-300 hover:text-black border border-neutral-700 hover:border-[#FFD700] text-xs font-bold transition-all shadow-sm active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFD700]"
                title="내 프로필 정보(이름, 연락처, 기본 배송지)를 주문서에 자동 입력합니다."
              >
                내 정보와 동일
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label htmlFor="ordererName" className="text-xs font-semibold text-neutral-400 mb-1.5 block">
                  주문자명 <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  id="ordererName"
                  name="ordererName"
                  aria-label="주문자명"
                  value={form.ordererName}
                  onChange={handleInputChange}
                  placeholder="성명 입력 (예: 홍길동)"
                  className={`w-full bg-neutral-900 border rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none transition-colors ${
                    fieldErrors.ordererName
                      ? 'border-rose-500 focus:border-rose-500 ring-1 ring-rose-500'
                      : 'border-neutral-700 focus:border-[#FFD700]'
                  }`}
                />
                {fieldErrors.ordererName && (
                  <p className="text-xs text-rose-400 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    <span>{fieldErrors.ordererName}</span>
                  </p>
                )}
              </div>
              <div>
                <label htmlFor="ordererPhone" className="text-xs font-semibold text-neutral-400 mb-1.5 block">
                  연락처 <span className="text-rose-400">*</span>
                </label>
                <input
                  type="tel"
                  id="ordererPhone"
                  name="ordererPhone"
                  aria-label="주문자 연락처"
                  value={form.ordererPhone}
                  onChange={handleInputChange}
                  placeholder="연락처 입력 (예: 010-1234-5678)"
                  className={`w-full bg-neutral-900 border rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none transition-colors ${
                    fieldErrors.ordererPhone
                      ? 'border-rose-500 focus:border-rose-500 ring-1 ring-rose-500'
                      : 'border-neutral-700 focus:border-[#FFD700]'
                  }`}
                />
                {fieldErrors.ordererPhone && (
                  <p className="text-xs text-rose-400 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    <span>{fieldErrors.ordererPhone}</span>
                  </p>
                )}
              </div>
              <div>
                <label htmlFor="ordererEmail" className="text-xs font-semibold text-neutral-400 mb-1.5 block">
                  이메일 <span className="text-rose-400">*</span>
                </label>
                <input
                  type="email"
                  id="ordererEmail"
                  name="ordererEmail"
                  aria-label="주문자 이메일"
                  value={form.ordererEmail}
                  onChange={handleInputChange}
                  placeholder="이메일 입력 (예: runner@example.com)"
                  className={`w-full bg-neutral-900 border rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none transition-colors ${
                    fieldErrors.ordererEmail
                      ? 'border-rose-500 focus:border-rose-500 ring-1 ring-rose-500'
                      : 'border-neutral-700 focus:border-[#FFD700]'
                  }`}
                />
                {fieldErrors.ordererEmail && (
                  <p className="text-xs text-rose-400 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    <span>{fieldErrors.ordererEmail}</span>
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* 2. 배송지 정보 */}
          <div className="p-6 rounded-2xl bg-[#141414] border border-[#262626] space-y-4 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <div className="flex items-center space-x-2">
                <Truck className="w-4 h-4 text-[#FFD700]" />
                <h2 className="text-base font-black text-white">배송지 정보</h2>
              </div>
              <label htmlFor="sameAsOrderer" className="inline-flex items-center space-x-2 text-xs font-semibold text-neutral-300 cursor-pointer hover:text-white transition-colors">
                <input
                  type="checkbox"
                  id="sameAsOrderer"
                  checked={sameAsOrderer}
                  onChange={handleSameAsOrdererChange}
                  className="w-4 h-4 rounded border-neutral-700 bg-neutral-900 text-[#FFD700] focus:ring-[#FFD700] accent-[#FFD700]"
                />
                <span>주문자 정보와 동일</span>
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="recipientName" className="text-xs font-semibold text-neutral-400 mb-1.5 block">
                  수령인 <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  id="recipientName"
                  name="recipientName"
                  aria-label="수령인 이름"
                  value={form.recipientName}
                  onChange={handleInputChange}
                  placeholder="수령인 성명 입력"
                  className={`w-full bg-neutral-900 border rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none transition-colors ${
                    fieldErrors.recipientName
                      ? 'border-rose-500 focus:border-rose-500 ring-1 ring-rose-500'
                      : 'border-neutral-700 focus:border-[#FFD700]'
                  }`}
                />
                {fieldErrors.recipientName && (
                  <p className="text-xs text-rose-400 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    <span>{fieldErrors.recipientName}</span>
                  </p>
                )}
              </div>
              <div>
                <label htmlFor="recipientPhone" className="text-xs font-semibold text-neutral-400 mb-1.5 block">
                  수령인 연락처 <span className="text-rose-400">*</span>
                </label>
                <input
                  type="tel"
                  id="recipientPhone"
                  name="recipientPhone"
                  aria-label="수령인 연락처"
                  value={form.recipientPhone}
                  onChange={handleInputChange}
                  placeholder="수령인 연락처 입력 (예: 010-1234-5678)"
                  className={`w-full bg-neutral-900 border rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none transition-colors ${
                    fieldErrors.recipientPhone
                      ? 'border-rose-500 focus:border-rose-500 ring-1 ring-rose-500'
                      : 'border-neutral-700 focus:border-[#FFD700]'
                  }`}
                />
                {fieldErrors.recipientPhone && (
                  <p className="text-xs text-rose-400 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    <span>{fieldErrors.recipientPhone}</span>
                  </p>
                )}
              </div>
            </div>

            {/* 우편번호 및 기본 주소 */}
            <div className="space-y-3">
              <div>
                <label htmlFor="postcode" className="text-xs font-semibold text-neutral-400 mb-1.5 block">
                  우편번호 및 기본 주소 <span className="text-rose-400">*</span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    id="postcode"
                    name="postcode"
                    aria-label="우편번호"
                    readOnly
                    value={form.postcode}
                    placeholder="우편번호 (5자리)"
                    className="w-36 bg-neutral-900 border border-neutral-700 rounded-xl px-4 py-2.5 text-sm text-white font-mono placeholder:text-neutral-500 focus:outline-none focus:border-[#FFD700]"
                  />
                  <button
                    type="button"
                    onClick={handleOpenPostcodeSearch}
                    className="min-h-[44px] px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 hover:border-[#FFD700] text-xs font-bold text-white transition-all flex items-center gap-1.5 shrink-0 active:scale-[0.98]"
                  >
                    <Search className="w-4 h-4 text-[#FFD700]" />
                    <span>우편번호 검색</span>
                  </button>
                </div>
              </div>

              <div>
                <div className="relative">
                  <input
                    type="text"
                    id="shippingAddress"
                    name="shippingAddress"
                    aria-label="배송지 기본 주소"
                    readOnly
                    onClick={handleOpenPostcodeSearch}
                    value={form.shippingAddress}
                    placeholder="우편번호 검색 버튼을 눌러 주소를 검색하세요"
                    className={`w-full bg-neutral-900 border rounded-xl px-4 py-2.5 pr-10 text-sm text-white cursor-pointer placeholder:text-neutral-500 focus:outline-none transition-colors ${
                      fieldErrors.shippingAddress
                        ? 'border-rose-500 focus:border-rose-500 ring-1 ring-rose-500'
                        : 'border-neutral-700 focus:border-[#FFD700]'
                    }`}
                  />
                  <MapPin className="w-4 h-4 text-neutral-500 absolute right-3.5 top-3.5 pointer-events-none" />
                </div>
                {fieldErrors.shippingAddress && (
                  <p className="text-xs text-rose-400 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    <span>{fieldErrors.shippingAddress}</span>
                  </p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="shippingDetailAddress" className="text-xs font-semibold text-neutral-400 mb-1.5 block">
                상세 주소
              </label>
              <input
                type="text"
                id="shippingDetailAddress"
                name="shippingDetailAddress"
                aria-label="상세 주소"
                value={form.shippingDetailAddress}
                onChange={handleInputChange}
                placeholder="상세 주소 입력 (동/호수, 층수 등)"
                className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#FFD700] transition-colors"
              />
            </div>

            <div>
              <label htmlFor="deliveryRequest" className="text-xs font-semibold text-neutral-400 mb-1.5 block">
                배송 요청사항
              </label>
              <input
                type="text"
                id="deliveryRequest"
                name="deliveryRequest"
                aria-label="배송 요청사항"
                value={form.deliveryRequest}
                onChange={handleInputChange}
                placeholder="배송 요청사항 입력 (예: 부재 시 문 앞에 놓아주세요)"
                className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#FFD700] transition-colors"
              />
            </div>
          </div>

          {/* 3. 결제 수단 */}
          <div className="p-6 rounded-2xl bg-[#141414] border border-[#262626] space-y-4 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <div className="flex items-center space-x-2">
                <CreditCard className="w-4 h-4 text-[#FFD700]" />
                <h2 className="text-base font-black text-white">결제 수단</h2>
              </div>
              <span className="text-xs text-neutral-400 font-medium">토스페이먼츠 표준 결제</span>
            </div>

            {/* Selected Single Payment Card */}
            <div className="rounded-xl border-2 border-[#FFD700] bg-[#1a1a1a] p-4.5 sm:p-5 space-y-3 relative shadow-md shadow-[#FFD700]/5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center space-x-3">
                  <CheckCircle2 className="w-5 h-5 text-[#FFD700] shrink-0" />
                  <div className="inline-flex items-center bg-white px-2.5 py-1 rounded-md shadow-sm shrink-0">
                    <Image
                      src="/images/toss-payments.png"
                      alt="Toss Payments"
                      width={100}
                      height={24}
                      className="h-6 w-auto object-contain"
                    />
                  </div>
                  <span className="text-sm sm:text-base font-bold text-white">
                    신용·체크카드 및 간편결제
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-1.5 pl-8 sm:pl-0">
                  <span className="px-2 py-0.5 rounded bg-neutral-800 border border-neutral-700 text-neutral-300 text-[11px] font-medium">
                    국내외 모든 카드
                  </span>
                  <span className="px-2 py-0.5 rounded bg-neutral-800 border border-neutral-700 text-neutral-300 text-[11px] font-medium">
                    토스페이
                  </span>
                  <span className="px-2 py-0.5 rounded bg-neutral-800 border border-neutral-700 text-neutral-300 text-[11px] font-medium">
                    카카오페이
                  </span>
                  <span className="px-2 py-0.5 rounded bg-neutral-800 border border-neutral-700 text-neutral-300 text-[11px] font-medium">
                    네이버페이
                  </span>
                </div>
              </div>
              <p className="text-xs text-neutral-400 pl-8 leading-relaxed">
                토스페이먼츠 보안 결제창을 통해 카드사 앱카드 및 간편결제로 안전하게 결제됩니다.
              </p>
            </div>
          </div>

          {/* 4. 주문 동의 */}
          <div
            className={`p-6 rounded-2xl bg-[#141414] border space-y-4 shadow-sm transition-colors ${
              termsError
                ? 'border-rose-500/80 ring-1 ring-rose-500/50'
                : 'border-[#262626]'
            }`}
          >
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-[#FFD700]" />
                <h2 className="text-base font-black text-white">주문 동의</h2>
              </div>
              {termsError && (
                <span className="text-xs text-rose-400 font-bold flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  필수 약관에 동의해 주세요
                </span>
              )}
            </div>

            {/* All terms toggle */}
            <label
              htmlFor="allTerms"
              className="flex items-center space-x-3 p-3 rounded-xl bg-neutral-900/90 border border-neutral-800 cursor-pointer hover:border-neutral-700 transition-colors min-h-[44px]"
            >
              <input
                type="checkbox"
                id="allTerms"
                checked={agreedTerms.all}
                onChange={handleAllTermsChange}
                className="w-4 h-4 rounded border-neutral-700 bg-neutral-950 text-[#FFD700] focus:ring-[#FFD700] accent-[#FFD700]"
              />
              <span className="text-sm font-bold text-white">
                아래 결제 및 개인정보 제공 내용에 모두 동의합니다. (전체 동의)
              </span>
            </label>

            {/* Individual required items */}
            <div className="space-y-2.5 pt-1 pl-1">
              <label
                htmlFor="orderTerms"
                className="flex items-center space-x-3 text-xs text-neutral-300 cursor-pointer hover:text-white transition-colors min-h-[44px]"
              >
                <input
                  type="checkbox"
                  id="orderTerms"
                  checked={agreedTerms.orderTerms}
                  onChange={handleSingleTermChange('orderTerms')}
                  className="w-4 h-4 rounded border-neutral-700 bg-neutral-950 text-[#FFD700] focus:ring-[#FFD700] accent-[#FFD700] shrink-0"
                />
                <span>
                  <span className="text-[#FFD700] font-bold mr-1">[필수]</span>
                  주문 상품 정보 및 서비스 이용약관 동의
                </span>
              </label>

              <label
                htmlFor="privacyTerms"
                className="flex items-center space-x-3 text-xs text-neutral-300 cursor-pointer hover:text-white transition-colors min-h-[44px]"
              >
                <input
                  type="checkbox"
                  id="privacyTerms"
                  checked={agreedTerms.privacyTerms}
                  onChange={handleSingleTermChange('privacyTerms')}
                  className="w-4 h-4 rounded border-neutral-700 bg-neutral-950 text-[#FFD700] focus:ring-[#FFD700] accent-[#FFD700] shrink-0"
                />
                <span>
                  <span className="text-[#FFD700] font-bold mr-1">[필수]</span>
                  전자금융거래 기본약관 및 개인정보 제3자 제공 동의 (토스페이먼츠)
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Right Column: Sticky Order Summary Card */}
        <div className="rounded-2xl bg-[#141414] border border-[#262626] p-6 space-y-6 sticky top-24 shadow-xl">
          <h2 className="text-base font-black text-white pb-3 border-b border-neutral-800">
            주문 요약 ({items.length}개)
          </h2>

          {/* Item List */}
          <div className="max-h-60 overflow-y-auto space-y-3 pr-1 divide-y divide-neutral-800/60">
            {items.map((item) => (
              <div
                key={item.productId}
                className="pt-3 first:pt-0 flex items-center justify-between space-x-3 text-xs"
              >
                <div className="flex items-center space-x-3 min-w-0 flex-1">
                  <div className="w-12 h-12 rounded-lg aspect-square overflow-hidden bg-neutral-950 border border-neutral-800 shrink-0 relative">
                    {item.imageUrl ? (
                      <Image
                        src={item.imageUrl}
                        alt={item.name}
                        fill
                        sizes="48px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-neutral-600">
                        <Package className="w-5 h-5 text-[#FFD700]/50" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-white truncate">{item.name}</p>
                    <p className="text-neutral-400 text-[11px]">수량: {item.quantity}개</p>
                  </div>
                </div>
                <div className="text-right shrink-0 font-bold text-neutral-200">
                  {(item.price * item.quantity).toLocaleString('ko-KR')}원
                </div>
              </div>
            ))}
          </div>

          {/* Amount Calculation */}
          <div className="space-y-3 pt-3 border-t border-neutral-800 text-xs">
            <div className="flex justify-between text-neutral-400">
              <span>총 상품 금액</span>
              <span className="font-bold text-neutral-200">
                {totalAmount.toLocaleString('ko-KR')}원
              </span>
            </div>
            <div className="flex justify-between text-neutral-400">
              <span>배송비</span>
              <span className="font-bold text-emerald-400">0원 (무료 배송)</span>
            </div>
            <div className="pt-3 border-t border-neutral-800 flex justify-between items-baseline">
              <span className="text-sm font-bold text-white">총 결제 금액</span>
              <div className="text-right">
                <span className="text-2xl font-black text-[#FFD700]">
                  {totalAmount.toLocaleString('ko-KR')}
                </span>
                <span className="text-xs font-normal text-neutral-400 ml-1">원</span>
              </div>
            </div>
          </div>

          {/* Official CTA Button (min-h-[56px]) */}
          <button
            type="button"
            onClick={handlePayment}
            disabled={isSubmitting}
            className="w-full min-h-[56px] py-4 rounded-xl bg-[#FFD700] hover:bg-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed text-black font-black text-base transition-all shadow-lg shadow-yellow-500/15 flex items-center justify-center space-x-2 active:scale-[0.99]"
          >
            {isSubmitting ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                <span>주문 결제 진행 중...</span>
              </div>
            ) : (
              <>
                <span>{totalAmount.toLocaleString('ko-KR')}원 토스페이로 결제하기</span>
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
