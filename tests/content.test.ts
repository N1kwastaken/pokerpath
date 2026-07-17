import { describe, it, expect } from 'vitest';
import { WORLDS } from '../apps/api/prisma/seed.js';

/**
 * Invariantes do conteúdo. Cada uma aqui existe porque já quebrou de verdade —
 * não são checagens teóricas.
 */

const allExercises = WORLDS.flatMap((w) =>
  w.stages.flatMap((s) => s.exercises.map((ex) => ({ ex, world: w, stage: s }))),
);

/** "A♠Q♥" → ["A♠", "Q♥"]. Cada carta é valor+naipe. */
function cards(hand: string): string[] {
  return hand.match(/../g) ?? [];
}

describe('cartas', () => {
  it('nenhum exercício repete carta entre mão e board', () => {
    const offenders = allExercises
      .filter(({ ex }) => {
        const all = [...cards(ex.heroHand), ...cards((ex.board ?? '').replace(/\s/g, ''))];
        return new Set(all).size !== all.length;
      })
      .map(({ ex, stage }) => `${stage.title}: ${ex.heroHand} / board ${ex.board}`);

    expect(offenders).toEqual([]);
  });
});

describe('spot de agressor', () => {
  // villainAction 'Check' ⇒ botões Bet/Check. Não existe fold: dar check é grátis.
  it('não oferece FOLD como resposta certa quando o vilão deu check', () => {
    const offenders = allExercises
      .filter(({ ex }) => ex.villainAction === 'Check' && ex.correctAction === 'FOLD')
      .map(({ ex, stage }) => `${stage.title}: ${ex.heroHand}`);

    expect(offenders).toEqual([]);
  });
});

describe('paywall', () => {
  // Regra do main(): premium = mundo order >= 2 && fase tem exercício com board.
  // Um exercício com board numa fase de preflop paywalla o preflop em silêncio.
  const isPremium = (world: (typeof WORLDS)[number], stage: (typeof WORLDS)[number]['stages'][number]) =>
    world.order >= 2 && stage.exercises.some((e) => e.board);

  it('nenhuma fase premium contém exercício de preflop', () => {
    const offenders = WORLDS.flatMap((w) =>
      w.stages
        .filter((s) => isPremium(w, s) && s.exercises.some((e) => !e.board))
        .map((s) => `[M${w.order}] ${s.title}`),
    );

    expect(offenders).toEqual([]);
  });
});

describe('sanidade do seed', () => {
  it('tem os 4 mundos e nenhuma fase vazia sem ser aula', () => {
    expect(WORLDS).toHaveLength(4);
    // Fase sem exercício é aula (tem `concept`); nunca uma fase de prática vazia.
    const vazias = WORLDS.flatMap((w) =>
      w.stages.filter((s) => s.exercises.length === 0 && !s.concept).map((s) => s.title),
    );
    expect(vazias).toEqual([]);
  });
});
