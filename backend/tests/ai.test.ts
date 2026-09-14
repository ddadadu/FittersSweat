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
});
