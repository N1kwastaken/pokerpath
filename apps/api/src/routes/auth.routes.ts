import type { FastifyInstance } from 'fastify';
import {
  registerSchema,
  loginSchema,
  refreshSchema,
} from '@pokerpath/shared';
import { prisma } from '../lib/prisma.js';
import { hashPassword, verifyPassword } from '../lib/password.js';
import {
  BadRequestError,
  ConflictError,
  UnauthorizedError,
  NotFoundError,
} from '../lib/errors.js';
import { toPublicUser } from '../services/user.serializer.js';

/**
 * Rotas de autenticação (PRD 4.1, 15.5).
 * POST /auth/register — cria conta + streak inicial
 * POST /auth/login    — valida credenciais e emite tokens
 * POST /auth/refresh  — rotaciona o refresh token
 * POST /auth/logout   — revoga o refresh token
 * GET  /auth/me       — retorna o usuário autenticado
 */
export async function authRoutes(app: FastifyInstance) {
  // ─── Registro ──────────────────────────────────────────────
  app.post('/auth/register', async (request, reply) => {
    const parsed = registerSchema.safeParse(request.body);
    if (!parsed.success) {
      throw new BadRequestError(
        parsed.error.errors[0]?.message ?? 'Dados inválidos',
        'VALIDATION_ERROR',
      );
    }
    const { name, email, password } = parsed.data;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new ConflictError('E-mail já cadastrado', 'EMAIL_TAKEN');
    }

    const passwordHash = await hashPassword(password);

    // Cria usuário e streak vazio juntos.
    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        streak: { create: {} },
      },
      include: { streak: true },
    });

    const accessToken = app.tokens.signAccessToken({
      sub: user.id,
      email: user.email,
    });
    const refreshToken = await app.tokens.issueRefreshToken(
      user.id,
      user.email,
    );

    return reply.status(201).send({
      user: toPublicUser(user, user.streak),
      accessToken,
      refreshToken,
    });
  });

  // ─── Login ─────────────────────────────────────────────────
  app.post('/auth/login', async (request, reply) => {
    const parsed = loginSchema.safeParse(request.body);
    if (!parsed.success) {
      throw new BadRequestError(
        parsed.error.errors[0]?.message ?? 'Dados inválidos',
        'VALIDATION_ERROR',
      );
    }
    const { email, password } = parsed.data;

    const user = await prisma.user.findUnique({
      where: { email },
      include: { streak: true },
    });

    // Mensagem genérica evita revelar se o e-mail existe.
    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      throw new UnauthorizedError(
        'E-mail ou senha incorretos',
        'INVALID_CREDENTIALS',
      );
    }

    const accessToken = app.tokens.signAccessToken({
      sub: user.id,
      email: user.email,
    });
    const refreshToken = await app.tokens.issueRefreshToken(
      user.id,
      user.email,
    );

    return reply.send({
      user: toPublicUser(user, user.streak),
      accessToken,
      refreshToken,
    });
  });

  // ─── Refresh ───────────────────────────────────────────────
  app.post('/auth/refresh', async (request, reply) => {
    const parsed = refreshSchema.safeParse(request.body);
    if (!parsed.success) {
      throw new BadRequestError('Refresh token ausente', 'VALIDATION_ERROR');
    }

    const rotated = await app.tokens.rotateRefreshToken(
      parsed.data.refreshToken,
    );
    if (!rotated) {
      throw new UnauthorizedError(
        'Refresh token inválido ou expirado',
        'INVALID_REFRESH',
      );
    }

    return reply.send({
      accessToken: rotated.accessToken,
      refreshToken: rotated.refreshToken,
    });
  });

  // ─── Logout ────────────────────────────────────────────────
  app.post('/auth/logout', async (request, reply) => {
    const parsed = refreshSchema.safeParse(request.body);
    if (parsed.success) {
      await app.tokens.revokeRefreshToken(parsed.data.refreshToken);
    }
    return reply.status(204).send();
  });

  // ─── Usuário atual ─────────────────────────────────────────
  app.get(
    '/auth/me',
    { onRequest: [app.authenticate] },
    async (request, reply) => {
      const user = await prisma.user.findUnique({
        where: { id: request.user.sub },
        include: { streak: true },
      });
      if (!user) {
        throw new NotFoundError('Usuário não encontrado', 'USER_NOT_FOUND');
      }
      return reply.send({ user: toPublicUser(user, user.streak) });
    },
  );
}
