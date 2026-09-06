import { FastifyInstance } from 'fastify';
import { PrismaClient, OrderStatus } from '@prisma/client';
import { confirmTossPayment } from '../services/payment.service';

const prisma = new PrismaClient();

export async function orderRoutes(app: FastifyInstance) {
  // 1. 주문 생성 및 재고 원자적 선차감
  app.post('/', async (request, reply) => {
    let userId: bigint;
    try {
      const token = request.headers.authorization?.replace('Bearer ', '');
      if (!token) throw new Error('Missing token');
      const decoded = app.jwt.verify<{ id: string }>(token);
      userId = BigInt(decoded.id);
    } catch {
      return reply.status(401).send({ message: 'Unauthorized' });
    }

    const { items } = request.body as {
      items: Array<{ productId: string | number; quantity: number }>;
    };

    if (!items || !Array.isArray(items) || items.length === 0) {
      return reply.status(400).send({ message: '주문할 상품 아이템이 필요합니다.' });
    }

    try {
      const order = await prisma.$transaction(async (tx) => {
        let totalAmount = 0;
        const orderItemCreates: Array<{ productId: bigint; quantity: number; unitPrice: number }> = [];

        for (const item of items) {
          const pId = BigInt(item.productId);
          const product = await tx.product.findUnique({
            where: { id: pId },
          });

          if (!product) {
            throw new Error(`상품을 찾을 수 없습니다 (ID: ${item.productId})`);
          }

          if (product.stockQuantity < item.quantity) {
            throw new Error(`재고가 부족합니다 (${product.name}: 현재고 ${product.stockQuantity}개)`);
          }

          // 재고 선차감
          await tx.product.update({
            where: { id: pId },
            data: {
              stockQuantity: {
                decrement: item.quantity,
              },
            },
          });

          const price = Number(product.price);
          totalAmount += price * item.quantity;
          orderItemCreates.push({
            productId: pId,
            quantity: item.quantity,
            unitPrice: price,
          });
        }

        return tx.order.create({
          data: {
            userId,
            status: OrderStatus.pending,
            totalAmount,
            orderItems: {
              create: orderItemCreates,
            },
          },
          include: {
            orderItems: {
              include: {
                product: true,
              },
            },
          },
        });
      });

      return reply.status(201).send({
        success: true,
        order: {
          ...order,
          id: order.id.toString(),
          userId: order.userId.toString(),
          totalAmount: Number(order.totalAmount),
          orderItems: order.orderItems.map((oi) => ({
            ...oi,
            id: oi.id.toString(),
            orderId: oi.orderId.toString(),
            productId: oi.productId.toString(),
            unitPrice: Number(oi.unitPrice),
            product: {
              ...oi.product,
              id: oi.product.id.toString(),
              price: Number(oi.product.price),
            },
          })),
        },
      });
    } catch (err: any) {
      return reply.status(400).send({ message: err.message || '주문 생성 실패' });
    }
  });

  // 2. Toss Payments 결제 승인 및 실패 시 재고 롤백
  app.post('/:id/payment', async (request, reply) => {
    let userId: bigint;
    try {
      const token = request.headers.authorization?.replace('Bearer ', '');
      if (!token) throw new Error('Missing token');
      const decoded = app.jwt.verify<{ id: string }>(token);
      userId = BigInt(decoded.id);
    } catch {
      return reply.status(401).send({ message: 'Unauthorized' });
    }

    const { id } = request.params as { id: string };
    const { paymentKey, orderId, amount } = request.body as {
      paymentKey: string;
      orderId: string;
      amount: number;
    };

    const order = await prisma.order.findUnique({
      where: { id: BigInt(id) },
      include: {
        orderItems: true,
      },
    });

    if (!order) {
      return reply.status(404).send({ success: false, message: '주문을 찾을 수 없습니다.' });
    }

    if (order.userId !== userId) {
      return reply.status(403).send({ success: false, message: '접근 권한이 없습니다.' });
    }

    if (order.status !== OrderStatus.pending) {
      return reply.status(400).send({
        success: false,
        message: `결제할 수 없는 주문 상태입니다: ${order.status}`,
      });
    }

    if (amount !== Number(order.totalAmount)) {
      return reply.status(400).send({
        success: false,
        message: '결제 요청 금액과 주문 금액이 일치하지 않습니다.',
      });
    }

    // Toss Payments 결제 승인 요청
    const tossResult = await confirmTossPayment({
      paymentKey,
      orderId,
      amount,
    });

    if (!tossResult.success) {
      // 결제 승인 실패 시 원자적 재고 롤백 및 주문 취소
      await prisma.$transaction(async (tx) => {
        for (const item of order.orderItems) {
          await tx.product.update({
            where: { id: item.productId },
            data: {
              stockQuantity: {
                increment: item.quantity,
              },
            },
          });
        }

        await tx.order.update({
          where: { id: order.id },
          data: {
            status: OrderStatus.cancelled,
          },
        });
      });

      return reply.status(400).send({
        success: false,
        message: tossResult.error || '결제 승인에 실패하여 주문이 취소되고 재고가 복구되었습니다.',
      });
    }

    // 결제 승인 성공 처리
    const updatedOrder = await prisma.order.update({
      where: { id: order.id },
      data: {
        status: OrderStatus.paid,
        paymentKey,
        paidAt: new Date(),
      },
      include: {
        orderItems: true,
      },
    });

    return reply.send({
      success: true,
      order: {
        ...updatedOrder,
        id: updatedOrder.id.toString(),
        userId: updatedOrder.userId.toString(),
        totalAmount: Number(updatedOrder.totalAmount),
        orderItems: updatedOrder.orderItems.map((oi) => ({
          ...oi,
          id: oi.id.toString(),
          orderId: oi.orderId.toString(),
          productId: oi.productId.toString(),
          unitPrice: Number(oi.unitPrice),
        })),
      },
    });
  });

  // 3. 내 주문 내역 조회
  app.get('/', async (request, reply) => {
    let userId: bigint;
    try {
      const token = request.headers.authorization?.replace('Bearer ', '');
      if (!token) throw new Error('Missing token');
      const decoded = app.jwt.verify<{ id: string }>(token);
      userId = BigInt(decoded.id);
    } catch {
      return reply.status(401).send({ message: 'Unauthorized' });
    }

    const orders = await prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        orderItems: {
          include: {
            product: true,
          },
        },
      },
    });

    return reply.send({
      success: true,
      orders: orders.map((o) => ({
        ...o,
        id: o.id.toString(),
        userId: o.userId.toString(),
        totalAmount: Number(o.totalAmount),
        orderItems: o.orderItems.map((oi) => ({
          ...oi,
          id: oi.id.toString(),
          orderId: oi.orderId.toString(),
          productId: oi.productId.toString(),
          unitPrice: Number(oi.unitPrice),
          product: {
            ...oi.product,
            id: oi.product.id.toString(),
            price: Number(oi.product.price),
          },
        })),
      })),
    });
  });
}
