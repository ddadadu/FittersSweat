import { buildApp } from '../src/app';
import { FastifyInstance } from 'fastify';

describe('Community Posts API (/api/v1/posts)', () => {
  let app: FastifyInstance;
  let authToken = '';
  let createdPostId: string;
  let sampleProductId: string;

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

    const prodRes = await app.inject({
      method: 'GET',
      url: '/api/v1/products',
    });
    const prodBody = JSON.parse(prodRes.payload);
    if (prodBody.products && prodBody.products.length > 0) {
      sampleProductId = prodBody.products[0].id;
    }
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/v1/posts - should return list of posts', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/posts',
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.payload);
    expect(body.success).toBe(true);
    expect(Array.isArray(body.posts)).toBe(true);
  });

  it('POST /api/v1/posts - should require auth header', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/posts',
      payload: {
        title: '하이록스 서울 참가 팁 공유',
        content: '첫 출전인데 에너지젤 필수입니다.',
      },
    });

    expect(res.statusCode).toBe(401);
  });

  it('POST /api/v1/posts - should create new post with tagged products', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/posts',
      headers: {
        authorization: `Bearer ${authToken}`,
      },
      payload: {
        title: '하이록스 인천 송도 더블즈 후기 및 장비 추천',
        content: '푸마 레이스화 접지력이 슬레드 풀에서 정말 큰 차이를 만들어줍니다.',
        productIds: sampleProductId ? [sampleProductId] : [],
      },
    });

    expect(res.statusCode).toBe(201);
    const body = JSON.parse(res.payload);
    expect(body.success).toBe(true);
    expect(body.post).toHaveProperty('id');
    expect(body.post.title).toBe('하이록스 인천 송도 더블즈 후기 및 장비 추천');
    createdPostId = body.post.id;
  });

  it('GET /api/v1/posts/:id - should return single post detail with comments and tagged items', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/posts/${createdPostId}`,
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.payload);
    expect(body.success).toBe(true);
    expect(body.post.id).toBe(createdPostId);
    expect(Array.isArray(body.post.postComments)).toBe(true);
    expect(Array.isArray(body.post.taggedItems)).toBe(true);
  });

  it('POST /api/v1/posts/:id/comments - should require auth', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/posts/${createdPostId}/comments`,
      payload: {
        content: '좋은 후기 감사합니다!',
      },
    });

    expect(res.statusCode).toBe(401);
  });

  it('POST /api/v1/posts/:id/comments - should create comment on post', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/posts/${createdPostId}/comments`,
      headers: {
        authorization: `Bearer ${authToken}`,
      },
      payload: {
        content: '정말 유익한 정보네요! 저도 이번에 그 신발 신어봐야겠습니다.',
      },
    });

    expect(res.statusCode).toBe(201);
    const body = JSON.parse(res.payload);
    expect(body.success).toBe(true);
    expect(body.comment).toHaveProperty('id');
    expect(body.comment.content).toBe('정말 유익한 정보네요! 저도 이번에 그 신발 신어봐야겠습니다.');
  });
});
