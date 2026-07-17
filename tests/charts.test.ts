import { describe, it, expect } from 'vitest';
import { WORLDS } from '../apps/api/prisma/seed.js';
import {
  RANGE_DEFS, buildCells, expand, raiseSet, labelOfHand,
  freqForHand, freqForExercise, rangeDefFor, mainAction, actionMargin,
  type Cell, type Freq,
} from '../apps/api/prisma/ranges.js';

/**
 * Charts × exercícios. O chart é a referência que o app mostra ao aluno; se um
 * exercício discorda dele, o aluno vê duas verdades e uma está errada.
 */

const allExercises = WORLDS.flatMap((w) => w.stages.flatMap((s) => s.exercises));

function cellFor(grid: Cell[][], hand: string): Cell {
  for (const row of grid) for (const cell of row) if (cell.hand === hand) return cell;
  throw new Error(`mão ${hand} não existe no grid`);
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

describe('mainAction', () => {
  it('escolhe a ação mais frequente', () => {
    expect(mainAction({ FOLD: 0, CALL: 0, RAISE: 100 })).toBe('RAISE');
    expect(mainAction({ FOLD: 30, CALL: 0, RAISE: 70 })).toBe('RAISE');
    expect(mainAction({ FOLD: 70, CALL: 30, RAISE: 0 })).toBe('FOLD');
    expect(mainAction({ FOLD: 20, CALL: 50, RAISE: 30 })).toBe('CALL');
  });
});

describe('freqForHand', () => {
  const utg = RANGE_DEFS.find((d) => d.scenario === 'RFI' && d.position === 'UTG')!;

  // O caso que o usuário reportou. As barras diziam RAISE 85 / FOLD 15 porque
  // saíam de `difficulty: MEDIUM`, enquanto o chart pintava verde sólido.
  it('KQs no UTG é raise puro — chart e barras batem', () => {
    expect(freqForHand(utg, 'KQs')).toEqual({ FOLD: 0, CALL: 0, RAISE: 100 });
  });

  // Este era pior: inventava "RAISE 15%" para uma mão que é fold puro.
  it('KQo no UTG é fold puro, sem raise inventado', () => {
    expect(freqForHand(utg, 'KQo')).toEqual({ FOLD: 100, CALL: 0, RAISE: 0 });
  });

  it('abertura nunca tem call (é raise-ou-fold)', () => {
    for (const def of RANGE_DEFS.filter((d) => d.scenario === 'RFI')) {
      for (const row of buildCells(def)) for (const cell of row) {
        expect(cell.freq.CALL).toBe(0);
      }
    }
  });
});

describe('a fonte é única', () => {
  // A regressão do KQs: chart e barras têm que sair do MESMO lugar. Se alguém
  // reintroduzir um segundo caminho para a frequência, este teste cai.
  it.each(RANGE_DEFS.map((d) => [`${d.position} ${d.scenario}`, d] as const))(
    '%s: a célula do chart é idêntica à frequência do exercício',
    (_nome, def) => {
      const grid = buildCells(def);
      const divergencias = allExercises
        .filter((ex) => rangeDefFor(ex) === def)
        .filter((ex) => {
          const cell = cellFor(grid, labelOfHand(ex.heroHand));
          return JSON.stringify(cell.freq) !== JSON.stringify(freqForExercise(ex));
        })
        .map((ex) => labelOfHand(ex.heroHand));

      expect(divergencias).toEqual([]);
    },
  );

  it.each(RANGE_DEFS.map((d) => [`${d.position} ${d.scenario}`, d] as const))(
    '%s: a resposta certa do exercício é a ação mais frequente do chart',
    (_nome, def) => {
      const divergencias = allExercises
        .filter((ex) => rangeDefFor(ex) === def)
        .filter((ex) => mainAction(freqForExercise(ex)!) !== ex.correctAction)
        .map((ex) => `${labelOfHand(ex.heroHand)}: exercício=${ex.correctAction} chart=${mainAction(freqForExercise(ex)!)}`);

      expect(divergencias).toEqual([]);
    },
  );

  it('exercício sem chart (postflop/4-bet/squeeze) não recebe frequência inventada', () => {
    const semChart = allExercises.filter((ex) => rangeDefFor(ex) === null);
    // Existem de verdade — se este número virar 0, o rangeDefFor casou demais.
    expect(semChart.length).toBeGreaterThan(0);
    for (const ex of semChart) expect(freqForExercise(ex)).toBeNull();
  });

  it('todo postflop cai no caso sem chart', () => {
    for (const ex of allExercises.filter((e) => e.board)) {
      expect(rangeDefFor(ex)).toBeNull();
    }
  });
});

describe('grid', () => {
  it.each(RANGE_DEFS.map((d) => [`${d.position} ${d.scenario}`, d] as const))(
    '%s: 13x13, 169 mãos, freq somando 100 e action = argmax',
    (_nome, def) => {
      const grid = buildCells(def);
      expect(grid).toHaveLength(13);

      const hands = new Set<string>();
      for (const row of grid) {
        expect(row).toHaveLength(13);
        for (const cell of row) {
          hands.add(cell.hand);
          const soma = cell.freq.FOLD + cell.freq.CALL + cell.freq.RAISE;
          expect(soma, `${cell.hand} soma ${soma}`).toBe(100);
          expect(cell.action).toBe(mainAction(cell.freq));
        }
      }
      expect(hands.size).toBe(169); // 13 pares + 78 suited + 78 offsuit
    },
  );

  it.each(RANGE_DEFS.map((d) => [`${d.position} ${d.scenario}`, d] as const))(
    '%s: nenhuma mão está em raise E call ao mesmo tempo',
    (_nome, def) => {
      const call = raiseSet(def.call ?? []);
      expect([...raiseSet(def.raise)].filter((h) => call.has(h))).toEqual([]);
    },
  );

  it('todo cenário é RFI ou VS_<posição> de uma posição real', () => {
    const posicoes = ['UTG', 'MP', 'CO', 'BTN', 'SB', 'BB'];
    for (const def of RANGE_DEFS) {
      expect(posicoes).toContain(def.position);
      if (def.scenario !== 'RFI') {
        expect(posicoes).toContain(def.scenario.replace('VS_', ''));
        expect(def.call, `${def.scenario} sem call`).toBeDefined();
      }
    }
  });
});

describe('cara-ou-coroa', () => {
  // Com frequências reais (vindas de solver), uma mão 52/48 reprovaria o aluno
  // num lance indiferente. Hoje nada é misto, então a margem é sempre 100.
  it('nenhum exercício cobra resposta numa decisão quase indiferente', () => {
    const apertados = allExercises
      .map((ex) => ({ ex, freq: freqForExercise(ex) }))
      .filter((x): x is { ex: typeof x.ex; freq: Freq } => x.freq !== null)
      .filter((x) => actionMargin(x.freq) < 10)
      .map((x) => `${labelOfHand(x.ex.heroHand)} (${x.ex.heroPosition}): margem ${actionMargin(x.freq)}`);

    expect(apertados).toEqual([]);
  });
});
