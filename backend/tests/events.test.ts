import { buildApp } from '../src/app';
import { FastifyInstance } from 'fastify';
import { parseKoreanDate, scrapeHyroxEvents } from '../src/tasks/scraper';

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

  describe('Global HYROX Scraper Integration Test', () => {
    it('should scrape global events and parse continent, country, city, and division', async () => {
      const events = await scrapeHyroxEvents();
      expect(events.length).toBeGreaterThanOrEqual(100);

      const first = events[0];
      expect(first.name).toBeDefined();
      expect(first.cityCode).toBeDefined();
      expect((first as any).city).toBeDefined();
      expect((first as any).country).toBeDefined();
      expect((first as any).continent).toBeDefined();
      expect((first as any).division).toMatch(/^(Adults|Youngstars)$/);
    }, 60000);
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

    it('GET /api/v1/events with multi-filter query params - should filter by continent and division', async () => {
      const resContinent = await app.inject({
        method: 'GET',
        url: '/api/v1/events?continent=' + encodeURIComponent('아시아-태평양 (Asia-Pacific)'),
      });
      expect(resContinent.statusCode).toBe(200);
      const bodyContinent = JSON.parse(resContinent.payload);
      expect(bodyContinent.success).toBe(true);
      expect(bodyContinent.events.length).toBeGreaterThan(0);
      bodyContinent.events.forEach((e: any) => {
        expect(e.continent).toBe('아시아-태평양 (Asia-Pacific)');
      });

      const resDivision = await app.inject({
        method: 'GET',
        url: '/api/v1/events?division=Youngstars',
      });
      expect(resDivision.statusCode).toBe(200);
      const bodyDivision = JSON.parse(resDivision.payload);
      expect(bodyDivision.success).toBe(true);
      bodyDivision.events.forEach((e: any) => {
        expect(e.division).toBe('Youngstars');
      });

      const resPast = await app.inject({
        method: 'GET',
        url: '/api/v1/events?status=PAST',
      });
      expect(resPast.statusCode).toBe(200);
      const bodyPast = JSON.parse(resPast.payload);
      expect(bodyPast.success).toBe(true);
      expect(bodyPast.events.length).toBeGreaterThan(0);
      const now = new Date();
      bodyPast.events.forEach((e: any) => {
        expect(new Date(e.endDate).getTime()).toBeLessThan(now.getTime());
      });

      const resUpcoming = await app.inject({
        method: 'GET',
        url: '/api/v1/events?status=UPCOMING',
      });
      expect(resUpcoming.statusCode).toBe(200);
      const bodyUpcoming = JSON.parse(resUpcoming.payload);
      expect(bodyUpcoming.success).toBe(true);
      expect(bodyUpcoming.events.length).toBeGreaterThan(0);
      bodyUpcoming.events.forEach((e: any) => {
        expect(new Date(e.endDate).getTime()).toBeGreaterThanOrEqual(now.getTime());
      });
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

    it('GET /api/v1/events/interested - should require auth header', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/events/interested',
      });

      expect(response.statusCode).toBe(401);
    });

    it('GET /api/v1/events/interested - should return interested events with auth', async () => {
      // Ensure event is registered as interested
      const checkRes = await app.inject({
        method: 'GET',
        url: '/api/v1/events/interested',
        headers: {
          authorization: `Bearer ${authToken}`,
        },
      });
      expect(checkRes.statusCode).toBe(200);
      const checkBody = JSON.parse(checkRes.payload);
      if (!checkBody.events.some((e: any) => e.id === eventId)) {
        await app.inject({
          method: 'POST',
          url: `/api/v1/events/${eventId}/interested`,
          headers: {
            authorization: `Bearer ${authToken}`,
          },
        });
      }

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/events/interested',
        headers: {
          authorization: `Bearer ${authToken}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.payload);
      expect(body.success).toBe(true);
      expect(Array.isArray(body.events)).toBe(true);
      expect(body.events.some((e: any) => e.id === eventId)).toBe(true);
    });
  });
});
