import { describe, expect, it } from 'vitest';
import { rewardForCode, rewardForWorldOrder } from '@pokerpath/shared';
import { WORLDS } from '../apps/api/prisma/seed.js';

describe('baús de mundo', () => {
  it('todo mundo do seed tem uma recompensa cosmética definida', () => {
    const missing = WORLDS
      .filter((world) => !rewardForWorldOrder(world.order))
      .map((world) => `${world.order}: ${world.name}`);

    expect(missing).toEqual([]);
  });

  it('mantém códigos únicos e resolvíveis para equipar com segurança', () => {
    const rewards = WORLDS.map((world) => rewardForWorldOrder(world.order)).filter(Boolean);
    expect(new Set(rewards.map((reward) => reward!.code)).size).toBe(rewards.length);
    for (const reward of rewards) expect(rewardForCode(reward!.code)).toEqual(reward);
  });
});
