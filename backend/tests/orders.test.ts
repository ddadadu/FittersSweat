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

    // 테스트용 상품 확인 또는 생성 (테스트 전 재고 최소 50개 확보)
    const product = await prisma.product.findFirst();
    if (product) {
      const refreshed = await prisma.product.update({
        where: { id: product.id },
        data: { stockQuantity: Math.max(product.stockQuantity, 50) },
      });
      testProductId = refreshed.id.toString();
      initialStock = refreshed.stockQuantity;
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

  it('confirmTossPayment - handles real/mock Toss payments gracefully', async () => {
    const { confirmTossPayment } = await import('../src/services/payment.service');
    // Mock success test
    const successRes = await confirmTossPayment({
      paymentKey: 'test_mock_success_key',
      orderId: 'ORDER_TEST_123',
      amount: 15000,
    });
    expect(successRes.success).toBe(true);
    expect(successRes.data?.status).toBe('DONE');

    // Mock fail test
    const failRes = await confirmTossPayment({
      paymentKey: 'test_mock_fail_key',
      orderId: 'ORDER_TEST_123',
      amount: 15000,
    });
    expect(failRes.success).toBe(false);
    expect(failRes.error).toBeDefined();
  });

  it('POST /api/v1/orders with shipping, GET /:id, and PATCH /:id/shipping', async () => {
    // 1. 주문 생성 with 배송지
    const createRes = await app.inject({
      method: 'POST',
      url: '/api/v1/orders',
      headers: { authorization: `Bearer ${authToken}` },
      payload: {
        items: [{ productId: testProductId, quantity: 1 }],
        recipientName: '홍길동',
        recipientPhone: '01012345678',
        postcode: '06000',
        address: '서울시 강남구 테헤란로 1',
        addressDetail: '101호',
      },
    });

    expect(createRes.statusCode).toBe(201);
    const created = JSON.parse(createRes.payload).order;
    const orderId = created.id;
    expect(created.recipientName).toBe('홍길동');

    // 2. 단건 조회
    const getRes = await app.inject({
      method: 'GET',
      url: `/api/v1/orders/${orderId}`,
      headers: { authorization: `Bearer ${authToken}` },
    });
    expect(getRes.statusCode).toBe(200);
    const fetched = JSON.parse(getRes.payload).order;
    expect(fetched.id).toBe(orderId);
    expect(fetched.recipientName).toBe('홍길동');
    expect(fetched.postcode).toBe('06000');
    expect(fetched.orderItems.length).toBe(1);

    // 3. 배송지 수정 (pending 상태)
    const patchRes = await app.inject({
      method: 'PATCH',
      url: `/api/v1/orders/${orderId}/shipping`,
      headers: { authorization: `Bearer ${authToken}` },
      payload: {
        recipientName: '김철수',
        recipientPhone: '01098765432',
        addressDetail: '202호',
      },
    });
    expect(patchRes.statusCode).toBe(200);
    const patched = JSON.parse(patchRes.payload).order;
    expect(patched.recipientName).toBe('김철수');
    expect(patched.recipientPhone).toBe('01098765432');
    expect(patched.addressDetail).toBe('202호');
    expect(patched.postcode).toBe('06000'); // 기존 값 보존

    // 4. 상태를 shipped로 변경 후 배송지 수정 시도 -> 거부 (400)
    await prisma.order.update({
      where: { id: BigInt(orderId) },
      data: { status: 'shipped' },
    });

    const rejectRes = await app.inject({
      method: 'PATCH',
      url: `/api/v1/orders/${orderId}/shipping`,
      headers: { authorization: `Bearer ${authToken}` },
      payload: { recipientName: '이영희' },
    });
    expect(rejectRes.statusCode).toBe(400);
    expect(JSON.parse(rejectRes.payload).message).toContain('배송이 시작된 후');
  });
});
