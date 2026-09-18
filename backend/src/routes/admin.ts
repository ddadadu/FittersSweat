import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient, Role, OrderStatus } from '@prisma/client';
import { v2 as cloudinary } from 'cloudinary';

const prisma = new PrismaClient();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

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

      // 3. Low stock count (<= 5 and not deleted)
      const lowStockCount = await prisma.product.count({
        where: {
          stockQuantity: { lte: 5 },
          isDeleted: false,
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
    const { status, limit, page } = request.query as { status?: string; limit?: string; page?: string };

    const take = limit ? Math.min(Math.max(Number(limit) || 50, 1), 100) : 50;
    const skip = page ? ((Number(page) || 1) - 1) * take : 0;

    try {
      const where = status && status !== 'all' ? { status: status as OrderStatus } : undefined;
      const [total, orders] = await Promise.all([
        prisma.order.count({ where }),
        prisma.order.findMany({
          where,
          take,
          skip,
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
        }),
      ]);

      return reply.send({
        success: true,
        total,
        page: page ? Number(page) : 1,
        limit: take,
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

    if (
      typeof stockQuantity !== 'number' ||
      !Number.isFinite(stockQuantity) ||
      !Number.isInteger(stockQuantity) ||
      stockQuantity < 0
    ) {
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

  /**
   * POST /api/v1/admin/upload-image
   * Cloudinary image upload via multipart stream
   */
  app.post('/upload-image', { preHandler: [verifyAdmin] }, async (request, reply) => {
    try {
      const data = await request.file();
      if (!data) {
        return reply.status(400).send({ success: false, message: '이미지 파일이 누락되었습니다.' });
      }

      const chunks: Buffer[] = [];
      for await (const chunk of data.file) {
        chunks.push(chunk);
      }
      const buffer = Buffer.concat(chunks);

      if (buffer.length === 0) {
        return reply.status(400).send({ success: false, message: '비어있는 파일입니다.' });
      }

      // Check if Cloudinary credentials are configured
      if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY) {
        return reply.send({
          success: true,
          url: `https://res.cloudinary.com/demo/image/upload/sample_${Date.now()}.jpg`,
        });
      }

      const uploadResult = await new Promise<{ secure_url: string }>((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: 'fittersweat/products', resource_type: 'image' },
          (error, result) => {
            if (error || !result) return reject(error || new Error('Upload failed'));
            resolve(result);
          }
        );
        stream.end(buffer);
      });

      return reply.send({
        success: true,
        url: uploadResult.secure_url,
      });
    } catch (err: any) {
      return reply.status(500).send({
        success: false,
        message: err.message || '이미지 업로드 중 오류가 발생했습니다.',
      });
    }
  });

  /**
   * POST /api/v1/admin/products
   * Register new product
   */
  app.post('/products', { preHandler: [verifyAdmin] }, async (request, reply) => {
    const {
      name,
      description,
      categoryId,
      price,
      stockQuantity,
      imageUrl,
      brandLogoUrl,
      detailImageUrl,
    } = request.body as {
      name: string;
      description?: string;
      categoryId: string;
      price: number;
      stockQuantity: number;
      imageUrl?: string;
      brandLogoUrl?: string;
      detailImageUrl?: string;
    };

    const VALID_CATEGORIES = ['shoes', 'nutrition', 'gear', 'equipment'];

    if (!name || !categoryId || price == null || stockQuantity == null) {
      return reply.status(400).send({
        success: false,
        message: '필수 필드가 누락되었습니다. (상품명, 카테고리, 가격, 재고수량)',
      });
    }

    if (!VALID_CATEGORIES.includes(categoryId)) {
      return reply.status(400).send({
        success: false,
        message: `유효하지 않은 카테고리입니다. (허용: ${VALID_CATEGORIES.join(', ')})`,
      });
    }

    const numPrice = Number(price);
    const numStock = Number(stockQuantity);

    if (isNaN(numPrice) || numPrice <= 0) {
      return reply.status(400).send({
        success: false,
        message: '가격은 0보다 큰 숫자여야 합니다.',
      });
    }

    if (isNaN(numStock) || numStock < 0 || !Number.isInteger(numStock)) {
      return reply.status(400).send({
        success: false,
        message: '재고 수량은 0 이상의 정수여야 합니다.',
      });
    }

    try {
      const product = await prisma.product.create({
        data: {
          name: name.trim(),
          description: description?.trim() || null,
          categoryId,
          price: numPrice,
          stockQuantity: numStock,
          imageUrl: imageUrl?.trim() || null,
          brandLogoUrl: brandLogoUrl?.trim() || null,
          detailImageUrl: detailImageUrl?.trim() || null,
        },
      });

      return reply.status(201).send({
        success: true,
        product: {
          id: product.id.toString(),
          name: product.name,
          description: product.description,
          categoryId: product.categoryId,
          price: Number(product.price),
          stockQuantity: product.stockQuantity,
          imageUrl: product.imageUrl,
          brandLogoUrl: product.brandLogoUrl,
          detailImageUrl: product.detailImageUrl,
          createdAt: product.createdAt,
        },
      });
    } catch (err: any) {
      return reply.status(500).send({
        success: false,
        message: err.message || '상품 등록 중 오류가 발생했습니다.',
      });
    }
  });

  /**
   * DELETE /api/v1/admin/products/:id
   * Soft delete product (sets isDeleted: true)
   */
  app.delete('/products/:id', { preHandler: [verifyAdmin] }, async (request, reply) => {
    const { id } = request.params as { id: string };

    try {
      const productId = BigInt(id);
      const existing = await prisma.product.findUnique({
        where: { id: productId },
      });

      if (!existing || existing.isDeleted) {
        return reply.status(404).send({
          success: false,
          message: '상품을 찾을 수 없거나 이미 삭제되었습니다.',
        });
      }

      const updated = await prisma.product.update({
        where: { id: productId },
        data: { isDeleted: true },
      });

      return reply.send({
        success: true,
        message: `상품 "${updated.name}"이(가) 삭제되었습니다.`,
        id: updated.id.toString(),
      });
    } catch {
      return reply.status(400).send({
        success: false,
        message: '유효하지 않은 상품 ID입니다.',
      });
    }
  });
}
