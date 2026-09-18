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
    await prisma.product.deleteMany({
      where: { name: { startsWith: '관리자 등록 상품_' } },
    });
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

  describe('POST /api/v1/admin/products', () => {
    it('rejects non-admin user with 403', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/admin/products',
        headers: { authorization: `Bearer ${userToken}` },
        payload: {
          name: '테스트 상품',
          categoryId: 'shoes',
          price: 150000,
          stockQuantity: 10,
        },
      });
      expect(res.statusCode).toBe(403);
    });

    it('rejects if required fields are missing', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/admin/products',
        headers: { authorization: `Bearer ${adminToken}` },
        payload: {
          name: '테스트 상품',
          // categoryId, price missing
          stockQuantity: 10,
        },
      });
      expect(res.statusCode).toBe(400);
    });

    it('rejects invalid category', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/admin/products',
        headers: { authorization: `Bearer ${adminToken}` },
        payload: {
          name: '테스트 상품',
          categoryId: 'invalid_category',
          price: 50000,
          stockQuantity: 10,
        },
      });
      expect(res.statusCode).toBe(400);
    });

    it('successfully creates product with admin token', async () => {
      const testName = `관리자 등록 상품_${Date.now()}`;
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/admin/products',
        headers: { authorization: `Bearer ${adminToken}` },
        payload: {
          name: testName,
          description: '테스트 설명입니다.',
          categoryId: 'gear',
          price: 89000,
          stockQuantity: 25,
          imageUrl: 'https://res.cloudinary.com/test/gear.jpg',
        },
      });

      expect(res.statusCode).toBe(201);
      const body = JSON.parse(res.payload);
      expect(body.success).toBe(true);
      expect(body.product.name).toBe(testName);
      expect(body.product.categoryId).toBe('gear');
      expect(body.product.price).toBe(89000);
      expect(body.product.stockQuantity).toBe(25);
    });
  });

  describe('POST /api/v1/admin/upload-image', () => {
    it('rejects non-admin user with 403', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/admin/upload-image',
        headers: { authorization: `Bearer ${userToken}` },
      });
      expect(res.statusCode).toBe(403);
    });
  });

  describe('DELETE /api/v1/admin/products/:id (Soft Delete)', () => {
    let toDeleteProductId: string;

    beforeAll(async () => {
      // Create a dedicated product for deletion test
      const prod = await prisma.product.create({
        data: {
          name: `삭제 테스트 상품_${Date.now()}`,
          categoryId: 'gear',
          price: 35000,
          stockQuantity: 10,
        },
      });
      toDeleteProductId = prod.id.toString();
    });

    it('returns 401 when no token is provided', async () => {
      const res = await app.inject({
        method: 'DELETE',
        url: `/api/v1/admin/products/${toDeleteProductId}`,
      });
      expect(res.statusCode).toBe(401);
    });

    it('returns 403 for non-admin user', async () => {
      const res = await app.inject({
        method: 'DELETE',
        url: `/api/v1/admin/products/${toDeleteProductId}`,
        headers: { authorization: `Bearer ${userToken}` },
      });
      expect(res.statusCode).toBe(403);
    });

    it('successfully soft deletes product with admin token', async () => {
      const res = await app.inject({
        method: 'DELETE',
        url: `/api/v1/admin/products/${toDeleteProductId}`,
        headers: { authorization: `Bearer ${adminToken}` },
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.payload);
      expect(body.success).toBe(true);

      // Verify in DB that isDeleted is true
      const dbProd = await prisma.product.findUnique({
        where: { id: BigInt(toDeleteProductId) },
      });
      expect(dbProd).not.toBeNull();
      expect(dbProd?.isDeleted).toBe(true);

      // Verify that public product API hides this product
      const detailRes = await app.inject({
        method: 'GET',
        url: `/api/v1/products/${toDeleteProductId}`,
      });
      expect(detailRes.statusCode).toBe(404);
    });

    it('returns 404 when trying to delete already deleted product', async () => {
      const res = await app.inject({
        method: 'DELETE',
        url: `/api/v1/admin/products/${toDeleteProductId}`,
        headers: { authorization: `Bearer ${adminToken}` },
      });

      expect(res.statusCode).toBe(404);
    });

    it('returns 404 for non-existent product ID', async () => {
      const res = await app.inject({
        method: 'DELETE',
        url: '/api/v1/admin/products/999999999',
        headers: { authorization: `Bearer ${adminToken}` },
      });

      expect(res.statusCode).toBe(404);
    });
  });
});

