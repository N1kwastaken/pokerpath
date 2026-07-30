import type { Prisma } from '@prisma/client';
import type { AnalyticsFunnelStep, ProductAnalytics } from '@pokerpath/shared';
import { prisma } from '../lib/prisma.js';
import { DEVELOPER_USERNAMES } from '../lib/godmode.js';

const DAY_MS = 24 * 60 * 60 * 1_000;

/**
 * Exclui somente as contas que passam pelos dois portões reais do debug:
 * permissão persistida + @ da allow-list. Assim, uso de teste não infla os
 * números do produto e uma conta comum nunca some só por ter `isDev` legado.
 */
const productUserWhere = {
  NOT: {
    isDev: true,
    username: { in: [...DEVELOPER_USERNAMES] },
  },
} satisfies Prisma.UserWhereInput;

function funnelStep(count: number, total: number): AnalyticsFunnelStep {
  return {
    count,
    percentage: total === 0 ? 0 : Math.round((count / total) * 1_000) / 10,
  };
}

/**
 * Calcula métricas de produto sem um rastreador paralelo. A janela é móvel:
 * "7 dias" significa as 168 horas anteriores à geração do relatório.
 */
export async function getProductAnalytics(now: Date = new Date()): Promise<ProductAnalytics> {
  const sevenDaysAgo = new Date(now.getTime() - 7 * DAY_MS);
  const twentyFourHoursAgo = new Date(now.getTime() - DAY_MS);

  const [
    registered,
    onboarded,
    newUsers7d,
    progressByUser,
    answers7d,
    correctAnswers7d,
    active24h,
    active7d,
    stagesCompleted7d,
    perfectStages7d,
    acceptedFriendships,
    pendingRequests,
    rejectedRequests,
  ] = await Promise.all([
    prisma.user.count({ where: productUserWhere }),
    prisma.user.count({ where: { ...productUserWhere, onboardingCompleted: true } }),
    prisma.user.count({ where: { ...productUserWhere, createdAt: { gte: sevenDaysAgo } } }),
    prisma.userProgress.groupBy({
      by: ['userId'],
      where: { status: 'COMPLETED', user: productUserWhere },
      _count: { _all: true },
    }),
    prisma.userAnswer.count({
      where: { createdAt: { gte: sevenDaysAgo }, user: productUserWhere },
    }),
    prisma.userAnswer.count({
      where: { createdAt: { gte: sevenDaysAgo }, isCorrect: true, user: productUserWhere },
    }),
    prisma.streak.count({
      where: { lastActiveAt: { gte: twentyFourHoursAgo }, user: productUserWhere },
    }),
    prisma.streak.count({
      where: { lastActiveAt: { gte: sevenDaysAgo }, user: productUserWhere },
    }),
    prisma.userProgress.count({
      where: {
        status: 'COMPLETED',
        completedAt: { gte: sevenDaysAgo },
        user: productUserWhere,
      },
    }),
    prisma.userProgress.count({
      where: {
        status: 'COMPLETED',
        perfectAt: { gte: sevenDaysAgo },
        user: productUserWhere,
      },
    }),
    prisma.friendship.count({
      where: { status: 'ACCEPTED', user: productUserWhere, friend: productUserWhere },
    }),
    prisma.friendship.count({
      where: { status: 'PENDING', user: productUserWhere, friend: productUserWhere },
    }),
    prisma.friendship.count({
      where: { status: 'REJECTED', user: productUserWhere, friend: productUserWhere },
    }),
  ]);

  const firstStage = progressByUser.length;
  const fiveStages = progressByUser.filter((progress) => progress._count._all >= 5).length;

  return {
    generatedAt: now.toISOString(),
    windowDays: 7,
    excludesDeveloperAccounts: true,
    funnel: {
      registered: funnelStep(registered, registered),
      onboarded: funnelStep(onboarded, registered),
      firstStage: funnelStep(firstStage, registered),
      fiveStages: funnelStep(fiveStages, registered),
      newUsers7d,
    },
    activity: {
      active24h,
      active7d,
      answers7d,
      correctAnswers7d,
      accuracy7d: answers7d === 0
        ? 0
        : Math.round((correctAnswers7d / answers7d) * 1_000) / 10,
    },
    learning: {
      stagesCompleted7d,
      perfectStages7d,
    },
    social: {
      acceptedFriendships,
      pendingRequests,
      rejectedRequests,
    },
  };
}
