import { describe, it, expect } from 'vitest';
import type { RangeCell } from '../packages/shared/src/gto.js';
import { cellBackground, cellTitle, CELL_BG } from '../apps/web/src/components/RangeGridView.js';

/**
 * O render da célula. O caso que mais importa aqui é o legado: o seed só faz
 * upsert de `Range` e nunca apaga linha, então uma linha gravada antes do campo
 * `freq` existir pode chegar ao cliente novo. Sem o fallback, ela renderizaria
 * um gradiente de `undefined` — tela quebrada.
 */

const puro = (hand: string, action: RangeCell['action']): RangeCell => ({
  hand, action, freq: { FOLD: 0, CALL: 0, RAISE: 0, [action]: 100 } as RangeCell['freq'],
});

describe('cellBackground', () => {
  it('mão pura vira cor sólida, sem gradiente', () => {
    expect(cellBackground(puro('AA', 'RAISE'))).toBe(CELL_BG.RAISE);
    expect(cellBackground(puro('72o', 'FOLD'))).toBe(CELL_BG.FOLD);
  });

  it('mão mista de 2 ações corta na proporção', () => {
    const bg = cellBackground({ hand: '99', action: 'RAISE', freq: { FOLD: 35, CALL: 0, RAISE: 65 } });
    expect(bg).toContain('linear-gradient');
    expect(bg).toBe(`linear-gradient(135deg, ${CELL_BG.RAISE} 0%, ${CELL_BG.RAISE} 65%, ${CELL_BG.FOLD} 65%, ${CELL_BG.FOLD} 100%)`);
  });

  it('mão mista de 3 ações mostra as três — o formato `mix` não conseguia', () => {
    const bg = cellBackground({ hand: 'ATs', action: 'CALL', freq: { FOLD: 25, CALL: 50, RAISE: 25 } });
    expect(bg).toContain(CELL_BG.RAISE);
    expect(bg).toContain(CELL_BG.CALL);
    expect(bg).toContain(CELL_BG.FOLD);
    // As faixas fecham em 100%: nenhuma sobra de fundo.
    expect(bg).toContain('100%)');
  });

  it('linha antiga (só `mix`, sem `freq`) ainda renderiza', () => {
    const legado: RangeCell = { hand: '99', action: 'RAISE', mix: { alt: 'FOLD', pct: 65 } };
    expect(cellBackground(legado)).toBe(
      `linear-gradient(135deg, ${CELL_BG.RAISE} 0%, ${CELL_BG.RAISE} 65%, ${CELL_BG.FOLD} 65%, ${CELL_BG.FOLD} 100%)`,
    );
  });

  it('linha antiga sem `freq` e sem `mix` vira cor sólida', () => {
    expect(cellBackground({ hand: 'AA', action: 'RAISE' })).toBe(CELL_BG.RAISE);
  });
});

describe('cellTitle', () => {
  it('mostra só as ações que existem', () => {
    expect(cellTitle(puro('AA', 'RAISE'))).toBe('AA · Raise 100%');
    expect(cellTitle({ hand: '99', action: 'RAISE', freq: { FOLD: 35, CALL: 0, RAISE: 65 } }))
      .toBe('99 · Raise 65% / Fold 35%');
  });
});
