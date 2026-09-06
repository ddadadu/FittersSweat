import { buildApp } from '../src/app';
import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Orders & Toss Payments API (/api/v1/orders)', () => {
  let app: FastifyInstance;
  let authToken = '';
  let testProductId: string;
  let initialStock: number;

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

    // 테스트용 상품 확인 또는 생성
    const product = await prisma.product.findFirst();
    if (product) {
      testProductId = product.id.toString();
      initialStock = product.stockQuantity;
    }
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /api/v1/orders - should require auth', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/orders',
      payload: {
        items: [{ productId: testProductId, quantity: 1 }],
      },
    });

    expect(res.statusCode).toBe(401);
  });

  it('POST /api/v1/orders - should reject if quantity exceeds stock', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/orders',
      headers: {
        authorization: `Bearer ${authToken}`,
      },
      payload: {
        items: [{ productId: testProductId, quantity: 999999 }],
      },
    });

    expect(res.statusCode).toBe(400);
    const body = JSON.parse(res.payload);
    expect(body.message).toMatch(/재고/i);
  });

  it('POST /api/v1/orders - should create pending order and decrement inventory', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/orders',
      headers: {
        authorization: `Bearer ${authToken}`,
      },
      payload: {
        items: [{ productId: testProductId, quantity: 2 }],
      },
    });

    expect(res.statusCode).toBe(201);
    const body = JSON.parse(res.payload);
    expect(body.success).toBe(true);
    expect(body.order.status).toBe('pending');
    expect(body.order.orderItems.length).toBe(1);

    // 재고가 2개 차감되었는지 DB 직접 검증
    const updatedProduct = await prisma.product.findUnique({
      where: { id: BigInt(testProductId) },
    });
    expect(updatedProduct?.stockQuantity).toBe(initialStock - 2);
  });

  it('POST /api/v1/orders/:id/payment - should rollback inventory on payment failure', async () => {
    // 1. 주문 생성
    const orderRes = await app.inject({
      method: 'POST',
      url: '/api/v1/orders',
      headers: {
        authorization: `Bearer ${authToken}`,
      },
      payload: {
        items: [{ productId: testProductId, quantity: 1 }],
      },
    });
    const order = JSON.parse(orderRes.payload).order;
    const stockBeforePayment = (await prisma.product.findUnique({ where: { id: BigInt(testProductId) } }))?.stockQuantity || 0;

    // 2. 모의 결제 실패 호출
    const paymentRes = await app.inject({
      method: 'POST',
      url: `/api/v1/orders/${order.id}/payment`,
      headers: {
        authorization: `Bearer ${authToken}`,
      },
      payload: {
        paymentKey: 'test_mock_fail_key',
        orderId: `ORDER_${order.id}`,
        amount: Number(order.totalAmount),
      },
    });

    expect(paymentRes.statusCode).toBe(400);
    const body = JSON.parse(paymentRes.payload);
    expect(body.success).toBe(false);

    // 3. 재고가 다시 원복(롤백)되었는지 검증
    const restoredProduct = await prisma.product.findUnique({
      where: { id: BigInt(testProductId) },
    });
    expect(restoredProduct?.stockQuantity).toBe(stockBeforePayment + 1);

    // 4. 주문 상태가 cancelled로 변경되었는지 검증
    const cancelledOrder = await prisma.order.findUnique({
      where: { id: BigInt(order.id) },
    });
    expect(cancelledOrder?.status).toBe('cancelled');
  });

  it('POST /api/v1/orders/:id/payment - should succeed with valid mock payment', async () => {
    // 1. 주문 생성
    const orderRes = await app.inject({
      method: 'POST',
      url: '/api/v1/orders',
      headers: {
        authorization: `Bearer ${authToken}`,
      },
      payload: {
        items: [{ productId: testProductId, quantity: 1 }],
      },
    });
    const order = JSON.parse(orderRes.payload).order;

    // 2. 모의 결제 성공 호출
    const paymentRes = await app.inject({
      method: 'POST',
      url: `/api/v1/orders/${order.id}/payment`,
      headers: {
        authorization: `Bearer ${authToken}`,
      },
      payload: {
        paymentKey: 'test_mock_success_key',
        orderId: `ORDER_${order.id}`,
        amount: Number(order.totalAmount),
      },
    });

    expect(paymentRes.statusCode).toBe(200);
    const body = JSON.parse(paymentRes.payload);
    expect(body.success).toBe(true);
    expect(body.order.status).toBe('paid');
  });

  it('GET /api/v1/orders - should return list of orders for authenticated user', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/orders',
      headers: {
        authorization: `Bearer ${authToken}`,
      },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.payload);
    expect(body.success).toBe(true);
    expect(Array.isArray(body.orders)).toBe(true);
    expect(body.orders.length).toBeGreaterThan(0);
  });
});
