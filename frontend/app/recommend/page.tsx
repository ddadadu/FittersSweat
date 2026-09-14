'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Sparkles,
  Search,
  Loader2,
  CheckCircle2,
  ShoppingCart,
  ArrowRight,
  ShieldCheck,
  MessageSquare,
  AlertCircle,
  Trophy,
} from 'lucide-react';
import { useCartStore } from '@/stores/useCartStore';

interface RecommendedProduct {
  id: string;
  name: string;
  description: string | null;
  categoryId: string;
  price: number;
  stockQuantity: number;
  imageUrl: string | null;
  similarity: number;
  rerankScore: number;
  isSocialVerified: boolean;
}

interface VerifiedReview {
  id: string;
  title: string;
  content: string;
  userId: string;
  userName: string;
  similarity: number;
}

interface RecommendationResponse {
  success: boolean;
  query: string;
  advice: string;
  recommendedProducts: RecommendedProduct[];
  verifiedReviews: VerifiedReview[];
}

const QUICK_PROMPTS = [
  {
    icon: '👟',
    title: '발볼 와이드 카본화',
    query: '발볼이 넓은데 슬레드 푸시에서 발이 안 밀리는 카본 레이싱화 추천해줘',
  },
  {
    icon: '🛷',
    title: '슬레드 풀 접지력 & 장갑',
    query: '슬레드 풀과 파머스 캐리에서 미끄러지지 않는 접지력 좋은 기어와 그립',
  },
  {
    icon: '⚡',
    title: '후반 인터벌 에너지젤',
    query: '후반 버피와 런에서 쥐 안 나고 즉각 흡수되는 카페인 전해질 에너지젤',
  },
  {
    icon: '🧱',
    title: '월볼 100개 무릎/어깨 보호',
    query: '월볼 샷 100개 던질 때 무릎 튕김과 어깨 피로도를 줄여주는 압박 보호대',
  },
];

export default function RecommendPage() {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<RecommendationResponse | null>(null);
  const [addedProductId, setAddedProductId] = useState<string | null>(null);

  const addItem = useCartStore((state) => state.addItem);

  const handleSearch = async (targetQuery?: string) => {
    const q = (targetQuery !== undefined ? targetQuery : query).trim();
    if (!q) return;

    setIsLoading(true);
    setError(null);

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

    try {
      const res = await fetch(`${apiUrl}/api/v1/ai/recommend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || '추천 분석 중 오류가 발생했습니다.');
      }

      setResult(data);
    } catch (err: any) {
      setError(err.message || '네트워크 연결 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddToCart = (product: RecommendedProduct) => {
    addItem({
      productId: product.id,
      name: product.name,
      price: product.price,
      imageUrl: product.imageUrl || undefined,
      stockQuantity: product.stockQuantity,
      categoryId: product.categoryId,
    });
    setAddedProductId(product.id);
    setTimeout(() => setAddedProductId(null), 1800);
  };

  return (
    <main className="min-h-screen bg-[#0A0A0A] text-white py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-3 pt-4">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-[#FFD700]/10 border border-[#FFD700]/30 text-[#FFD700] text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Dual-Retriever RAG Intelligence</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black italic tracking-tight">
            HYROX <span className="text-[#FFD700]">AI 기어 어드바이저</span>
          </h1>
          <p className="text-sm sm:text-base text-neutral-400 max-w-2xl mx-auto break-keep">
            400개 직매입 장비 스펙과 150개 실전 완주 후기를 768차원 듀얼 벡터로 교차 분석하여
            나의 레이스 고민에 최적화된 장비를 맞춤 처방합니다.
          </p>
        </div>

        {/* Quick Prompts */}
        <div className="space-y-2">
          <div className="text-xs font-semibold text-neutral-400 flex items-center space-x-1.5">
            <Trophy className="w-3.5 h-3.5 text-[#FFD700]" />
            <span>레이서들이 가장 많이 묻는 4대 핵심 질문</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            {QUICK_PROMPTS.map((item, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setQuery(item.query);
                  handleSearch(item.query);
                }}
                className="flex items-center space-x-2.5 p-3 rounded-xl bg-[#141414] border border-[#262626] hover:border-[#FFD700]/60 hover:bg-[#1A1A1A] transition-all text-left min-h-[44px] group"
              >
                <span className="text-lg">{item.icon}</span>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-neutral-200 group-hover:text-[#FFD700] transition-colors truncate">
                    {item.title}
                  </div>
                  <div className="text-[11px] text-neutral-500 truncate">
                    {item.query}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Search Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSearch();
          }}
          className="relative flex items-center"
        >
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-neutral-500 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="예: 슬레드 푸시에서 발 밀림 없는 2E 와이드 신발 추천해줘..."
              className="w-full pl-12 pr-4 py-4 rounded-2xl bg-[#141414] border border-[#262626] text-white text-sm sm:text-base placeholder-neutral-500 focus:outline-none focus:border-[#FFD700] focus:ring-1 focus:ring-[#FFD700] transition-all min-h-[52px]"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading || !query.trim()}
            className="ml-3 px-6 py-4 rounded-2xl bg-[#FFD700] hover:bg-[#FFC700] active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none text-black font-black text-sm sm:text-base shrink-0 transition-all flex items-center space-x-2 min-h-[52px]"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>분석 중...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>AI 맞춤 분석</span>
              </>
            )}
          </button>
        </form>

        {/* Error Alert */}
        {error && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Recommendation Results (3-Tier Cards) */}
        {result && (
          <div className="space-y-8 pt-4">
            {/* TIER 1: Chief Fitter Advisory Callout */}
            <section className="rounded-2xl bg-gradient-to-br from-[#1A1A1A] to-[#141414] border-2 border-[#FFD700]/50 p-6 sm:p-8 space-y-4 shadow-xl">
              <div className="flex items-center space-x-2.5 text-[#FFD700]">
                <div className="w-8 h-8 rounded-lg bg-[#FFD700]/20 flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-black tracking-tight">
                    HYROX 수석 기어 피터의 1:1 맞춤 처방
                  </h2>
                  <p className="text-xs text-neutral-400">
                    Dual-Retriever & Gemini 1.5 Flash 실시간 합성 소견
                  </p>
                </div>
              </div>

              <div className="p-5 rounded-xl bg-[#0A0A0A]/70 border border-[#262626] text-neutral-200 text-sm sm:text-base leading-relaxed whitespace-pre-wrap font-medium">
                {result.advice}
              </div>
            </section>

            {/* TIER 2: Social Proof Verified Reviews */}
            {result.verifiedReviews.length > 0 && (
              <section className="space-y-4">
                <div className="flex items-center space-x-2 text-white">
                  <ShieldCheck className="w-5 h-5 text-[#FFD700]" />
                  <h3 className="text-lg font-black italic">
                    실전 레이서 검증 후기 (Social Proof)
                  </h3>
                  <span className="text-xs text-neutral-500">
                    실제 대회에서 이 장비를 착용하고 완주한 레이서들의 생생한 기록
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {result.verifiedReviews.map((post) => (
                    <Link
                      key={post.id}
                      href={`/community/${post.id}`}
                      className="block p-5 rounded-xl bg-[#141414] border border-[#262626] hover:border-[#FFD700]/50 transition-all group"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="inline-flex items-center space-x-1 text-xs font-bold text-[#FFD700] bg-[#FFD700]/10 px-2 py-0.5 rounded">
                          <span>🏅 {post.userName}</span>
                        </span>
                        <span className="text-[11px] text-neutral-500 font-mono">
                          유사도 {Math.round(post.similarity * 100)}%
                        </span>
                      </div>
                      <h4 className="font-bold text-sm text-white group-hover:text-[#FFD700] transition-colors line-clamp-1 mb-1.5">
                        {post.title}
                      </h4>
                      <p className="text-xs text-neutral-400 line-clamp-3 leading-relaxed">
                        {post.content}
                      </p>
                      <div className="mt-3 flex items-center space-x-1 text-[11px] text-[#FFD700] font-semibold">
                        <span>전체 후기 읽기</span>
                        <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* TIER 3: Direct Recommended Catalog Products */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-white">
                  <ShoppingCart className="w-5 h-5 text-[#FFD700]" />
                  <h3 className="text-lg font-black italic">
                    매칭된 직매입 공식 기어 ({result.recommendedProducts.length}선)
                  </h3>
                </div>
                <span className="text-xs text-neutral-500">
                  교차 검증된 100% 본사 직매입 실시간 재고
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {result.recommendedProducts.map((prod) => (
                  <div
                    key={prod.id}
                    className="flex flex-col rounded-2xl bg-[#141414] border border-[#262626] hover:border-[#333333] transition-all overflow-hidden group"
                  >
                    {/* Thumbnail Image */}
                    <div className="relative aspect-square bg-[#1A1A1A] overflow-hidden">
                      {prod.imageUrl ? (
                        <Image
                          src={prod.imageUrl}
                          alt={prod.name}
                          fill
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-neutral-600">
                          <ShoppingCart className="w-12 h-12" />
                        </div>
                      )}

                      {/* Badges */}
                      <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                        <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-black/70 backdrop-blur-md text-white border border-white/20">
                          {prod.categoryId}
                        </span>
                        {prod.isSocialVerified && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#FFD700] text-black shadow">
                            ⚡ 후기 검증 +20%
                          </span>
                        )}
                      </div>

                      <div className="absolute top-3 right-3 px-2 py-0.5 rounded text-[10px] font-mono bg-black/80 text-[#FFD700]">
                        매칭 {Math.round(prod.similarity * 100)}%
                      </div>
                    </div>

                    {/* Info */}
                    <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                      <div>
                        <Link href={`/products/${prod.id}`}>
                          <h4 className="font-bold text-sm text-white hover:text-[#FFD700] transition-colors line-clamp-2">
                            {prod.name}
                          </h4>
                        </Link>
                        {prod.description && (
                          <p className="text-xs text-neutral-400 line-clamp-2 mt-1">
                            {prod.description}
                          </p>
                        )}
                      </div>

                      <div className="pt-2 border-t border-[#262626] space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-neutral-400">판매가</span>
                          <span className="text-base font-black text-[#FFD700]">
                            {prod.price.toLocaleString()}원
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => handleAddToCart(prod)}
                            className="min-h-[44px] px-3 py-2 rounded-xl bg-[#1F1F1F] hover:bg-[#262626] text-white text-xs font-bold border border-[#333333] transition-colors flex items-center justify-center space-x-1.5"
                          >
                            {addedProductId === prod.id ? (
                              <>
                                <CheckCircle2 className="w-3.5 h-3.5 text-[#FFD700]" />
                                <span className="text-[#FFD700]">담김!</span>
                              </>
                            ) : (
                              <>
                                <ShoppingCart className="w-3.5 h-3.5" />
                                <span>장바구니</span>
                              </>
                            )}
                          </button>

                          <Link
                            href="/checkout"
                            onClick={() => handleAddToCart(prod)}
                            className="min-h-[44px] px-3 py-2 rounded-xl bg-[#FFD700] hover:bg-[#FFC700] text-black text-xs font-black transition-colors flex items-center justify-center space-x-1"
                          >
                            <span>바로 구매</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}
      </div>
    </main>
  );
}
