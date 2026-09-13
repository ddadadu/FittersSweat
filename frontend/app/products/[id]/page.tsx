'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchApi } from '@/lib/api';
import { useCartStore } from '@/stores/useCartStore';
import Link from 'next/link';
import { ArrowLeft, Star, ShoppingCart, ShieldCheck, Truck, MessageSquare, Plus, Check } from 'lucide-react';

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
  reviews: Review[];
  taggedPosts: TaggedPost[];
}

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const productId = params.id as string;

  const [quantity, setQuantity] = useState(1);
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [newReviewContent, setNewReviewContent] = useState('');
  const [isAdded, setIsAdded] = useState(false);

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
      <div className="space-y-6 animate-pulse">
        <div className="h-6 w-32 bg-neutral-800 rounded" />
        <div className="h-96 bg-neutral-900 rounded-3xl border border-neutral-800" />
      </div>
    );
  }

  if (error || !data?.product) {
    return (
      <div className="p-12 text-center rounded-2xl bg-neutral-900 border border-neutral-800 text-neutral-400 space-y-4">
        <p>상품 정보를 찾을 수 없습니다.</p>
        <button
          onClick={() => router.back()}
          className="px-4 py-2 rounded-xl bg-neutral-800 text-white text-sm font-bold"
        >
          돌아가기
        </button>
      </div>
    );
  }

  const product = data.product;

  const handleAddToCart = () => {
    addItem(
      {
        productId: product.id,
        name: product.name,
        price: product.price,
        categoryId: product.categoryId,
      },
      quantity
    );
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2000);
  };

  const handleBuyNow = () => {
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
    <div className="space-y-10 max-w-5xl mx-auto">
      {/* Back button */}
      <Link
        href="/products"
        className="inline-flex items-center space-x-1.5 text-xs font-semibold text-neutral-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>상품 목록으로</span>
      </Link>

      {/* Main Product Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Visual Box */}
        <div className="rounded-3xl bg-neutral-900 border border-neutral-800 p-8 flex flex-col items-center justify-center min-h-[380px] text-center space-y-4">
          <div className="w-20 h-20 rounded-full bg-[#FFD700]/10 text-[#FFD700] flex items-center justify-center font-black text-2xl">
            HYROX
          </div>
          <div className="space-y-1">
            <span className="text-xs font-bold tracking-widest text-neutral-400 uppercase">
              {product.categoryId}
            </span>
            <h2 className="text-xl font-black text-white">{product.name}</h2>
          </div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-neutral-800 text-neutral-300 text-xs font-semibold">
            <ShieldCheck className="w-3.5 h-3.5 text-green-400" />
            <span>본사 직매입 100% 정품 인증</span>
          </div>
        </div>

        {/* Info & Purchase Actions */}
        <div className="space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="px-3 py-1 rounded-lg bg-neutral-800 text-neutral-300 text-xs font-bold uppercase">
                {product.categoryId}
              </span>
              <span className="text-xs text-neutral-400">
                남은 재고: <strong className="text-white">{product.stockQuantity}</strong>개
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white leading-tight">
              {product.name}
            </h1>

            <div className="text-3xl font-black text-[#FFD700]">
              {product.price.toLocaleString('ko-KR')}
              <span className="text-base font-normal text-neutral-400 ml-1">원</span>
            </div>

            <p className="text-sm text-neutral-300 leading-relaxed pt-2 border-t border-neutral-800">
              {product.description}
            </p>

            <div className="p-4 rounded-2xl bg-neutral-900/70 border border-neutral-800 flex items-center space-x-3 text-xs text-neutral-300">
              <Truck className="w-5 h-5 text-[#FFD700] flex-shrink-0" />
              <span>평일 오후 2시 이전 주문 시 <strong>당일 발송 (무료 배송)</strong></span>
            </div>
          </div>

          {/* Action Box */}
          <div className="space-y-4 pt-6 border-t border-neutral-800">
            <div className="flex items-center space-x-4">
              <span className="text-xs font-bold text-neutral-400">수량 선택</span>
              <div className="flex items-center border border-neutral-700 rounded-xl bg-neutral-900 overflow-hidden">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-3 py-1 text-sm font-bold text-neutral-300 hover:bg-neutral-800"
                >
                  -
                </button>
                <span className="px-4 py-1 text-xs font-bold text-white">{quantity}</span>
                <button
                  onClick={() => setQuantity(Math.min(product.stockQuantity, quantity + 1))}
                  className="px-3 py-1 text-sm font-bold text-neutral-300 hover:bg-neutral-800"
                >
                  +
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleAddToCart}
                className={`flex-1 py-3.5 px-4 rounded-xl text-xs font-extrabold flex items-center justify-center space-x-2 transition-all border ${
                  isAdded
                    ? 'bg-green-600 border-green-600 text-white'
                    : 'bg-neutral-900 border-neutral-700 hover:border-[#FFD700] text-neutral-200 hover:text-[#FFD700]'
                }`}
              >
                {isAdded ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>장바구니에 담김!</span>
                  </>
                ) : (
                  <>
                    <ShoppingCart className="w-4 h-4" />
                    <span>장바구니 담기</span>
                  </>
                )}
              </button>
              <button
                onClick={handleBuyNow}
                className="flex-1 py-3.5 px-4 rounded-xl bg-[#FFD700] hover:bg-yellow-400 text-black text-xs font-black transition-all shadow-lg shadow-yellow-500/10"
              >
                토스로 바로 구매
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Community Tagged Posts */}
      {product.taggedPosts && product.taggedPosts.length > 0 && (
        <div className="space-y-4 pt-8 border-t border-neutral-800">
          <div className="flex items-center space-x-2">
            <MessageSquare className="w-4 h-4 text-[#FFD700]" />
            <h2 className="text-lg font-bold text-white">이 장비를 착용한 레이서들의 후기</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {product.taggedPosts.map((tp) => (
              <Link
                key={tp.postId}
                href={`/community/${tp.postId}`}
                className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 hover:border-neutral-700 transition-colors"
              >
                <div className="text-xs text-neutral-400 mb-1">
                  {new Date(tp.post.createdAt).toLocaleDateString('ko-KR')}
                </div>
                <h3 className="text-sm font-bold text-neutral-200 hover:text-[#FFD700] transition-colors line-clamp-1">
                  {tp.post.title}
                </h3>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Reviews Section */}
      <div className="space-y-6 pt-8 border-t border-neutral-800">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white flex items-center space-x-2">
            <span>실구매자 리뷰</span>
            <span className="text-[#FFD700]">({product.reviews.length})</span>
          </h2>
        </div>

        {/* Add Review Form */}
        <form onSubmit={handleSubmitReview} className="p-6 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-neutral-300">리뷰 남기기</span>
            <div className="flex items-center space-x-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setNewReviewRating(star)}
                  className="p-1 text-neutral-500 hover:text-[#FFD700]"
                >
                  <Star className={`w-4 h-4 ${star <= newReviewRating ? 'fill-[#FFD700] text-[#FFD700]' : ''}`} />
                </button>
              ))}
            </div>
          </div>
          <textarea
            value={newReviewContent}
            onChange={(e) => setNewReviewContent(e.target.value)}
            placeholder="실제 대회나 훈련에서 장비를 사용해 본 소감을 남겨주세요."
            rows={3}
            className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#FFD700]"
          />
          <button
            type="submit"
            disabled={reviewMutation.isPending || !newReviewContent.trim()}
            className="px-4 py-2 rounded-xl bg-[#FFD700] text-black text-xs font-bold hover:bg-yellow-400 disabled:opacity-50 transition-colors"
          >
            {reviewMutation.isPending ? '등록 중...' : '리뷰 등록'}
          </button>
        </form>

        {/* Review List */}
        {product.reviews.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-neutral-900/50 border border-neutral-800 text-neutral-400 text-xs">
            아직 작성된 리뷰가 없습니다.
          </div>
        ) : (
          <div className="space-y-3">
            {product.reviews.map((rev) => (
              <div key={rev.id} className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-neutral-300">{rev.user.name}</span>
                  <div className="flex items-center space-x-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} className={`w-3 h-3 ${s <= rev.rating ? 'fill-[#FFD700] text-[#FFD700]' : 'text-neutral-700'}`} />
                    ))}
                  </div>
                </div>
                <p className="text-xs text-neutral-300 leading-relaxed">{rev.content}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
