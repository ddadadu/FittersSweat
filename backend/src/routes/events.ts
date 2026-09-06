import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function eventRoutes(app: FastifyInstance) {
  // 1. 대회 목록 조회
  app.get('/', async (request, reply) => {
    const events = await prisma.event.findMany({
      orderBy: { startDate: 'asc' },
    });

    return reply.send({
      success: true,
      events: events.map((e) => ({
        ...e,
        id: e.id.toString(),
      })),
    });
  });

  // 2. 대회 상세 조회
  app.get('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };

    try {
      const event = await prisma.event.findUnique({
        where: { id: BigInt(id) },
        include: {
          posts: {
            take: 5,
            orderBy: { createdAt: 'desc' },
          },
        },
      });

      if (!event) {
        return reply.status(404).send({ message: 'Event not found' });
      }

      return reply.send({
        success: true,
        event: {
          ...event,
          id: event.id.toString(),
          posts: event.posts.map((p) => ({
            ...p,
            id: p.id.toString(),
            userId: p.userId.toString(),
            eventId: p.eventId?.toString() || null,
          })),
        },
      });
    } catch {
      return reply.status(400).send({ message: 'Invalid event ID' });
    }
  });

  // 3. 관심 대회 등록/취소 (토글)
  app.post('/:id/interested', async (request, reply) => {
    // JWT 인증 검증
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
    const eventId = BigInt(id);

    const existing = await prisma.interestedEvent.findUnique({
      where: {
        userId_eventId: { userId, eventId },
      },
    });

    if (existing) {
      await prisma.interestedEvent.delete({
        where: {
          userId_eventId: { userId, eventId },
        },
      });
      return reply.send({ success: true, isInterested: false });
    } else {
      await prisma.interestedEvent.create({
        data: { userId, eventId },
      });
      return reply.send({ success: true, isInterested: true });
    }
  });
}
