import { FastifyInstance } from 'fastify';
import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const prisma = new PrismaClient();

import crypto from 'crypto';
import { EmailService } from '../services/email.service';

// BigInt JSON 직렬화 지원
(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

interface OtpEntry {
  code: string;
  expiresAt: number;
  attempts: number;
  lastSentAt: number;
}
export const emailOtpStore = new Map<string, OtpEntry>();

const sendOtpSchema = z.object({
  email: z.string().email('올바른 이메일 형식을 입력해 주세요.'),
});

const verifyOtpSchema = z.object({
  email: z.string().email('올바른 이메일 형식을 입력해 주세요.'),
  code: z.string().length(6, '6자리 인증 코드를 입력해 주세요.'),
});

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1),
  role: z.nativeEnum(Role).optional(),
  verificationToken: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

const refreshSchema = z.object({
  refreshToken: z.string(),
});

export async function authRoutes(app: FastifyInstance) {
  // 0-1. 회원가입 이메일 인증번호 발송 (POST /api/v1/auth/send-verification-email)
  app.post(
    '/send-verification-email',
    {
      schema: {
        tags: ['Auth'],
        summary: '이메일 인증번호 발송',
        description: '회원가입을 위한 6자리 OTP 인증 코드를 이메일로 전송합니다.',
        body: {
          type: 'object',
          required: ['email'],
          properties: {
            email: { type: 'string', format: 'email', example: 'runner@naver.com' },
          },
        },
      },
    },
    async (request, reply) => {
      const parseResult = sendOtpSchema.safeParse(request.body);
      if (!parseResult.success) {
        return reply.status(400).send({
          message: '올바른 이메일 주소를 입력해 주세요.',
          errors: parseResult.error.errors,
        });
      }

      const { email } = parseResult.data;

      // 1. 이미 가입된 이메일 중복 체크
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) {
        return reply.status(409).send({ message: '이미 가입된 이메일 주소입니다.' });
      }

      // 2. 30초 내 재발송 방지 Rate Limit 가드
      const prevEntry = emailOtpStore.get(email);
      const now = Date.now();
      if (prevEntry && now - prevEntry.lastSentAt < 30 * 1000) {
        const waitSeconds = Math.ceil((30 * 1000 - (now - prevEntry.lastSentAt)) / 1000);
        return reply.status(429).send({
          message: `인증번호는 ${waitSeconds}초 후에 재발송할 수 있습니다.`,
        });
      }

      // 3. 6자리 난수 OTP 생성
      const code = crypto.randomInt(100000, 1000000).toString();

      // 4. 인메모리 OTP 저장소에 5분(300초) TTL 저장
      emailOtpStore.set(email, {
        code,
        expiresAt: now + 5 * 60 * 1000,
        attempts: 0,
        lastSentAt: now,
      });

      // 5. Nodemailer로 메일 발송
      try {
        await EmailService.sendVerificationEmail({ to: email, code });
      } catch (err: any) {
        emailOtpStore.delete(email);
        return reply.status(500).send({
          message: err.message || '이메일 발송에 실패했습니다. 잠시 후 다시 시도해 주세요.',
        });
      }

      return reply.send({
        success: true,
        message: '인증번호가 발송되었습니다. 5분 이내에 입력해 주세요.',
      });
    }
  );

  // 0-2. 이메일 인증번호 검증 (POST /api/v1/auth/verify-email-code)
  app.post(
    '/verify-email-code',
    {
      schema: {
        tags: ['Auth'],
        summary: '이메일 인증번호 확인',
        description: '수신한 6자리 OTP 코드를 검증하고 서명된 가입 인증 토큰을 발급합니다.',
        body: {
          type: 'object',
          required: ['email', 'code'],
          properties: {
            email: { type: 'string', format: 'email' },
            code: { type: 'string', minLength: 6, maxLength: 6 },
          },
        },
      },
    },
    async (request, reply) => {
      const parseResult = verifyOtpSchema.safeParse(request.body);
      if (!parseResult.success) {
        return reply.status(400).send({
          message: '이메일과 6자리 인증 코드를 정확히 입력해 주세요.',
          errors: parseResult.error.errors,
        });
      }

      const { email, code } = parseResult.data;
      const entry = emailOtpStore.get(email);

      if (!entry) {
        return reply.status(400).send({
          message: '인증번호가 발송되지 않았거나 만료되었습니다. 인증번호를 요청해 주세요.',
        });
      }

      // 1. 유효시간 만료 체크 (5분)
      if (Date.now() > entry.expiresAt) {
        emailOtpStore.delete(email);
        return reply.status(400).send({
          message: '인증 유효시간(5분)이 초과되었습니다. 인증번호를 다시 발송해 주세요.',
        });
      }

      // 2. 무차별 대입(Brute-Force) 방어: 최대 5회 초과 시 파기
      if (entry.attempts >= 5) {
        emailOtpStore.delete(email);
        return reply.status(429).send({
          message: '인증 시도 횟수(5회)를 초과했습니다. 인증번호를 다시 요청해 주세요.',
        });
      }

      // 3. Timing-Safe 문자열 검증
      const inputBuffer = Buffer.from(code.trim());
      const targetBuffer = Buffer.from(entry.code);
      const isMatch =
        inputBuffer.length === targetBuffer.length &&
        crypto.timingSafeEqual(inputBuffer, targetBuffer);

      if (!isMatch) {
        entry.attempts += 1;
        const remaining = 5 - entry.attempts;
        if (remaining <= 0) {
          emailOtpStore.delete(email);
          return reply.status(429).send({
            message: '인증 시도 횟수를 초과했습니다. 인증번호를 다시 요청해 주세요.',
          });
        }
        return reply.status(400).send({
          message: `인증번호가 일치하지 않습니다. (남은 시도: ${remaining}회)`,
        });
      }

      // 4. 인증 성공: OTP 파기 및 10분 유효기간 서명 토큰 발급
      emailOtpStore.delete(email);
      const verificationToken = app.jwt.sign(
        { email, purpose: 'email_verified' },
        { expiresIn: '10m' }
      );

      return reply.send({
        success: true,
        verificationToken,
        message: '이메일 인증이 성공적으로 완료되었습니다.',
      });
    }
  );

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
            verificationToken: { type: 'string' },
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

      const { email, password, name, role, verificationToken } = parseResult.data;

      // 이메일 인증 토큰 검증
      if (verificationToken) {
        try {
          const decoded = app.jwt.verify<{ email: string; purpose: string }>(verificationToken);
          if (decoded.purpose !== 'email_verified' || decoded.email !== email) {
            return reply.status(400).send({ message: '인증된 이메일 정보와 일치하지 않습니다.' });
          }
        } catch {
          return reply.status(400).send({ message: '인증 토큰이 만료되었거나 올바르지 않습니다.' });
        }
      } else if (process.env.NODE_ENV === 'production') {
        return reply.status(400).send({ message: '이메일 인증이 필요합니다.' });
      }

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

      // 즉시 로그인 가능한 액세스/리프레시 토큰 발급
      const accessToken = app.jwt.sign(
        { id: user.id.toString(), email: user.email, role: user.role },
        { expiresIn: '1h' }
      );
      const refreshToken = app.jwt.sign(
        { id: user.id.toString() },
        { expiresIn: '7d' }
      );

      return reply.status(201).send({
        success: true,
        user,
        accessToken,
        refreshToken,
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
          phone: true,
          postcode: true,
          address: true,
          addressDetail: true,
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
    phone: z.string().max(20).optional().nullable(),
    postcode: z.string().max(10).optional().nullable(),
    address: z.string().max(255).optional().nullable(),
    addressDetail: z.string().max(255).optional().nullable(),
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
        description: '사용자 이름, 연락처, 기본 배송지 또는 비밀번호를 변경합니다.',
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

      const { name, phone, postcode, address, addressDetail, currentPassword, newPassword } = parseResult.data;
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        return reply.status(404).send({ message: 'User not found' });
      }

      const updateData: {
        name?: string;
        passwordHash?: string;
        phone?: string | null;
        postcode?: string | null;
        address?: string | null;
        addressDetail?: string | null;
      } = {};

      if (name !== undefined) {
        updateData.name = name;
      }
      if (phone !== undefined) {
        updateData.phone = phone;
      }
      if (postcode !== undefined) {
        updateData.postcode = postcode;
      }
      if (address !== undefined) {
        updateData.address = address;
      }
      if (addressDetail !== undefined) {
        updateData.addressDetail = addressDetail;
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
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          phone: true,
          postcode: true,
          address: true,
          addressDetail: true,
          createdAt: true,
        },
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
