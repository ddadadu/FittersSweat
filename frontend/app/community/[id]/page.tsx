'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowLeft,
  MessageSquare,
  Package,
  ChevronRight,
  Sparkles,
  Loader2,
  Calendar,
  Send,
  AlertCircle,
} from 'lucide-react';
import { fetchApi, ensureAuthToken } from '@/lib/api';

interface TaggedProduct {
  id: string;
  name: string;
  price: number;
  categoryId?: string;
  imageUrl?: string | null;
}

interface CommentItem {
  id: string;
  postId: string;
  userId: string;
  content: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
  };
}

interface PostDetail {
  id: string;
  userId: string;
  eventId?: string | null;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string;
  };
  event?: {
    id: string;
    name: string;
    cityCode?: string;
  } | null;
  postComments: CommentItem[];
  taggedItems: Array<{
    productId: string;
    product: TaggedProduct;
  }>;
}

function formatDate(dateStr: string): string {
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

function parsePostContent(rawContent: string) {
  if (!rawContent) return { summary: null, bodyParagraphs: [] };

  const summaryMatch = rawContent.match(/^>\s*💡\s*\*\*핵심 요약\*\*:\s*([^\n]+)/m);
  let summary: string | null = null;
  let rest = rawContent;

  if (summaryMatch) {
    summary = summaryMatch[1].trim();
    rest = rawContent.replace(summaryMatch[0], '').trim();
  }

  const bodyParagraphs = rest
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  return { summary, bodyParagraphs };
}

export default function PostDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [post, setPost] = useState<PostDetail | null>(null);
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [commentError, setCommentError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    let isMounted = true;
    async function loadPost() {
      setLoading(true);
      try {
        const res = await fetchApi<{ success: boolean; post: PostDetail }>(`/api/v1/posts/${id}`);
        if (isMounted && res.post) {
          setPost(res.post);
          setComments(res.post.postComments || []);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || '게시글을 불러올 수 없습니다.');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadPost();
    return () => {
      isMounted = false;
    };
  }, [id]);

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCommentError(null);
    if (!newComment.trim() || submittingComment) return;

    setSubmittingComment(true);
    try {
      // Auto-authenticate test account if no token present
      await ensureAuthToken();

      const res = await fetchApi<{ success: boolean; comment: CommentItem }>(
        `/api/v1/posts/${id}/comments`,
        {
          method: 'POST',
          body: JSON.stringify({ content: newComment.trim() }),
        }
      );

      if (res.comment) {
        setComments((prev) => [...prev, res.comment]);
        setNewComment('');
        setCommentError(null);
      }
    } catch (err: any) {
      console.error('Comment submit error:', err);
      setCommentError(err.message || '댓글 등록에 실패했습니다. 다시 시도해 주세요.');
    } finally {
      setSubmittingComment(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-[#737373]">
          <Loader2 className="w-8 h-8 animate-spin text-[#FFD700]" />
          <span className="text-sm">후기 상세 정보를 불러오는 중...</span>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] py-16 px-4">
        <div className="max-w-xl mx-auto text-center p-8 bg-[#141414] border border-[#262626] rounded-2xl space-y-4">
          <p className="text-rose-400 font-medium">{error || '게시글이 존재하지 않습니다.'}</p>
          <button
            type="button"
            onClick={() => router.push('/community')}
            className="min-h-[44px] px-5 py-2.5 bg-[#FFD700] text-black font-bold text-xs rounded-xl"
          >
            커뮤니티 피드로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  const { summary, bodyParagraphs } = parsePostContent(post.content);

  // Event tag chip
  let eventTag = '';
  if (post.event?.name) {
    eventTag = `#${post.event.name.trim().replace(/\s+/g, '_')}`;
  } else if (post.eventId) {
    eventTag = `#2026_HYROX_${post.eventId}`;
  } else {
    eventTag = '#2026_HYROX_SEOUL';
  }

  const authorName = post.user?.name || '익명 레이서';
  const authorInitial = authorName.slice(0, 1).toUpperCase();

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white py-8 sm:py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Navigation Back Link */}
        <div>
          <Link
            href="/community"
            className="min-h-[44px] inline-flex items-center gap-2 text-xs font-bold text-[#A3A3A3] hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFD700] rounded-lg px-2 -ml-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>커뮤니티 목록으로 돌아가기</span>
          </Link>
        </div>

        {/* Post Article Header */}
        <article className="space-y-6 bg-[#141414] border border-[#262626] rounded-2xl p-6 sm:p-8">
          {/* Tag & Author Info */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-6 border-b border-[#262626]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#1F1F1F] border border-[#333333] flex items-center justify-center text-sm font-black text-[#FFD700] shrink-0">
                {authorInitial}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-base font-bold text-white">{authorName}</span>
                  <span className="text-xs font-bold text-[#FFD700] bg-[#FFD700]/10 border border-[#FFD700]/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <span>🏅</span>
                    <span>HYROX Finisher</span>
                  </span>
                </div>
                <span className="text-xs text-[#737373] flex items-center gap-1 mt-0.5">
                  <Calendar className="w-3 h-3 text-[#737373]" />
                  <span>{formatDate(post.createdAt)}</span>
                </span>
              </div>
            </div>

            {eventTag && (
              <span className="text-xs font-bold text-[#FFD700] bg-[#FFD700]/10 border border-[#FFD700]/30 px-3 py-1 rounded-full">
                {eventTag}
              </span>
            )}
          </div>

          {/* Post Title */}
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-snug">
            {post.title}
          </h1>

          {/* RAG 1-sentence summary highlight callout box */}
          {summary && (
            <div className="bg-[#FFD700]/10 border-l-4 border-[#FFD700] rounded-r-xl p-5 my-6 shadow-sm">
              <div className="flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-[#FFD700] shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="text-xs font-black uppercase tracking-wider text-[#FFD700] flex items-center gap-1.5">
                    <span>AI 핵심 요약 (RAG Extraction)</span>
                  </div>
                  <p className="text-sm sm:text-base font-medium text-white leading-relaxed">
                    {summary}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Post Body Paragraphs */}
          <div className="text-neutral-200 text-base leading-relaxed space-y-4 pt-2">
            {bodyParagraphs.map((paragraph, idx) => (
              <p key={idx} className="whitespace-pre-line leading-relaxed">
                {paragraph}
              </p>
            ))}
          </div>

          {/* Tagged Equipment Section */}
          {post.taggedItems && post.taggedItems.length > 0 && (
            <div className="pt-8 border-t border-[#262626] space-y-4">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>🏃 레이서가 착용한 직매입 장비</span>
                  <span className="text-xs font-semibold text-[#FFD700] bg-[#FFD700]/10 px-2 py-0.5 rounded">
                    {post.taggedItems.length}개
                  </span>
                </h3>
              </div>
              <p className="text-xs text-[#A3A3A3]">
                본 후기 작성자가 대회 및 훈련에서 착용하고 추천한 공식 직매입 장비입니다. 클릭 시 쇼핑몰 상세로 이동합니다.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
                {post.taggedItems.map((item) => {
                  const prod = item.product;
                  return (
                    <div
                      key={item.productId}
                      className="bg-[#1F1F1F] border border-[#333333] hover:border-[#FFD700]/60 rounded-xl p-3.5 transition-all flex items-center justify-between gap-3 group"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="relative aspect-square w-14 h-14 bg-neutral-900 border border-[#404040] rounded-lg overflow-hidden shrink-0 flex items-center justify-center">
                          {prod.imageUrl ? (
                            <Image
                              src={prod.imageUrl}
                              alt={prod.name}
                              width={56}
                              height={56}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              unoptimized
                            />
                          ) : (
                            <Package className="w-5 h-5 text-[#737373]" />
                          )}
                        </div>

                        <div className="min-w-0 flex-1 space-y-0.5">
                          <span className="text-[10px] font-bold uppercase text-[#FFD700]">
                            {prod.categoryId || 'GEAR'}
                          </span>
                          <h4 className="text-xs sm:text-sm font-semibold text-white truncate group-hover:text-[#FFD700] transition-colors">
                            {prod.name}
                          </h4>
                          <p className="text-xs font-black text-[#FFD700]">
                            {Number(prod.price).toLocaleString()}원
                          </p>
                        </div>
                      </div>

                      <Link
                        href={`/products/${prod.id}`}
                        className="min-h-[44px] px-3.5 py-2 bg-[#262626] hover:bg-[#FFD700] hover:text-black border border-[#404040] hover:border-[#FFD700] rounded-lg text-xs font-bold text-white transition-all flex items-center gap-1 shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFD700]"
                      >
                        <span>장비 상세 보기</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </article>

        {/* Comments Section */}
        <section className="bg-[#141414] border border-[#262626] rounded-2xl p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-[#262626]">
            <h3 className="text-lg font-black text-white flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-[#FFD700]" />
              <span>댓글 ({comments.length})</span>
            </h3>
          </div>

          {/* Comment Creation Form */}
          <form onSubmit={handleCommentSubmit} className="space-y-3">
            <textarea
              value={newComment}
              onChange={(e) => {
                setNewComment(e.target.value);
                if (commentError) setCommentError(null);
              }}
              placeholder="레이서에게 궁금한 점이나 응원의 댓글을 남겨보세요..."
              rows={3}
              className={`w-full bg-[#1F1F1F] border rounded-xl p-4 text-sm text-white placeholder:text-[#737373] outline-none transition-all resize-none ${
                commentError
                  ? 'border-[#EF4444] ring-1 ring-[#EF4444]'
                  : 'border-[#333333] focus:border-[#FFD700] focus:ring-1 focus:ring-[#FFD700]'
              }`}
            />
            {commentError && (
              <p className="text-xs text-[#EF4444] flex items-center gap-1.5 pt-0.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{commentError}</span>
              </p>
            )}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={submittingComment || !newComment.trim()}
                className="min-h-[44px] px-6 py-2.5 bg-[#FFD700] hover:bg-[#FFD700]/90 disabled:bg-[#262626] disabled:text-[#737373] text-black font-extrabold text-xs rounded-xl transition-all flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFD700]"
              >
                {submittingComment ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>등록 중...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>댓글 등록</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Comments List */}
          <div className="space-y-4 pt-2 divide-y divide-[#262626]/60">
            {comments.length === 0 ? (
              <div className="py-10 text-center text-[#737373] space-y-1">
                <p className="text-sm text-[#A3A3A3]">등록된 댓글이 없습니다.</p>
                <p className="text-xs">첫 번째 응원 댓글을 남겨보세요!</p>
              </div>
            ) : (
              comments.map((comment) => {
                const commenterName = comment.user?.name || '레이서';
                const commenterInitial = commenterName.slice(0, 1).toUpperCase();

                return (
                  <div key={comment.id} className="pt-4 first:pt-0 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-[#1F1F1F] border border-[#333333] flex items-center justify-center text-[10px] font-bold text-[#FFD700] shrink-0">
                          {commenterInitial}
                        </div>
                        <span className="text-sm font-semibold text-white">{commenterName}</span>
                        <span className="text-[10px] font-bold text-[#FFD700] bg-[#FFD700]/10 px-1.5 py-0.2 rounded">
                          Finisher
                        </span>
                      </div>
                      <span className="text-xs text-[#737373]">
                        {formatDate(comment.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm text-neutral-300 pl-9 leading-relaxed whitespace-pre-line">
                      {comment.content}
                    </p>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
