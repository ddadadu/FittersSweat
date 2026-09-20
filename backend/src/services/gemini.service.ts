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

export interface ChatAdvisorResponse {
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
        model: 'gemini-3.6-flash',
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
        model: 'gemini-3.6-flash',
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
  async embedText(text: string): Promise<number[]> {
    if (this.isMock || !this.genAI) {
      return this.generateMockEmbedding(text);
    }

    try {
      const model = this.genAI.getGenerativeModel({
        model: 'gemini-embedding-001',
      });
      // @google/generative-ai embedContent supports { content: { parts: [{ text }] }, outputDimensionality: 768 }
      const result = await model.embedContent({
        content: { parts: [{ text }] },
        outputDimensionality: 768,
      } as any);
      if (result.embedding?.values && result.embedding.values.length === 768) {
        return result.embedding.values;
      }
      return this.generateMockEmbedding(text);
    } catch (err: any) {
      console.warn('[GeminiService] embedText failed, falling back to mock:', err?.message || err);
      return this.generateMockEmbedding(text);
    }
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
      const chatModel = this.genAI.getGenerativeModel({ model: 'gemini-3.6-flash' });
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

