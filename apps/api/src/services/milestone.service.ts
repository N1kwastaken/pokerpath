import {
  MILESTONES,
  resolveLevel,
  type MilestoneTrack,
  type MilestoneView,
  type MilestoneClaimResult,
} from '@pokerpath/shared';
import { prisma } from '../lib/prisma.js';
import { NotFoundError, BadRequestError } from '../lib/errors.js';
import { evaluateAchievements } from './achievement.service.js';
import { addEnergyBonus } from './game.service.js';

/**
 * Marcos (milestones) — a escada de progresso.
 *
 * Diferente das conquistas, que são feitos avulsos, marco é DEGRAU: cada
 * trilha sobe em ordem e sempre existe um "próximo". O progresso é sempre
 * DERIVADO do que já está no banco (fases, respostas, streak); a única coisa
 * persistida é o resgate, para a recompensa não ser paga duas vezes.
 */
async function trackProgress(userId: string): Promise<Record<MilestoneTrack, number>> {
  const [stages, correct, streak, perfect] = await Promise.all([
    prisma.userProgress.count({ where: { userId, status: 'COMPLETED' } }),
    prisma.userAnswer.count({ where: { userId, isCorrect: true } }),
    prisma.streak.findUnique({ where: { userId }, select: { maxStreak: true } }),
    prisma.userProgress.count({ where: { userId, perfectAt: { not: null } } }),
  ]);
  // O streak usa o MÁXIMO, não o atual: um marco conquistado não pode ser
  // perdido porque a pessoa faltou um dia depois.
  return { STAGES: stages, CORRECT: correct, STREAK: streak?.maxStreak ?? 0, PERFECT: perfect };
}

export async function getMilestones(userId: string): Promise<MilestoneView[]> {
  const [progress, claimed] = await Promise.all([
    trackProgress(userId),
    prisma.userMilestone.findMany({ where: { userId }, select: { code: true } }),
  ]);
  const claimedSet = new Set(claimed.map((c) => c.code));
  return MILESTONES.map((m) => {
    const value = progress[m.track];
    return {
      ...m,
      progress: Math.min(value, m.target),
      reached: value >= m.target,
      claimed: claimedSet.has(m.code),
    };
  });
}

export async function claimMilestone(userId: string, code: string): Promise<MilestoneClaimResult> {
  const def = MILESTONES.find((m) => m.code === code);
  if (!def) throw new NotFoundError('Marco não encontrado', 'MILESTONE_NOT_FOUND');

  const progress = await trackProgress(userId);
  if (progress[def.track] < def.target) {
    throw new BadRequestError('Marco ainda não alcançado.', 'MILESTONE_NOT_REACHED');
  }

  // A unique [userId, code] é a trava de verdade contra clique duplo: duas
  // requisições simultâneas não conseguem inserir a mesma linha.
  try {
    await prisma.userMilestone.create({ data: { userId, code } });
  } catch {
    throw new BadRequestError('Marco já resgatado.', 'MILESTONE_ALREADY_CLAIMED');
  }

  const user = await prisma.user.findUnique({ where: { id: userId }, include: { streak: true } });
  if (!user) throw new NotFoundError('Usuário não encontrado', 'USER_NOT_FOUND');

  const before = resolveLevel(user.totalXp);
  const totalXp = user.totalXp + def.xpReward;
  const after = resolveLevel(totalXp);
  await prisma.user.update({ where: { id: userId }, data: { totalXp } });
  if (def.energyReward > 0) await addEnergyBonus(userId, def.energyReward);

  const newAchievements = await evaluateAchievements({
    userId,
    currentStreak: user.streak?.currentStreak ?? 0,
  });

  return {
    code,
    xpGained: def.xpReward,
    energyGained: def.energyReward,
    totalXp,
    level: after.level,
    levelName: after.name,
    leveledUp: after.level > before.level,
    newAchievements,
  };
}
