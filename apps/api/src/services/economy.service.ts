import { Prisma } from '@prisma/client';
import {
  BASE_ENERGY_CAP,
  ENERGY_ITEMS,
  PERFECT_STAGE_COIN_REWARD,
  energyCapFromItemCodes,
  energyItemForCode,
  type EconomyItemView,
  type EconomyState,
  type ItemUnlockResult,
} from '@pokerpath/shared';
import { prisma } from '../lib/prisma.js';
import { BadRequestError, NotFoundError } from '../lib/errors.js';

function isUniqueConstraint(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
}

/** Capacidade efetiva, sempre derivada dos itens realmente possuídos. */
export async function getEnergyCap(userId: string): Promise<number> {
  const rows = await prisma.userItem.findMany({
    where: { userId },
    select: { itemCode: true },
  });
  return energyCapFromItemCodes(rows.map((row) => row.itemCode));
}

/**
 * Credita fichas uma única vez por fase perfeita. A criação do ledger e o
 * incremento acontecem na mesma transação: se a chave única já existe, não há
 * saldo novo. Nenhuma entrada do cliente controla valor ou origem.
 */
export async function awardPerfectStageCoins(userId: string, stageId: string): Promise<number> {
  return prisma.$transaction(async (tx) => {
    const stage = await tx.stage.findUnique({
      where: { id: stageId },
      select: { _count: { select: { exercises: true } } },
    });
    // Aula pode ser marcada perfeita pelo quiz local, mas não é exercício e
    // portanto jamais é fonte de fichas.
    if (!stage || stage._count.exercises === 0) return 0;

    try {
      await tx.userPerfectStageReward.create({
        data: { userId, stageId, coins: PERFECT_STAGE_COIN_REWARD },
      });
    } catch (error) {
      if (isUniqueConstraint(error)) return 0;
      throw error;
    }

    await tx.user.update({
      where: { id: userId },
      data: { coins: { increment: PERFECT_STAGE_COIN_REWARD } },
    });
    return PERFECT_STAGE_COIN_REWARD;
  });
}

/**
 * Quem já tinha fases perfeitas antes da economia recebe o mesmo crédito uma
 * vez. O ledger torna este backfill idempotente e auditável.
 */
async function backfillPerfectStageCoins(userId: string): Promise<void> {
  const [perfects, rows] = await Promise.all([
    prisma.userProgress.findMany({
      where: {
        userId,
        perfectAt: { not: null },
        stage: { exercises: { some: {} } },
      },
      select: { stageId: true },
    }),
    prisma.userPerfectStageReward.findMany({
      where: { userId },
      select: { stageId: true },
    }),
  ]);
  const awarded = new Set(rows.map((row) => row.stageId));
  // Sequencial de propósito: em SQLite transações concorrentes no backfill
  // aumentam chance de lock; o volume é pequeno e só roda na primeira leitura.
  for (const progress of perfects) {
    if (!awarded.has(progress.stageId)) {
      await awardPerfectStageCoins(userId, progress.stageId);
    }
  }
}

function itemView(
  definition: (typeof ENERGY_ITEMS)[number],
  unlockedAt: Date | undefined,
): EconomyItemView {
  return {
    ...definition,
    unlocked: !!unlockedAt,
    unlockedAt: unlockedAt?.toISOString() ?? null,
  };
}

/** Carteira e catálogo prontos para a interface, sem expor qualquer mutação. */
export async function getEconomy(userId: string): Promise<EconomyState> {
  await backfillPerfectStageCoins(userId);
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      coins: true,
      items: { select: { itemCode: true, unlockedAt: true } },
    },
  });
  if (!user) throw new NotFoundError('Usuário não encontrado', 'USER_NOT_FOUND');

  const unlocked = new Map(user.items.map((item) => [item.itemCode, item.unlockedAt]));
  const energyCap = energyCapFromItemCodes([...unlocked.keys()]);
  return {
    coins: user.coins,
    baseEnergyCap: BASE_ENERGY_CAP,
    energyCapBonus: energyCap - BASE_ENERGY_CAP,
    energyCap,
    perfectStageCoinReward: PERFECT_STAGE_COIN_REWARD,
    items: ENERGY_ITEMS.map((item) => itemView(item, unlocked.get(item.code))),
  };
}

/**
 * Desbloqueia um item permanente com fichas. O cliente escolhe apenas o
 * código; custo e bônus vêm do catálogo fechado e o débito só ocorre se há
 * saldo suficiente. Não existe rota de compra com cartão/dinheiro.
 */
export async function unlockEnergyItem(userId: string, code: string): Promise<ItemUnlockResult> {
  const item = energyItemForCode(code);
  if (!item) throw new BadRequestError('Item de energia inválido.', 'INVALID_ITEM');

  await backfillPerfectStageCoins(userId);
  try {
    await prisma.$transaction(async (tx) => {
      const owned = await tx.userItem.findUnique({
        where: { userId_itemCode: { userId, itemCode: item.code } },
        select: { id: true },
      });
      if (owned) throw new BadRequestError('Este item já está desbloqueado.', 'ITEM_ALREADY_UNLOCKED');

      // A condição no próprio UPDATE é a trava contra duas telas gastarem o
      // mesmo saldo simultaneamente.
      const debit = await tx.user.updateMany({
        where: { id: userId, coins: { gte: item.coinCost } },
        data: { coins: { decrement: item.coinCost } },
      });
      if (debit.count !== 1) {
        throw new BadRequestError('Fichas insuficientes para este item.', 'INSUFFICIENT_COINS');
      }

      await tx.userItem.create({ data: { userId, itemCode: item.code } });
    });
  } catch (error) {
    if (isUniqueConstraint(error)) {
      throw new BadRequestError('Este item já está desbloqueado.', 'ITEM_ALREADY_UNLOCKED');
    }
    throw error;
  }

  const economy = await getEconomy(userId);
  const unlocked = economy.items.find((candidate) => candidate.code === item.code);
  // O catálogo foi validado acima; isto só protege uma edição futura acidental.
  if (!unlocked) throw new NotFoundError('Item não encontrado.', 'ITEM_NOT_FOUND');
  return { item: unlocked, economy };
}

/** Ferramentas de debug: a rota correspondente continua protegida por DEV. */
export async function debugSetCoins(userId: string, amount: number): Promise<{ ok: true; coins: number }> {
  const coins = Math.max(0, Math.trunc(Number.isFinite(amount) ? amount : 0));
  await prisma.user.update({ where: { id: userId }, data: { coins } });
  return { ok: true, coins };
}

export async function debugGrantEnergyItem(userId: string, code: string): Promise<{ ok: true; code: string }> {
  const item = energyItemForCode(code);
  if (!item) throw new BadRequestError('Item de energia inválido.', 'INVALID_ITEM');
  await prisma.userItem.upsert({
    where: { userId_itemCode: { userId, itemCode: item.code } },
    update: {},
    create: { userId, itemCode: item.code },
  });
  return { ok: true, code: item.code };
}

/** Limpa saldo, itens e ledger para o debug poder repetir uma fase perfeita. */
export async function debugResetEconomy(userId: string): Promise<{ ok: true }> {
  await prisma.$transaction([
    prisma.userItem.deleteMany({ where: { userId } }),
    prisma.userPerfectStageReward.deleteMany({ where: { userId } }),
    // Sem isso o backfill veria estrelas antigas e recriaria o saldo assim que
    // a carteira fosse aberta. Aula não participa da economia de qualquer jeito.
    prisma.userProgress.updateMany({
      where: { userId, stage: { exercises: { some: {} } } },
      data: { perfectAt: null },
    }),
    prisma.user.update({ where: { id: userId }, data: { coins: 0, energyUsed: 0, energyUsageDate: null } }),
  ]);
  return { ok: true };
}
