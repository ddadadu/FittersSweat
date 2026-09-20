import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useAuthStore } from './useAuthStore';

export interface RecommendedProduct {
  id: string;
  name: string;
  description: string;
  categoryId: string;
  price: number;
  stockQuantity: number;
  imageUrl: string;
  similarity: number;
  rerankScore: number;
  isSocialVerified: boolean;
}

export interface VerifiedReview {
  id: string;
  title: string;
  content: string;
  userName: string;
  similarity: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  intentType?: 'gear_recommend' | 'event_schedule' | 'general_chat';
  detectedCategory?: string;
  categoryReason?: string;
  products?: RecommendedProduct[];
  reviews?: VerifiedReview[];
  followUpQuestion?: string;
  suggestedQueries?: string[];
  createdAt: number;
}

const DEFAULT_WELCOME_MESSAGE: ChatMessage = {
  id: 'welcome-msg',
  role: 'assistant',
  content:
    '반갑습니다! HYROX 전문 수석 기어 피터입니다. 신체 조건, 목표 기록, 또는 보완하고 싶은 스테이션을 말씀해주시면 딱 맞는 직매입 장비와 실전 팁을 처방해 드립니다.',
  followUpQuestion: '어떤 스테이션이나 장비에 대해 가장 고민이신가요?',
  suggestedQueries: [
    '슬레드 밀 때 발 안 밀리는 러닝화 추천해줘',
    '후반 버피와 런에서 쥐 안 나는 에너지젤 추천해줘',
    '샌드백 런지용 무릎 보호대 추천해줘',
    '첫 출전인데 필수 장비 풀세트 알려줘',
  ],
  createdAt: 1789450000000,
};

interface AiChatState {
  isOpen: boolean;
  messages: ChatMessage[];
  currentCategory: string;
  isLoading: boolean;
  warningCount: number;
  isBanned: boolean;
  guestQueryCount: number;
  error: string | null;

  toggleOpen: () => void;
  setOpen: (open: boolean) => void;
  sendMessage: (query: string) => Promise<void>;
  resetConversation: () => void;
  clearError: () => void;
}

export const useAiChatStore = create<AiChatState>()(
  persist(
    (set, get) => ({
      isOpen: false,
      messages: [DEFAULT_WELCOME_MESSAGE],
      currentCategory: 'all',
      isLoading: false,
      warningCount: 0,
      isBanned: false,
      guestQueryCount: 0,
      error: null,

      toggleOpen: () => set((state) => ({ isOpen: !state.isOpen })),
      setOpen: (open: boolean) => set({ isOpen: open }),
      clearError: () => set({ error: null }),

      resetConversation: () =>
        set({
          messages: [
            {
              ...DEFAULT_WELCOME_MESSAGE,
              createdAt: Date.now(),
            },
          ],
          currentCategory: 'all',
          error: null,
          isLoading: false,
        }),

      sendMessage: async (query: string) => {
        const trimmed = query.trim();
        if (!trimmed) return;

        const state = get();
        if (state.isBanned) {
          set({
            error:
              '비정상적인 요청 감지로 인해 서비스 이용이 제한되었습니다. 고객센터에 문의해주세요.',
          });
          return;
        }

        // Check auth status
        const authState = useAuthStore.getState();
        const isLoggedIn = Boolean(
          authState.isAuthenticated ||
            (typeof window !== 'undefined' && localStorage.getItem('accessToken'))
        );

        // Guest Teaser Limit: 10 queries
        if (!isLoggedIn && state.guestQueryCount >= 10) {
          set({
            error:
              '더 깊이 있는 1:1 맞춤 추천을 위해 1초 간편 로그인해 주세요! (비회원 무료 10회 체험 완료)',
          });
          authState.setAuthModalOpen(true, 'login');
          return;
        }

        if (!isLoggedIn) {
          set((prev) => ({ guestQueryCount: prev.guestQueryCount + 1 }));
        }

        const userMsg: ChatMessage = {
          id: `user-${Date.now()}`,
          role: 'user',
          content: trimmed,
          createdAt: Date.now(),
        };

        // Sliding Window: send only the previous 5 messages to the backend (excluding current query)
        const recentHistory = state.messages.slice(-5).map((m) => ({
          role: m.role,
          content: m.content,
        }));

        // Optimistically append user message
        const nextMessages = [...state.messages, userMsg];
        set({
          messages: nextMessages,
          isLoading: true,
          error: null,
        });

        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
        const token =
          authState.accessToken ||
          (typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null);

        try {
          const res = await fetch(`${apiUrl}/api/v1/ai/chat`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify({
              query: trimmed,
              history: recentHistory,
              currentCategory: state.currentCategory,
            }),
          });

          // Handle 429 Rate Limit
          if (res.status === 429) {
            const nextWarning = state.warningCount + 1;
            const isBannedNow = nextWarning >= 5;
            set({
              isLoading: false,
              warningCount: nextWarning,
              isBanned: isBannedNow,
              error: `매크로 방지를 위해 분당 메세지 제한이 설정되었습니다. 5회 경고 시 아이디가 영구 차단됩니다. (경고 ${nextWarning}/5회)`,
            });
            return;
          }

          const data = await res.json();
          if (!res.ok || !data.success) {
            throw new Error(data.message || 'AI 답변을 불러오지 못했습니다.');
          }

          const assistantMsg: ChatMessage = {
            id: `assistant-${Date.now()}`,
            role: 'assistant',
            content: data.advice,
            intentType: data.intentType,
            detectedCategory: data.detectedCategory,
            categoryReason: data.categoryReason,
            products: data.recommendedProducts || [],
            reviews: data.verifiedReviews || [],
            followUpQuestion: data.followUpQuestion,
            suggestedQueries: data.suggestedQueries || [],
            createdAt: Date.now(),
          };

          set((prev) => ({
            messages: [...prev.messages, assistantMsg],
            currentCategory: data.detectedCategory || prev.currentCategory,
            isLoading: false,
            error: null,
          }));
        } catch (err: any) {
          set({
            isLoading: false,
            error: err.message || '일시적인 네트워크 오류가 발생했습니다.',
          });
        }
      },
    }),
    {
      name: 'fittersweat-ai-coach-session',
      partialize: (state) => ({
        messages: state.messages,
        currentCategory: state.currentCategory,
        warningCount: state.warningCount,
        isBanned: state.isBanned,
        guestQueryCount: state.guestQueryCount,
      }),
    }
  )
);
