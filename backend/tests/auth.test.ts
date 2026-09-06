import { buildApp } from '../src/app';
import { FastifyInstance } from 'fastify';

describe('Auth API (/api/v1/auth)', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildApp();
  });

  afterAll(async () => {
    await app.close();
  });

  const testUser = {
    email: `test_${Date.now()}@fittersweat.com`,
    password: 'password123',
    name: '테스터',
  };

  let refreshToken = '';

  it('POST /api/v1/auth/signup - should register a new user', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/signup',
      payload: testUser,
    });

    expect(response.statusCode).toBe(201);
    const body = JSON.parse(response.payload);
    expect(body.success).toBe(true);
    expect(body.user).toHaveProperty('id');
    expect(body.user.email).toBe(testUser.email);
    expect(body.user).not.toHaveProperty('passwordHash');
  });

  it('POST /api/v1/auth/signup - should reject duplicate email (409 Conflict)', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/signup',
      payload: testUser,
    });

    expect(response.statusCode).toBe(409);
    const body = JSON.parse(response.payload);
    expect(body.message).toMatch(/already registered|이미 등록/i);
  });

  it('POST /api/v1/auth/login - should authenticate user and return tokens', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: {
        email: testUser.email,
        password: testUser.password,
      },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.payload);
    expect(body.success).toBe(true);
    expect(body).toHaveProperty('accessToken');
    expect(body).toHaveProperty('refreshToken');
    refreshToken = body.refreshToken;
  });

  it('POST /api/v1/auth/login - should fail with wrong password (401 Unauthorized)', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: {
        email: testUser.email,
        password: 'wrongpassword',
      },
    });

    expect(response.statusCode).toBe(401);
  });

  it('POST /api/v1/auth/refresh - should issue new access token with valid refresh token', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/refresh',
      payload: { refreshToken },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.payload);
    expect(body.success).toBe(true);
    expect(body).toHaveProperty('accessToken');
  });
});
