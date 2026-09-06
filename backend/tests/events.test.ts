import { buildApp } from '../src/app';
import { FastifyInstance } from 'fastify';
import { parseKoreanDate } from '../src/tasks/scraper';

describe('Events API & Scraper (/api/v1/events)', () => {
  let app: FastifyInstance;
  let authToken = '';

  beforeAll(async () => {
    app = await buildApp();

    // 테스트 유저 로그인하여 토큰 획득
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

  describe('Date Parser Unit Test', () => {
    it('should parse Korean date format "13. 11월. 2026"', () => {
      const date = parseKoreanDate('13. 11월. 2026');
      expect(date).not.toBeNull();
      expect(date?.getFullYear()).toBe(2026);
      expect(date?.getMonth()).toBe(10); // 11월은 0-indexed로 10
      expect(date?.getDate()).toBe(13);
    });

    it('should return null for invalid date string', () => {
      expect(parseKoreanDate('invalid-date')).toBeNull();
    });
  });

  describe('REST Endpoints', () => {
    let eventId: string;

    it('GET /api/v1/events - should return list of seeded events', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/events',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.payload);
      expect(body.success).toBe(true);
      expect(Array.isArray(body.events)).toBe(true);
      expect(body.events.length).toBeGreaterThan(0);
      eventId = body.events[0].id;
    });

    it('GET /api/v1/events/:id - should return single event details', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/events/${eventId}`,
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.payload);
      expect(body.success).toBe(true);
      expect(body.event.id).toBe(eventId);
    });

    it('POST /api/v1/events/:id/interested - should require auth header', async () => {
      const response = await app.inject({
        method: 'POST',
        url: `/api/v1/events/${eventId}/interested`,
      });

      expect(response.statusCode).toBe(401);
    });

    it('POST /api/v1/events/:id/interested - should toggle interested event with auth', async () => {
      // 1. 등록 혹은 취소
      const response = await app.inject({
        method: 'POST',
        url: `/api/v1/events/${eventId}/interested`,
        headers: {
          authorization: `Bearer ${authToken}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.payload);
      expect(body.success).toBe(true);
      expect(body).toHaveProperty('isInterested');
    });
  });
});
