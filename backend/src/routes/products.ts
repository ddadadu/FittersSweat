import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function productRoutes(app: FastifyInstance) {
  // 1. 상품 목록 조회 (카테고리 필터링, 검색, 정렬, 페이지네이션 지원)
  app.get('/', async (request, reply) => {
    const {
      categoryId,
      search,
      sort = 'newest',
      page = '1',
      limit = '20',
    } = request.query as {
      categoryId?: string;
      search?: string;
      sort?: 'newest' | 'price_asc' | 'price_desc';
      page?: string;
      limit?: string;
    };

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const where: any = { isDeleted: false };
    if (categoryId && categoryId !== 'ALL') {
      where.categoryId = categoryId;
    }
    if (search && search.trim()) {
      where.OR = [
        { name: { contains: search.trim(), mode: 'insensitive' } },
        { description: { contains: search.trim(), mode: 'insensitive' } },
      ];
    }

    let orderBy: any = { createdAt: 'desc' };
    if (sort === 'price_asc') {
      orderBy = { price: 'asc' };
    } else if (sort === 'price_desc') {
      orderBy = { price: 'desc' };
    }

    const [total, products] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        orderBy,
        skip,
        take: limitNum,
        include: {
          _count: {
            select: { reviews: true },
          },
        },
      }),
    ]);

    return reply.send({
      success: true,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
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

      if (!product || product.isDeleted) {
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
