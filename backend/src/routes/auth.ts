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

  const updateProfileSchema = z.object({
    name: z.string().min(1).optional(),
    currentPassword: z.string().optional(),
    newPassword: z.string().min(6).optional(),
  });

  const deleteAccountSchema = z.object({
    password: z.string().min(1),
  });

  // 5. 내 정보 수정 (PATCH /api/v1/auth/me)
  app.patch(
    '/me',
    {
      schema: {
        tags: ['Auth'],
        summary: '내 정보 수정',
        description: '사용자 이름 또는 비밀번호를 변경합니다.',
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

      const parseResult = updateProfileSchema.safeParse(request.body);
      if (!parseResult.success) {
        return reply.status(400).send({ message: 'Invalid input', errors: parseResult.error.errors });
      }

      const { name, currentPassword, newPassword } = parseResult.data;
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        return reply.status(404).send({ message: 'User not found' });
      }

      const updateData: { name?: string; passwordHash?: string } = {};

      if (name) {
        updateData.name = name;
      }

      if (newPassword) {
        if (!currentPassword) {
          return reply.status(400).send({ message: '현재 비밀번호를 입력해 주세요.' });
        }
        const valid = await bcrypt.compare(currentPassword, user.passwordHash);
        if (!valid) {
          return reply.status(400).send({ message: '현재 비밀번호가 일치하지 않습니다.' });
        }
        updateData.passwordHash = await bcrypt.hash(newPassword, 10);
      }

      const updated = await prisma.user.update({
        where: { id: userId },
        data: updateData,
        select: { id: true, email: true, name: true, role: true, createdAt: true },
      });

      return reply.send({
        success: true,
        user: { ...updated, id: updated.id.toString() },
      });
    }
  );

  // 6. 로그아웃 (POST /api/v1/auth/logout)
  app.post(
    '/logout',
    {
      schema: {
        tags: ['Auth'],
        summary: '로그아웃',
        description: '세션을 종료합니다.',
      },
    },
    async (request, reply) => {
      return reply.send({ success: true, message: 'Logged out successfully' });
    }
  );

  // 7. 회원 탈퇴 (DELETE /api/v1/auth/me)
  app.delete(
    '/me',
    {
      schema: {
        tags: ['Auth'],
        summary: '회원 탈퇴',
        description: '비밀번호 확인 후 사용자와 연관된 데이터를 정리하고 계정을 삭제합니다.',
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

      const parseResult = deleteAccountSchema.safeParse(request.body);
      if (!parseResult.success) {
        return reply.status(400).send({ message: '비밀번호를 입력해 주세요.' });
      }

      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        return reply.status(404).send({ message: 'User not found' });
      }

      const valid = await bcrypt.compare(parseResult.data.password, user.passwordHash);
      if (!valid) {
        return reply.status(400).send({ message: '비밀번호가 일치하지 않습니다.' });
      }

      // Atomic cascading cleanup for orders and user
      await prisma.$transaction(async (tx) => {
        await tx.orderItem.deleteMany({ where: { order: { userId } } });
        await tx.order.deleteMany({ where: { userId } });
        await tx.postProductTag.deleteMany({ where: { post: { userId } } });
        await tx.postComment.deleteMany({ where: { userId } });
        await tx.post.deleteMany({ where: { userId } });
        await tx.review.deleteMany({ where: { userId } });
        await tx.interestedEvent.deleteMany({ where: { userId } });
        await tx.user.delete({ where: { id: userId } });
      });

      return reply.send({
        success: true,
        message: '회원 탈퇴가 안전하게 완료되었습니다.',
      });
    }
  );
}
