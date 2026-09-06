import { FastifyInstance } from 'fastify';
import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const prisma = new PrismaClient();

// BigInt JSON 직렬화 지원
(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1),
  role: z.nativeEnum(Role).optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

const refreshSchema = z.object({
  refreshToken: z.string(),
});

export async function authRoutes(app: FastifyInstance) {
  // 1. 회원가입
  app.post('/signup', async (request, reply) => {
    const parseResult = signupSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({
        message: 'Invalid input',
        errors: parseResult.error.errors,
      });
    }

    const { email, password, name, role } = parseResult.data;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return reply.status(409).send({ message: 'Email already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name,
        role: role || Role.USER,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });

    return reply.status(201).send({
      success: true,
      user,
    });
  });

  // 2. 로그인
  app.post('/login', async (request, reply) => {
    const parseResult = loginSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({ message: 'Invalid credentials' });
    }

    const { email, password } = parseResult.data;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return reply.status(401).send({ message: 'Invalid email or password' });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return reply.status(401).send({ message: 'Invalid email or password' });
    }

    const accessToken = app.jwt.sign(
      { id: user.id.toString(), email: user.email, role: user.role },
      { expiresIn: '1h' }
    );

    const refreshToken = app.jwt.sign(
      { id: user.id.toString() },
      { expiresIn: '7d' }
    );

    return reply.send({
      success: true,
      accessToken,
      refreshToken,
      user: {
        id: user.id.toString(),
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  });

  // 3. 토큰 갱신
  app.post('/refresh', async (request, reply) => {
    const parseResult = refreshSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({ message: 'Missing refresh token' });
    }

    try {
      const decoded = app.jwt.verify<{ id: string }>(parseResult.data.refreshToken);
      const user = await prisma.user.findUnique({
        where: { id: BigInt(decoded.id) },
      });

      if (!user) {
        return reply.status(401).send({ message: 'Invalid user in token' });
      }

      const newAccessToken = app.jwt.sign(
        { id: user.id.toString(), email: user.email, role: user.role },
        { expiresIn: '1h' }
      );

      return reply.send({
        success: true,
        accessToken: newAccessToken,
      });
    } catch (err) {
      return reply.status(401).send({ message: 'Invalid or expired refresh token' });
    }
  });
}
