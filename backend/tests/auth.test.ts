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

  it('GET /api/v1/auth/me - should require auth header', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/auth/me',
    });

    expect(response.statusCode).toBe(401);
  });

  it('GET /api/v1/auth/me - should return user profile with valid token', async () => {
    const loginRes = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: {
        email: testUser.email,
        password: testUser.password,
      },
    });
    const token = JSON.parse(loginRes.payload).accessToken;

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/auth/me',
      headers: {
        authorization: `Bearer ${token}`,
      },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.payload);
    expect(body.success).toBe(true);
    expect(body.user).toHaveProperty('id');
    expect(body.user.email).toBe(testUser.email);
    expect(body.user.name).toBe(testUser.name);
    expect(body.user).toHaveProperty('role');
    expect(body.user).toHaveProperty('createdAt');
  });

  it('PATCH /api/v1/auth/me - should update user name and verify profile', async () => {
    const loginRes = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { email: testUser.email, password: testUser.password },
    });
    const token = JSON.parse(loginRes.payload).accessToken;

    const patchRes = await app.inject({
      method: 'PATCH',
      url: '/api/v1/auth/me',
      headers: { authorization: `Bearer ${token}` },
      payload: { name: '새로운이름' },
    });

    expect(patchRes.statusCode).toBe(200);
    const body = JSON.parse(patchRes.payload);
    expect(body.success).toBe(true);
    expect(body.user.name).toBe('새로운이름');
  });

  it('PATCH /api/v1/auth/me - should fail password change if current password is wrong', async () => {
    const loginRes = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { email: testUser.email, password: testUser.password },
    });
    const token = JSON.parse(loginRes.payload).accessToken;

    const patchRes = await app.inject({
      method: 'PATCH',
      url: '/api/v1/auth/me',
      headers: { authorization: `Bearer ${token}` },
      payload: { currentPassword: 'wrongcurrentpassword', newPassword: 'newpassword123' },
    });

    expect(patchRes.statusCode).toBe(400);
  });

  it('POST /api/v1/auth/logout - should return success response', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/logout',
    });

    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.payload).success).toBe(true);
  });

  it('DELETE /api/v1/auth/me - should fail with incorrect password', async () => {
    const loginRes = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { email: testUser.email, password: testUser.password },
    });
    const token = JSON.parse(loginRes.payload).accessToken;

    const deleteRes = await app.inject({
      method: 'DELETE',
      url: '/api/v1/auth/me',
      headers: { authorization: `Bearer ${token}` },
      payload: { password: 'wrongpassword' },
    });

    expect(deleteRes.statusCode).toBe(400);
  });

  it('DELETE /api/v1/auth/me - should delete user account cleanly with correct password', async () => {
    const loginRes = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { email: testUser.email, password: testUser.password },
    });
    const token = JSON.parse(loginRes.payload).accessToken;

    const deleteRes = await app.inject({
      method: 'DELETE',
      url: '/api/v1/auth/me',
      headers: { authorization: `Bearer ${token}` },
      payload: { password: testUser.password },
    });

    expect(deleteRes.statusCode).toBe(200);
    expect(JSON.parse(deleteRes.payload).success).toBe(true);

    // Verify user is gone
    const meRes = await app.inject({
      method: 'GET',
      url: '/api/v1/auth/me',
      headers: { authorization: `Bearer ${token}` },
    });
    expect(meRes.statusCode).toBe(404);
  });
});
