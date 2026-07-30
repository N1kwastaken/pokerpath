import { beforeEach, describe, expect, it, vi } from 'vitest';

const db = vi.hoisted(() => ({
  user: { count: vi.fn() },
  userProgress: { groupBy: vi.fn(), count: vi.fn() },
  userAnswer: { count: vi.fn() },
  streak: { count: vi.fn() },
  friendship: { count: vi.fn() },
}));

vi.mock('../apps/api/src/lib/prisma.js', () => ({ prisma: db }));

import { getProductAnalytics } from '../apps/api/src/services/analytics.service.js';

const NOW = new Date('2026-07-29T12:00:00.000Z');

beforeEach(() => {
  vi.clearAllMocks();
});

describe('métricas reais do produto', () => {
  it('calcula funil, atividade e aprendizado sem contar as contas DEV', async () => {
    db.user.count
      .mockResolvedValueOnce(10)
      .mockResolvedValueOnce(8)
      .mockResolvedValueOnce(2);
    db.userProgress.groupBy.mockResolvedValue([
      { userId: 'u1', _count: { _all: 5 } },
      { userId: 'u2', _count: { _all: 1 } },
    ]);
    db.userAnswer.count
      .mockResolvedValueOnce(4)
      .mockResolvedValueOnce(3);
    db.streak.count
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(2);
    db.userProgress.count
      .mockResolvedValueOnce(3)
      .mockResolvedValueOnce(1);
    db.friendship.count
      .mockResolvedValueOnce(3)
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(2);

    const result = await getProductAnalytics(NOW);

    expect(result).toEqual({
      generatedAt: NOW.toISOString(),
      windowDays: 7,
      excludesDeveloperAccounts: true,
      funnel: {
        registered: { count: 10, percentage: 100 },
        onboarded: { count: 8, percentage: 80 },
        firstStage: { count: 2, percentage: 20 },
        fiveStages: { count: 1, percentage: 10 },
        newUsers7d: 2,
      },
      activity: {
        active24h: 1,
        active7d: 2,
        answers7d: 4,
        correctAnswers7d: 3,
        accuracy7d: 75,
      },
      learning: {
        stagesCompleted7d: 3,
        perfectStages7d: 1,
      },
      social: {
        acceptedFriendships: 3,
        pendingRequests: 1,
        rejectedRequests: 2,
      },
    });

    const productUsers = {
      NOT: {
        isDev: true,
        username: { in: ['kowalski', 'sousa', 'dev'] },
      },
    };
    expect(db.user.count).toHaveBeenNthCalledWith(1, { where: productUsers });
    expect(db.userProgress.groupBy).toHaveBeenCalledWith(expect.objectContaining({
      where: { status: 'COMPLETED', user: productUsers },
    }));
    expect(db.userAnswer.count).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ user: productUsers }),
    }));
    expect(db.streak.count).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ user: productUsers }),
    }));
  });

  it('retorna percentuais zerados quando ainda não há usuários ou respostas', async () => {
    db.user.count.mockResolvedValue(0);
    db.userProgress.groupBy.mockResolvedValue([]);
    db.userProgress.count.mockResolvedValue(0);
    db.userAnswer.count.mockResolvedValue(0);
    db.streak.count.mockResolvedValue(0);
    db.friendship.count.mockResolvedValue(0);

    const result = await getProductAnalytics(NOW);

    expect(result.funnel.registered).toEqual({ count: 0, percentage: 0 });
    expect(result.funnel.onboarded.percentage).toBe(0);
    expect(result.activity.accuracy7d).toBe(0);
  });
});
