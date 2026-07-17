import { describe, it, expect } from 'vitest';
import { levelProgress, USER_LEVELS } from '../packages/shared/src/domain.js';

describe('levelProgress', () => {
  it('começa zerado no Fish', () => {
    const p = levelProgress(0);
    expect(p.current.name).toBe('Fish');
    expect(p.next?.name).toBe('Recreativo');
    expect(p).toMatchObject({ pct: 0, xpToNext: 500 });
  });

  it('mostra a metade do caminho', () => {
    expect(levelProgress(250)).toMatchObject({ pct: 50, xpToNext: 250 });
  });

  it('a 1 XP de subir arredonda para 100% mas ainda não subiu', () => {
    const p = levelProgress(499);
    expect(p.current.name).toBe('Fish');
    expect(p).toMatchObject({ pct: 100, xpToNext: 1 });
  });

  it('sobe exatamente no limiar', () => {
    const p = levelProgress(500);
    expect(p.current.name).toBe('Recreativo');
    expect(p).toMatchObject({ pct: 0, xpToNext: 1500 });
  });

  it('no topo não existe próximo nível', () => {
    const p = levelProgress(100_000);
    expect(p.current.name).toBe('Poker Master');
    expect(p.next).toBeNull();
    expect(p).toMatchObject({ pct: 100, xpToNext: 0 });
  });

  it('acima do topo continua no topo (não estoura)', () => {
    const p = levelProgress(250_000);
    expect(p.current.name).toBe('Poker Master');
    expect(p).toMatchObject({ pct: 100, xpToNext: 0 });
  });
});

describe('USER_LEVELS', () => {
  it('tem 8 níveis com limiares crescentes', () => {
    expect(USER_LEVELS).toHaveLength(8);
    const xps = USER_LEVELS.map((l) => l.xpRequired);
    expect(xps).toEqual([...xps].sort((a, b) => a - b));
    expect(xps[0]).toBe(0);
  });
});
