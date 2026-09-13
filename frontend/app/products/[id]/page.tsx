'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchApi } from '@/lib/api';
import { useCartStore } from '@/stores/useCartStore';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowLeft,
  Star,
  ShoppingCart,
  ShieldCheck,
  Truck,
  RotateCcw,
  MessageSquare,
  Check,
  ChevronRight,
  Package,
} from 'lucide-react';

interface Review {
  id: string;
  rating: number;
  content: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
  };
}

interface TaggedPost {
  postId: string;
  productId: string;
  post: {
    id: string;
    title: string;
    createdAt: string;
  };
}

interface ProductDetail {
  id: string;
  name: string;
  description: string;
  categoryId: string;
  price: number;
  stockQuantity: number;
  imageUrl?: string | null;
  brandLogoUrl?: string | null;
  detailImageUrl?: string | null;
  reviews: Review[];
  taggedPosts: TaggedPost[];
}

const CATEGORY_NAMES: Record<string, string> = {
  shoes: '공식 레이싱화 (SHOES)',
  nutrition: '에너지 & 뉴트리션 (NUTRITION)',
  gear: '보호대 & 그립장비 (GEAR)',
  equipment: '대회 공인 스테이션 장비 (EQUIPMENT)',
};

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const productId = params.id as string;

  const [quantity, setQuantity] = useState(1);
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [newReviewContent, setNewReviewContent] = useState('');
  const [isAdded, setIsAdded] = useState(false);
  const [imgError, setImgError] = useState(false);

  const addItem = useCartStore((state) => state.addItem);

  const { data, isLoading, error } = useQuery<{ success: boolean; product: ProductDetail }>({
    queryKey: ['product', productId],
    queryFn: () => fetchApi(`/api/v1/products/${productId}`),
    enabled: !!productId,
  });

  const reviewMutation = useMutation({
    mutationFn: (newReview: { rating: number; content: string }) =>
      fetchApi(`/api/v1/products/${productId}/reviews`, {
        method: 'POST',
        body: JSON.stringify(newReview),
      }),
    onSuccess: () => {
      setNewReviewContent('');
      queryClient.invalidateQueries({ queryKey: ['product', productId] });
      alert('리뷰가 성공적으로 등록되었습니다.');
    },
    onError: (err: any) => {
      alert(err.message || '리뷰 등록에 실패했습니다. 로그인이 필요합니다.');
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-8 max-w-5xl mx-auto animate-pulse">
        <div className="h-6 w-32 bg-neutral-800 rounded" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <div className="aspect-square bg-neutral-900 rounded-3xl border border-neutral-800" />
          <div className="space-y-6">
            <div className="h-6 w-24 bg-neutral-800 rounded" />
            <div className="h-10 w-3/4 bg-neutral-800 rounded" />
            <div className="h-8 w-1/3 bg-neutral-800 rounded" />
            <div className="h-24 bg-neutral-800 rounded-2xl" />
            <div className="h-12 w-full bg-neutral-800 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !data?.product) {
    return (
      <div className="p-12 text-center rounded-2xl bg-neutral-900 border border-neutral-800 text-neutral-400 space-y-4 max-w-md mx-auto">
        <p className="text-base font-semibold text-white">상품 정보를 찾을 수 없습니다.</p>
        <button
          onClick={() => router.push('/products')}
          className="px-5 py-2.5 rounded-xl bg-[#FFD700] hover:bg-yellow-400 text-black text-xs font-bold transition-colors"
        >
          장비몰 목록으로 돌아가기
        </button>
      </div>
    );
  }

  const product = data.product;
  const reviews = product.reviews || [];
  const taggedPosts = product.taggedPosts || [];
  const isOutOfStock = product.stockQuantity <= 0;
  const isLowStock = product.stockQuantity > 0 && product.stockQuantity <= 5;
  const displayImage = product.detailImageUrl || product.imageUrl;
  const hasValidImage = !!displayImage && !imgError;
  const categoryTitle = CATEGORY_NAMES[product.categoryId.toLowerCase()] || product.categoryId.toUpperCase();

  const averageRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 5.0;

  const handleAddToCart = () => {
    if (isOutOfStock) return;
    addItem(
      {
        productId: product.id,
        name: product.name,
        price: product.price,
        categoryId: product.categoryId,
        imageUrl: product.imageUrl || undefined,
        stockQuantity: product.stockQuantity,
      },
      quantity
    );
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2000);
  };

  const handleBuyNow = () => {
    if (isOutOfStock) return;
    handleAddToCart();
    router.push('/checkout');
  };

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReviewContent.trim()) return;
    reviewMutation.mutate({
      rating: newReviewRating,
      content: newReviewContent.trim(),
    });
  };

  return (
    <div className="space-y-10 max-w-5xl mx-auto pb-12">
      {/* Back Navigation Bar */}
      <Link
        href="/products"
        className="inline-flex items-center space-x-2 text-xs font-bold text-neutral-400 hover:text-white transition-colors min-h-[44px]"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>레이서 장비몰 목록으로</span>
      </Link>

      {/* Main Product Showcase Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
        {/* Left Column: 1:1 Cloudinary Image Viewer (CLS 0) */}
        <div className="space-y-4">
          <div className="relative aspect-square w-full rounded-3xl bg-[#141414] border border-[#262626] overflow-hidden shadow-2xl">
            {hasValidImage ? (
              <Image
                src={displayImage!}
                alt={product.name}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover w-full h-full"
                onError={() => setImgError(true)}
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-neutral-900 to-neutral-950 text-neutral-600 p-8">
                <Package className="w-16 h-16 stroke-1 text-[#FFD700]/40 mb-3" />
                <span className="text-xs font-black tracking-widest text-neutral-400 uppercase">
                  HYROX OFFICIAL MERCHANDISE
                </span>
              </div>
            )}

            {/* Category Tag Overlay */}
            <div className="absolute top-4 left-4 z-10">
              <span className="px-3 py-1 rounded-full bg-black/80 backdrop-blur-md text-[#FFD700] border border-[#FFD700]/30 text-xs font-black uppercase tracking-wider shadow-md">
                {product.categoryId.toUpperCase()}
              </span>
            </div>

            {/* Official Guarantee Badge Overlay */}
            <div className="absolute bottom-4 left-4 right-4 z-10">
              <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-black/85 backdrop-blur-md border border-neutral-700 text-neutral-200 text-xs font-semibold shadow-lg">
                <ShieldCheck className="w-4 h-4 text-[#FFD700] shrink-0" />
                <span>본사 직매입 100% 정품 보증</span>
              </div>
            </div>
          </div>

          {/* Delivery & Trust Benefits Banner */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 rounded-2xl bg-[#141414] border border-[#262626] flex items-center space-x-2.5 text-xs text-neutral-300">
              <Truck className="w-4 h-4 text-[#FFD700] shrink-0" />
              <span className="text-[11px] leading-tight">
                오후 2시 이전 주문 시 <strong>당일 무료 발송</strong>
              </span>
            </div>
            <div className="p-3.5 rounded-2xl bg-[#141414] border border-[#262626] flex items-center space-x-2.5 text-xs text-neutral-300">
              <RotateCcw className="w-4 h-4 text-[#FFD700] shrink-0" />
              <span className="text-[11px] leading-tight">
                사이즈 미스 시 <strong>무료 교환 / 반품</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Details, Stock, Quantity & Purchase CTAs */}
        <div className="space-y-6 flex flex-col justify-between">
          <div className="space-y-5">
            {/* Category & Stock Badges */}
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-neutral-400 uppercase tracking-wide">
                {categoryTitle}
              </span>
              {isOutOfStock ? (
                <span className="px-3 py-1 rounded-full text-xs font-black bg-rose-950/80 text-rose-400 border border-rose-800/50">
                  품절 (재입고 준비중)
                </span>
              ) : isLowStock ? (
                <span className="px-3 py-1 rounded-full text-xs font-black bg-amber-950/85 text-amber-400 border border-amber-600/50 animate-pulse">
                  품절 임박: 남은 재고 {product.stockQuantity}개
                </span>
              ) : (
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-neutral-800 text-neutral-300 border border-neutral-700">
                  남은 재고: <strong className="text-white font-bold">{product.stockQuantity}</strong>개
                </span>
              )}
            </div>

            {/* Product Title */}
            <h1 className="text-2xl sm:text-3xl font-black text-white leading-tight tracking-tight">
              {product.name}
            </h1>

            {/* Rating Stars Summary */}
            <div className="flex items-center space-x-2 text-sm text-neutral-400">
              <div className="flex items-center space-x-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-4 h-4 ${
                      star <= Math.round(averageRating)
                        ? 'fill-[#FFD700] text-[#FFD700]'
                        : 'text-neutral-700'
                    }`}
                  />
                ))}
              </div>
              <span className="font-extrabold text-white">{averageRating.toFixed(1)}</span>
              <span>·</span>
              <span className="text-xs text-neutral-400">실구매 리뷰 {reviews.length}개</span>
            </div>

            {/* Price */}
            <div className="text-3xl sm:text-4xl font-black text-[#FFD700] tracking-tight">
              {product.price.toLocaleString('ko-KR')}
              <span className="text-lg font-normal text-neutral-400 ml-1">원</span>
            </div>

            {/* Description */}
            <div className="pt-4 border-t border-[#262626]">
              <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">
                장비 상세 스펙 & 레이스 활용팁
              </h3>
              <p className="text-sm sm:text-base text-neutral-300 leading-relaxed whitespace-pre-line">
                {product.description || '공식 대회 규격을 충족하는 HYROX 인증 장비입니다.'}
              </p>
            </div>
          </div>

          {/* Action Box: Quantity & Purchase CTAs */}
          <div className="space-y-4 pt-6 border-t border-[#262626]">
            {/* Quantity Controller */}
            <div className="flex items-center justify-between bg-[#141414] border border-[#262626] rounded-2xl p-3">
              <span className="text-xs font-bold text-neutral-300">구매 수량</span>
              <div className="flex items-center border border-neutral-700 rounded-xl bg-neutral-900 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  disabled={quantity <= 1 || isOutOfStock}
                  aria-label="수량 1 감소"
                  className="min-w-[44px] min-h-[44px] flex items-center justify-center text-base font-bold text-neutral-300 hover:bg-neutral-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  -
                </button>
                <span className="min-w-[44px] text-center text-sm font-black text-white">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.min(product.stockQuantity, q + 1))}
                  disabled={quantity >= product.stockQuantity || isOutOfStock}
                  aria-label="수량 1 증가"
                  className="min-w-[44px] min-h-[44px] flex items-center justify-center text-base font-bold text-neutral-300 hover:bg-neutral-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  +
                </button>
              </div>
            </div>

            {/* Dual Action CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-3">
              {/* Add to Cart Button */}
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={isOutOfStock}
                className={`w-full sm:flex-1 min-h-[52px] px-5 rounded-xl text-xs font-extrabold flex items-center justify-center space-x-2 transition-all duration-150 border ${
                  isAdded
                    ? 'bg-green-600 border-green-600 text-white shadow-lg shadow-green-600/30'
                    : isOutOfStock
                    ? 'bg-neutral-900 border-neutral-800 text-neutral-600 cursor-not-allowed'
                    : 'bg-[#141414] border-neutral-700 hover:border-[#FFD700] text-neutral-200 hover:text-[#FFD700]'
                }`}
              >
                {isAdded ? (
                  <>
                    <Check className="w-4 h-4 stroke-[2.5]" />
                    <span>장바구니에 담김!</span>
                  </>
                ) : (
                  <>
                    <ShoppingCart className="w-4 h-4" />
                    <span>장바구니 담기</span>
                  </>
                )}
              </button>

              {/* Buy Now CTA */}
              <button
                type="button"
                onClick={handleBuyNow}
                disabled={isOutOfStock}
                className="w-full sm:flex-1 min-h-[52px] px-5 rounded-xl bg-[#FFD700] hover:bg-yellow-400 text-black text-xs font-black transition-all shadow-lg shadow-yellow-500/10 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center space-x-1.5"
              >
                <span>토스로 바로 구매</span>
                <ChevronRight className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Community Racer Tagged Posts Section */}
      <div className="space-y-4 pt-10 border-t border-neutral-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <MessageSquare className="w-5 h-5 text-[#FFD700]" />
            <h2 className="text-lg sm:text-xl font-black text-white">이 장비를 착용한 레이서들의 후기</h2>
          </div>
          {taggedPosts.length > 0 && (
            <span className="text-xs text-neutral-400">총 {taggedPosts.length}개의 완주 기록</span>
          )}
        </div>

        {taggedPosts.length === 0 ? (
          <div className="p-8 rounded-2xl bg-[#141414] border border-[#262626] text-center space-y-3">
            <p className="text-sm text-neutral-400">
              아직 이 장비가 태그된 커뮤니티 후기가 없습니다. 첫 완주 후기를 공유해 보세요!
            </p>
            <Link
              href="/community"
              className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-bold transition-colors min-h-[44px]"
            >
              <span>커뮤니티 둘러보기</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {taggedPosts.map((tp) => (
              <Link
                key={tp.postId}
                href={`/community/${tp.post.id}`}
                className="p-5 rounded-2xl bg-[#141414] border border-[#262626] hover:border-[#FFD700]/50 hover:shadow-lg transition-all group block"
              >
                <div className="flex items-center justify-between text-xs text-neutral-400 mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#FFD700] bg-[#FFD700]/10 px-2 py-0.5 rounded">
                    VERIFIED RACER
                  </span>
                  <span>{new Date(tp.post.createdAt).toLocaleDateString('ko-KR')}</span>
                </div>
                <h3 className="text-sm font-bold text-white group-hover:text-[#FFD700] transition-colors line-clamp-2 leading-snug">
                  {tp.post.title}
                </h3>
                <div className="mt-3 text-xs text-neutral-400 group-hover:text-neutral-200 flex items-center space-x-1">
                  <span>완주 스토리 읽기</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Verified Buyer Reviews Section */}
      <div className="space-y-6 pt-10 border-t border-neutral-800">
        <div className="flex items-center justify-between">
          <h2 className="text-lg sm:text-xl font-black text-white flex items-center space-x-2">
            <span>실구매자 리뷰</span>
            <span className="text-[#FFD700]">({reviews.length})</span>
          </h2>
          <div className="text-xs text-neutral-400">
            평균 평점 <strong className="text-[#FFD700] font-bold">{averageRating.toFixed(1)}</strong> / 5.0
          </div>
        </div>

        {/* Review Form */}
        <form
          onSubmit={handleSubmitReview}
          className="p-6 rounded-2xl bg-[#141414] border border-[#262626] space-y-4"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <span className="text-xs font-bold text-neutral-200">실제 레이스 장비 리뷰 작성</span>
            <div className="flex items-center space-x-1">
              <span className="text-xs text-neutral-400 mr-2">별점 선택:</span>
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setNewReviewRating(star)}
                  className="p-1 min-w-[36px] min-h-[36px] flex items-center justify-center text-neutral-600 hover:text-[#FFD700] transition-colors"
                  aria-label={`${star}점 부여`}
                >
                  <Star
                    className={`w-5 h-5 ${
                      star <= newReviewRating ? 'fill-[#FFD700] text-[#FFD700]' : 'text-neutral-700'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          <textarea
            value={newReviewContent}
            onChange={(e) => setNewReviewContent(e.target.value)}
            placeholder="실제 대회나 훈련에서 장비를 착용/사용해 본 솔직한 후기를 남겨주세요. (접지력, 내구성, 착용감 등)"
            rows={3}
            className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#FFD700] focus:ring-1 focus:ring-[#FFD700] transition-colors leading-relaxed"
          />

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={reviewMutation.isPending || !newReviewContent.trim()}
              className="min-h-[44px] px-5 py-2.5 rounded-xl bg-[#FFD700] hover:bg-yellow-400 text-black text-xs font-black disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-md shadow-yellow-500/10"
            >
              {reviewMutation.isPending ? '리뷰 등록 중...' : '리뷰 등록'}
            </button>
          </div>
        </form>

        {/* Review List */}
        {reviews.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-[#141414] border border-[#262626] text-neutral-400 text-xs">
            아직 작성된 실구매자 리뷰가 없습니다. 첫 번째 리뷰어가 되어보세요!
          </div>
        ) : (
          <div className="space-y-3">
            {reviews.map((rev) => (
              <div
                key={rev.id}
                className="p-5 rounded-2xl bg-[#141414] border border-[#262626] space-y-2.5"
              >
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-white">{rev.user.name}</span>
                    <span className="text-[10px] text-green-400 bg-green-500/10 px-2 py-0.5 rounded font-semibold">
                      구매 인증
                    </span>
                  </div>
                  <div className="flex items-center space-x-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`w-3.5 h-3.5 ${
                          s <= rev.rating ? 'fill-[#FFD700] text-[#FFD700]' : 'text-neutral-700'
                        }`}
                      />
                    ))}
                    <span className="text-neutral-500 text-[11px] ml-2">
                      {new Date(rev.createdAt).toLocaleDateString('ko-KR')}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-neutral-300 leading-relaxed whitespace-pre-line">
                  {rev.content}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
