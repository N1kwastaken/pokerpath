import {
  resolveLevel,
  type AchievementView,
  type MissionView,
  type MissionType,
  type MissionClaimResult,
} from '@pokerpath/shared';
import { prisma } from '../lib/prisma.js';
import { NotFoundError, BadRequestError } from '../lib/errors.js';
import { evaluateAchievements } from './achievement.service.js';

function startOfToday(): Date {
  const n = new Date();
  return new Date(n.getFullYear(), n.getMonth(), n.getDate());
}
function startOfWeek(): Date {
  const n = new Date();
  const d = new Date(n.getFullYear(), n.getMonth(), n.getDate());
  const dow = (d.getDay() + 6) % 7; // segunda = 0
  d.setDate(d.getDate() - dow);
  return d;
}

// ─── Conquistas (PRD 9.5) ──────────────────────────────────────
export async function getAchievements(userId: string): Promise<AchievementView[]> {
  const all = await prisma.achievement.findMany({ orderBy: { createdAt: 'asc' } });
  const owned = await prisma.userAchievement.findMany({ where: { userId } });
  const byId = new Map(owned.map((u) => [u.achievementId, u]));
  return all.map((a) => {
    const u = byId.get(a.id);
    return {
      code: a.code,
      name: a.name,
      description: a.description,
      icon: a.icon,
      unlocked: !!u,
      unlockedAt: u ? u.unlockedAt.toISOString() : null,
    };
  });
}

// ─── Missões (PRD 9.4) — progresso computado ao vivo ───────────
async function missionProgress(userId: string, code: string): Promise<number> {
  const today = startOfToday();
  const week = startOfWeek();
  switch (code) {
    case 'DAILY_PLAY':
      return prisma.userAnswer.count({ where: { userId, createdAt: { gte: today } } });
    case 'DAILY_5_CORRECT':
    case 'DAILY_10_CORRECT':
    case 'DAILY_20_CORRECT':
      return prisma.userAnswer.count({ where: { userId, isCorrect: true, createdAt: { gte: today } } });
    case 'DAILY_FINISH_STAGE':
    case 'DAILY_2_STAGES':
      return prisma.userProgress.count({ where: { userId, status: 'COMPLETED', completedAt: { gte: today } } });
    case 'WEEKLY_50_CORRECT':
      return prisma.userAnswer.count({ where: { userId, isCorrect: true, createdAt: { gte: week } } });
    case 'WEEKLY_5_STAGES':
      return prisma.userProgress.count({ where: { userId, status: 'COMPLETED', completedAt: { gte: week } } });
    case 'WEEKLY_3_DAYS':
    case 'WEEKLY_5_DAYS': {
      const rows = await prisma.userAnswer.findMany({ where: { userId, createdAt: { gte: week } }, select: { createdAt: true } });
      const days = new Set(rows.map((r) => r.createdAt.toISOString().slice(0, 10)));
      return days.size;
    }
    default:
      return 0;
  }
}

/** Quantas missões ativas por vez (sorteadas da "tabela" e rotacionadas). */
const DAILY_COUNT = 3;
const WEEKLY_COUNT = 2;
function rotate<T>(arr: T[], n: number): T[] {
  if (arr.length === 0) return arr;
  const k = ((n % arr.length) + arr.length) % arr.length;
  return arr.slice(k).concat(arr.slice(0, k));
}

export async function getMissions(userId: string): Promise<MissionView[]> {
  const all = await prisma.mission.findMany();
  const cmp = (a: { code: string }, b: { code: string }) => a.code.localeCompare(b.code);
  const daily = all.filter((m) => m.type === 'DAILY').sort(cmp);
  const weekly = all.filter((m) => m.type === 'WEEKLY').sort(cmp);

  const today = startOfToday();
  const week = startOfWeek();
  const dayIdx = Math.floor(today.getTime() / 86_400_000);   // muda a cada 24h
  const weekIdx = Math.floor(week.getTime() / (7 * 86_400_000)); // muda a cada 7 dias

  // Subconjunto ativo do período (rotaciona a tabela pelo índice do dia/semana).
  const active = [
    ...rotate(daily, dayIdx).slice(0, DAILY_COUNT),
    ...rotate(weekly, weekIdx).slice(0, WEEKLY_COUNT),
  ];

  const um = await prisma.userMission.findMany({ where: { userId, missionId: { in: active.map((m) => m.id) } } });
  const claimedAtBy = new Map(um.map((u) => [u.missionId, u.completedAt]));

  const out: MissionView[] = [];
  for (const m of active) {
    const progress = await missionProgress(userId, m.code);
    const claimedAt = claimedAtBy.get(m.id) ?? null;
    const periodStart = m.type === 'WEEKLY' ? week : today;
    out.push({
      code: m.code,
      title: m.title,
      description: m.description,
      type: m.type as MissionType,
      xpReward: m.xpReward,
      target: m.target,
      progress: Math.min(progress, m.target),
      completed: progress >= m.target,
      // resgate vale só DENTRO do período (reset diário/semanal).
      claimed: claimedAt != null && claimedAt >= periodStart,
    });
  }
  return out;
}

// ─── Resgatar recompensa de missão ─────────────────────────────
export async function claimMission(userId: string, code: string): Promise<MissionClaimResult> {
  const mission = await prisma.mission.findUnique({ where: { code } });
  if (!mission) throw new NotFoundError('Missão não encontrada', 'MISSION_NOT_FOUND');

  const periodStart = mission.type === 'WEEKLY' ? startOfWeek() : startOfToday();
  const existing = await prisma.userMission.findFirst({ where: { userId, missionId: mission.id } });
  if (existing?.completedAt && existing.completedAt >= periodStart) {
    throw new BadRequestError('Recompensa já resgatada neste período.', 'MISSION_ALREADY_CLAIMED');
  }

  const progress = await missionProgress(userId, code);
  if (progress < mission.target) {
    throw new BadRequestError('Missão ainda não concluída.', 'MISSION_NOT_COMPLETED');
  }

  if (existing) {
    await prisma.userMission.update({
      where: { id: existing.id },
      data: { progress, completedAt: new Date() },
    });
  } else {
    await prisma.userMission.create({
      data: { userId, missionId: mission.id, progress, completedAt: new Date() },
    });
  }

  const user = await prisma.user.findUnique({ where: { id: userId }, include: { streak: true } });
  if (!user) throw new NotFoundError('Usuário não encontrado', 'USER_NOT_FOUND');

  const before = resolveLevel(user.totalXp);
  const totalXp = user.totalXp + mission.xpReward;
  const after = resolveLevel(totalXp);
  await prisma.user.update({ where: { id: userId }, data: { totalXp } });

  const newAchievements = await evaluateAchievements({
    userId,
    currentStreak: user.streak?.currentStreak ?? 0,
  });

  return {
    code,
    xpGained: mission.xpReward,
    totalXp,
    level: after.level,
    levelName: after.name,
    leveledUp: after.level > before.level,
    newAchievements,
  };
}
