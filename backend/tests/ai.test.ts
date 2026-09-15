import { buildApp } from '../src/app';
import { FastifyInstance } from 'fastify';

describe('AI Recommendation API (POST /api/v1/ai/recommend)', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns 400 if query is missing or empty', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/ai/recommend',
      payload: { query: '' },
    });

    expect(res.statusCode).toBe(400);
    const body = JSON.parse(res.body);
    expect(body.message).toMatch(/query is required/i);
  });

  it('returns recommendation advice, top products, and verified reviews', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/ai/recommend',
      payload: { query: '슬레드 푸시 접지력 좋은 레이싱 신발' },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.success).toBe(true);
    expect(typeof body.advice).toBe('string');
    expect(body.advice.length).toBeGreaterThan(0);
    expect(Array.isArray(body.recommendedProducts)).toBe(true);
    expect(body.recommendedProducts.length).toBeGreaterThan(0);
    expect(Array.isArray(body.verifiedReviews)).toBe(true);

    const firstProduct = body.recommendedProducts[0];
    expect(firstProduct).toHaveProperty('id');
    expect(firstProduct).toHaveProperty('name');
    expect(firstProduct).toHaveProperty('price');
  });

  it('supports category filtering', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/ai/recommend',
      payload: {
        query: '에너지 부스팅 리커버리',
        categoryId: 'nutrition',
      },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.success).toBe(true);
    if (body.recommendedProducts.length > 0) {
      expect(body.recommendedProducts.every((p: any) => p.categoryId === 'nutrition')).toBe(true);
    }
  });

  describe('POST /api/v1/ai/chat (Multi-turn conversational chat)', () => {
    it('returns 400 if query is missing', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/ai/chat',
        payload: { query: '' },
      });
      expect(res.statusCode).toBe(400);
    });

    it('classifies energy gel query as nutrition and returns only nutrition products (0 shoes/equipment)', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/ai/chat',
        payload: { query: '후반 버피와 런에서 쥐 안 나고 즉각 흡수되는 에너지젤 추천해줘' },
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.success).toBe(true);
      expect(body.detectedCategory).toBe('nutrition');
      expect(typeof body.advice).toBe('string');
      expect(body.advice.length).toBeLessThanOrEqual(500);
      expect(typeof body.followUpQuestion).toBe('string');
      expect(Array.isArray(body.suggestedQueries)).toBe(true);
      expect(body.suggestedQueries.length).toBeGreaterThanOrEqual(3);

      expect(Array.isArray(body.recommendedProducts)).toBe(true);
      if (body.recommendedProducts.length > 0) {
        // Assert ALL returned products are strictly nutrition (no shoes or equipment!)
        expect(body.recommendedProducts.every((p: any) => p.categoryId === 'nutrition')).toBe(true);
      }
    });

    it('inherits previous category on short follow-up question', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/ai/chat',
        payload: {
          query: '카페인 없는 건 있어?',
          currentCategory: 'nutrition',
          history: [
            { role: 'user', content: '에너지젤 추천해줘' },
            { role: 'assistant', content: '하이드로퓨얼 젤을 추천합니다.' },
          ],
        },
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.success).toBe(true);
      expect(body.detectedCategory).toBe('nutrition');
    });

    it('switches category when user explicitly asks for a different category', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/ai/chat',
        payload: {
          query: '아 그리고 슬레드 밀 때 신을 운동화도 추천해줘',
          currentCategory: 'nutrition',
          history: [
            { role: 'user', content: '에너지젤 추천해줘' },
            { role: 'assistant', content: '하이드로퓨얼 젤을 추천합니다.' },
          ],
        },
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.success).toBe(true);
      expect(body.detectedCategory).toBe('shoes');
      if (body.recommendedProducts.length > 0) {
        expect(body.recommendedProducts.every((p: any) => p.categoryId === 'shoes')).toBe(true);
      }
    });

    it('returns 429 error and warning message when exceeding rate limit (10 req/min)', async () => {
      // Send 11 rapid requests from a unique IP
      let lastRes: any;
      for (let i = 0; i < 11; i++) {
        lastRes = await app.inject({
          method: 'POST',
          url: '/api/v1/ai/chat',
          payload: { query: '테스트 질문' },
          remoteAddress: '192.168.99.1',
        });
      }

      expect(lastRes.statusCode).toBe(429);
      const body = JSON.parse(lastRes.body);
      expect(body.message).toContain('매크로 방지를 위해 분당 메세지 제한이 설정되었습니다');
    });
  });
});

