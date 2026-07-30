import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { RANGE_DEFS } from '../apps/api/prisma/ranges.js';
import { methodologyForRange } from '../apps/api/src/lib/strategy-methodology.js';

const read = (path: string) => readFileSync(new URL(path, import.meta.url), 'utf8');

describe('integridade da estratégia', () => {
  it('classifica os charts atuais como referência, nunca como solver verificado', () => {
    const rfi = methodologyForRange({
      gameType: 'CASH',
      tableSize: 'SIX_MAX',
      stackBb: 100,
      scenario: 'RFI',
    });
    const defense = methodologyForRange({
      gameType: 'CASH',
      tableSize: 'SIX_MAX',
      stackBb: 100,
      scenario: 'VS_BTN',
    });

    expect(rfi).toMatchObject({
      version: 'reference-2026.07-v1',
      classification: 'REFERENCE',
      solverVerified: false,
    });
    expect(rfi.note).toContain('Não é uma solução certificada por solver');
    expect(defense.note).toContain('construída manualmente');
    expect(defense.assumptions).toContain('Resposta contra open de 2,5 BB');
  });

  it('não promete estratégia mista quando os charts não têm células mistas', () => {
    expect(RANGE_DEFS.every((range) => !range.mix)).toBe(true);
    expect(read('../README.md')).not.toContain('células mistas proporcionais');
  });

  it('não usa alegações GTO nas superfícies que vendem ou explicam o produto', () => {
    const surfaces = [
      '../README.md',
      '../apps/web/src/components/StrategyBars.tsx',
      '../apps/web/src/components/PositionRangeCard.tsx',
      '../apps/web/src/pages/LandingPage.tsx',
      '../apps/web/src/pages/IntroPage.tsx',
    ].map(read).join('\n');

    for (const unsupportedClaim of [
      'Estratégia GTO',
      'Chart GTO',
      'charts GTO',
      'frequências GTO',
      'estratégia ótima',
    ]) {
      expect(surfaces).not.toContain(unsupportedClaim);
    }
    expect(surfaces).toContain('estratégia de referência');
  });
});
