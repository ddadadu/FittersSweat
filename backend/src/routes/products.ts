import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function productRoutes(app: FastifyInstance) {
  // 1. 상품 목록 조회 (카테고리 필터링 지원)
  app.get('/', async (request, reply) => {
    const { categoryId } = request.query as { categoryId?: string };

    const where = categoryId ? { categoryId } : {};
    const products = await prisma.product.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { reviews: true },
        },
      },
    });

    return reply.send({
      success: true,
      products: products.map((p) => ({
        ...p,
        id: p.id.toString(),
        price: Number(p.price),
        reviewCount: p._count.reviews,
      })),
    });
  });

  // 2. 상품 상세 조회 (리뷰 및 태그된 게시글 포함)
  app.get('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };

    try {
      const product = await prisma.product.findUnique({
        where: { id: BigInt(id) },
        include: {
          reviews: {
            include: {
              user: {
                select: { id: true, name: true },
              },
            },
            orderBy: { createdAt: 'desc' },
          },
          taggedPosts: {
            include: {
              post: {
                select: { id: true, title: true, createdAt: true },
              },
            },
          },
        },
      });

      if (!product) {
        return reply.status(404).send({ message: 'Product not found' });
      }

      return reply.send({
        success: true,
        product: {
          ...product,
          id: product.id.toString(),
          price: Number(product.price),
          reviews: product.reviews.map((r) => ({
            ...r,
            id: r.id.toString(),
            productId: r.productId.toString(),
            userId: r.userId.toString(),
            user: {
              id: r.user.id.toString(),
              name: r.user.name,
            },
          })),
          taggedPosts: product.taggedPosts.map((tp) => ({
            postId: tp.postId.toString(),
            productId: tp.productId.toString(),
            post: {
              id: tp.post.id.toString(),
              title: tp.post.title,
              createdAt: tp.post.createdAt,
            },
          })),
        },
      });
    } catch {
      return reply.status(400).send({ message: 'Invalid product ID' });
    }
  });

  // 3. 상품 리뷰 작성 (인증 필요)
  app.post('/:id/reviews', async (request, reply) => {
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
    const { rating, content } = request.body as { rating: number; content: string };

    if (!rating || !content) {
      return reply.status(400).send({ message: 'Rating and content are required' });
    }

    try {
      const review = await prisma.review.create({
        data: {
          productId: BigInt(id),
          userId,
          rating: Number(rating),
          content,
        },
      });

      return reply.status(201).send({
        success: true,
        review: {
          ...review,
          id: review.id.toString(),
          productId: review.productId.toString(),
          userId: review.userId.toString(),
        },
      });
    } catch {
      return reply.status(400).send({ message: 'Failed to create review' });
    }
  });
}
