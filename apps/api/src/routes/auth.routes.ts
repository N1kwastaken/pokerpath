import type { FastifyInstance } from 'fastify';
import { createHash, randomBytes } from 'node:crypto';
import {
  registerSchema,
  loginSchema,
  refreshSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '@pokerpath/shared';
import { prisma } from '../lib/prisma.js';
import { betaSignup } from '../lib/beta.js';
import { hashPassword, verifyPassword } from '../lib/password.js';
import {
  BadRequestError,
  ConflictError,
  UnauthorizedError,
  NotFoundError,
} from '../lib/errors.js';
import { toPublicUser } from '../services/user.serializer.js';
import { sendMail, passwordResetMail, welcomeMail } from '../services/mail.service.js';
import { env } from '../config/env.js';

/** Recuperação de senha: validade do link e limite anti-abuso. */
const RESET_TTL_MIN = 30;
const RESET_MAX_PER_HOUR = 3;
const sha256 = (s: string) => createHash('sha256').update(s).digest('hex');

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

    // Cria usuário e streak vazio juntos. `isDev` vem EXPLÍCITO do ambiente
    // (ver lib/beta.ts): assim o launch é uma variável no Render, não uma
    // migration que recria a tabela users.
    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        isDev: betaSignup(),
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

    // Boas-vindas: nunca pode derrubar o cadastro — falha vira log.
    try {
      await sendMail({ to: user.email, ...welcomeMail(user.name) });
    } catch (err) {
      request.log.error({ err }, 'Falha ao enviar e-mail de boas-vindas');
    }

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

  // ─── Esqueci minha senha ───────────────────────────────────
  app.post('/auth/forgot-password', async (request, reply) => {
    const parsed = forgotPasswordSchema.safeParse(request.body);
    if (!parsed.success) {
      throw new BadRequestError(
        parsed.error.errors[0]?.message ?? 'Dados inválidos',
        'VALIDATION_ERROR',
      );
    }
    const { email } = parsed.data;

    // A resposta é IDÊNTICA com ou sem conta — não revela e-mails cadastrados.
    const user = await prisma.user.findUnique({ where: { email } });
    if (user) {
      const recent = await prisma.passwordResetToken.count({
        where: { userId: user.id, createdAt: { gte: new Date(Date.now() - 3_600_000) } },
      });
      // A resposta ao cliente é sempre a mesma (anti-enumeração), então sem
      // este log o limite bloqueia em SILÊNCIO — e de fora fica idêntico a
      // "e-mail não chegou". Custou um diagnóstico; agora aparece no log.
      if (recent >= RESET_MAX_PER_HOUR) {
        request.log.warn({ userId: user.id, recent }, 'Reset de senha bloqueado pelo limite por hora');
      }
      if (recent < RESET_MAX_PER_HOUR) {
        const token = randomBytes(32).toString('hex');
        await prisma.passwordResetToken.create({
          data: {
            userId: user.id,
            tokenHash: sha256(token),
            expiresAt: new Date(Date.now() + RESET_TTL_MIN * 60_000),
          },
        });
        const base = process.env.WEB_APP_URL ?? env.WEB_ORIGIN;
        const link = `${base}/reset-password?token=${token}`;
        try {
          await sendMail({ to: email, ...passwordResetMail(user.name, link, RESET_TTL_MIN) });
        } catch (err) {
          request.log.error({ err }, 'Falha ao enviar e-mail de recuperação');
        }
      }
    }

    return reply.send({
      ok: true,
      message: 'Se este e-mail tiver conta, enviamos um link de recuperação.',
    });
  });

  // ─── Redefinir senha ───────────────────────────────────────
  app.post('/auth/reset-password', async (request, reply) => {
    const parsed = resetPasswordSchema.safeParse(request.body);
    if (!parsed.success) {
      throw new BadRequestError(
        parsed.error.errors[0]?.message ?? 'Dados inválidos',
        'VALIDATION_ERROR',
      );
    }
    const { token, password } = parsed.data;

    const row = await prisma.passwordResetToken.findUnique({
      where: { tokenHash: sha256(token) },
    });
    if (!row || row.usedAt || row.expiresAt < new Date()) {
      throw new BadRequestError(
        'Link inválido ou expirado. Peça um novo.',
        'INVALID_RESET_TOKEN',
      );
    }

    const passwordHash = await hashPassword(password);
    // Troca a senha, queima o token e derruba as sessões antigas — juntos.
    await prisma.$transaction([
      prisma.user.update({ where: { id: row.userId }, data: { passwordHash } }),
      prisma.passwordResetToken.update({ where: { id: row.id }, data: { usedAt: new Date() } }),
      prisma.refreshToken.updateMany({
        where: { userId: row.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);

    return reply.send({ ok: true });
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
