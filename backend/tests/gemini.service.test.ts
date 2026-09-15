import { GeminiService } from '../src/services/gemini.service';

describe('GeminiService', () => {
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

