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
});
