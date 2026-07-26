import { describe, expect, it } from 'vitest';
import {
  BASE_ENERGY_CAP,
  ENERGY_COST_PER_EXERCISE,
  ENERGY_COST_PER_LESSON,
  ENERGY_ITEMS,
  PERFECT_STAGE_COIN_REWARD,
  energyCapFromItemCodes,
  remainingEnergy,
} from '@pokerpath/shared';

describe('economia de energia', () => {
  it('começa em 10 e cada exercício consome exatamente uma carga; aula não consome', () => {
    expect(BASE_ENERGY_CAP).toBe(10);
    expect(ENERGY_COST_PER_EXERCISE).toBe(1);
    expect(ENERGY_COST_PER_LESSON).toBe(0);
    expect(remainingEnergy(BASE_ENERGY_CAP, 0)).toBe(10);
    expect(remainingEnergy(BASE_ENERGY_CAP, 1)).toBe(9);
    expect(remainingEnergy(BASE_ENERGY_CAP, 10)).toBe(0);
    expect(remainingEnergy(BASE_ENERGY_CAP, 99)).toBe(0);
  });

  it('só aumenta o cap por itens válidos e não duplica um item', () => {
    const first = ENERGY_ITEMS[0];
    const second = ENERGY_ITEMS[1];
    expect(energyCapFromItemCodes([])).toBe(BASE_ENERGY_CAP);
    expect(energyCapFromItemCodes([first.code, first.code, 'INVENTADO'])).toBe(
      BASE_ENERGY_CAP + first.energyCapBonus,
    );
    expect(energyCapFromItemCodes([first.code, second.code])).toBe(
      BASE_ENERGY_CAP + first.energyCapBonus + second.energyCapBonus,
    );
  });

  it('tem catálogo determinístico: custos positivos e recompensa perfeita fixa', () => {
    expect(PERFECT_STAGE_COIN_REWARD).toBeGreaterThan(0);
    expect(new Set(ENERGY_ITEMS.map((item) => item.code)).size).toBe(ENERGY_ITEMS.length);
    for (const item of ENERGY_ITEMS) {
      expect(item.coinCost).toBeGreaterThan(0);
      expect(item.energyCapBonus).toBeGreaterThan(0);
    }
  });
});
