import type { FastifyInstance } from 'fastify';
import { answerSchema } from '@pokerpath/shared';
import { prisma } from '../lib/prisma.js';
import { BadRequestError, NotFoundError, ForbiddenError } from '../lib/errors.js';
import {
  getWorldsForUser,
  getWorldDetail,
  getStagePlay,
  submitAnswer,
  completeLesson,
  getStats,
  getEnergy,
  getTrail,
  getReview,
  skipBasics,
  graduateGuest,
  placeAtLevel,
  resetProgress,
  debugSetPlan,
  debugAddXp,
  debugCompleteAll,
} from '../services/game.service.js';
import { listFriends, addFriend, removeFriend } from '../services/friends.service.js';
import { isGodmodeEmail, effectivePlan } from '../lib/godmode.js';
import {
  getAchievements,
  getMissions,
  claimMission,
} from '../services/gamification.service.js';

/**
 * Rotas do loop de jogo (PRD 5, 6, 7, 15.3).
 * Todas exigem autenticação.
 *   GET  /worlds            — mapa de mundos com progresso
 *   GET  /worlds/:id        — fases do mundo
 *   GET  /stages/:id        — exercícios da fase (sem gabarito)
 *   POST /answers           — registra resposta, devolve XP/feedback
 */
export async function gameRoutes(app: FastifyInstance) {
  app.addHook('onRequest', app.authenticate);

  /** Plano + godmode do usuário (controla gating premium e travas de debug). */
  async function accountOf(userId: string): Promise<{ plan: string; godmode: boolean }> {
    const u = await prisma.user.findUnique({
      where: { id: userId },
      select: { plan: true, email: true, isDev: true },
    });
    if (!u) throw new NotFoundError('Usuário não encontrado', 'USER_NOT_FOUND');
    return { plan: effectivePlan(u), godmode: isGodmodeEmail(u.email) };
  }

  /** Bloqueia rotas de debug para contas que não são godmode. */
  async function assertGodmode(userId: string): Promise<void> {
    const { godmode } = await accountOf(userId);
    if (!godmode) throw new ForbiddenError('Apenas contas de debug.', 'NOT_GODMODE');
  }

  app.get('/worlds', async (request) => {
    const { plan, godmode } = await accountOf(request.user.sub);
    const worlds = await getWorldsForUser(request.user.sub, plan, godmode);
    return { worlds };
  });

  app.get('/trail', async (request) => {
    const { plan, godmode } = await accountOf(request.user.sub);
    return { trail: await getTrail(request.user.sub, plan, godmode) };
  });

  app.get<{ Params: { worldId: string } }>(
    '/worlds/:worldId',
    async (request) => {
      const { plan, godmode } = await accountOf(request.user.sub);
      const world = await getWorldDetail(
        request.user.sub,
        plan,
        request.params.worldId,
        godmode,
      );
      return { world };
    },
  );

  app.get<{ Params: { stageId: string }; Querystring: { resume?: string } }>(
    '/stages/:stageId',
    async (request) => {
      const { plan, godmode } = await accountOf(request.user.sub);
      const stage = await getStagePlay(
        request.user.sub,
        plan,
        request.params.stageId,
        godmode,
        request.query.resume === '1',
      );
      return stage;
    },
  );

  app.post('/answers', async (request) => {
    const parsed = answerSchema.safeParse(request.body);
    if (!parsed.success) {
      throw new BadRequestError(
        parsed.error.errors[0]?.message ?? 'Dados inválidos',
        'VALIDATION_ERROR',
      );
    }
    const result = await submitAnswer(request.user.sub, parsed.data);
    return result;
  });


  app.post<{ Params: { stageId: string }; Body: { perfect?: boolean } | null }>('/stages/:stageId/complete', async (request) => {
    return completeLesson(request.user.sub, request.params.stageId, request.body?.perfect === true);
  });

  app.get('/stats', async (request) => {
    return getStats(request.user.sub);
  });

  app.get('/energy', async (request) => {
    return getEnergy(request.user.sub);
  });

  app.get('/review', async (request) => {
    return { review: await getReview(request.user.sub) };
  });

  app.post('/skip-basics', async (request) => {
    return skipBasics(request.user.sub);
  });

  // Gradua o progresso de convidado (Mundo 0 jogado sem conta) na conta nova.
  app.post<{ Body: { stageIds?: string[] } | null }>('/guest/graduate', async (request) => {
    const ids = Array.isArray(request.body?.stageIds)
      ? request.body!.stageIds.filter((s): s is string => typeof s === 'string').slice(0, 50)
      : [];
    return graduateGuest(request.user.sub, ids);
  });

  app.post<{ Body: { level?: number } | null }>('/placement', async (request) => {
    const level = Number(request.body?.level);
    if (!Number.isFinite(level) || level < 0 || level > 3) {
      throw new BadRequestError('Nível inválido (0-3).', 'VALIDATION_ERROR');
    }
    return placeAtLevel(request.user.sub, level);
  });

  app.post('/progress/reset', async (request) => {
    return resetProgress(request.user.sub);
  });

  app.post<{ Body: { plan?: string } }>('/debug/plan', async (request) => {
    await assertGodmode(request.user.sub);
    return debugSetPlan(request.user.sub, request.body?.plan ?? 'FREE');
  });

  app.post<{ Body: { amount?: number } }>('/debug/xp', async (request) => {
    await assertGodmode(request.user.sub);
    return debugAddXp(request.user.sub, Number(request.body?.amount ?? 0));
  });

  app.post('/debug/complete-all', async (request) => {
    await assertGodmode(request.user.sub);
    return debugCompleteAll(request.user.sub);
  });

  // (GET /ranges mudou para guest.routes — conteúdo estático, público, para
  //  a aula do gráfico funcionar também no modo convidado.)

  app.get('/achievements', async (request) => {
    return { achievements: await getAchievements(request.user.sub) };
  });

  app.get('/missions', async (request) => {
    return { missions: await getMissions(request.user.sub) };
  });

  app.post<{ Params: { code: string } }>('/missions/:code/claim', async (request) => {
    return claimMission(request.user.sub, request.params.code);
  });

  // ─── Amigos (código curto → amizade mútua) ────────────────
  app.get('/friends', async (request) => {
    return listFriends(request.user.sub);
  });

  app.post<{ Body: { code?: string } | null }>('/friends', async (request) => {
    const code = typeof request.body?.code === 'string' ? request.body.code : '';
    return { friend: await addFriend(request.user.sub, code) };
  });

  app.delete<{ Params: { friendId: string } }>('/friends/:friendId', async (request) => {
    return removeFriend(request.user.sub, request.params.friendId);
  });
}
