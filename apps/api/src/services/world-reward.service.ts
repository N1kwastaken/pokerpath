import {
  rewardForCode,
  rewardForWorldOrder,
  type WorldRewardView,
} from '@pokerpath/shared';
import { prisma } from '../lib/prisma.js';
import { BadRequestError, NotFoundError } from '../lib/errors.js';

type RewardRow = {
  id: string;
  rewardCode: string;
  awardedAt: Date;
  equippedAt: Date | null;
  world: { id: string; order: number; name: string };
};

function toView(row: RewardRow): WorldRewardView | null {
  const definition = rewardForCode(row.rewardCode);
  if (!definition) return null;
  return {
    ...definition,
    worldId: row.world.id,
    worldOrder: row.world.order,
    worldName: row.world.name,
    awardedAt: row.awardedAt.toISOString(),
    equipped: !!row.equippedAt,
  };
}

/**
 * Cria a recompensa de uma conclusão nova. A chave única no banco é a última
 * barreira contra duplicatas; o cliente nunca escolhe código nem quantidade.
 */
export async function awardWorldReward(
  userId: string,
  world: { id: string; order: number; name: string },
): Promise<WorldRewardView | null> {
  const definition = rewardForWorldOrder(world.order);
  if (!definition) return null;

  const row = await prisma.userWorldReward.upsert({
    where: { userId_worldId: { userId, worldId: world.id } },
    update: {},
    create: { userId, worldId: world.id, rewardCode: definition.code },
    include: { world: { select: { id: true, order: true, name: true } } },
  });
  return toView(row);
}

/**
 * Backfill preguiçoso para quem já havia fechado mundos antes desta feature.
 * O mundo vale para FREE quando todas as fases gratuitas estão completas — a
 * mesma regra de progressão do jogo, nunca uma exigência Premium escondida.
 */
async function ensureCompletedWorldRewards(userId: string, plan: string, godmode: boolean): Promise<void> {
  const [worlds, progress, owned] = await Promise.all([
    prisma.world.findMany({
      orderBy: { order: 'asc' },
      include: { stages: { select: { id: true, premium: true } } },
    }),
    prisma.userProgress.findMany({ where: { userId, status: 'COMPLETED' }, select: { stageId: true } }),
    prisma.userWorldReward.findMany({ where: { userId }, select: { worldId: true } }),
  ]);
  const completed = new Set(progress.map((p) => p.stageId));
  const existing = new Set(owned.map((reward) => reward.worldId));
  const free = plan === 'FREE' && !godmode;

  await Promise.all(worlds.map(async (world) => {
    if (existing.has(world.id) || !rewardForWorldOrder(world.order)) return;
    const required = world.stages.filter((stage) => !free || !stage.premium);
    if (required.length === 0 || !required.every((stage) => completed.has(stage.id))) return;
    await awardWorldReward(userId, world);
  }));
}

export async function getWorldRewards(
  userId: string,
  plan: string,
  godmode = false,
): Promise<WorldRewardView[]> {
  await ensureCompletedWorldRewards(userId, plan, godmode);
  const rows = await prisma.userWorldReward.findMany({
    where: { userId },
    orderBy: { world: { order: 'asc' } },
    include: { world: { select: { id: true, order: true, name: true } } },
  });
  return rows.map(toView).filter((reward): reward is WorldRewardView => !!reward);
}

export async function equipWorldReward(userId: string, code: string): Promise<void> {
  if (!rewardForCode(code)) {
    throw new BadRequestError('Item cosmético inválido.', 'INVALID_REWARD');
  }
  const owned = await prisma.userWorldReward.findFirst({ where: { userId, rewardCode: code } });
  if (!owned) throw new NotFoundError('Você ainda não possui este item.', 'REWARD_NOT_OWNED');

  await prisma.$transaction([
    prisma.userWorldReward.updateMany({ where: { userId }, data: { equippedAt: null } }),
    prisma.userWorldReward.update({ where: { id: owned.id }, data: { equippedAt: new Date() } }),
  ]);
}
