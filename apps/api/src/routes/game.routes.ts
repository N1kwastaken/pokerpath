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
  getReviewPlay,
  answerReview,
  skipBasics,
  graduateGuest,
  placeAtLevel,
  resetProgress,
  debugSetPlan,
  debugAddXp,
  debugCompleteAll,
} from '../services/game.service.js';
import {
  acceptFriendRequest,
  deleteFriendRequest,
  getFriendProfile,
  listFriends,
  removeFriend,
  sendFriendRequestByCode,
  sendFriendRequestByUsername,
} from '../services/friends.service.js';
import { isDeveloperAccount, isDeveloperBypass, effectivePlan } from '../lib/godmode.js';
import {
  getAchievements,
  getMissions,
  claimMission,
} from '../services/gamification.service.js';
import { getMilestones, claimMilestone } from '../services/milestone.service.js';
import { equipWorldReward, getWorldRewards } from '../services/world-reward.service.js';
import {
  debugGrantEnergyItem,
  debugResetEconomy,
  debugSetCoins,
  getEconomy,
  unlockEnergyItem,
} from '../services/economy.service.js';

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

  /** Plano + permissão DEV do usuário (controla gating e debug). */
  async function accountOf(userId: string): Promise<{ plan: string; godmode: boolean; developer: boolean }> {
    const u = await prisma.user.findUnique({
      where: { id: userId },
      select: { plan: true, username: true, isDev: true, devSimulation: true },
    });
    if (!u) throw new NotFoundError('Usuário não encontrado', 'USER_NOT_FOUND');
    return {
      plan: effectivePlan(u),
      godmode: isDeveloperBypass(u),
      developer: isDeveloperAccount(u),
    };
  }

  /** Bloqueia todas as mutações de debug fora da allow-list DEV. */
  async function assertGodmode(userId: string): Promise<void> {
    const { developer } = await accountOf(userId);
    if (!developer) throw new ForbiddenError('Apenas contas de debug.', 'NOT_DEVELOPER');
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

  // Economia determinística: saldo só vem de fases perfeitas no servidor;
  // esta rota apenas mostra carteira/catálogo e a outra desbloqueia item fixo.
  app.get('/economy', async (request) => {
    return getEconomy(request.user.sub);
  });

  app.post<{ Params: { code: string } }>('/items/:code/unlock', async (request) => {
    return unlockEnergyItem(request.user.sub, request.params.code);
  });

  app.get('/review', async (request) => {
    return { review: await getReview(request.user.sub) };
  });

  // Rejogar os erros: exercícios sem gabarito + validação no servidor. Acertar
  // aqui faz o erro sair da revisão (não dá XP nem mexe no progresso da fase).
  app.get('/review/play', async (request) => {
    return { exercises: await getReviewPlay(request.user.sub) };
  });
  app.post('/review/answer', async (request) => {
    const parsed = answerSchema.safeParse(request.body);
    if (!parsed.success) {
      throw new BadRequestError(parsed.error.errors[0]?.message ?? 'Dados inválidos', 'VALIDATION_ERROR');
    }
    return answerReview(request.user.sub, parsed.data.exerciseId, parsed.data.selectedAction);
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

  app.post('/debug/progress/reset', async (request) => {
    await assertGodmode(request.user.sub);
    return resetProgress(request.user.sub);
  });

  app.post<{ Body: { plan?: string; simulation?: boolean } }>('/debug/plan', async (request) => {
    await assertGodmode(request.user.sub);
    return debugSetPlan(request.user.sub, request.body?.plan ?? 'FREE', request.body?.simulation);
  });

  app.post<{ Body: { amount?: number } }>('/debug/xp', async (request) => {
    await assertGodmode(request.user.sub);
    return debugAddXp(request.user.sub, Number(request.body?.amount ?? 0));
  });

  app.post('/debug/complete-all', async (request) => {
    await assertGodmode(request.user.sub);
    return debugCompleteAll(request.user.sub);
  });

  app.post<{ Body: { amount?: number } }>('/debug/coins', async (request) => {
    await assertGodmode(request.user.sub);
    return debugSetCoins(request.user.sub, Number(request.body?.amount ?? 0));
  });

  app.post<{ Params: { code: string } }>('/debug/items/:code', async (request) => {
    await assertGodmode(request.user.sub);
    return debugGrantEnergyItem(request.user.sub, request.params.code);
  });

  app.post('/debug/economy/reset', async (request) => {
    await assertGodmode(request.user.sub);
    return debugResetEconomy(request.user.sub);
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

  app.get('/milestones', async (request) => {
    return { milestones: await getMilestones(request.user.sub) };
  });

  app.post<{ Params: { code: string } }>('/milestones/:code/claim', async (request) => {
    return claimMilestone(request.user.sub, request.params.code);
  });

  // Baús de mundo: a lista também faz o backfill seguro para quem concluiu
  // mundos antes desta feature. Equipar só aceita item já possuído no servidor.
  app.get('/rewards', async (request) => {
    const { plan, godmode } = await accountOf(request.user.sub);
    return { rewards: await getWorldRewards(request.user.sub, plan, godmode) };
  });

  app.put<{ Params: { code: string } }>('/rewards/:code/equip', async (request) => {
    await equipWorldReward(request.user.sub, request.params.code);
    const { plan, godmode } = await accountOf(request.user.sub);
    return { rewards: await getWorldRewards(request.user.sub, plan, godmode) };
  });

  // ─── Amigos (@ → pedido → aceite → amizade mútua) ─────────
  app.get('/friends', async (request) => {
    return listFriends(request.user.sub);
  });

  app.post<{ Body: { username?: unknown } | null }>('/friends/requests', async (request) => {
    if (typeof request.body?.username !== 'string') {
      throw new BadRequestError('username deve ser um texto.', 'VALIDATION_ERROR');
    }
    return {
      request: await sendFriendRequestByUsername(request.user.sub, request.body.username),
    };
  });

  app.post<{ Params: { requestId: string } }>('/friends/requests/:requestId/accept', async (request) => {
    return {
      friend: await acceptFriendRequest(request.user.sub, request.params.requestId),
    };
  });

  app.delete<{ Params: { requestId: string } }>('/friends/requests/:requestId', async (request) => {
    return deleteFriendRequest(request.user.sub, request.params.requestId);
  });

  app.get<{ Params: { friendId: string } }>('/friends/:friendId', async (request) => {
    return { friend: await getFriendProfile(request.user.sub, request.params.friendId) };
  });

  /**
   * Compatibilidade com versões antigas do app e convites por código. A
   * resposta ainda inclui `friend`, mas a relação agora fica pendente.
   */
  app.post<{ Body: { code?: unknown; username?: unknown } | null }>('/friends', async (request) => {
    const body = request.body;
    if (body?.username !== undefined) {
      if (typeof body.username !== 'string') {
        throw new BadRequestError('username deve ser um texto.', 'VALIDATION_ERROR');
      }
      if (body.code !== undefined) {
        throw new BadRequestError('Informe um código ou um @, não os dois.', 'VALIDATION_ERROR');
      }
      const friendRequest = await sendFriendRequestByUsername(request.user.sub, body.username);
      return { request: friendRequest, friend: friendRequest.user };
    }
    const code = typeof body?.code === 'string' ? body.code : '';
    const friendRequest = await sendFriendRequestByCode(request.user.sub, code);
    return { request: friendRequest, friend: friendRequest.user };
  });

  app.delete<{ Params: { friendId: string } }>('/friends/:friendId', async (request) => {
    return removeFriend(request.user.sub, request.params.friendId);
  });
}
