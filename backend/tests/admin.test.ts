import { buildApp } from '../src/app';
import { FastifyInstance } from 'fastify';
import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

describe('Admin API (/api/v1/admin)', () => {
  let app: FastifyInstance;
  let adminToken = '';
  let userToken = '';
  let testProductId: string;
  let testOrderId: string;

  beforeAll(async () => {
    app = await buildApp();

    // 1. Ensure admin user exists
    const passwordHash = await bcrypt.hash('admin123', 10);
    const adminUser = await prisma.user.upsert({
      where: { email: 'admin@fittersweat.com' },
      update: { role: Role.ADMIN, passwordHash },
      create: {
        email: 'admin@fittersweat.com',
        name: '관리자',
        passwordHash,
        role: Role.ADMIN,
      },
    });

    const adminLoginRes = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: {
        email: 'admin@fittersweat.com',
        password: 'admin123',
      },
    });
    adminToken = JSON.parse(adminLoginRes.payload).accessToken;

    // 2. Regular user token
    const userLoginRes = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: {
        email: 'runner1@naver.com',
        password: 'password123',
      },
    });
    userToken = JSON.parse(userLoginRes.payload).accessToken;

    // 3. Test product & order
    const prod = await prisma.product.findFirst();
    testProductId = prod ? prod.id.toString() : '1';

    const order = await prisma.order.findFirst();
    testOrderId = order ? order.id.toString() : '1';
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Authorization checks', () => {
    it('returns 401 when no token is provided', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/admin/stats',
      });
      expect(res.statusCode).toBe(401);
    });

    it('returns 403 when regular user attempts to access admin endpoints', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/admin/stats',
        headers: { authorization: `Bearer ${userToken}` },
      });
      expect(res.statusCode).toBe(403);
    });
  });

  describe('GET /api/v1/admin/stats', () => {
    it('returns platform KPI statistics for admin', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/admin/stats',
        headers: { authorization: `Bearer ${adminToken}` },
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.payload);
      expect(body.success).toBe(true);
      expect(body.stats).toHaveProperty('totalRevenue');
      expect(body.stats).toHaveProperty('totalOrders');
      expect(body.stats).toHaveProperty('lowStockCount');
      expect(body.stats).toHaveProperty('totalUsers');
      expect(typeof body.stats.totalRevenue).toBe('number');
    });
  });

  describe('GET /api/v1/admin/orders', () => {
    it('returns order list with user and items info', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/admin/orders',
        headers: { authorization: `Bearer ${adminToken}` },
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.payload);
      expect(body.success).toBe(true);
      expect(Array.isArray(body.orders)).toBe(true);
    });
  });

  describe('PATCH /api/v1/admin/orders/:id/status', () => {
    it('updates order status (e.g. to shipped)', async () => {
      if (!testOrderId) return;

      const res = await app.inject({
        method: 'PATCH',
        url: `/api/v1/admin/orders/${testOrderId}/status`,
        headers: { authorization: `Bearer ${adminToken}` },
        payload: { status: 'shipped' },
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.payload);
      expect(body.success).toBe(true);
      expect(body.order.status).toBe('shipped');
    });
  });

  describe('PATCH /api/v1/admin/products/:id/stock', () => {
    it('updates product stock quantity in real-time', async () => {
      const prod = await prisma.product.findFirst({ orderBy: { id: 'desc' } });
      if (!prod) return;

      const newStock = prod.stockQuantity + 5;
      const res = await app.inject({
        method: 'PATCH',
        url: `/api/v1/admin/products/${prod.id}/stock`,
        headers: { authorization: `Bearer ${adminToken}` },
        payload: { stockQuantity: newStock },
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.payload);
      expect(body.success).toBe(true);
      expect(body.product.stockQuantity).toBe(newStock);
    });
  });
});
