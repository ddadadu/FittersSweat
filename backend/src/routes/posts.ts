import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function postRoutes(app: FastifyInstance) {
  // 1. 커뮤니티 게시글 목록 조회 (대회별 필터링 옵션)
  app.get('/', async (request, reply) => {
    const { eventId } = request.query as { eventId?: string };

    const where = eventId ? { eventId: BigInt(eventId) } : {};
    const posts = await prisma.post.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { id: true, name: true },
        },
        _count: {
          select: { postComments: true },
        },
        taggedItems: {
          include: {
            product: {
              select: { id: true, name: true, price: true, categoryId: true },
            },
          },
        },
      },
    });

    return reply.send({
      success: true,
      posts: posts.map((p) => ({
        ...p,
        id: p.id.toString(),
        userId: p.userId.toString(),
        eventId: p.eventId?.toString() || null,
        user: {
          id: p.user.id.toString(),
          name: p.user.name,
        },
        commentCount: p._count.postComments,
        taggedItems: p.taggedItems.map((ti) => ({
          productId: ti.productId.toString(),
          product: {
            ...ti.product,
            id: ti.product.id.toString(),
            price: Number(ti.product.price),
          },
        })),
      })),
    });
  });

  // 2. 게시글 상세 조회 (댓글 및 태그된 상품 포함)
  app.get('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };

    try {
      const post = await prisma.post.findUnique({
        where: { id: BigInt(id) },
        include: {
          user: {
            select: { id: true, name: true },
          },
          postComments: {
            include: {
              user: {
                select: { id: true, name: true },
              },
            },
            orderBy: { createdAt: 'asc' },
          },
          taggedItems: {
            include: {
              product: {
                select: { id: true, name: true, price: true, categoryId: true },
              },
            },
          },
        },
      });

      if (!post) {
        return reply.status(404).send({ message: 'Post not found' });
      }

      return reply.send({
        success: true,
        post: {
          ...post,
          id: post.id.toString(),
          userId: post.userId.toString(),
          eventId: post.eventId?.toString() || null,
          user: {
            id: post.user.id.toString(),
            name: post.user.name,
          },
          postComments: post.postComments.map((c) => ({
            ...c,
            id: c.id.toString(),
            postId: c.postId.toString(),
            userId: c.userId.toString(),
            user: {
              id: c.user.id.toString(),
              name: c.user.name,
            },
          })),
          taggedItems: post.taggedItems.map((ti) => ({
            productId: ti.productId.toString(),
            product: {
              ...ti.product,
              id: ti.product.id.toString(),
              price: Number(ti.product.price),
            },
          })),
        },
      });
    } catch {
      return reply.status(400).send({ message: 'Invalid post ID' });
    }
  });

  // 3. 게시글 작성 (상품 태그 연결 지원, 인증 필수)
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

    const { title, content, eventId, productIds } = request.body as {
      title: string;
      content: string;
      eventId?: string | number;
      productIds?: (string | number)[];
    };

    if (!title || !content) {
      return reply.status(400).send({ message: 'Title and content are required' });
    }

    try {
      const post = await prisma.post.create({
        data: {
          title,
          content,
          userId,
          eventId: eventId ? BigInt(eventId) : null,
          taggedItems: productIds && productIds.length > 0
            ? {
                create: productIds.map((pId) => ({
                  productId: BigInt(pId),
                })),
              }
            : undefined,
        },
        include: {
          taggedItems: true,
        },
      });

      return reply.status(201).send({
        success: true,
        post: {
          ...post,
          id: post.id.toString(),
          userId: post.userId.toString(),
          eventId: post.eventId?.toString() || null,
        },
      });
    } catch {
      return reply.status(400).send({ message: 'Failed to create post' });
    }
  });

  // 4. 댓글 작성 (인증 필수)
  app.post('/:id/comments', async (request, reply) => {
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
    const { content } = request.body as { content: string };

    if (!content) {
      return reply.status(400).send({ message: 'Content is required' });
    }

    try {
      const comment = await prisma.postComment.create({
        data: {
          postId: BigInt(id),
          userId,
          content,
        },
      });

      return reply.status(201).send({
        success: true,
        comment: {
          ...comment,
          id: comment.id.toString(),
          postId: comment.postId.toString(),
          userId: comment.userId.toString(),
        },
      });
    } catch {
      return reply.status(400).send({ message: 'Failed to create comment' });
    }
  });
}
