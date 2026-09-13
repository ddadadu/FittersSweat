'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchApi, ensureAuthToken } from '@/lib/api';
import EventCard, { EventItem } from '@/components/EventCard';
import PostCard, { PostItem } from '@/components/PostCard';
import {
  User,
  ShoppingBag,
  Trophy,
  MessageSquare,
  Calendar,
  Package,
  ArrowRight,
  PenLine,
  Zap,
  Award,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  Clock,
  RefreshCw,
  Settings,
  LogOut,
  Trash2,
  LogIn,
} from 'lucide-react';
import { useAuthStore } from '@/stores/useAuthStore';
import EditProfileModal from '@/components/EditProfileModal';
import DeleteAccountModal from '@/components/DeleteAccountModal';

interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: string;
  createdAt: string;
}

interface OrderProduct {
  id: string;
  name: string;
  price: number;
  imageUrl?: string | null;
  categoryId?: string;
}

interface OrderItemEntry {
  id: string;
  orderId: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  product?: OrderProduct;
}

interface OrderRecord {
  id: string;
  userId: string;
  status: string;
  totalAmount: number;
  paymentKey?: string | null;
  paidAt?: string | null;
  createdAt: string;
  updatedAt: string;
  orderItems: OrderItemEntry[];
}

type TabType = 'orders' | 'events' | 'posts';

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}.${month}.${day}`;
  } catch {
    return '';
  }
}

function formatDateTime(dateStr?: string | null): string {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${year}.${month}.${day} ${hours}:${minutes}`;
  } catch {
    return '';
  }
}

function getOrderStatusBadge(status: string) {
  const normalized = (status || '').toLowerCase();
  switch (normalized) {
    case 'paid':
      return {
        label: '결제 완료',
        classes: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
      };
    case 'cancelled':
      return {
        label: '취소됨',
        classes: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
      };
    case 'shipped':
      return {
        label: '배송 준비중',
        classes: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
      };
    case 'delivered':
      return {
        label: '배송 완료',
        classes: 'bg-teal-500/10 text-teal-400 border-teal-500/30',
      };
    case 'pending':
    default:
      return {
        label: '결제 대기',
        classes: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
      };
  }
}

export default function MyPage() {
  const queryClient = useQueryClient();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('orders');
  const [imgErrors, setImgErrors] = useState<Record<string, boolean>>({});
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [deleteAccountOpen, setDeleteAccountOpen] = useState(false);

  const {
    user: storeUser,
    isAuthenticated,
    isLoading: isAuthStoreLoading,
    logout,
    setAuthModalOpen,
  } = useAuthStore();

  useEffect(() => {
    setMounted(true);
  }, []);

  // 1. User profile query: GET /api/v1/auth/me
  const {
    data: authData,
    isLoading: isAuthLoading,
    isError: isAuthError,
    error: authError,
    refetch: refetchAuth,
  } = useQuery<{ success: boolean; user: UserProfile }>({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      return fetchApi<{ success: boolean; user: UserProfile }>('/api/v1/auth/me');
    },
    enabled: mounted && isAuthenticated,
  });

  const user = authData?.user || storeUser;
  const userId = user?.id;

  // 2. Orders query: GET /api/v1/orders
  const {
    data: ordersData,
    isLoading: isOrdersLoading,
    isError: isOrdersError,
    refetch: refetchOrders,
  } = useQuery<{ success: boolean; orders: OrderRecord[] }>({
    queryKey: ['orders'],
    queryFn: async () => {
      return fetchApi<{ success: boolean; orders: OrderRecord[] }>('/api/v1/orders');
    },
    enabled: mounted && isAuthenticated,
  });

  // 3. Interested events query: GET /api/v1/events/interested
  const {
    data: eventsData,
    isLoading: isEventsLoading,
    isError: isEventsError,
    refetch: refetchEvents,
  } = useQuery<{ success: boolean; events: EventItem[] }>({
    queryKey: ['events', 'interested'],
    queryFn: async () => {
      return fetchApi<{ success: boolean; events: EventItem[] }>('/api/v1/events/interested');
    },
    enabled: mounted && isAuthenticated,
  });

  // 4. User posts query: GET /api/v1/posts?userId=${userId}
  const {
    data: postsData,
    isLoading: isPostsLoading,
    isError: isPostsError,
    refetch: refetchPosts,
  } = useQuery<{ success: boolean; posts: PostItem[] }>({
    queryKey: ['posts', 'user', userId],
    queryFn: async () => {
      if (!userId) return { success: true, posts: [] };
      return fetchApi<{ success: boolean; posts: PostItem[] }>(`/api/v1/posts?userId=${userId}`);
    },
    enabled: mounted && isAuthenticated && !!userId,
  });

  // Review finding #2: Fix Flash of Empty State (FOES) for user posts
  const isPostsPending = isAuthLoading || isPostsLoading;

  // Toggle interested event mutation with optimistic update
  const toggleInterestMutation = useMutation({
    mutationFn: async (eventId: string) => {
      await ensureAuthToken();
      return fetchApi<{ success: boolean; isInterested: boolean }>(`/api/v1/events/${eventId}/interested`, {
        method: 'POST',
      });
    },
    onMutate: async (eventId: string) => {
      await queryClient.cancelQueries({ queryKey: ['events', 'interested'] });
      const previous = queryClient.getQueryData<{ success: boolean; events: EventItem[] }>(['events', 'interested']);
      if (previous) {
        queryClient.setQueryData(['events', 'interested'], {
          ...previous,
          events: previous.events.filter((e) => e.id !== eventId),
        });
      }
      return { previous };
    },
    onError: (err: any, _eventId, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['events', 'interested'], context.previous);
      }
      alert(err.message || '관심 대회 설정에 실패했습니다.');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['events', 'interested'] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
  });

  const orders = ordersData?.orders || [];
  const interestedEvents = eventsData?.events || [];
  const userPosts = postsData?.posts || [];

  const userName = user?.name || '러너';
  const userEmail = user?.email || '';
  const joinDate = user?.createdAt ? formatDate(user.createdAt) : formatDate(new Date().toISOString());
  const userInitial = userName.slice(0, 1).toUpperCase();

  const tabs = [
    {
      id: 'orders' as TabType,
      label: '내 주문 내역',
      count: orders.length,
      icon: ShoppingBag,
    },
    {
      id: 'events' as TabType,
      label: '관심 대회',
      count: interestedEvents.length,
      icon: Trophy,
    },
    {
      id: 'posts' as TabType,
      label: '내 활동 후기',
      count: userPosts.length,
      icon: MessageSquare,
    },
  ];

  if (!mounted) {
    return (
      <div className="max-w-6xl mx-auto py-12 px-4 space-y-8 animate-pulse">
        <div className="h-44 rounded-2xl bg-[#141414] border border-[#262626]" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 rounded-2xl bg-[#141414] border border-[#262626]" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-8 sm:py-12 px-4 sm:px-6 space-y-8 pb-16">
      {/* 1. Top Profile Dashboard / Guest State / Auth Error State */}
      {!isAuthenticated && !isAuthStoreLoading ? (
        <section
          aria-label="로그인 안내"
          className="relative overflow-hidden rounded-2xl bg-[#141414] border border-[#262626] p-8 sm:p-12 shadow-xl text-center space-y-5"
        >
          <div className="w-16 h-16 rounded-full bg-[#FFD700]/10 border border-[#FFD700]/20 flex items-center justify-center text-[#FFD700] mx-auto shadow-md">
            <User className="w-8 h-8" />
          </div>
          <div className="space-y-2 max-w-md mx-auto">
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              로그인이 필요한 서비스입니다
            </h2>
            <p className="text-xs sm:text-sm text-[#A3A3A3] leading-relaxed">
              FitterSweat 회원으로 로그인하여 내 주문 내역, 관심 대회, 작성한 완주 후기를 한눈에 확인하고 관리하세요.
            </p>
          </div>
          <div className="pt-2 flex justify-center">
            <button
              type="button"
              onClick={() => setAuthModalOpen(true, 'login')}
              className="min-h-[48px] px-8 py-3.5 rounded-xl bg-[#FFD700] hover:bg-yellow-400 text-black font-black text-sm transition-all shadow-lg shadow-yellow-500/15 flex items-center gap-2 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFD700]"
            >
              <LogIn className="w-4 h-4" />
              <span>로그인 / 회원가입</span>
            </button>
          </div>
        </section>
      ) : isAuthError ? (
        /* Review Finding #3: Auth Error State */
        <section
          aria-label="인증 오류 안내"
          className="relative overflow-hidden rounded-2xl bg-[#141414] border border-rose-500/30 p-6 sm:p-8 shadow-xl text-center space-y-4"
        >
          <div className="w-16 h-16 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mx-auto shadow-md">
            <AlertCircle className="w-8 h-8" />
          </div>
          <div className="space-y-1.5 max-w-md mx-auto">
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              로그인이 필요하거나 세션이 만료되었습니다
            </h2>
            <p className="text-xs sm:text-sm text-[#A3A3A3] leading-relaxed">
              {(authError as any)?.message || '사용자 프로필 정보를 안전하게 불러오지 못했습니다. 계정 정보를 갱신해 주세요.'}
            </p>
          </div>
          <div className="pt-2 flex justify-center">
            <button
              type="button"
              onClick={() => setAuthModalOpen(true, 'login')}
              className="min-h-[44px] px-6 py-3 rounded-xl bg-[#FFD700] hover:bg-[#E6C200] text-black font-black text-xs transition-colors flex items-center gap-2 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFD700]"
            >
              <LogIn className="w-4 h-4" />
              <span>로그인하기</span>
            </button>
          </div>
        </section>
      ) : (
        <section
          aria-label="사용자 프로필 대시보드"
          className="relative overflow-hidden rounded-2xl bg-[#141414] border border-[#262626] p-6 sm:p-8 shadow-xl"
        >
          {/* Subtle decorative background glow */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-[#FFD700]/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            {/* Avatar and User Info */}
            <div className="flex items-center gap-5">
              {/* Review Finding #5: Corrected avatar sizing w-16 h-16 sm:w-20 sm:h-20 */}
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#1F1F1F] border-2 border-[#FFD700]/40 flex items-center justify-center text-2xl sm:text-3xl font-black text-[#FFD700] shadow-lg shadow-[#FFD700]/10 shrink-0">
                {userInitial}
              </div>

              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                    {isAuthLoading ? (
                      <span className="inline-block w-32 h-8 bg-[#262626] rounded animate-pulse" />
                    ) : (
                      userName
                    )}
                  </h1>

                  {/* Racer Badges */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-[#FFD700]/10 text-[#FFD700] border border-[#FFD700]/30 shadow-sm"
                      title="HYROX 공식 완주자"
                    >
                      <span>🏅</span>
                      <span>HYROX Finisher</span>
                    </span>
                    <span
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-[#CCFF00]/10 text-[#CCFF00] border border-[#CCFF00]/30 shadow-sm"
                      title="공식 등록 레이서"
                    >
                      <Zap className="w-3.5 h-3.5 fill-[#CCFF00]" />
                      <span>Official Racer</span>
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs sm:text-sm text-[#A3A3A3]">
                  <span>{userEmail}</span>
                  <span className="hidden sm:inline text-[#333333]">&bull;</span>
                  <span className="flex items-center gap-1 text-[#8A8A8A]">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>가입일: {joinDate}</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons: Edit Profile, Logout, Delete Account */}
            <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
              <button
                type="button"
                onClick={() => setEditProfileOpen(true)}
                className="min-h-[44px] px-3.5 py-2 rounded-xl bg-[#1F1F1F] hover:bg-[#262626] border border-[#333333] hover:border-[#FFD700]/50 text-neutral-200 text-xs font-bold transition-colors flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFD700]"
                aria-label="내 정보 수정"
              >
                <Settings className="w-3.5 h-3.5 text-[#FFD700]" />
                <span>내 정보 수정</span>
              </button>

              <button
                type="button"
                onClick={() => logout()}
                className="min-h-[44px] px-3.5 py-2 rounded-xl bg-[#1F1F1F] hover:bg-neutral-800 border border-[#333333] text-neutral-300 hover:text-white text-xs font-semibold transition-colors flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-500"
                aria-label="로그아웃"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>로그아웃</span>
              </button>

              <button
                type="button"
                onClick={() => setDeleteAccountOpen(true)}
                className="min-h-[44px] px-3 py-2 rounded-xl text-neutral-500 hover:text-rose-400 hover:bg-rose-500/10 text-xs font-medium transition-colors flex items-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
                aria-label="회원탈퇴"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>회원탈퇴</span>
              </button>
            </div>
          </div>

          {/* 3 Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-8 border-t border-[#262626] mt-6">
            {/* Stat 1: Total Orders */}
            <button
              type="button"
              onClick={() => setActiveTab('orders')}
              aria-label={`총 주문 내역 ${orders.length}건 보기`}
              className={`rounded-xl p-4 text-left transition-all border flex items-center justify-between group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFD700] ${
                activeTab === 'orders'
                  ? 'bg-[#1A1A1A] border-[#FFD700]/50 shadow-md shadow-[#FFD700]/5'
                  : 'bg-[#1F1F1F]/50 border-[#262626] hover:border-[#333333] hover:bg-[#1F1F1F]'
              }`}
            >
              <div className="space-y-1">
                <span className="text-xs font-medium text-[#A3A3A3] block">총 주문 내역</span>
                <div className="flex items-baseline gap-1">
                  {isOrdersLoading ? (
                    <span className="inline-block w-10 h-7 bg-[#262626] rounded animate-pulse" />
                  ) : isOrdersError ? (
                    <span className="text-sm font-bold text-rose-400">-</span>
                  ) : (
                    <span className="text-2xl font-black text-white group-hover:text-[#FFD700] transition-colors">
                      {orders.length}
                    </span>
                  )}
                  <span className="text-xs text-[#8A8A8A]">건</span>
                </div>
              </div>
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center transition-colors ${
                activeTab === 'orders' ? 'bg-[#FFD700]/10 text-[#FFD700]' : 'bg-[#262626] text-[#A3A3A3] group-hover:text-white'
              }`}>
                <ShoppingBag className="w-5 h-5" />
              </div>
            </button>

            {/* Stat 2: Interested Events */}
            <button
              type="button"
              onClick={() => setActiveTab('events')}
              aria-label={`관심 대회 ${interestedEvents.length}개 보기`}
              className={`rounded-xl p-4 text-left transition-all border flex items-center justify-between group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFD700] ${
                activeTab === 'events'
                  ? 'bg-[#1A1A1A] border-[#FFD700]/50 shadow-md shadow-[#FFD700]/5'
                  : 'bg-[#1F1F1F]/50 border-[#262626] hover:border-[#333333] hover:bg-[#1F1F1F]'
              }`}
            >
              <div className="space-y-1">
                <span className="text-xs font-medium text-[#A3A3A3] block">관심 대회</span>
                <div className="flex items-baseline gap-1">
                  {isEventsLoading ? (
                    <span className="inline-block w-10 h-7 bg-[#262626] rounded animate-pulse" />
                  ) : isEventsError ? (
                    <span className="text-sm font-bold text-rose-400">-</span>
                  ) : (
                    <span className="text-2xl font-black text-white group-hover:text-[#FFD700] transition-colors">
                      {interestedEvents.length}
                    </span>
                  )}
                  <span className="text-xs text-[#8A8A8A]">개</span>
                </div>
              </div>
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center transition-colors ${
                activeTab === 'events' ? 'bg-[#FFD700]/10 text-[#FFD700]' : 'bg-[#262626] text-[#A3A3A3] group-hover:text-white'
              }`}>
                <Trophy className="w-5 h-5" />
              </div>
            </button>

            {/* Stat 3: User Posts */}
            <button
              type="button"
              onClick={() => setActiveTab('posts')}
              aria-label={`작성한 후기 ${userPosts.length}개 보기`}
              className={`rounded-xl p-4 text-left transition-all border flex items-center justify-between group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFD700] ${
                activeTab === 'posts'
                  ? 'bg-[#1A1A1A] border-[#FFD700]/50 shadow-md shadow-[#FFD700]/5'
                  : 'bg-[#1F1F1F]/50 border-[#262626] hover:border-[#333333] hover:bg-[#1F1F1F]'
              }`}
            >
              <div className="space-y-1">
                <span className="text-xs font-medium text-[#A3A3A3] block">작성한 후기</span>
                <div className="flex items-baseline gap-1">
                  {/* Review Finding #2: Use isPostsPending */}
                  {isPostsPending ? (
                    <span className="inline-block w-10 h-7 bg-[#262626] rounded animate-pulse" />
                  ) : isPostsError ? (
                    <span className="text-sm font-bold text-rose-400">-</span>
                  ) : (
                    <span className="text-2xl font-black text-white group-hover:text-[#FFD700] transition-colors">
                      {userPosts.length}
                    </span>
                  )}
                  <span className="text-xs text-[#8A8A8A]">개</span>
                </div>
              </div>
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center transition-colors ${
                activeTab === 'posts' ? 'bg-[#FFD700]/10 text-[#FFD700]' : 'bg-[#262626] text-[#A3A3A3] group-hover:text-white'
              }`}>
                <MessageSquare className="w-5 h-5" />
              </div>
            </button>
          </div>
        </section>
      )}

      {/* 2. 3-Tab Navigation Bar with WAI-ARIA Semantics */}
      <div
        role="tablist"
        aria-label="마이페이지 메뉴 탭"
        className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-[#262626] scrollbar-none"
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              role="tab"
              id={`tab-${tab.id}`}
              aria-selected={isActive}
              aria-controls={`panel-${tab.id}`}
              tabIndex={isActive ? 0 : -1}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`min-h-[44px] px-5 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2.5 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFD700] active:scale-[0.98] ${
                isActive
                  ? 'bg-[#FFD700] text-black shadow-md shadow-[#FFD700]/20'
                  : 'bg-[#141414] border border-[#262626] text-[#A3A3A3] hover:text-white hover:bg-[#1F1F1F]'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-black' : 'text-[#A3A3A3]'}`} />
              <span>{tab.label}</span>
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-black ${
                  isActive ? 'bg-black/15 text-black' : 'bg-[#262626] text-[#A3A3A3]'
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* 3. Tab Contents with WAI-ARIA tabpanel */}
      <div className="pt-2">
        {/* Tab 1: Orders */}
        <div
          role="tabpanel"
          id="panel-orders"
          aria-labelledby="tab-orders"
          hidden={activeTab !== 'orders'}
          className={activeTab === 'orders' ? 'space-y-6' : 'hidden'}
        >
          {isOrdersLoading ? (
            <div className="space-y-4 animate-pulse">
              {[1, 2].map((i) => (
                <div key={i} className="h-44 rounded-2xl bg-[#141414] border border-[#262626]" />
              ))}
            </div>
          ) : isOrdersError ? (
            /* Review Finding #4: Orders Error State */
            <div className="py-12 px-4 text-center rounded-2xl bg-[#141414] border border-[#262626] flex flex-col items-center justify-center space-y-4">
              <div className="w-14 h-14 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                <AlertCircle className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-white">주문 내역을 불러오지 못했습니다</h3>
                <p className="text-xs text-[#A3A3A3]">네트워크 상태를 확인하고 다시 시도해 주세요.</p>
              </div>
              <button
                type="button"
                onClick={() => refetchOrders()}
                className="min-h-[44px] px-5 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-bold transition-colors flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFD700]"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>다시 시도</span>
              </button>
            </div>
          ) : orders.length === 0 ? (
            /* Empty State for Orders */
            <div className="py-16 px-4 text-center rounded-2xl bg-[#141414] border border-[#262626] flex flex-col items-center justify-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-[#1F1F1F] border border-[#333333] flex items-center justify-center text-[#A3A3A3]">
                <ShoppingBag className="w-8 h-8 text-[#FFD700]" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-white">주문 내역이 없습니다</h3>
                <p className="text-sm text-[#A3A3A3] max-w-sm">
                  HYROX 완주를 위한 공식 장비를 둘러보고 장바구니에 담아보세요.
                </p>
              </div>
              <Link
                href="/products"
                className="min-h-[44px] px-6 py-3 rounded-xl bg-[#FFD700] hover:bg-[#E6C200] text-black font-black text-sm transition-colors flex items-center gap-2 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFD700]"
              >
                <ShoppingBag className="w-4 h-4 stroke-[2.5]" />
                <span>장비몰 둘러보기</span>
              </Link>
            </div>
          ) : (
            /* Orders List */
            <div className="space-y-5">
              {orders.map((order) => {
                const badge = getOrderStatusBadge(order.status);
                const items = order.orderItems || [];
                return (
                  <article
                    key={order.id}
                    className="rounded-2xl bg-[#141414] border border-[#262626] p-5 sm:p-6 space-y-4 hover:border-[#333333] transition-all"
                  >
                    {/* Order Header */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pb-3.5 border-b border-[#262626]">
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-bold text-white text-sm sm:text-base">
                          주문 #{order.id}
                        </span>
                        <span className="text-xs text-[#8A8A8A] flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{formatDateTime(order.createdAt)}</span>
                        </span>
                      </div>
                      <span className={`text-xs font-bold px-3 py-1 rounded-full border ${badge.classes}`}>
                        {badge.label}
                      </span>
                    </div>

                    {/* Ordered Items (defensive mapping) */}
                    <div className="space-y-2.5">
                      {items.map((item) => {
                        const hasImg = !!item.product?.imageUrl && !imgErrors[item.id];
                        return (
                          <div
                            key={item.id}
                            className="flex items-center justify-between gap-4 p-3 rounded-xl bg-[#1A1A1A]/80 border border-[#262626]/80 hover:border-neutral-700 transition-colors"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-14 h-14 rounded-lg bg-[#141414] border border-[#262626] overflow-hidden shrink-0 flex items-center justify-center aspect-square">
                                {hasImg ? (
                                  <Image
                                    src={item.product!.imageUrl!}
                                    alt={item.product?.name || '상품 이미지'}
                                    width={56}
                                    height={56}
                                    className="w-full h-full object-cover"
                                    unoptimized
                                    onError={() => setImgErrors((prev) => ({ ...prev, [item.id]: true }))}
                                  />
                                ) : (
                                  <Package className="w-6 h-6 text-[#8A8A8A]" />
                                )}
                              </div>
                              <div className="min-w-0">
                                <Link
                                  href={`/products/${item.productId}`}
                                  className="text-sm font-semibold text-white hover:text-[#FFD700] transition-colors truncate block max-w-[200px] sm:max-w-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFD700] rounded"
                                  title={item.product?.name || `상품 ID: ${item.productId}`}
                                >
                                  {item.product?.name || `상품 ID: ${item.productId}`}
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

                    {/* Order Footer: Total Amount */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#262626]">
                      <div className="text-xs text-[#8A8A8A]">
                        {order.paymentKey && (
                          <span className="font-mono text-[11px] text-[#8A8A8A]" title={order.paymentKey}>
                            결제키: {order.paymentKey.slice(0, 18)}...
                          </span>
                        )}
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-xs sm:text-sm font-medium text-[#A3A3A3]">총 결제 금액</span>
                        <span className="text-xl sm:text-2xl font-black text-[#FFD700]">
                          {Number(order.totalAmount).toLocaleString()}
                        </span>
                        <span className="text-xs font-normal text-white">원</span>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>

        {/* Tab 2: Interested Events */}
        <div
          role="tabpanel"
          id="panel-events"
          aria-labelledby="tab-events"
          hidden={activeTab !== 'events'}
          className={activeTab === 'events' ? 'space-y-6' : 'hidden'}
        >
          {isEventsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-64 rounded-2xl bg-[#141414] border border-[#262626]" />
              ))}
            </div>
          ) : isEventsError ? (
            /* Review Finding #4: Events Error State */
            <div className="py-12 px-4 text-center rounded-2xl bg-[#141414] border border-[#262626] flex flex-col items-center justify-center space-y-4">
              <div className="w-14 h-14 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                <AlertCircle className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-white">관심 대회 목록을 불러오지 못했습니다</h3>
                <p className="text-xs text-[#A3A3A3]">네트워크 상태를 확인하고 다시 시도해 주세요.</p>
              </div>
              <button
                type="button"
                onClick={() => refetchEvents()}
                className="min-h-[44px] px-5 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-bold transition-colors flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFD700]"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>다시 시도</span>
              </button>
            </div>
          ) : interestedEvents.length === 0 ? (
            /* Empty State for Interested Events */
            <div className="py-16 px-4 text-center rounded-2xl bg-[#141414] border border-[#262626] flex flex-col items-center justify-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-[#1F1F1F] border border-[#333333] flex items-center justify-center text-[#A3A3A3]">
                <Trophy className="w-8 h-8 text-[#FFD700]" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-white">관심 등록된 대회가 없습니다</h3>
                <p className="text-sm text-[#A3A3A3] max-w-sm">
                  다가오는 2026 HYROX 서울, 인천 송도 대회 일정을 확인하고 관심 대회로 등록하세요.
                </p>
              </div>
              <Link
                href="/events"
                className="min-h-[44px] px-6 py-3 rounded-xl bg-[#FFD700] hover:bg-[#E6C200] text-black font-black text-sm transition-colors flex items-center gap-2 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFD700]"
              >
                <Trophy className="w-4 h-4" />
                <span>대회 일정 둘러보기</span>
              </Link>
            </div>
          ) : (
            /* Interested Events Grid */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {interestedEvents.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  isInterested={true}
                  onToggleInterest={(id) => toggleInterestMutation.mutate(id)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Tab 3: User Posts */}
        <div
          role="tabpanel"
          id="panel-posts"
          aria-labelledby="tab-posts"
          hidden={activeTab !== 'posts'}
          className={activeTab === 'posts' ? 'space-y-6' : 'hidden'}
        >
          {/* Review Finding #2: Use isPostsPending to prevent FOES */}
          {isPostsPending ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 animate-pulse">
              {[1, 2].map((i) => (
                <div key={i} className="h-56 rounded-xl bg-[#141414] border border-[#262626]" />
              ))}
            </div>
          ) : isPostsError ? (
            /* Review Finding #4: Posts Error State */
            <div className="py-12 px-4 text-center rounded-2xl bg-[#141414] border border-[#262626] flex flex-col items-center justify-center space-y-4">
              <div className="w-14 h-14 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                <AlertCircle className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-white">후기 목록을 불러오지 못했습니다</h3>
                <p className="text-xs text-[#A3A3A3]">네트워크 상태를 확인하고 다시 시도해 주세요.</p>
              </div>
              <button
                type="button"
                onClick={() => refetchPosts()}
                className="min-h-[44px] px-5 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-bold transition-colors flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFD700]"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>다시 시도</span>
              </button>
            </div>
          ) : userPosts.length === 0 ? (
            /* Empty State for User Posts */
            <div className="py-16 px-4 text-center rounded-2xl bg-[#141414] border border-[#262626] flex flex-col items-center justify-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-[#1F1F1F] border border-[#333333] flex items-center justify-center text-[#A3A3A3]">
                <MessageSquare className="w-8 h-8 text-[#FFD700]" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-white">작성한 후기가 없습니다</h3>
                <p className="text-sm text-[#A3A3A3] max-w-sm">
                  참가한 대회의 완주 기록과 사용한 장비 팁을 커뮤니티 레이서들과 공유해보세요.
                </p>
              </div>
              <Link
                href="/community/new"
                className="min-h-[44px] px-6 py-3 rounded-xl bg-[#FFD700] hover:bg-[#E6C200] text-black font-black text-sm transition-colors flex items-center gap-2 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFD700]"
              >
                <PenLine className="w-4 h-4 stroke-[2.5]" />
                <span>완주 후기 작성하기</span>
              </Link>
            </div>
          ) : (
            /* User Posts Grid */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {userPosts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Edit Profile Modal */}
      <EditProfileModal
        isOpen={editProfileOpen}
        onClose={() => {
          setEditProfileOpen(false);
          refetchAuth();
        }}
        currentName={userName}
        currentEmail={userEmail}
      />

      {/* Delete Account Modal */}
      <DeleteAccountModal
        isOpen={deleteAccountOpen}
        onClose={() => setDeleteAccountOpen(false)}
      />
    </div>
  );
}
