import type { FastifyInstance } from 'fastify';
import { onboardingSchema, ownsBadge, SHOWCASE_MAX, isValidAvatar, AVATAR_MAX_CHARS } from '@pokerpath/shared';
import { prisma } from '../lib/prisma.js';
import { BadRequestError, NotFoundError } from '../lib/errors.js';
import { toPublicUser } from '../services/user.serializer.js';

/**
 * Rotas do usuário autenticado.
 *   POST /onboarding   — salva as 3 respostas e marca o onboarding concluído (PRD 4.1)
 *   PATCH /preferences — preferências da conta (hoje: lembrete por e-mail)
 *   PUT   /showcase    — badges exibidos no perfil (posse validada aqui)
 *   PUT   /avatar      — foto de perfil (data URI pequeno, ou null para remover)
 */
export async function userRoutes(app: FastifyInstance) {
  app.addHook('onRequest', app.authenticate);

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
