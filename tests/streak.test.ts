import { describe, it, expect } from 'vitest';
import { viewStreak } from '../apps/api/src/services/streak.service.js';

/**
 * O streak EFETIVO na leitura. Antes disso o valor gravado era servido cru:
 * quem tinha 10 dias e sumia por uma semana continuava vendo "10🔥", e só
 * zerava em silêncio ao responder algo. É o bug de retenção mais grave que já
 * apareceu — por isso os casos abaixo.
 */

const NOW = new Date(2026, 6, 16, 14, 0); // 16/jul, 14h
const dia = (d: number, h = 10) => new Date(2026, 6, d, h);

describe('viewStreak', () => {
  it('jogou hoje: streak vivo e dia garantido', () => {
    expect(viewStreak({ currentStreak: 10, lastActiveAt: dia(16, 9) }, NOW))
      .toEqual({ current: 10, playedToday: true, atRisk: false });
  });

  it('jogou ontem: streak vivo, mas em risco hoje', () => {
    expect(viewStreak({ currentStreak: 10, lastActiveAt: dia(15) }, NOW))
      .toEqual({ current: 10, playedToday: false, atRisk: true });
  });

  it('sumiu 2 dias: elo quebrado', () => {
    expect(viewStreak({ currentStreak: 10, lastActiveAt: dia(14) }, NOW))
      .toEqual({ current: 0, playedToday: false, atRisk: false });
  });

  it('sumiu 1 semana: zera (era o bug do "10🔥" fantasma)', () => {
    expect(viewStreak({ currentStreak: 10, lastActiveAt: dia(9) }, NOW))
      .toEqual({ current: 0, playedToday: false, atRisk: false });
  });

  it('nunca jogou', () => {
    expect(viewStreak(null, NOW)).toEqual({ current: 0, playedToday: false, atRisk: false });
  });

  it('sem streak não fica em risco', () => {
    expect(viewStreak({ currentStreak: 0, lastActiveAt: dia(16) }, NOW))
      .toEqual({ current: 0, playedToday: false, atRisk: false });
  });
});
