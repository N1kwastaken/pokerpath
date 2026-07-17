import { describe, it, expect } from 'vitest';
import {
  WORLDS, RANGE_DEFS, VS_DEFS, buildCells, buildCells3, labelOfHand, raiseSet, expand,
} from '../apps/api/prisma/seed.js';

/**
 * Charts × exercícios. O chart é a referência que o app mostra ao aluno; se um
 * exercício discorda dele, o aluno vê duas verdades e uma delas está errada.
 */

const allExercises = WORLDS.flatMap((w) => w.stages.flatMap((s) => s.exercises));

/** Ação da célula de uma mão no grid 13x13. */
function cellAction(grid: { hand: string; action: string }[][], hand: string): string | null {
  for (const row of grid) for (const cell of row) if (cell.hand === hand) return cell.action;
  return null;
}

describe('expand', () => {
  // A ordem da lista é detalhe de implementação — quem consome é o raiseSet,
  // que é um Set. O que importa é o conteúdo.
  const set = (token: string) => new Set(expand(token));

  it('expande pares com +', () => {
    expect(set('QQ+')).toEqual(new Set(['AA', 'KK', 'QQ']));
  });
  it('expande suited/offsuit com + mantendo o high card', () => {
    expect(set('AQs+')).toEqual(new Set(['AKs', 'AQs']));
    expect(set('KTo+')).toEqual(new Set(['KQo', 'KJo', 'KTo']));
  });
  it('passa mão exata sem +', () => {
    expect(expand('KQs')).toEqual(['KQs']);
  });
  it('devolve vazio em token inválido em vez de estourar', () => {
    expect(expand('lixo')).toEqual([]);
  });
});

describe('RFI', () => {
  it.each(RANGE_DEFS.map((rd) => [rd.position, rd] as const))(
    '%s: todo exercício de abertura bate com o chart',
    (_pos, rd) => {
      const grid = buildCells(rd.tokens);
      const divergencias = allExercises
        .filter((e) => e.category === 'OPEN_RAISE' && !e.villainAction && e.heroPosition === rd.position)
        .filter((e) => cellAction(grid, labelOfHand(e.heroHand)) !== e.correctAction)
        .map((e) => `${labelOfHand(e.heroHand)}: exercício=${e.correctAction} chart=${cellAction(grid, labelOfHand(e.heroHand))}`);

      expect(divergencias).toEqual([]);
    },
  );

  it('KQs abre no UTG e KQo não (o caso que o usuário reportou)', () => {
    const utg = buildCells(RANGE_DEFS.find((r) => r.position === 'UTG')!.tokens);
    expect(cellAction(utg, 'KQs')).toBe('RAISE');
    expect(cellAction(utg, 'KQo')).toBe('FOLD');
  });
});

describe('defesa vs open', () => {
  it.each(VS_DEFS.map((vd) => [`${vd.position} ${vd.scenario}`, vd] as const))(
    '%s: todo exercício bate com o chart',
    (_nome, vd) => {
      const grid = buildCells3(vd.raise, vd.call);
      const villain = vd.scenario.replace('VS_', '');
      const divergencias = allExercises
        .filter((e) => e.heroPosition === vd.position && e.villainPosition === villain
          && !e.board && e.villainAction === 'Raise 2.5x')
        .filter((e) => cellAction(grid, labelOfHand(e.heroHand)) !== e.correctAction)
        .map((e) => `${labelOfHand(e.heroHand)}: exercício=${e.correctAction} chart=${cellAction(grid, labelOfHand(e.heroHand))}`);

      expect(divergencias).toEqual([]);
    },
  );

  it.each(VS_DEFS.map((vd) => [`${vd.position} ${vd.scenario}`, vd] as const))(
    '%s: nenhuma mão está em raise E call ao mesmo tempo',
    (_nome, vd) => {
      const call = raiseSet(vd.call);
      const overlap = [...raiseSet(vd.raise)].filter((h) => call.has(h));
      expect(overlap).toEqual([]);
    },
  );
});

describe('grid', () => {
  it('é 13x13 e sem mão repetida com ações diferentes', () => {
    for (const rd of RANGE_DEFS) {
      const grid = buildCells(rd.tokens);
      expect(grid).toHaveLength(13);
      for (const row of grid) expect(row).toHaveLength(13);

      const seen = new Map<string, string>();
      for (const row of grid) for (const cell of row) {
        if (seen.has(cell.hand)) expect(seen.get(cell.hand)).toBe(cell.action);
        seen.set(cell.hand, cell.action);
      }
      expect(seen.size).toBe(169); // 13 pares + 78 suited + 78 offsuit
    }
  });
});
