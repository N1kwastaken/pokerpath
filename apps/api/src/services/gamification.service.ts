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
  switch (code) {
    case 'DAILY_10_CORRECT':
      return prisma.userAnswer.count({
        where: { userId, isCorrect: true, createdAt: { gte: startOfToday() } },
      });
    case 'DAILY_FINISH_STAGE':
      return prisma.userProgress.count({
        where: { userId, status: 'COMPLETED', completedAt: { gte: startOfToday() } },
      });
    case 'WEEKLY_3_DAYS': {
      const rows = await prisma.userAnswer.findMany({
        where: { userId, createdAt: { gte: startOfWeek() } },
        select: { createdAt: true },
      });
      const days = new Set(rows.map((r) => r.createdAt.toISOString().slice(0, 10)));
      return days.size;
    }
    default:
      return 0;
  }
}

export async function getMissions(userId: string): Promise<MissionView[]> {
  const missions = await prisma.mission.findMany();
  const userMissions = await prisma.userMission.findMany({ where: { userId } });
  const claimedByMission = new Map(userMissions.map((um) => [um.missionId, um.completedAt]));

  // Ordena: diárias antes de semanais.
  missions.sort((a, b) => (a.type === b.type ? a.code.localeCompare(b.code) : a.type === 'DAILY' ? -1 : 1));

  const out: MissionView[] = [];
  for (const m of missions) {
    const progress = await missionProgress(userId, m.code);
    out.push({
      code: m.code,
      title: m.title,
      description: m.description,
      type: m.type as MissionType,
      xpReward: m.xpReward,
      target: m.target,
      progress: Math.min(progress, m.target),
      completed: progress >= m.target,
      claimed: claimedByMission.get(m.id) != null,
    });
  }
  return out;
}

// ─── Resgatar recompensa de missão ─────────────────────────────
export async function claimMission(userId: string, code: string): Promise<MissionClaimResult> {
  const mission = await prisma.mission.findUnique({ where: { code } });
  if (!mission) throw new NotFoundError('Missão não encontrada', 'MISSION_NOT_FOUND');

  const existing = await prisma.userMission.findFirst({ where: { userId, missionId: mission.id } });
  if (existing?.completedAt) {
    throw new BadRequestError('Recompensa já resgatada.', 'MISSION_ALREADY_CLAIMED');
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
