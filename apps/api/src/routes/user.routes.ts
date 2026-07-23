import type { FastifyInstance } from 'fastify';
import {
  onboardingSchema, ownsBadge, SHOWCASE_MAX, isValidAvatar, AVATAR_MAX_CHARS,
  nameSchema, usernameSchema,
} from '@pokerpath/shared';
import { prisma } from '../lib/prisma.js';
import { BadRequestError, ConflictError, NotFoundError } from '../lib/errors.js';
import { toPublicUser, usernameNextChangeAt } from '../services/user.serializer.js';

/**
 * Rotas do usuário autenticado.
 *   POST  /onboarding   — salva as 3 respostas e marca o onboarding concluído
 *   PATCH /preferences  — preferências da conta (hoje: lembrete por e-mail)
 *   PATCH /name         — nome de exibição (livre, sempre)
 *   PUT   /username      — @ único (1x a cada 30 dias, unicidade validada)
 *   PUT   /showcase     — badges exibidos no perfil (posse validada aqui)
 *   PUT   /avatar       — foto de perfil (data URI pequeno, ou null para remover)
 */
export async function userRoutes(app: FastifyInstance) {
  app.addHook('onRequest', app.authenticate);

  // Nome de exibição — sempre permitido (livre, com acento/espaço).
  app.patch<{ Body: { name?: unknown } | null }>('/name', async (request, reply) => {
    const parsed = nameSchema.safeParse(request.body?.name);
    if (!parsed.success) {
      throw new BadRequestError(parsed.error.errors[0]?.message ?? 'Nome inválido', 'VALIDATION_ERROR');
    }
    const user = await prisma.user.update({
      where: { id: request.user.sub },
      data: { name: parsed.data },
      include: { streak: true },
    });
    return reply.send({ user: toPublicUser(user, user.streak) });
  });

  /**
   * @username — 1 troca a cada 30 dias, único (case-insensitive porque é
   * guardado em minúsculo pelo schema). A janela é medida por `usernameChangedAt`
   * e computada no servidor; o cliente só exibe o que /me devolve.
   */
  app.put<{ Body: { username?: unknown } | null }>('/username', async (request, reply) => {
    const parsed = usernameSchema.safeParse(request.body?.username);
    if (!parsed.success) {
      throw new BadRequestError(parsed.error.errors[0]?.message ?? 'Usuário inválido', 'VALIDATION_ERROR');
    }
    const next = parsed.data;

    const me = await prisma.user.findUnique({
      where: { id: request.user.sub },
      select: { username: true, usernameChangedAt: true },
    });
    if (!me) throw new NotFoundError('Usuário não encontrado', 'USER_NOT_FOUND');

    // Sem troca se for o mesmo @ (evita queimar a janela dos 30 dias à toa).
    if (me.username === next) {
      const user = await prisma.user.findUnique({ where: { id: request.user.sub }, include: { streak: true } });
      return reply.send({ user: toPublicUser(user!, user!.streak) });
    }

    // Janela de 30 dias — bloqueia se ainda não liberou.
    const blockedUntil = usernameNextChangeAt(me.usernameChangedAt);
    if (blockedUntil) {
      const days = Math.ceil((new Date(blockedUntil).getTime() - Date.now()) / 86_400_000);
      throw new BadRequestError(
        `Você só pode trocar o @ a cada 30 dias. Faltam ${days} ${days === 1 ? 'dia' : 'dias'}.`,
        'USERNAME_COOLDOWN',
      );
    }

    // Unicidade: checagem amigável antes de bater na constraint do banco.
    const taken = await prisma.user.findFirst({ where: { username: next, NOT: { id: request.user.sub } }, select: { id: true } });
    if (taken) throw new ConflictError('Esse @ já está em uso.', 'USERNAME_TAKEN');

    try {
      const user = await prisma.user.update({
        where: { id: request.user.sub },
        data: { username: next, usernameChangedAt: new Date() },
        include: { streak: true },
      });
      return reply.send({ user: toPublicUser(user, user.streak) });
    } catch {
      // Corrida: dois pedidos com o mesmo @ ao mesmo tempo → a unique pega.
      throw new ConflictError('Esse @ já está em uso.', 'USERNAME_TAKEN');
    }
  });

  app.patch<{ Body: { emailReminders?: boolean } | null }>('/preferences', async (request, reply) => {
    const on = request.body?.emailReminders;
    if (typeof on !== 'boolean') {
      throw new BadRequestError('emailReminders deve ser true ou false', 'VALIDATION_ERROR');
    }
    const user = await prisma.user.update({
      where: { id: request.user.sub },
      data: { emailReminders: on },
      include: { streak: true },
    });
    return reply.send({ user: toPublicUser(user, user.streak) });
  });

  /**
   * Vitrine do perfil. O servidor VALIDA a posse de cada badge: sem isto,
   * qualquer cliente exibiria a conquista que nunca fez.
   */
  app.put<{ Body: { badges?: unknown } | null }>('/showcase', async (request, reply) => {
    const raw = request.body?.badges;
    if (!Array.isArray(raw) || raw.some((x) => typeof x !== 'string')) {
      throw new BadRequestError('badges deve ser uma lista de textos', 'VALIDATION_ERROR');
    }
    const badges = [...new Set(raw as string[])].slice(0, SHOWCASE_MAX);

    const [owned, streak] = await Promise.all([
      prisma.userAchievement.findMany({
        where: { userId: request.user.sub },
        select: { achievement: { select: { code: true } } },
      }),
      prisma.streak.findUnique({ where: { userId: request.user.sub }, select: { maxStreak: true } }),
    ]);
    const has = {
      achievements: owned.map((o) => o.achievement.code),
      maxStreak: streak?.maxStreak ?? 0,
    };
    const invalid = badges.filter((b) => !ownsBadge(b, has));
    if (invalid.length > 0) {
      throw new BadRequestError(`Badge não conquistado: ${invalid.join(', ')}`, 'BADGE_NOT_OWNED');
    }

    const user = await prisma.user.update({
      where: { id: request.user.sub },
      data: { showcaseBadges: JSON.stringify(badges) },
      include: { streak: true },
    });
    return reply.send({ user: toPublicUser(user, user.streak) });
  });

  /**
   * Foto de perfil. `null` remove e volta para a inicial do nome.
   *
   * O servidor não decodifica a imagem (sem dependência de processamento);
   * ele garante FORMATO e TAMANHO, que é o que impede a coluna de virar
   * armazenamento de dados arbitrários.
   */
  app.put<{ Body: { avatar?: unknown } | null }>('/avatar', async (request, reply) => {
    const raw = request.body?.avatar;
    if (raw !== null && typeof raw !== 'string') {
      throw new BadRequestError('avatar deve ser um data URI ou null', 'VALIDATION_ERROR');
    }
    if (typeof raw === 'string' && !isValidAvatar(raw)) {
      throw new BadRequestError(
        `Imagem inválida ou grande demais (limite ${AVATAR_MAX_CHARS} caracteres).`,
        'AVATAR_INVALID',
      );
    }
    const user = await prisma.user.update({
      where: { id: request.user.sub },
      data: { avatar: raw },
      include: { streak: true },
    });
    return reply.send({ user: toPublicUser(user, user.streak) });
  });

  app.post('/onboarding', async (request, reply) => {
    const parsed = onboardingSchema.safeParse(request.body);
    if (!parsed.success) {
      throw new BadRequestError(
        parsed.error.errors[0]?.message ?? 'Dados inválidos',
        'VALIDATION_ERROR',
      );
    }

    const user = await prisma.user.update({
      where: { id: request.user.sub },
      data: {
        experienceLevel: parsed.data.experienceLevel,
        playFrequency: parsed.data.playFrequency,
        goal: parsed.data.goal,
        onboardingCompleted: true,
      },
      include: { streak: true },
    });
    if (!user) throw new NotFoundError('Usuário não encontrado', 'USER_NOT_FOUND');

    return reply.send({ user: toPublicUser(user, user.streak) });
  });
}
