import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient, Role, OrderStatus } from '@prisma/client';

const prisma = new PrismaClient();

export async function adminRoutes(app: FastifyInstance) {
  // Middleware: verifyAdmin
  const verifyAdmin = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const token = request.headers.authorization?.replace('Bearer ', '');
      if (!token) {
        return reply.status(401).send({ success: false, message: 'Unauthorized: Missing token' });
      }

      const decoded = app.jwt.verify<{ id: string }>(token);
      const user = await prisma.user.findUnique({
        where: { id: BigInt(decoded.id) },
        select: { id: true, role: true },
      });

      if (!user || user.role !== Role.ADMIN) {
        return reply.status(403).send({
          success: false,
          message: 'Forbidden: Admin access required',
        });
      }
    } catch {
      return reply.status(401).send({ success: false, message: 'Unauthorized: Invalid token' });
    }
  };

  /**
   * GET /api/v1/admin/stats
   * Platform KPI statistics for Admin Dashboard
   */
  app.get('/stats', { preHandler: [verifyAdmin] }, async (_request, reply) => {
    try {
      // 1. Total revenue (sum of paid, shipped, delivered orders)
      const revenueResult = await prisma.order.aggregate({
        where: {
          status: { in: [OrderStatus.paid, OrderStatus.shipped, OrderStatus.delivered] },
        },
        _sum: {
          totalAmount: true,
        },
      });

      // 2. Total orders count
      const totalOrders = await prisma.order.count();

      // 3. Low stock count (<= 5)
      const lowStockCount = await prisma.product.count({
        where: {
          stockQuantity: { lte: 5 },
        },
      });

      // 4. Total users count
      const totalUsers = await prisma.user.count();

      return reply.send({
        success: true,
        stats: {
          totalRevenue: Number(revenueResult._sum.totalAmount || 0),
          totalOrders,
          lowStockCount,
          totalUsers,
        },
      });
    } catch (err: any) {
      return reply.status(500).send({
        success: false,
        message: 'Failed to fetch admin stats',
        error: err.message,
      });
    }
  });

  /**
   * GET /api/v1/admin/orders
   * All orders with filters
   */
  app.get('/orders', { preHandler: [verifyAdmin] }, async (request, reply) => {
    const { status } = request.query as { status?: string };

    try {
      const orders = await prisma.order.findMany({
        where: status && status !== 'all' ? { status: status as OrderStatus } : undefined,
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
          orderItems: {
            include: {
              product: {
                select: { id: true, name: true, imageUrl: true, price: true, categoryId: true },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      return reply.send({
        success: true,
        orders: orders.map((o) => ({
          id: o.id.toString(),
          userId: o.userId.toString(),
          status: o.status,
          totalAmount: Number(o.totalAmount),
          paymentKey: o.paymentKey,
          paidAt: o.paidAt?.toISOString() || null,
          createdAt: o.createdAt.toISOString(),
          user: {
            id: o.user.id.toString(),
            name: o.user.name,
            email: o.user.email,
          },
          orderItems: o.orderItems.map((oi) => ({
            id: oi.id.toString(),
            productId: oi.productId.toString(),
            quantity: oi.quantity,
            unitPrice: Number(oi.unitPrice),
            product: {
              id: oi.product.id.toString(),
              name: oi.product.name,
              imageUrl: oi.product.imageUrl || null,
              price: Number(oi.product.price),
              categoryId: oi.product.categoryId,
            },
          })),
        })),
      });
    } catch (err: any) {
      return reply.status(500).send({
        success: false,
        message: 'Failed to fetch orders',
        error: err.message,
      });
    }
  });

  /**
   * PATCH /api/v1/admin/orders/:id/status
   * Update order status
   */
  app.patch('/orders/:id/status', { preHandler: [verifyAdmin] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { status } = request.body as { status: string };

    if (!Object.values(OrderStatus).includes(status as OrderStatus)) {
      return reply.status(400).send({ success: false, message: 'Invalid order status' });
    }

    try {
      const updated = await prisma.order.update({
        where: { id: BigInt(id) },
        data: { status: status as OrderStatus },
      });

      return reply.send({
        success: true,
        order: {
          id: updated.id.toString(),
          status: updated.status,
          updatedAt: updated.updatedAt.toISOString(),
        },
      });
    } catch {
      return reply.status(404).send({ success: false, message: 'Order not found' });
    }
  });

  /**
   * PATCH /api/v1/admin/products/:id/stock
   * Real-time inventory stock update
   */
  app.patch('/products/:id/stock', { preHandler: [verifyAdmin] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { stockQuantity } = request.body as { stockQuantity: number };

    if (typeof stockQuantity !== 'number' || stockQuantity < 0) {
      return reply.status(400).send({ success: false, message: 'Invalid stock quantity' });
    }

    try {
      const updated = await prisma.product.update({
        where: { id: BigInt(id) },
        data: { stockQuantity: Math.floor(stockQuantity) },
        select: { id: true, name: true, stockQuantity: true, categoryId: true },
      });

      return reply.send({
        success: true,
        product: {
          id: updated.id.toString(),
          name: updated.name,
          stockQuantity: updated.stockQuantity,
          categoryId: updated.categoryId,
        },
      });
    } catch {
      return reply.status(404).send({ success: false, message: 'Product not found' });
    }
  });
}
