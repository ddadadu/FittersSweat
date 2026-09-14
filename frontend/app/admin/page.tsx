'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  ShieldAlert,
  TrendingUp,
  Package,
  AlertTriangle,
  Users,
  CheckCircle2,
  Clock,
  Truck,
  RotateCcw,
  Search,
  Loader2,
  ExternalLink,
  ChevronRight,
  Filter,
  Save,
  Check,
  AlertCircle,
  ShoppingBag,
} from 'lucide-react';
import { useAuthStore } from '@/stores/useAuthStore';
import { ensureAuthToken } from '@/lib/api';

interface AdminStats {
  totalRevenue: number;
  totalOrders: number;
  lowStockCount: number;
  totalUsers: number;
}

interface OrderItemProduct {
  id: string;
  name: string;
  imageUrl: string | null;
  price: number;
  categoryId: string;
}

interface AdminOrderItem {
  id: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  product: OrderItemProduct;
}

interface AdminOrder {
  id: string;
  userId: string;
  status: string;
  totalAmount: number;
  paymentKey: string | null;
  paidAt: string | null;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  orderItems: AdminOrderItem[];
}

interface AdminProduct {
  id: string;
  name: string;
  description?: string;
  categoryId: string;
  price: number;
  stockQuantity: number;
  imageUrl?: string;
}

const ORDER_STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: '결제 대기', color: 'text-amber-400', bg: 'bg-amber-400/10 border-amber-400/30' },
  paid: { label: '결제 완료', color: 'text-emerald-400', bg: 'bg-emerald-400/10 border-emerald-400/30' },
  shipped: { label: '배송중', color: 'text-sky-400', bg: 'bg-sky-400/10 border-sky-400/30' },
  delivered: { label: '배송 완료', color: 'text-purple-400', bg: 'bg-purple-400/10 border-purple-400/30' },
  cancelled: { label: '주문 취소', color: 'text-rose-400', bg: 'bg-rose-400/10 border-rose-400/30' },
};

export default function AdminPage() {
  const router = useRouter();
  const { user, isAuthenticated, setAuthModalOpen } = useAuthStore();

  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [activeTab, setActiveTab] = useState<'orders' | 'inventory'>('orders');

  // Stats
  const [stats, setStats] = useState<AdminStats | null>(null);

  // Orders
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('all');
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  // Inventory
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [stockEditMap, setStockEditMap] = useState<Record<string, number>>({});
  const [updatingProductId, setUpdatingProductId] = useState<string | null>(null);
  const [productSavedId, setProductSavedId] = useState<string | null>(null);

  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  const getApiUrl = () => process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  // 1. Auth & Admin Verification
  const verifyAdminAccess = useCallback(async () => {
    setIsLoading(true);
    try {
      const token = await ensureAuthToken();
      if (!token) {
        setIsAuthorized(false);
        setIsLoading(false);
        return;
      }

      // Check current user profile from backend
      const res = await fetch(`${getApiUrl()}/api/v1/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (data.success && data.user?.role === 'ADMIN') {
        setIsAuthorized(true);
        loadDashboardData(token);
      } else {
        setIsAuthorized(false);
      }
    } catch {
      setIsAuthorized(false);
    } finally {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    verifyAdminAccess();
  }, [verifyAdminAccess]);

  // 2. Load Dashboard Stats & Initial Data
  const loadDashboardData = async (token?: string) => {
    const activeToken = token || (await ensureAuthToken());
    if (!activeToken) return;

    try {
      // 1. Stats
      const statsRes = await fetch(`${getApiUrl()}/api/v1/admin/stats`, {
        headers: { Authorization: `Bearer ${activeToken}` },
      });
      const statsData = await statsRes.json();
      if (statsData.success) {
        setStats(statsData.stats);
      }

      // 2. Orders
      fetchOrders(orderStatusFilter, activeToken);

      // 3. Products
      fetchProducts('', activeToken);
    } catch (err: any) {
      console.error('Error loading admin dashboard data:', err);
    }
  };

  // 3. Fetch Orders
  const fetchOrders = async (status = 'all', token?: string) => {
    const activeToken = token || (await ensureAuthToken());
    if (!activeToken) return;

    try {
      const query = status !== 'all' ? `?status=${status}` : '';
      const res = await fetch(`${getApiUrl()}/api/v1/admin/orders${query}`, {
        headers: { Authorization: `Bearer ${activeToken}` },
      });
      const data = await res.json();
      if (data.success) {
        setOrders(data.orders);
      }
    } catch (err: any) {
      showNotification('error', '주문 목록을 불러오지 못했습니다.');
    }
  };

  // 4. Update Order Status
  const handleUpdateOrderStatus = async (orderId: string, newStatus: string) => {
    setUpdatingOrderId(orderId);
    try {
      const token = await ensureAuthToken();
      const res = await fetch(`${getApiUrl()}/api/v1/admin/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
        );
        showNotification('success', `주문(#${orderId}) 상태가 [${ORDER_STATUS_LABELS[newStatus]?.label || newStatus}]로 변경되었습니다.`);
      } else {
        throw new Error(data.message);
      }
    } catch (err: any) {
      showNotification('error', err.message || '주문 상태 변경 실패');
    } finally {
      setUpdatingOrderId(null);
    }
  };

  // 5. Fetch Products
  const fetchProducts = async (search = '', token?: string) => {
    try {
      const query = search ? `?search=${encodeURIComponent(search)}&limit=40` : '?limit=40';
      const res = await fetch(`${getApiUrl()}/api/v1/products${query}`);
      const data = await res.json();
      if (data.success && data.products) {
        setProducts(data.products);
        const editMap: Record<string, number> = {};
        data.products.forEach((p: AdminProduct) => {
          editMap[p.id] = p.stockQuantity;
        });
        setStockEditMap(editMap);
      }
    } catch (err) {
      console.error('Failed to fetch products', err);
    }
  };

  // 6. Update Product Stock Quantity
  const handleUpdateStock = async (productId: string) => {
    const newStock = stockEditMap[productId];
    if (newStock === undefined || newStock < 0) return;

    setUpdatingProductId(productId);
    try {
      const token = await ensureAuthToken();
      const res = await fetch(`${getApiUrl()}/api/v1/admin/products/${productId}/stock`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ stockQuantity: newStock }),
      });
      const data = await res.json();
      if (data.success) {
        setProducts((prev) =>
          prev.map((p) => (p.id === productId ? { ...p, stockQuantity: newStock } : p))
        );
        setProductSavedId(productId);
        setTimeout(() => setProductSavedId(null), 2000);
        showNotification('success', '재고 수량이 성공적으로 갱신되었습니다.');
      } else {
        throw new Error(data.message);
      }
    } catch (err: any) {
      showNotification('error', err.message || '재고 수량 변경 실패');
    } finally {
      setUpdatingProductId(null);
    }
  };

  // 1. Loading screen while verifying credentials (eliminates FOUC)
  if (isLoading) {
    return (
      <main className="min-h-screen bg-[#0A0A0A] flex items-center justify-center p-4">
        <div className="flex flex-col items-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#FFD700]" />
          <p className="text-xs text-neutral-400 font-medium">관리자 권한 확인 중...</p>
        </div>
      </main>
    );
  }

  // 2. Access Denied Screen for Non-Admin
  if (!isAuthorized) {
    return (
      <main className="min-h-screen bg-[#0A0A0A] flex items-center justify-center p-4">
        <div className="max-w-md w-full rounded-2xl bg-[#141414] border border-[#262626] p-8 text-center space-y-5">
          <div className="w-16 h-16 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mx-auto text-rose-400">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-bold text-white">관리자 전용 페이지</h1>
            <p className="text-xs text-neutral-400 leading-relaxed break-keep">
              FittersSweat 관리자 계정(ADMIN)으로 로그인해야 접근할 수 있습니다.
            </p>
          </div>
          <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
            <button
              type="button"
              onClick={() => setAuthModalOpen(true)}
              className="flex-1 min-h-[44px] px-4 py-2.5 rounded-xl bg-[#FFD700] hover:bg-[#FFC700] text-black text-xs font-bold transition-colors"
            >
              관리자 계정으로 로그인
            </button>
            <Link
              href="/"
              className="flex-1 min-h-[44px] px-4 py-2.5 rounded-xl bg-[#1F1F1F] hover:bg-[#262626] border border-[#333333] text-white text-xs font-semibold transition-colors flex items-center justify-center"
            >
              홈으로 이동
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0A0A0A] text-white py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Notification Toast */}
        {notification && (
          <div
            className={`fixed bottom-6 right-6 z-50 p-4 rounded-xl shadow-2xl flex items-center space-x-2 text-sm font-semibold border ${
              notification.type === 'success'
                ? 'bg-emerald-950 border-emerald-500/50 text-emerald-300'
                : 'bg-rose-950 border-rose-500/50 text-rose-300'
            }`}
          >
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-400" />
            )}
            <span>{notification.message}</span>
          </div>
        )}

        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#262626]">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded text-[11px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-400 border border-amber-500/40">
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Admin Console</span>
              </span>
              <span className="text-xs text-neutral-500">실시간 통합 관제</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black italic tracking-tight text-white">
              FittersSweat <span className="text-[#FFD700]">관리자 대시보드</span>
            </h1>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => loadDashboardData()}
              className="min-h-[44px] px-3.5 py-2 rounded-xl bg-[#141414] hover:bg-[#1F1F1F] border border-[#262626] text-xs font-semibold text-neutral-300 transition-colors flex items-center space-x-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>새로고침</span>
            </button>
            <Link
              href="/products"
              className="min-h-[44px] px-3.5 py-2 rounded-xl bg-[#1F1F1F] hover:bg-[#262626] border border-[#333333] text-xs font-semibold text-white transition-colors flex items-center space-x-1.5"
            >
              <span>장비몰 바로가기</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* 4 KPI Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-[#141414] border border-[#262626] space-y-2">
            <div className="flex items-center justify-between text-neutral-400 text-xs font-semibold">
              <span>총 누적 매출액</span>
              <TrendingUp className="w-4 h-4 text-[#FFD700]" />
            </div>
            <div className="text-2xl font-black text-[#FFD700] tracking-tight">
              {stats ? `${stats.totalRevenue.toLocaleString()}원` : '-'}
            </div>
            <p className="text-[11px] text-neutral-500">결제 완료/배송 주문 기준</p>
          </div>

          <div className="p-5 rounded-2xl bg-[#141414] border border-[#262626] space-y-2">
            <div className="flex items-center justify-between text-neutral-400 text-xs font-semibold">
              <span>총 주문 건수</span>
              <Package className="w-4 h-4 text-sky-400" />
            </div>
            <div className="text-2xl font-black text-white tracking-tight">
              {stats ? `${stats.totalOrders}건` : '-'}
            </div>
            <p className="text-[11px] text-neutral-500">전체 고객 누적 주문</p>
          </div>

          <div className="p-5 rounded-2xl bg-[#141414] border border-[#262626] space-y-2">
            <div className="flex items-center justify-between text-neutral-400 text-xs font-semibold">
              <span>재고 부족 경고 장비</span>
              <AlertTriangle className="w-4 h-4 text-rose-400" />
            </div>
            <div className="text-2xl font-black text-rose-400 tracking-tight">
              {stats ? `${stats.lowStockCount}개` : '-'}
            </div>
            <p className="text-[11px] text-neutral-500">재고 5개 이하 또는 품절</p>
          </div>

          <div className="p-5 rounded-2xl bg-[#141414] border border-[#262626] space-y-2">
            <div className="flex items-center justify-between text-neutral-400 text-xs font-semibold">
              <span>가입 회원 수</span>
              <Users className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-black text-white tracking-tight">
              {stats ? `${stats.totalUsers}명` : '-'}
            </div>
            <p className="text-[11px] text-neutral-500">등록된 공식 러너 계정</p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-[#262626] space-x-4">
          <button
            type="button"
            onClick={() => setActiveTab('orders')}
            className={`pb-3.5 px-2 text-sm font-bold transition-all border-b-2 min-h-[44px] flex items-center space-x-2 ${
              activeTab === 'orders'
                ? 'border-[#FFD700] text-[#FFD700]'
                : 'border-transparent text-neutral-400 hover:text-white'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>주문 및 배송 관리 ({orders.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('inventory')}
            className={`pb-3.5 px-2 text-sm font-bold transition-all border-b-2 min-h-[44px] flex items-center space-x-2 ${
              activeTab === 'inventory'
                ? 'border-[#FFD700] text-[#FFD700]'
                : 'border-transparent text-neutral-400 hover:text-white'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>직매입 장비 재고 관리 (400개 카탈로그)</span>
          </button>
        </div>

        {/* TAB 1: Orders Management */}
        {activeTab === 'orders' && (
          <div className="space-y-4">
            {/* Status Filter Pills */}
            <div className="flex items-center space-x-2 overflow-x-auto pb-1">
              <span className="text-xs font-semibold text-neutral-400 flex items-center space-x-1 shrink-0 mr-1">
                <Filter className="w-3.5 h-3.5" />
                <span>필터:</span>
              </span>
              {[
                { key: 'all', label: '전체' },
                { key: 'paid', label: '결제 완료' },
                { key: 'shipped', label: '배송중' },
                { key: 'delivered', label: '배송 완료' },
                { key: 'cancelled', label: '주문 취소' },
                { key: 'pending', label: '결제 대기' },
              ].map((filter) => (
                <button
                  key={filter.key}
                  type="button"
                  onClick={() => {
                    setOrderStatusFilter(filter.key);
                    fetchOrders(filter.key);
                  }}
                  className={`min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-bold transition-colors shrink-0 ${
                    orderStatusFilter === filter.key
                      ? 'bg-[#FFD700] text-black'
                      : 'bg-[#141414] hover:bg-[#1F1F1F] text-neutral-300 border border-[#262626]'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>

            {/* Orders Table Wrapper (Responsive: overflow-x-auto) */}
            <div className="rounded-2xl bg-[#141414] border border-[#262626] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[700px]">
                  <thead>
                    <tr className="border-b border-[#262626] bg-[#1A1A1A] text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                      <th className="py-3 px-4">주문 번호</th>
                      <th className="py-3 px-4">주문자 / 연락처</th>
                      <th className="py-3 px-4">주문 상품 품목</th>
                      <th className="py-3 px-4">결제 금액</th>
                      <th className="py-3 px-4">상태</th>
                      <th className="py-3 px-4 text-right">배송 상태 변경</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#262626] text-xs">
                    {orders.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-neutral-500">
                          해당 조건의 주문 내역이 없습니다.
                        </td>
                      </tr>
                    ) : (
                      orders.map((order) => {
                        const statusConfig = ORDER_STATUS_LABELS[order.status] || {
                          label: order.status,
                          color: 'text-neutral-300',
                          bg: 'bg-neutral-800',
                        };

                        return (
                          <tr key={order.id} className="hover:bg-[#1A1A1A]/60 transition-colors">
                            <td className="py-4 px-4 font-mono font-bold text-white">
                              #{order.id}
                              <div className="text-[10px] text-neutral-500 font-normal">
                                {new Date(order.createdAt).toLocaleString('ko-KR', {
                                  month: 'numeric',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <div className="font-bold text-white">{order.user.name}</div>
                              <div className="text-neutral-500 text-[11px]">{order.user.email}</div>
                            </td>
                            <td className="py-4 px-4">
                              <div className="space-y-1">
                                {order.orderItems.map((item) => (
                                  <div key={item.id} className="flex items-center space-x-2">
                                    <span className="text-neutral-300 font-medium line-clamp-1">
                                      {item.product.name}
                                    </span>
                                    <span className="text-neutral-500 font-bold shrink-0">
                                      x {item.quantity}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </td>
                            <td className="py-4 px-4 font-black text-[#FFD700] text-sm">
                              {order.totalAmount.toLocaleString()}원
                            </td>
                            <td className="py-4 px-4">
                              <span
                                className={`inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold border ${statusConfig.bg} ${statusConfig.color}`}
                              >
                                {statusConfig.label}
                              </span>
                            </td>
                            <td className="py-4 px-4 text-right">
                              <div className="flex items-center justify-end space-x-1.5">
                                {order.status === 'paid' && (
                                  <button
                                    type="button"
                                    disabled={updatingOrderId === order.id}
                                    onClick={() => handleUpdateOrderStatus(order.id, 'shipped')}
                                    className="min-h-[36px] px-3 py-1.5 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 border border-sky-500/40 text-sky-300 text-xs font-bold transition-colors flex items-center space-x-1"
                                  >
                                    <Truck className="w-3.5 h-3.5" />
                                    <span>배송 시작</span>
                                  </button>
                                )}

                                {order.status === 'shipped' && (
                                  <button
                                    type="button"
                                    disabled={updatingOrderId === order.id}
                                    onClick={() => handleUpdateOrderStatus(order.id, 'delivered')}
                                    className="min-h-[36px] px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 text-xs font-bold transition-colors flex items-center space-x-1"
                                  >
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    <span>배송 완료</span>
                                  </button>
                                )}

                                {order.status === 'delivered' && (
                                  <span className="text-[11px] text-neutral-500 font-semibold">
                                    배송 완료됨
                                  </span>
                                )}

                                {order.status === 'cancelled' && (
                                  <span className="text-[11px] text-rose-400 font-semibold">
                                    취소/환불됨
                                  </span>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Direct Inventory Management */}
        {activeTab === 'inventory' && (
          <div className="space-y-4">
            {/* Search Bar */}
            <div className="flex items-center space-x-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={productSearch}
                  onChange={(e) => {
                    setProductSearch(e.target.value);
                    fetchProducts(e.target.value);
                  }}
                  placeholder="장비명 또는 스펙 검색..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#141414] border border-[#262626] text-white text-xs placeholder-neutral-500 focus:outline-none focus:border-[#FFD700] min-h-[44px]"
                />
              </div>
            </div>

            {/* Products Inventory Table */}
            <div className="rounded-2xl bg-[#141414] border border-[#262626] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[700px]">
                  <thead>
                    <tr className="border-b border-[#262626] bg-[#1A1A1A] text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                      <th className="py-3 px-4">상품 ID</th>
                      <th className="py-3 px-4">상품 정보</th>
                      <th className="py-3 px-4">카테고리</th>
                      <th className="py-3 px-4">판매가</th>
                      <th className="py-3 px-4">현재 재고</th>
                      <th className="py-3 px-4 text-right">재고 수량 변경</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#262626] text-xs">
                    {products.map((prod) => {
                      const isLowStock = prod.stockQuantity <= 5;
                      const isOutOfStock = prod.stockQuantity === 0;

                      return (
                        <tr key={prod.id} className="hover:bg-[#1A1A1A]/60 transition-colors">
                          <td className="py-3 px-4 font-mono font-bold text-neutral-400">
                            #{prod.id}
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-bold text-white line-clamp-1">{prod.name}</div>
                            {prod.description && (
                              <div className="text-[11px] text-neutral-500 line-clamp-1">
                                {prod.description}
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-[#1F1F1F] border border-[#333333] text-neutral-300">
                              {prod.categoryId}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-bold text-neutral-200">
                            {prod.price.toLocaleString()}원
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center space-x-2">
                              <span
                                className={`font-black text-sm ${
                                  isOutOfStock
                                    ? 'text-rose-500'
                                    : isLowStock
                                    ? 'text-amber-400'
                                    : 'text-emerald-400'
                                }`}
                              >
                                {prod.stockQuantity}개
                              </span>
                              {isOutOfStock && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/40">
                                  품절
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end space-x-2">
                              <input
                                type="number"
                                min="0"
                                value={stockEditMap[prod.id] !== undefined ? stockEditMap[prod.id] : prod.stockQuantity}
                                onChange={(e) =>
                                  setStockEditMap({
                                    ...stockEditMap,
                                    [prod.id]: Number(e.target.value),
                                  })
                                }
                                className="w-20 px-2.5 py-1.5 rounded-lg bg-[#0A0A0A] border border-[#333333] text-white text-center font-bold text-xs focus:outline-none focus:border-[#FFD700] min-h-[36px]"
                              />
                              <button
                                type="button"
                                disabled={updatingProductId === prod.id}
                                onClick={() => handleUpdateStock(prod.id)}
                                className="min-h-[36px] px-3 py-1.5 rounded-lg bg-[#FFD700] hover:bg-[#FFC700] text-black text-xs font-black transition-colors flex items-center space-x-1 disabled:opacity-50"
                              >
                                {productSavedId === prod.id ? (
                                  <>
                                    <Check className="w-3.5 h-3.5" />
                                    <span>완료</span>
                                  </>
                                ) : (
                                  <>
                                    <Save className="w-3.5 h-3.5" />
                                    <span>저장</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
