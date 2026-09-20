import dotenv from 'dotenv';
dotenv.config();
import { GoogleGenerativeAI } from '@google/generative-ai';

export interface GeminiServiceOptions {
  apiKey?: string;
  mock?: boolean;
}

export interface CategoryClassification {
  category: 'nutrition' | 'shoes' | 'gear' | 'equipment' | 'all';
  reason: string;
}

export type IntentType = 'gear_recommend' | 'event_schedule' | 'general_chat';

export interface ComprehensiveIntent {
  intentType: IntentType;
  category?: 'nutrition' | 'shoes' | 'gear' | 'equipment' | 'all';
  eventFilters?: {
    country?: string;
    continent?: string;
    status?: 'upcoming' | 'past' | 'all';
  };
  reason: string;
}

export interface ChatAdvisorResponse {
  intentType?: IntentType;
  advice: string;
  followUpQuestion: string;
  suggestedQueries: string[];
}

export class GeminiService {
  private genAI: GoogleGenerativeAI | null = null;
  private isMock: boolean;

  constructor(options?: GeminiServiceOptions) {
    const apiKey = options?.apiKey ?? process.env.GEMINI_API_KEY;
    this.isMock = Boolean(options?.mock || !apiKey || apiKey === 'your-gemini-api-key-here');
    if (!this.isMock && apiKey) {
      this.genAI = new GoogleGenerativeAI(apiKey);
    }
  }

  /**
   * Classifies user shopping intent for a HYROX store into a specific category.
   * Handles context inheritance from currentCategory and category switching.
   */
  async classifyQueryIntent(
    query: string,
    history?: Array<{ role: string; content: string }>,
    currentCategory?: string
  ): Promise<CategoryClassification> {
    if (this.isMock || !this.genAI) {
      return this.classifyMockIntent(query, currentCategory);
    }

    try {
      const model = this.genAI.getGenerativeModel({
        model: 'gemini-3.5-flash-lite',
        generationConfig: {
          responseMimeType: 'application/json',
          maxOutputTokens: 200,
        },
      });

      const historyContext = history && history.length > 0
        ? `[최근 대화 맥락]:\n${history.slice(-5).map(h => `${h.role}: ${h.content}`).join('\n')}\n[현재 활성 카테고리]: ${currentCategory || 'none'}`
        : `[현재 활성 카테고리]: ${currentCategory || 'none'}`;

      const prompt = `당신은 HYROX 피트니스 이커머스 질의 분류기입니다.
사용자 질문에서 '훈련 상황/증상'과 '실제 구매 대상'을 구분하여 목표 제품군을 분류하세요.

카테고리 규격:
- "shoes": 러닝화, 카본화, 접지화, 트레이너, 베어풋 슈즈
- "nutrition": 에너지젤, 보충제, 프로틴, 전해질, 아미노산, 카페인, 급수음료, 회복제
- "gear": 무릎 슬리브, 짐내스틱 그립, 리프팅 스트랩, 양말, 컴프레션 의류, 테이핑, 장갑
- "equipment": 슬레드, 케틀벨, 월볼, 덤벨, 인조잔디 매트, 스키에르그, 훈련 기구
- "all": 풀세트, 입문 추천, 종합 패키지 등 다중 카테고리

규칙:
1. 질문에 특정 카테고리가 명시되면 해당 카테고리로 즉시 전환.
2. "카페인 없는 건?", "더 가벼운 건?"처럼 단축 질문은 [현재 활성 카테고리] 맥락 유지.
3. 여러 카테고리를 포괄하는 질문은 "all".

JSON 출력 규격:
{ "category": "shoes" | "nutrition" | "gear" | "equipment" | "all", "reason": "간결한 이유" }

${historyContext}
[사용자 질문]: "${query}"`;

      const result = await model.generateContent(prompt);
      const parsed = JSON.parse(result.response.text().trim());
      if (parsed.category && ['nutrition', 'shoes', 'gear', 'equipment', 'all'].includes(parsed.category)) {
        return {
          category: parsed.category,
          reason: parsed.reason || 'Gemini LLM 분류',
        };
      }
      return this.classifyMockIntent(query, currentCategory);
    } catch (err: any) {
      console.warn('[GeminiService] classifyQueryIntent failed, falling back to mock:', err?.message || err);
      return this.classifyMockIntent(query, currentCategory);
    }
  }

  /**
   * Hybrid 3-Way Intent Router: Fast-path regex (<1ms) with Gemini 3.5 Flash Lite fallback.
   */
  async classifyComprehensiveIntent(
    query: string,
    history?: Array<{ role: string; content: string }>,
    currentCategory?: string
  ): Promise<ComprehensiveIntent> {
    const q = query.trim();

    // 1. Fast-Path: Event schedule queries
    if (/대회|일정|경기|스케줄|언제 열려|마라톤|개최|레이스 일정|참가 신청/i.test(q)) {
      const isKorea = /대한민국|한국|서울|인천|국내|송도/i.test(q);
      const isPast = /종료된|지난|과거|끝난/i.test(q);
      return {
        intentType: 'event_schedule',
        eventFilters: {
          country: isKorea ? '대한민국' : undefined,
          status: isPast ? 'past' : 'upcoming',
        },
        reason: 'Fast-path event keyword match',
      };
    }

    // 2. Fast-Path: Casual chat / Greeting / Persona questions
    if (/^(안녕|반가워|하이|누구|역할|뭐해|도와줘|소개|반갑습니다|너는|피터|챗봇)/i.test(q) || /넌 어떤 역할을 수행해|너는 누구야|뭐하는 애야/i.test(q)) {
      return {
        intentType: 'general_chat',
        reason: 'Fast-path general chat keyword match',
      };
    }

    // 3. Fast-Path: Obvious gear keywords
    if (/신발|러닝화|장비|보호대|니슬리브|에너지젤|젤|추천|사이즈|구매|기어|옷|양말/i.test(q)) {
      const cat = await this.classifyQueryIntent(q, history, currentCategory);
      return {
        intentType: 'gear_recommend',
        category: cat.category,
        reason: `Fast-path gear match: ${cat.reason}`,
      };
    }

    // 4. LLM Deep-Path fallback for ambiguous/complex queries
    if (this.isMock || !this.genAI) {
      return { intentType: 'gear_recommend', category: 'all', reason: 'mock fallback' };
    }

    try {
      const model = this.genAI.getGenerativeModel({
        model: 'gemini-3.5-flash-lite',
        generationConfig: { responseMimeType: 'application/json', maxOutputTokens: 200 },
      });
      const prompt = `사용자의 질문을 3가지 의도(intentType) 중 하나로 분류하세요:
- "gear_recommend": 신발, 의류, 에너지젤, 보호대 등 장비/제품 추천 요청
- "event_schedule": HYROX 대회 일정, 경기 날짜, 장소, 접수 일정 문의
- "general_chat": 인사, 소개, 역할 질문, 일상 대화

질문: "${q}"
JSON 규격:
{"intentType":"gear_recommend"|"event_schedule"|"general_chat","category":"shoes"|"nutrition"|"gear"|"equipment"|"all","country":"대한민국"|null,"status":"upcoming"|"past"|"all"}`;
      const res = await model.generateContent(prompt);
      const parsed = JSON.parse(res.response.text().trim());
      return {
        intentType: parsed.intentType || 'gear_recommend',
        category: parsed.category || 'all',
        eventFilters: parsed.intentType === 'event_schedule' ? { country: parsed.country || undefined, status: parsed.status || 'upcoming' } : undefined,
        reason: 'LLM intent classification',
      };
    } catch {
      return { intentType: 'gear_recommend', category: 'all', reason: 'LLM error fallback' };
    }
  }

  /**
   * Synthesizes a friendly, persona-driven greeting and role explanation.
   */
  async generateCasualResponse(
    query: string,
    history?: Array<{ role: string; content: string }>
  ): Promise<ChatAdvisorResponse> {
    const defaultResponse: ChatAdvisorResponse = {
      intentType: 'general_chat',
      advice: '안녕하세요! 저는 FitterSweat의 수석 기어 피터입니다. 🏋️‍♂️\n\nHYROX 8개 스테이션 완주를 위한 **최적의 직매입 기어 1:1 처방**, **국내외 대회 일정 안내**, 그리고 **실제 완주자들의 검증된 레이스 후기**를 신속하게 안내해 드립니다. 무엇을 도와드릴까요?',
      followUpQuestion: '어떤 스테이션이나 장비, 또는 출전 예정인 대회에 대해 알아보고 싶으신가요?',
      suggestedQueries: [
        '발볼 넓은 러너를 위한 신발 추천해줘',
        '현재 종료되지 않은 대한민국 대회 일정 알려줘',
        '첫 출전인데 필수 장비 풀세트 알려줘',
      ],
    };

    if (this.isMock || !this.genAI) {
      return defaultResponse;
    }

    try {
      const model = this.genAI.getGenerativeModel({
        model: 'gemini-3.5-flash-lite',
        generationConfig: { responseMimeType: 'application/json', maxOutputTokens: 500 },
      });
      const prompt = `당신은 HYROX 전문 수석 기어 피터(Chief Gear Fitter)입니다. 사용자의 인사나 역할 질문에 대해 친절하고 전문적인 어조로 답변을 작성하세요.
답변에는 FitterSweat에서 제공하는 3대 서비스(8개 스테이션 맞춤 직매입 기어 처방, 국내외 HYROX 대회 일정 안내, 완주자 검증 후기 매칭)가 자연스럽게 포함되어야 합니다.

사용자 질문: "${query}"

JSON 출력 규격:
{
  "advice": "500자 이내 친절하고 전문적인 마크다운 소개/인사",
  "followUpQuestion": "레이서의 관심사를 묻는 1문장의 후속 질문",
  "suggestedQueries": ["추천 칩 1", "추천 칩 2", "추천 칩 3"]
}`;
      const res = await model.generateContent(prompt);
      const parsed = JSON.parse(res.response.text().trim());
      if (parsed.advice && parsed.followUpQuestion && Array.isArray(parsed.suggestedQueries)) {
        return {
          intentType: 'general_chat',
          advice: parsed.advice.slice(0, 500),
          followUpQuestion: parsed.followUpQuestion,
          suggestedQueries: parsed.suggestedQueries.slice(0, 4),
        };
      }
      return defaultResponse;
    } catch {
      return defaultResponse;
    }
  }

  /**
   * Fallback rule-based keyword intent classification.
   */
  private classifyMockIntent(query: string, currentCategory?: string): CategoryClassification {
    const q = query.toLowerCase();

    // 1. Check for broad/package queries
    if (/풀세트|다 맞춰|패키지|전체|입문 세트/.test(q)) {
      return { category: 'all', reason: '종합 장비 풀세트 요청' };
    }

    // 2. Check for explicit keywords
    if (/신발|러닝화|운동화|슈즈|쿠션화|접지화|레이싱화|트레이너|발볼/.test(q)) {
      return { category: 'shoes', reason: '신발/러닝화 구매 의도 감지' };
    }
    if (/젤|에너지젤|보충제|프로틴|단백질|전해질|카페인|bcaa|아미노산|마그네슘|급수|음료|먹는|섭취|알약/.test(q)) {
      return { category: 'nutrition', reason: '에너지/뉴트리션 섭취 제품군 의도 감지' };
    }
    if (/보호대|슬리브|니슬리브|그립|스트랩|양말|삭스|테이핑|장갑|카프|의류|컴프레션/.test(q)) {
      return { category: 'gear', reason: '착용 보호 기어 의도 감지' };
    }
    if (/슬레드|케틀벨|월볼|로잉|스키|매트|플레이트|덤벨|기구/.test(q)) {
      return { category: 'equipment', reason: '훈련 기구/장비 의도 감지' };
    }

    // 3. Context inheritance: if short follow-up and currentCategory is valid, retain it
    if (currentCategory && ['nutrition', 'shoes', 'gear', 'equipment'].includes(currentCategory)) {
      return { category: currentCategory as any, reason: '직전 카테고리 대화 맥락 계승' };
    }

    return { category: 'all', reason: '일반 레이스 상담' };
  }

  /**
   * Generates a conversational chat response with 500-character advice,
   * a follow-up question, and 3-4 recursive query suggestion pills.
   */
  async generateChatResponse(
    query: string,
    products: Array<{ id: bigint | number | string; name: string; description?: string | null; categoryId?: string; price: number | any }>,
    posts: Array<{ id: bigint | number | string; title: string; content: string }>,
    history?: Array<{ role: string; content: string }>
  ): Promise<ChatAdvisorResponse> {
    const prodSummary = products
      .slice(0, 3)
      .map((p, i) => `${i + 1}. [${p.name}] (${p.categoryId}, ${Number(p.price).toLocaleString()}원)`)
      .join('\n');

    const postSummary = posts
      .slice(0, 2)
      .map((post, i) => `후기 ${i + 1} (${post.title}): "${post.content.slice(0, 100)}..."`)
      .join('\n');

    if (this.isMock || !this.genAI) {
      return this.generateMockChatResponse(query, products, posts);
    }

    try {
      const chatModel = this.genAI.getGenerativeModel({
        model: 'gemini-3.5-flash-lite',
        generationConfig: {
          responseMimeType: 'application/json',
          maxOutputTokens: 500,
        },
      });

      const historyText = history && history.length > 0
        ? `[최근 대화]:\n${history.slice(-5).map(h => `${h.role}: ${h.content}`).join('\n')}`
        : '';

      const prompt = `당신은 세계적인 피트니스 레이스 HYROX 전문 수석 기어 피터(Chief Gear Fitter)입니다.
추천 장비와 완주 후기를 기반으로 전문적이고 자신감 넘치는 맞춤 처방을 JSON 형식으로 작성해주세요.

[사용자 질문]: "${query}"
${historyText}

[추천 장비]:
${prodSummary}

[실전 레이서 후기]:
${postSummary}

[지침]:
1. "advice": 핵심 피팅 소견을 2~4문장으로 작성 (공백 포함 반드시 500자 이내). 제품명과 스테이션 특성 언급. 불필요한 서두 생략.
2. "followUpQuestion": 레이서의 다음 행동이나 연관 필요성을 묻는 1문장의 후속 질문.
3. "suggestedQueries": 사용자가 1탭으로 클릭해 후속 질문을 보낼 수 있는 3~4개의 추천 칩 문구.

JSON 출력 규격:
{
  "advice": "500자 이내 마크다운 소견",
  "followUpQuestion": "후속 질문 문장",
  "suggestedQueries": ["추천 칩 1", "추천 칩 2", "추천 칩 3"]
}`;

      const res = await chatModel.generateContent(prompt);
      const parsed = JSON.parse(res.response.text().trim());
      if (parsed.advice && parsed.followUpQuestion && Array.isArray(parsed.suggestedQueries)) {
        return {
          advice: parsed.advice.slice(0, 500),
          followUpQuestion: parsed.followUpQuestion,
          suggestedQueries: parsed.suggestedQueries.slice(0, 4),
        };
      }
      return this.generateMockChatResponse(query, products, posts);
    } catch (err: any) {
      console.warn('[GeminiService] generateChatResponse failed, falling back to mock:', err?.message || err);
      return this.generateMockChatResponse(query, products, posts);
    }
  }

  private generateMockChatResponse(
    query: string,
    products: Array<{ name: string; categoryId?: string }>,
    posts: Array<{ title: string }>
  ): ChatAdvisorResponse {
    const topProd = products[0]?.name ?? '추천 기어';
    const postRef = posts[0] ? `실전 레이서 후기(${posts[0].title})에서도 입증되었듯 ` : '';
    const advice = `요청하신 "${query}"에 최적화된 장비는 **${topProd}**입니다. ${postRef}스테이션 후반부 피로 누적을 방지하고 추진력을 안정적으로 서포트하여 기록 단축을 확실히 지원합니다.`.slice(0, 500);

    const category = products[0]?.categoryId || 'all';
    let followUpQuestion = '더 나은 레이스 페이스 유지를 위해 추가로 점검할 장비가 있으신가요?';
    let suggestedQueries = ['슬레드 푸시 전용화', '무릎 보호 니슬리브', '경기 후 회복 음료'];

    if (category === 'nutrition') {
      followUpQuestion = '러닝 후반부 빠른 수분 충전용 전해질 음료도 함께 확인해보시겠습니까?';
      suggestedQueries = ['전해질 이온 타블렛', '위장 트러블 없는 젤', '경기 직후 BCAA 회복제'];
    } else if (category === 'shoes') {
      followUpQuestion = '슬레드 구간이나 런지 시 발목 안정성을 높여주는 테이핑이나 양말도 보실까요?';
      suggestedQueries = ['논슬립 마찰력 양말', '발목 보호 테이핑', '경량 카본 레이서'];
    } else if (category === 'gear') {
      followUpQuestion = '스테이션별 그립 피로를 덜어줄 리프팅 그립도 함께 알아보실까요?';
      suggestedQueries = ['파머스 캐리 그립', '통기성 컴프레션 삭스', '손목 보호 스트랩'];
    }

    return {
      advice,
      followUpQuestion,
      suggestedQueries,
    };
  }

  /**
   * Generates a 768-dimensional text embedding using gemini-embedding-001.
   * Falls back to deterministic mock vector if API key is not configured.
   */
  /**
   * Generates 768-dimensional text embeddings in batch using gemini-embedding-001.
   * Efficiently packs multiple texts into a single API request (up to 100 items)
   * to respect Google API rate limits (100 RPM free tier).
   */
  async embedTexts(texts: string[], retries = 5): Promise<number[][]> {
    if (this.isMock || !this.genAI) {
      return texts.map((t) => this.generateMockEmbedding(t));
    }

    const model = this.genAI.getGenerativeModel({
      model: 'gemini-embedding-2',
    });

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const result = await model.batchEmbedContents({
          requests: texts.map((text) => ({
            content: { parts: [{ text }], role: 'user' },
            outputDimensionality: 768,
          } as any)),
        });
        if (result.embeddings && result.embeddings.length === texts.length) {
          return result.embeddings.map((e, idx) =>
            e.values && e.values.length === 768 ? e.values : this.generateMockEmbedding(texts[idx])
          );
        }
      } catch (err: any) {
        const isRateLimit =
          err?.status === 429 ||
          err?.message?.includes('429') ||
          err?.message?.includes('Quota exceeded');
        if (isRateLimit && attempt < retries) {
          const match = err?.message?.match(/retry in ([0-9.]+)/i);
          const waitSec = match ? Math.ceil(parseFloat(match[1])) + 2 : 25;
          console.warn(`[GeminiService] Rate limited (429). Retrying after ${waitSec}s... (attempt ${attempt + 1}/${retries})`);
          await new Promise((r) => setTimeout(r, waitSec * 1000));
          continue;
        }
        console.warn('[GeminiService] batchEmbedContents failed, falling back to mock:', err?.message || err);
        return texts.map((t) => this.generateMockEmbedding(t));
      }
    }
    return texts.map((t) => this.generateMockEmbedding(t));
  }

  async embedText(text: string): Promise<number[]> {
    if (this.isMock || !this.genAI) {
      return this.generateMockEmbedding(text);
    }
    const [vec] = await this.embedTexts([text]);
    return vec || this.generateMockEmbedding(text);
  }

  /**
   * Generates personalized advisor recommendation advice using gemini-3.6-flash.
   */
  async generateRecommendationAdvice(
    query: string,
    products: Array<{ id: bigint | number | string; name: string; description?: string | null; categoryId?: string; price: number | any }>,
    posts: Array<{ id: bigint | number | string; title: string; content: string }>
  ): Promise<string> {
    const prodSummary = products
      .map((p, i) => `${i + 1}. [${p.name}] (${p.categoryId}, ${Number(p.price).toLocaleString()}원): ${p.description || ''}`)
      .join('\n');

    const postSummary = posts
      .slice(0, 2)
      .map((post, i) => `후기 ${i + 1} (${post.title}): "${post.content.slice(0, 150)}..."`)
      .join('\n');

    if (this.isMock || !this.genAI) {
      return this.generateMockAdvice(query, products, posts);
    }

    try {
      const chatModel = this.genAI.getGenerativeModel({ model: 'gemini-3.5-flash-lite' });
      const prompt = `당신은 세계적인 피트니스 레이스 HYROX 전문 수석 기어 피터(Chief Gear Fitter)입니다.
사용자의 질문과 실제 레이서들의 검증된 완주 후기, 직매입 장비 스펙을 바탕으로 2~3문장의 명확하고 자신감 넘치는 맞춤 처방을 한국어로 작성해주세요.

[사용자 질문]: ${query}

[추천 직매입 장비]:
${prodSummary}

[실전 레이서 완주 후기]:
${postSummary}

[작성 지침]:
- 제품명과 스테이션(슬레드, 버피, 런 등) 특성을 직접 언급하세요.
- 불필요한 서두(예: "안녕하세요") 없이 즉시 핵심 피팅 소견으로 시작하세요.`;

      const res = await chatModel.generateContent(prompt);
      const text = res.response.text().trim();
      return text || this.generateMockAdvice(query, products, posts);
    } catch (err: any) {
      console.warn('[GeminiService] generateRecommendationAdvice failed, falling back to mock:', err?.message || err);
      return this.generateMockAdvice(query, products, posts);
    }
  }

  /**
   * Deterministic 768-dim normalized pseudo-vector based on string hash.
   */
  private generateMockEmbedding(text: string): number[] {
    const dim = 768;
    const vector: number[] = new Array(dim);
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      hash = (hash << 5) - hash + text.charCodeAt(i);
      hash |= 0;
    }

    let sumSq = 0;
    for (let i = 0; i < dim; i++) {
      const val = Math.sin(hash + i * 0.173 + (i % 17));
      vector[i] = val;
      sumSq += val * val;
    }

    const norm = Math.sqrt(sumSq) || 1;
    for (let i = 0; i < dim; i++) {
      vector[i] = Number((vector[i] / norm).toFixed(6));
    }

    return vector;
  }

  private generateMockAdvice(
    query: string,
    products: Array<{ name: string }>,
    posts: Array<{ title: string }>
  ): string {
    const topProd = products[0]?.name ?? '추천 기어';
    const postRef = posts[0] ? `실전 레이서들의 후기(${posts[0].title})에서도 입증되었듯 ` : '';
    return `요청하신 "${query}"에 최적화된 장비는 **${topProd}**입니다. ${postRef}안정적인 지지력과 추진력으로 레이스 스테이션에서 기록 단축을 확실히 지원합니다.`;
  }
}

export const geminiService = new GeminiService();

