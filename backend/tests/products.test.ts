import { buildApp } from '../src/app';
import { FastifyInstance } from 'fastify';

describe('Products API (/api/v1/products)', () => {
  let app: FastifyInstance;
  let authToken = '';
  let productId: string;

  beforeAll(async () => {
    app = await buildApp();

    const loginRes = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: {
        email: 'runner1@naver.com',
        password: 'password123',
      },
    });
    authToken = JSON.parse(loginRes.payload).accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/v1/products - should return list of products', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/products',
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.payload);
    expect(body.success).toBe(true);
    expect(Array.isArray(body.products)).toBe(true);
    expect(body.products.length).toBeGreaterThan(0);
    productId = body.products[0].id;
  });

  it('GET /api/v1/products?categoryId=shoes - should filter by category', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/products?categoryId=shoes',
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.payload);
    expect(body.success).toBe(true);
    for (const p of body.products) {
      expect(p.categoryId).toBe('shoes');
    }
  });

  it('GET /api/v1/products/:id - should return single product details with reviews', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/products/${productId}`,
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.payload);
    expect(body.success).toBe(true);
    expect(body.product.id).toBe(productId);
    expect(Array.isArray(body.product.reviews)).toBe(true);
  });

  it('GET /api/v1/products/:id - should return 404 for non-existent product', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/products/99999999',
    });

    expect(res.statusCode).toBe(404);
  });

  it('POST /api/v1/products/:id/reviews - should require auth', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/products/${productId}/reviews`,
      payload: {
        rating: 5,
        content: '최고의 레이싱화입니다!',
      },
    });

    expect(res.statusCode).toBe(401);
  });

  it('POST /api/v1/products/:id/reviews - should create review with auth', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/products/${productId}/reviews`,
      headers: {
        authorization: `Bearer ${authToken}`,
      },
      payload: {
        rating: 5,
        content: '최고의 접지력과 반발력입니다. 강추합니다.',
      },
    });

    expect(res.statusCode).toBe(201);
    const body = JSON.parse(res.payload);
    expect(body.success).toBe(true);
    expect(body.review).toHaveProperty('id');
    expect(body.review.rating).toBe(5);
  });
});
