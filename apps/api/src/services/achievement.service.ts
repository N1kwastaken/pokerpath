import type { UnlockedAchievement } from '@pokerpath/shared';
import { prisma } from '../lib/prisma.js';

/**
 * Avaliação de conquistas (PRD 9.5).
 * Após cada resposta, recalcula quais critérios o usuário cumpriu e registra
 * as conquistas ainda não desbloqueadas. Idempotente: só insere o que falta.
 */

/** Conta quantos acertos seguidos (sem erro) o usuário tem agora. */
async function consecutiveCorrect(userId: string): Promise<number> {
  const recent = await prisma.userAnswer.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 60,
    select: { isCorrect: true },
  });
  let streak = 0;
  for (const a of recent) {
    if (a.isCorrect) streak++;
    else break;
  }
  return streak;
}

/** Quantos mundos o usuário já alcançou (têm progresso registrado). */
async function reachedWorlds(userId: string): Promise<number> {
  const rows = await prisma.userProgress.findMany({
    where: { userId },
    select: { stage: { select: { worldId: true } } },
  });
  return new Set(rows.map((r) => r.stage.worldId)).size;
}

/**
 * Avalia e persiste conquistas recém-desbloqueadas.
 * Retorna apenas as novas (para o cliente celebrar).
 */
export async function evaluateAchievements(args: {
  userId: string;
  currentStreak: number;
}): Promise<UnlockedAchievement[]> {
  const { userId, currentStreak } = args;

  // Conjunto de códigos já desbloqueados (evita trabalho e duplicidade).
  const owned = new Set(
    (
      await prisma.userAchievement.findMany({
        where: { userId },
        select: { achievement: { select: { code: true } } },
      })
    ).map((u) => u.achievement.code),
  );

  const unlock = new Set<string>();
  const want = (code: string) => !owned.has(code);

  // FIRST_HAND — primeiro exercício respondido.
  if (want('FIRST_HAND')) {
    const any = await prisma.userAnswer.count({ where: { userId } });
    if (any >= 1) unlock.add('FIRST_HAND');
  }

  // PERFECT_WEEK — streak de 7 dias.
  if (want('PERFECT_WEEK') && currentStreak >= 7) unlock.add('PERFECT_WEEK');

  // HOT_STREAK / SHARP_SHOOTER — acertos seguidos (5 / 50).
  if (want('HOT_STREAK') || want('SHARP_SHOOTER')) {
    const streak = await consecutiveCorrect(userId);
    if (want('HOT_STREAK') && streak >= 5) unlock.add('HOT_STREAK');
    if (want('SHARP_SHOOTER') && streak >= 50) unlock.add('SHARP_SHOOTER');
  }

  // EXPLORER — chegar a TODOS os mundos existentes.
  if (want('EXPLORER')) {
    const total = await prisma.world.count();
    if (total > 0 && (await reachedWorlds(userId)) >= total) unlock.add('EXPLORER');
  }

  // THREEBET_MACHINE — 100 acertos de 3-bet.
  if (want('THREEBET_MACHINE')) {
    const n = await prisma.userAnswer.count({
      where: { userId, isCorrect: true, exercise: { category: 'THREE_BET' } },
    });
    if (n >= 100) unlock.add('THREEBET_MACHINE');
  }

  // BTN_MASTER — Mundo Preflop (order 1) completo com 90%+ de acerto médio.
  // A média ignora aulas (accuracy 0); só conta fases de prática.
  if (want('BTN_MASTER')) {
    const pre = await prisma.world.findUnique({
      where: { order: 1 },
      include: { stages: { select: { id: true } } },
    });
    if (pre && pre.stages.length > 0) {
      const prog = await prisma.userProgress.findMany({
        where: { userId, stageId: { in: pre.stages.map((s) => s.id) } },
      });
      const allDone =
        prog.length === pre.stages.length &&
        prog.every((p) => p.status === 'COMPLETED');
      const graded = prog.filter((p) => p.accuracy > 0);
      const avg = graded.length > 0
        ? graded.reduce((s, p) => s + p.accuracy, 0) / graded.length
        : 0;
      if (allDone && avg >= 0.9) unlock.add('BTN_MASTER');
    }
  }

  // FULL_GAME — todos os 15 mundos completos.
  if (want('FULL_GAME')) {
    const worlds = await prisma.world.findMany({
      include: { stages: { select: { id: true } } },
    });
    const real = worlds.filter((w) => w.stages.length > 0);
    if (real.length > 0) {
      const completedWorlds = await Promise.all(
        real.map(async (w) => {
          const done = await prisma.userProgress.count({
            where: {
              userId,
              status: 'COMPLETED',
              stageId: { in: w.stages.map((s) => s.id) },
            },
          });
          return done === w.stages.length;
        }),
      );
      if (completedWorlds.every(Boolean)) unlock.add('FULL_GAME');
    }
  }

  if (unlock.size === 0) return [];

  const defs = await prisma.achievement.findMany({
    where: { code: { in: [...unlock] } },
  });

  const created: UnlockedAchievement[] = [];
  for (const def of defs) {
    try {
      await prisma.userAchievement.create({
        data: { userId, achievementId: def.id },
      });
      created.push({
        code: def.code,
        name: def.name,
        description: def.description,
        icon: def.icon,
      });
    } catch {
      // Corrida/duplicidade — ignora (constraint @@unique).
    }
  }
  return created;
}
