'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import { fetchApi } from '@/lib/api';
import { showToast } from '@/stores/useToastStore';
import { openDaumPostcodePopup } from '@/lib/daumPostcode';
import {
  ChevronLeft,
  Package,
  MapPin,
  Phone,
  User,
  Pencil,
  Check,
  X,
  Search,
  Clock,
  AlertCircle,
} from 'lucide-react';

const STATUS_BADGE: Record<string, { label: string; classes: string }> = {
  pending: {
    label: '결제 대기',
    classes: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
  },
  paid: {
    label: '결제 완료',
    classes: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  },
  shipped: {
    label: '배송 중',
    classes: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  },
  delivered: {
    label: '배송 완료',
    classes: 'bg-green-500/10 text-green-400 border-green-500/30',
  },
  cancelled: {
    label: '취소됨',
    classes: 'bg-red-500/10 text-red-400 border-red-500/30',
  },
};

interface OrderDetail {
  id: string;
  status: string;
  totalAmount: number;
  paymentKey: string | null;
  paidAt: string | null;
  createdAt: string;
  recipientName: string | null;
  recipientPhone: string | null;
  postcode: string | null;
  address: string | null;
  addressDetail: string | null;
  orderItems: Array<{
    id: string;
    quantity: number;
    unitPrice: number;
    product: {
      id: string;
      name: string;
      imageUrl: string | null;
      price: number;
    };
  }>;
}

export default function OrderDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [shippingForm, setShippingForm] = useState({
    recipientName: '',
    recipientPhone: '',
    postcode: '',
    address: '',
    addressDetail: '',
  });
  const [saving, setSaving] = useState(false);
  const [imgErrors, setImgErrors] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!id) return;
    fetchApi<{ success: boolean; order: OrderDetail }>(`/api/v1/orders/${id}`)
      .then((res) => {
        if (res?.success && res.order) {
          setOrder(res.order);
          setShippingForm({
            recipientName: res.order.recipientName || '',
            recipientPhone: res.order.recipientPhone || '',
            postcode: res.order.postcode || '',
            address: res.order.address || '',
            addressDetail: res.order.addressDetail || '',
          });
        }
      })
      .catch((err: any) => {
        showToast(err?.message || '주문 정보를 불러오는데 실패했습니다.', 'error');
      })
      .finally(() => setLoading(false));
  }, [id]);

  const canEditShipping = order && (order.status === 'pending' || order.status === 'paid');

  const handleOpenAddressSearch = async () => {
    try {
      await openDaumPostcodePopup((result) => {
        setShippingForm((prev) => ({
          ...prev,
          postcode: result.zonecode,
          address: result.baseAddress + (result.extraAddress ? ` ${result.extraAddress}` : ''),
        }));
      });
    } catch {
      showToast('주소 검색을 열지 못했습니다.', 'error');
    }
  };

  const handleSaveShipping = async () => {
    if (!order) return;
    setSaving(true);
    try {
      const res = await fetchApi<{ success: boolean; order: Partial<OrderDetail> }>(
        `/api/v1/orders/${id}/shipping`,
        {
          method: 'PATCH',
          body: JSON.stringify(shippingForm),
        }
      );
      if (res?.success && res.order) {
        setOrder((prev) => (prev ? { ...prev, ...res.order } : prev));
        setEditing(false);
        showToast('배송지가 정상적으로 수정되었습니다.', 'success');
      } else {
        throw new Error('배송지 수정에 실패했습니다.');
      }
    } catch (err: any) {
      showToast(err?.message || '배송지 수정에 실패했습니다.', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#FFD700] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] text-white flex flex-col items-center justify-center gap-4 px-4">
        <AlertCircle className="w-12 h-12 text-neutral-500" />
        <p className="text-lg font-bold">주문 정보를 찾을 수 없습니다.</p>
        <Link
          href="/mypage"
          className="px-6 py-2.5 rounded-xl bg-[#FFD700] text-black font-bold text-sm hover:bg-[#E6C200] transition-colors"
        >
          마이페이지로 이동
        </Link>
      </div>
    );
  }

  const badge = STATUS_BADGE[order.status] ?? {
    label: order.status,
    classes: 'bg-neutral-800 text-white border-neutral-700',
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white pb-20">
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* Navigation & Header */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-xl bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 transition-colors"
            aria-label="뒤로가기"
          >
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>
          <div>
            <h1 className="text-xl font-bold">주문 상세 내역</h1>
            <p className="text-xs text-neutral-400">주문 및 결제 세부 정보를 확인합니다.</p>
          </div>
        </div>

        {/* Order Meta Info Card */}
        <div className="rounded-2xl bg-[#141414] border border-[#262626] p-5 sm:p-6 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#262626]">
            <div className="flex items-center gap-3">
              <span className="font-mono font-bold text-lg text-white">주문 #{order.id}</span>
              <span className="text-xs text-[#8A8A8A] flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                <span>{new Date(order.createdAt).toLocaleString('ko-KR')}</span>
              </span>
            </div>
            <span className={`text-xs font-bold px-3 py-1 rounded-full border ${badge.classes}`}>
              {badge.label}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-neutral-400 pt-1">
            {order.paidAt && (
              <div>
                결제 승인: <span className="text-neutral-200">{new Date(order.paidAt).toLocaleString('ko-KR')}</span>
              </div>
            )}
            {order.paymentKey && (
              <div className="truncate font-mono">
                결제키: <span className="text-neutral-200">{order.paymentKey}</span>
              </div>
            )}
          </div>
        </div>

        {/* Ordered Items List */}
        <div className="rounded-2xl bg-[#141414] border border-[#262626] p-5 sm:p-6 space-y-4">
          <h2 className="font-bold text-base flex items-center gap-2">
            <Package className="w-4 h-4 text-[#FFD700]" />
            <span>주문 상품 ({order.orderItems.length}개)</span>
          </h2>

          <div className="space-y-3">
            {order.orderItems.map((item) => {
              const hasImg = !!item.product?.imageUrl && !imgErrors[item.id];
              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-4 p-3.5 rounded-xl bg-[#1A1A1A] border border-[#262626]"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-14 h-14 rounded-lg bg-[#141414] border border-[#262626] overflow-hidden shrink-0 flex items-center justify-center">
                      {hasImg ? (
                        <Image
                          src={item.product.imageUrl!}
                          alt={item.product.name}
                          width={56}
                          height={56}
                          className="w-full h-full object-cover"
                          unoptimized
                          onError={() => setImgErrors((p) => ({ ...p, [item.id]: true }))}
                        />
                      ) : (
                        <Package className="w-6 h-6 text-[#8A8A8A]" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <Link
                        href={`/products/${item.product.id}`}
                        className="text-sm font-semibold text-white hover:text-[#FFD700] transition-colors truncate block"
                      >
                        {item.product.name}
                      </Link>
                      <p className="text-xs text-[#A3A3A3] mt-0.5">
                        수량 {item.quantity}개 &middot; 개당 {Number(item.unitPrice).toLocaleString()}원
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-sm sm:text-base font-bold text-white">
                      {(Number(item.unitPrice) * item.quantity).toLocaleString()}
                    </span>
                    <span className="text-xs text-[#8A8A8A] ml-1">원</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-baseline justify-between pt-4 border-t border-[#262626]">
            <span className="text-sm font-medium text-[#A3A3A3]">총 결제 금액</span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-[#FFD700]">
                {Number(order.totalAmount).toLocaleString()}
              </span>
              <span className="text-sm text-white">원</span>
            </div>
          </div>
        </div>

        {/* Shipping Address Section */}
        <div className="rounded-2xl bg-[#141414] border border-[#262626] p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-base flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#FFD700]" />
              <span>배송지 정보</span>
            </h2>

            {canEditShipping && !editing && (
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-[#FFD700] border border-neutral-700 text-xs font-bold transition-colors"
              >
                <Pencil className="w-3.5 h-3.5" />
                <span>배송지 수정</span>
              </button>
            )}
          </div>

          {editing ? (
            <div className="space-y-4 pt-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-[#A3A3A3] mb-1 block">받는 사람 *</label>
                  <div className="flex items-center gap-2 bg-[#1A1A1A] border border-[#333] rounded-xl px-3 py-2.5">
                    <User className="w-4 h-4 text-[#8A8A8A] shrink-0" />
                    <input
                      className="bg-transparent text-white text-sm w-full outline-none"
                      value={shippingForm.recipientName}
                      onChange={(e) => setShippingForm((p) => ({ ...p, recipientName: e.target.value }))}
                      placeholder="받는 사람 이름"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs text-[#A3A3A3] mb-1 block">연락처 *</label>
                  <div className="flex items-center gap-2 bg-[#1A1A1A] border border-[#333] rounded-xl px-3 py-2.5">
                    <Phone className="w-4 h-4 text-[#8A8A8A] shrink-0" />
                    <input
                      className="bg-transparent text-white text-sm w-full outline-none"
                      value={shippingForm.recipientPhone}
                      onChange={(e) => setShippingForm((p) => ({ ...p, recipientPhone: e.target.value }))}
                      placeholder="010-0000-0000"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs text-[#A3A3A3] mb-1 block">우편번호 및 기본 주소 *</label>
                <div className="flex gap-2">
                  <input
                    readOnly
                    value={shippingForm.postcode}
                    placeholder="우편번호"
                    className="w-28 bg-[#1A1A1A] border border-[#333] rounded-xl px-3 py-2.5 text-white text-sm outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleOpenAddressSearch}
                    className="px-4 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-[#FFD700] border border-neutral-700 text-xs font-bold transition-colors flex items-center gap-1.5 shrink-0"
                  >
                    <Search className="w-3.5 h-3.5" />
                    <span>주소 검색</span>
                  </button>
                </div>
              </div>

              <div>
                <input
                  readOnly
                  value={shippingForm.address}
                  placeholder="기본 주소 (주소 검색으로 자동 기입)"
                  className="w-full bg-[#1A1A1A] border border-[#333] rounded-xl px-3 py-2.5 text-white text-sm outline-none"
                />
              </div>

              <div>
                <label className="text-xs text-[#A3A3A3] mb-1 block">상세 주소</label>
                <input
                  value={shippingForm.addressDetail}
                  onChange={(e) => setShippingForm((p) => ({ ...p, addressDetail: e.target.value }))}
                  placeholder="상세 주소를 입력해주세요 (동/호수 등)"
                  className="w-full bg-[#1A1A1A] border border-[#333] rounded-xl px-3 py-2.5 text-white text-sm outline-none focus:border-[#FFD700]"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleSaveShipping}
                  disabled={saving}
                  className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#FFD700] hover:bg-[#E6C200] text-black text-sm font-bold transition-colors disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  <span>{saving ? '저장 중...' : '저장 완료'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  disabled={saving}
                  className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white text-sm font-semibold transition-colors"
                >
                  <X className="w-4 h-4" />
                  <span>취소</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-2 text-sm text-neutral-300">
              {order.recipientName && (
                <div className="flex items-center gap-2.5">
                  <User className="w-4 h-4 text-[#8A8A8A] shrink-0" />
                  <span className="font-semibold text-white">{order.recipientName}</span>
                </div>
              )}
              {order.recipientPhone && (
                <div className="flex items-center gap-2.5">
                  <Phone className="w-4 h-4 text-[#8A8A8A] shrink-0" />
                  <span>{order.recipientPhone}</span>
                </div>
              )}
              {order.address && (
                <div className="flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-[#8A8A8A] shrink-0 mt-0.5" />
                  <div>
                    {order.postcode && <span className="text-[#8A8A8A]">[{order.postcode}] </span>}
                    <span className="text-white">{order.address}</span>
                    {order.addressDetail && <span className="text-neutral-300"> {order.addressDetail}</span>}
                  </div>
                </div>
              )}
              {!order.recipientName && !order.address && (
                <p className="text-sm text-neutral-500 py-1">등록된 배송지 정보가 없습니다.</p>
              )}

              {!canEditShipping && order.status !== 'cancelled' && (
                <p className="text-xs text-neutral-500 pt-2 border-t border-neutral-800">
                  * 상품 배송이 시작되어 배송지를 변경할 수 없습니다. 문의사항은 고객센터로 연락해 주세요.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Bottom Actions */}
        <div className="flex gap-3 pt-2">
          <Link
            href="/mypage"
            className="flex-1 text-center py-3.5 rounded-xl bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 text-white text-sm font-bold transition-colors"
          >
            마이페이지로 돌아가기
          </Link>
          <Link
            href="/products"
            className="flex-1 text-center py-3.5 rounded-xl bg-[#FFD700] hover:bg-[#E6C200] text-black text-sm font-bold transition-colors"
          >
            장비몰 계속 쇼핑
          </Link>
        </div>
      </div>
    </div>
  );
}
