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
  PlusCircle,
  UploadCloud,
  ImageIcon,
  Trash2,
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
  const [activeTab, setActiveTab] = useState<'orders' | 'inventory' | 'createProduct'>('orders');

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
  const [productToDelete, setProductToDelete] = useState<AdminProduct | null>(null);
  const [isDeletingProduct, setIsDeletingProduct] = useState(false);

  // Create Product State
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    categoryId: 'shoes',
    price: '',
    stockQuantity: '',
    imageUrl: '',
    brandLogoUrl: '',
    detailImageUrl: '',
  });
  const [isUploadingImage, setIsUploadingImage] = useState<string | null>(null);
  const [isSubmittingProduct, setIsSubmittingProduct] = useState(false);

  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  const getApiUrl = () => process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  // Image Upload Handler
  const handleUploadImageFile = async (
    field: 'imageUrl' | 'brandLogoUrl' | 'detailImageUrl',
    file: File
  ) => {
    setIsUploadingImage(field);
    try {
      const token = await ensureAuthToken();
      if (!token) {
        showNotification('error', '로그인이 필요합니다.');
        return;
      }

      const formData = new FormData();
      formData.append('image', file);

      const res = await fetch(`${getApiUrl()}/api/v1/admin/upload-image`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await res.json();
      if (data.success && data.url) {
        setProductForm((prev) => ({ ...prev, [field]: data.url }));
        showNotification('success', '이미지가 성공적으로 업로드되었습니다.');
      } else {
        throw new Error(data.message || '업로드 실패');
      }
    } catch (err: any) {
      showNotification('error', err.message || '이미지 업로드에 실패했습니다.');
    } finally {
      setIsUploadingImage(null);
    }
  };

  // Product Create Submit Handler
  const handleCreateProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productForm.name.trim()) {
      showNotification('error', '상품명을 입력해주세요.');
      return;
    }
    const numPrice = Number(productForm.price);
    if (isNaN(numPrice) || numPrice <= 0) {
      showNotification('error', '유효한 가격을 입력해주세요.');
      return;
    }
    const numStock = Number(productForm.stockQuantity);
    if (isNaN(numStock) || numStock < 0 || !Number.isInteger(numStock)) {
      showNotification('error', '재고 수량은 0 이상의 정수여야 합니다.');
      return;
    }

    setIsSubmittingProduct(true);
    try {
      const token = await ensureAuthToken();
      if (!token) {
        showNotification('error', '로그인이 필요합니다.');
        return;
      }

      const res = await fetch(`${getApiUrl()}/api/v1/admin/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: productForm.name.trim(),
          description: productForm.description.trim() || undefined,
          categoryId: productForm.categoryId,
          price: numPrice,
          stockQuantity: numStock,
          imageUrl: productForm.imageUrl.trim() || undefined,
          brandLogoUrl: productForm.brandLogoUrl.trim() || undefined,
          detailImageUrl: productForm.detailImageUrl.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (data.success && data.product) {
        showNotification('success', `상품 "${data.product.name}"이(가) 등록되었습니다!`);
        setProductForm({
          name: '',
          description: '',
          categoryId: 'shoes',
          price: '',
          stockQuantity: '',
          imageUrl: '',
          brandLogoUrl: '',
          detailImageUrl: '',
        });
        loadDashboardData(token);
      } else {
        throw new Error(data.message || '상품 등록에 실패했습니다.');
      }
    } catch (err: any) {
      showNotification('error', err.message || '상품 등록 중 오류가 발생했습니다.');
    } finally {
      setIsSubmittingProduct(false);
    }
  };

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

  // 6. Delete Product (Soft Delete)
  const handleDeleteProduct = async () => {
    if (!productToDelete) return;
    setIsDeletingProduct(true);
    try {
      const token = await ensureAuthToken();
      if (!token) {
        showNotification('error', '로그인이 필요합니다.');
        return;
      }
      const res = await fetch(`${getApiUrl()}/api/v1/admin/products/${productToDelete.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showNotification('success', data.message || '상품이 삭제되었습니다.');
        setProducts((prev) => prev.filter((p) => p.id !== productToDelete.id));
        setProductToDelete(null);
        loadDashboardData(token);
      } else {
        showNotification('error', data.message || '상품 삭제에 실패했습니다.');
      }
    } catch {
      showNotification('error', '상품 삭제 중 네트워크 오류가 발생했습니다.');
    } finally {
      setIsDeletingProduct(false);
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
          <button
            type="button"
            onClick={() => setActiveTab('createProduct')}
            className={`pb-3.5 px-2 text-sm font-bold transition-all border-b-2 min-h-[44px] flex items-center space-x-2 ${
              activeTab === 'createProduct'
                ? 'border-[#FFD700] text-[#FFD700]'
                : 'border-transparent text-neutral-400 hover:text-white'
            }`}
          >
            <PlusCircle className="w-4 h-4" />
            <span>신규 상품 등록 (Cloudinary)</span>
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
                              <Link
                                href={`/orders/${order.id}`}
                                className="text-[#FFD700] hover:underline inline-flex items-center gap-1 group"
                                title="주문 결제 및 배송 상세 보기"
                              >
                                <span>#{order.id}</span>
                                <ExternalLink className="w-3 h-3 text-neutral-400 group-hover:text-[#FFD700] transition-colors" />
                              </Link>
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
                              <button
                                type="button"
                                onClick={() => setProductToDelete(prod)}
                                className="min-h-[36px] px-2.5 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs font-bold transition-colors flex items-center justify-center"
                                title="상품 삭제"
                                aria-label={`${prod.name} 삭제`}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
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

        {/* TAB 3: Create New Product */}
        {activeTab === 'createProduct' && (
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="p-6 sm:p-8 rounded-2xl bg-[#141414] border border-[#262626] space-y-6">
              <div>
                <div className="flex items-center space-x-2 text-[#FFD700] text-xs font-black uppercase tracking-wider mb-1">
                  <PlusCircle className="w-4 h-4" />
                  <span>Catalog Registration</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black italic text-white">
                  신규 장비 / 상품 등록
                </h2>
                <p className="text-xs text-neutral-400 mt-1">
                  직매입 카탈로그에 새로운 상품을 등록합니다. 이미지는 파일 선택 즉시 Cloudinary 스토리지에 자동 업로드되어 URL이 기입됩니다.
                </p>
              </div>

              <form onSubmit={handleCreateProductSubmit} className="space-y-6">
                {/* 1. 기본 정보 */}
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-neutral-300 pb-2 border-b border-[#262626]">
                    1. 기본 정보
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="sm:col-span-2 space-y-1.5">
                      <label className="text-xs font-semibold text-neutral-300 block">
                        상품명 <span className="text-rose-400">*</span>
                      </label>
                      <input
                        required
                        type="text"
                        value={productForm.name}
                        onChange={(e) => setProductForm((p) => ({ ...p, name: e.target.value }))}
                        placeholder="예: [나이키] 줌 레이싱 플라이 5"
                        className="w-full bg-[#1A1A1A] border border-[#333] rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-[#FFD700]"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-neutral-300 block">
                        카테고리 <span className="text-rose-400">*</span>
                      </label>
                      <select
                        value={productForm.categoryId}
                        onChange={(e) => setProductForm((p) => ({ ...p, categoryId: e.target.value }))}
                        className="w-full bg-[#1A1A1A] border border-[#333] rounded-xl px-3 py-2.5 text-white text-sm outline-none focus:border-[#FFD700]"
                      >
                        <option value="shoes">레이싱화 (shoes)</option>
                        <option value="nutrition">보충제 (nutrition)</option>
                        <option value="gear">착용 장비 (gear)</option>
                        <option value="equipment">훈련 기구 (equipment)</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* 2. 가격 및 재고 */}
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-neutral-300 pb-2 border-b border-[#262626]">
                    2. 가격 및 재고
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-neutral-300 block">
                        판매 가격 (원) <span className="text-rose-400">*</span>
                      </label>
                      <input
                        required
                        type="number"
                        min="1"
                        step="100"
                        value={productForm.price}
                        onChange={(e) => setProductForm((p) => ({ ...p, price: e.target.value }))}
                        placeholder="예: 189000"
                        className="w-full bg-[#1A1A1A] border border-[#333] rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-[#FFD700]"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-neutral-300 block">
                        초기 입고 수량 (개) <span className="text-rose-400">*</span>
                      </label>
                      <input
                        required
                        type="number"
                        min="0"
                        step="1"
                        value={productForm.stockQuantity}
                        onChange={(e) => setProductForm((p) => ({ ...p, stockQuantity: e.target.value }))}
                        placeholder="예: 50"
                        className="w-full bg-[#1A1A1A] border border-[#333] rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-[#FFD700]"
                      />
                    </div>
                  </div>
                </div>

                {/* 3. 상세 설명 */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-neutral-300 block">
                    상품 상세 설명
                  </label>
                  <textarea
                    rows={3}
                    value={productForm.description}
                    onChange={(e) => setProductForm((p) => ({ ...p, description: e.target.value }))}
                    placeholder="HYROX 레이스 적합도, 스펙, 특징 등을 자유롭게 기술하세요."
                    className="w-full bg-[#1A1A1A] border border-[#333] rounded-xl p-3.5 text-white text-sm outline-none focus:border-[#FFD700] resize-none"
                  />
                </div>

                {/* 4. 이미지 등록 및 Cloudinary 자동 업로드 */}
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-neutral-300 pb-2 border-b border-[#262626]">
                    3. 상품 이미지 (Cloudinary 자동 업로드)
                  </h3>
                  <div className="space-y-4">
                    {([
                      { field: 'imageUrl' as const, label: '대표 썸네일 이미지', desc: '장비 목록 및 카드에 표시되는 메인 이미지' },
                      { field: 'brandLogoUrl' as const, label: '브랜드 로고 이미지', desc: '제조사/브랜드 로고 이미지' },
                      { field: 'detailImageUrl' as const, label: '상세 페이지 이미지', desc: '상품 상세 본문에 노출되는 고해상도 이미지' },
                    ]).map(({ field, label, desc }) => (
                      <div key={field} className="p-4 rounded-xl bg-[#1A1A1A] border border-[#262626] space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                          <div>
                            <span className="text-xs font-bold text-white">{label}</span>
                            <p className="text-[11px] text-neutral-400">{desc}</p>
                          </div>
                          {isUploadingImage === field && (
                            <span className="text-xs text-[#FFD700] flex items-center gap-1 font-semibold">
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              <span>Cloudinary 업로드 중...</span>
                            </span>
                          )}
                        </div>

                        <div className="flex flex-col sm:flex-row items-start gap-3">
                          {productForm[field] ? (
                            <div className="w-20 h-20 rounded-xl bg-[#141414] border border-[#333] overflow-hidden shrink-0 flex items-center justify-center relative group">
                              <Image
                                src={productForm[field]}
                                alt={label}
                                width={80}
                                height={80}
                                className="w-full h-full object-cover"
                                unoptimized
                              />
                            </div>
                          ) : (
                            <div className="w-20 h-20 rounded-xl bg-[#141414] border border-dashed border-neutral-700 flex flex-col items-center justify-center shrink-0 text-neutral-500">
                              <ImageIcon className="w-6 h-6" />
                              <span className="text-[10px] mt-1">미등록</span>
                            </div>
                          )}

                          <div className="flex-1 w-full space-y-2">
                            <div className="flex gap-2">
                              <label className="cursor-pointer px-3.5 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-[#FFD700] border border-neutral-700 text-xs font-bold transition-colors inline-flex items-center gap-1.5 shrink-0">
                                <UploadCloud className="w-3.5 h-3.5" />
                                <span>파일 선택</span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  disabled={isUploadingImage !== null}
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) handleUploadImageFile(field, file);
                                  }}
                                />
                              </label>
                              <input
                                type="url"
                                value={productForm[field]}
                                onChange={(e) => setProductForm((p) => ({ ...p, [field]: e.target.value }))}
                                placeholder="또는 직접 URL 입력 (예: https://...)"
                                className="w-full bg-[#141414] border border-[#333] rounded-xl px-3 py-2 text-white text-xs outline-none focus:border-[#FFD700]"
                              />
                            </div>
                            {productForm[field] && (
                              <p className="text-[11px] text-emerald-400 truncate">
                                ✓ 업로드 완료: {productForm[field]}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 제출 버튼 */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setProductForm({
                        name: '',
                        description: '',
                        categoryId: 'shoes',
                        price: '',
                        stockQuantity: '',
                        imageUrl: '',
                        brandLogoUrl: '',
                        detailImageUrl: '',
                      });
                      setActiveTab('inventory');
                    }}
                    className="flex-1 py-3 rounded-xl bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 text-white text-sm font-bold transition-colors"
                  >
                    취소 및 목록으로
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingProduct || isUploadingImage !== null}
                    className="flex-1 py-3 px-8 rounded-xl bg-[#FFD700] hover:bg-[#E6C200] text-black text-sm font-black transition-colors flex items-center justify-center space-x-2 disabled:opacity-50"
                  >
                    {isSubmittingProduct ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>상품 등록 처리 중...</span>
                      </>
                    ) : (
                      <>
                        <PlusCircle className="w-4 h-4" />
                        <span>신규 상품 등록 완료</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal (Option 2) */}
        {productToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
            <div className="w-full max-w-md p-6 rounded-2xl bg-[#141414] border border-[#262626] shadow-2xl space-y-5">
              <div className="flex items-start space-x-3.5">
                <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0 text-red-400">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">상품 삭제 확인</h3>
                  <p className="text-xs text-neutral-400 mt-1">
                    정말로 <span className="text-white font-semibold">&ldquo;{productToDelete.name}&rdquo;</span> 상품을 삭제하시겠습니까?
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-[#1A1A1A] border border-[#262626] text-xs text-neutral-400 space-y-1">
                <div className="flex items-center text-neutral-300 font-medium space-x-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-[#FFD700]" />
                  <span>소프트 딜리트(Soft Delete) 안내</span>
                </div>
                <p>기존 고객의 주문 내역 및 결제 데이터는 보존되며, 상점 및 관리자 목록에서 즉시 숨김 처리됩니다.</p>
              </div>

              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  disabled={isDeletingProduct}
                  onClick={() => setProductToDelete(null)}
                  className="flex-1 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 text-white text-xs font-bold transition-colors disabled:opacity-50"
                >
                  취소
                </button>
                <button
                  type="button"
                  disabled={isDeletingProduct}
                  onClick={handleDeleteProduct}
                  className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-colors flex items-center justify-center space-x-1.5 disabled:opacity-50"
                >
                  {isDeletingProduct ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>삭제 중...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>삭제 확인</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
