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
  app.post(
    '/signup',
    {
      schema: {
        tags: ['Auth'],
        summary: '회원가입',
        description: '새로운 사용자를 등록하고 bcrypt로 비밀번호를 암호화합니다.',
        body: {
          type: 'object',
          required: ['email', 'password', 'name'],
          properties: {
            email: { type: 'string', format: 'email', example: 'runner@naver.com' },
            password: { type: 'string', minLength: 6, example: 'password123!' },
            name: { type: 'string', example: '김러너' },
          },
        },
      },
    },
    async (request, reply) => {
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
    }
  );

  // 2. 로그인
  app.post(
    '/login',
    {
      schema: {
        tags: ['Auth'],
        summary: '로그인',
        description: '이메일과 비밀번호로 로그인하여 JWT 토큰을 발급받습니다.',
        body: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email', example: 'runner@naver.com' },
            password: { type: 'string', example: 'password123!' },
          },
        },
      },
    },
    async (request, reply) => {
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
  app.post(
    '/refresh',
    {
      schema: {
        tags: ['Auth'],
        summary: '토큰 갱신',
        description: 'Refresh 토큰으로 새로운 Access 토큰을 갱신합니다.',
        body: {
          type: 'object',
          required: ['refreshToken'],
          properties: {
            refreshToken: { type: 'string', example: 'eyJhbGci...' },
          },
        },
      },
    },
    async (request, reply) => {
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


  // 4. 내 프로필 조회
  app.get(
    '/me',
    {
      schema: {
        tags: ['Auth'],
        summary: '내 프로필 조회',
        description: '인증 토큰으로 현재 로그인한 사용자의 정보를 조회합니다.',
      },
    },
    async (request, reply) => {
      let userId: bigint;
      try {
        const token = request.headers.authorization?.replace('Bearer ', '');
        if (!token) throw new Error('Missing token');
        const decoded = app.jwt.verify<{ id: string }>(token);
        userId = BigInt(decoded.id);
      } catch {
        return reply.status(401).send({ message: 'Unauthorized' });
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
        },
      });

      if (!user) {
        return reply.status(404).send({ message: 'User not found' });
      }

      return reply.send({
        success: true,
        user: {
          ...user,
          id: user.id.toString(),
        },
      });
    }
  );
}
