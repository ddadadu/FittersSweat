import { GoogleGenerativeAI } from '@google/generative-ai';

export interface GeminiServiceOptions {
  apiKey?: string;
  mock?: boolean;
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
   * Generates a 768-dimensional text embedding using text-embedding-004.
   * Falls back to deterministic mock vector if API key is not configured.
   */
  async embedText(text: string): Promise<number[]> {
    if (this.isMock || !this.genAI) {
      return this.generateMockEmbedding(text);
    }

    try {
      const model = this.genAI.getGenerativeModel({ model: 'text-embedding-004' });
      const result = await model.embedContent(text);
      if (result.embedding?.values && result.embedding.values.length === 768) {
        return result.embedding.values;
      }
      return this.generateMockEmbedding(text);
    } catch {
      // ponytail: graceful fallback to mock vector when API is unreachable or rate-limited
      return this.generateMockEmbedding(text);
    }
  }

  /**
   * Generates personalized advisor recommendation advice using gemini-1.5-flash.
   */
  async generateRecommendationAdvice(
    query: string,
    products: Array<{ id: bigint | number; name: string; description?: string | null; categoryId: string; price: number | any }>,
    posts: Array<{ id: bigint | number; title: string; content: string }>
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
      const chatModel = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
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
    } catch {
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
      // Periodic pseudo-random value in [-1, 1]
      const val = Math.sin(hash + i * 0.173 + (i % 17));
      vector[i] = val;
      sumSq += val * val;
    }

    // Normalize to unit vector
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
