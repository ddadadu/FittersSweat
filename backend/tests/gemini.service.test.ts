import dotenv from 'dotenv';
dotenv.config();
import { GeminiService } from '../src/services/gemini.service';

function cosineSimilarity(vecA: number[], vecB: number[]): number {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

const itWithKey = process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your-gemini-api-key-here' ? it : it.skip;

describe('GeminiService', () => {
  jest.setTimeout(25000);
  let service: GeminiService;

  beforeEach(() => {
    service = new GeminiService();
  });

  describe('embedText', () => {
    it('returns a 768-dimensional embedding array', async () => {
      const embedding = await service.embedText('HYROX 슬레드 푸시 접지력 좋은 신발');
      expect(Array.isArray(embedding)).toBe(true);
      expect(embedding.length).toBe(768);
      expect(typeof embedding[0]).toBe('number');
    });

    it('returns mock 768-dim vector when API key is missing or mock mode', async () => {
      const mockService = new GeminiService({ mock: true });
      const embedding = await mockService.embedText('테스트 질의');
      expect(embedding.length).toBe(768);
      // Normalized mock vector: sum of squares ≈ 1 or valid finite numbers
      expect(embedding.every((n: number) => Number.isFinite(n))).toBe(true);
    });
    itWithKey('returns a real 768-dimensional embedding and reflects semantic similarity (Post 5 > Post 67)', async () => {
      const query = '발볼 넓은 러너 적합 신발 추천';
      const post5 = '발볼 10.5cm 러너의 슬레드 푸시용 와이드 핏 레이서 장비 실착기 - 발볼이 넓은 러너는 앞코 토박스가 2E 규격으로 여유로우면서 측면 토크를 지지하는 TPU 보강 프레임 신발을 신어야 발가락 쏠림이 없음.';
      const post67 = '로잉 댐퍼 레버 5.5 설정이 Concept2 최적의 드래그팩터인 이유 - 댐퍼 10은 무거운 물을 젓는 보트와 같아 요추 부상을 부르므로 드래그팩터 125~130(댐퍼 5~6) 세팅이 기록에 가장 유리.';

      const qVec = await service.embedText(query);
      const p5Vec = await service.embedText(post5);
      const p67Vec = await service.embedText(post67);

      expect(qVec.length).toBe(768);
      expect(p5Vec.length).toBe(768);
      expect(p67Vec.length).toBe(768);

      const simPost5 = cosineSimilarity(qVec, p5Vec);
      const simPost67 = cosineSimilarity(qVec, p67Vec);

      expect(simPost5).toBeGreaterThan(simPost67);
      expect(simPost5).toBeGreaterThan(0.7);
    }, 20000);
  });

  describe('generateRecommendationAdvice', () => {
    it('synthesizes an advisor recommendation text', async () => {
      const query = '발볼이 넓은데 샌드백 런에서 발이 안 아픈 신발 추천해줘';
      const products = [
        {
          id: BigInt(1),
          name: '퓨마 디비에이트 나이트로 3',
          description: 'HYROX 공인 와이드 토박스 레이싱화',
          categoryId: 'shoes',
          price: 189000,
        },
      ];
      const posts = [
        {
          id: BigInt(10),
          title: '2026 서울 대회 완주 후기',
          content: '발볼 2E 레이서로서 나이트로3 착용하고 슬레드에서 전혀 밀림 없었습니다.',
        },
      ];

      const advice = await service.generateRecommendationAdvice(query, products, posts);
      expect(typeof advice).toBe('string');
      expect(advice.length).toBeGreaterThan(10);
      expect(advice).toContain('나이트로 3');
    });
  });

  describe('classifyQueryIntent', () => {
    it('classifies energy gel query as nutrition', async () => {
      const res = await service.classifyQueryIntent('후반 버피와 런에서 쥐 안 나고 즉각 흡수되는 에너지젤 추천해줘');
      expect(res.category).toBe('nutrition');
      expect(typeof res.reason).toBe('string');
    });

    it('classifies shoe query as shoes', async () => {
      const res = await service.classifyQueryIntent('슬레드 밀 때 발 안 밀리는 러닝화 추천해줘');
      expect(res.category).toBe('shoes');
    });

    it('classifies knee sleeve query as gear', async () => {
      const res = await service.classifyQueryIntent('무릎 관절 잡아주는 니슬리브 있어?');
      expect(res.category).toBe('gear');
    });

    it('inherits currentCategory when question is short follow-up', async () => {
      const res = await service.classifyQueryIntent('카페인 없는 건 있어?', [], 'nutrition');
      expect(res.category).toBe('nutrition');
    });

    it('switches category when user explicitly asks for a different category', async () => {
      const res = await service.classifyQueryIntent('아 맞다 슬레드 밀 때 신을 운동화도 보여줘', [], 'nutrition');
      expect(res.category).toBe('shoes');
    });

    it('classifies broad query as all', async () => {
      const res = await service.classifyQueryIntent('하이록스 첫 출전 풀세트 장비 다 맞춰줘');
      expect(res.category).toBe('all');
    });
  });

  describe('generateChatResponse', () => {
    it('returns advice capped at 500 characters, follow-up question, and 3-4 suggested queries', async () => {
      const query = '후반 쥐 안 나는 에너지젤 추천해줘';
      const products = [
        {
          id: BigInt(20),
          name: '하이드로퓨얼 45g 에너지젤',
          description: '단당류 복합당 2:1 배합',
          categoryId: 'nutrition',
          price: 42000,
        },
      ];
      const posts = [
        {
          id: BigInt(5),
          title: '에너지젤 섭취 타이밍 후기',
          content: '런 7구간 진입 전 1포 섭취하면 버피까지 힘이 납니다.',
        },
      ];

      const res = await service.generateChatResponse(query, products, posts);
      expect(typeof res.advice).toBe('string');
      expect(res.advice.length).toBeLessThanOrEqual(500);
      expect(typeof res.followUpQuestion).toBe('string');
      expect(res.followUpQuestion.length).toBeGreaterThan(5);
      expect(Array.isArray(res.suggestedQueries)).toBe(true);
      expect(res.suggestedQueries.length).toBeGreaterThanOrEqual(3);
      expect(res.suggestedQueries.length).toBeLessThanOrEqual(4);
    });
  });
});

