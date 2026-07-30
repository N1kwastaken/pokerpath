import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { confettiCount } from '../apps/web/src/lib/celebrations.js';

const read = (path: string) => readFileSync(new URL(path, import.meta.url), 'utf8');

describe('gamificação responsável', () => {
  it('respeita intensidade, movimento reduzido e um teto de confete', () => {
    expect(confettiCount(90, 'FULL')).toBe(72);
    expect(confettiCount(90, 'SUBTLE')).toBe(16);
    expect(confettiCount(22, 'SUBTLE')).toBe(6);
    expect(confettiCount(90, 'OFF')).toBe(0);
    expect(confettiCount(90, 'FULL', true)).toBe(0);
  });

  it('não usa pressão de perda nem cronômetro nas missões', () => {
    const stage = read('../apps/web/src/pages/StagePlayPage.tsx');
    const missions = read('../apps/web/src/components/MissionsCard.tsx');
    expect(stage).not.toContain('volte amanhã para não perder');
    expect(missions).not.toContain('setInterval');
    expect(missions).not.toContain('⏳');
    expect(missions).toContain('Renovam no próximo dia');
  });

  it('explica que economia e recompensas não dependem de sorte', () => {
    const economy = read('../packages/shared/src/economy.ts');
    const worldReward = read('../apps/web/src/components/WorldChest.tsx');
    const principles = read('../GAMIFICATION_PRINCIPLES.md');
    expect(economy).toContain('Não há compra com dinheiro, loot box');
    expect(worldReward).toContain('sem sorteio');
    for (const forbidden of ['roleta', 'loot box', 'prêmio aleatório']) {
      expect(principles).toContain(forbidden);
    }
  });

  it('só comemora resgates depois da confirmação do servidor', () => {
    for (const path of [
      '../apps/web/src/components/MissionsCard.tsx',
      '../apps/web/src/pages/MilestonesPage.tsx',
      '../apps/web/src/pages/RewardsPage.tsx',
    ]) {
      const source = read(path);
      const optimistic = source.slice(source.indexOf('onMutate:'), source.indexOf('onSuccess:'));
      const confirmed = source.slice(source.indexOf('onSuccess:'), source.indexOf('onError:'));
      expect(optimistic).not.toContain('sound.levelUp()');
      expect(optimistic).not.toContain('setCelebrate(');
      expect(optimistic).not.toContain('claimed: true');
      expect(confirmed).toContain('sound.levelUp()');
      expect(confirmed).toContain('setCelebrate(');
      expect(source).toContain('Confirmando…');
    }
  });
});
