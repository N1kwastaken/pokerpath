import { describe, it, expect } from 'vitest';
import { WORLDS } from '../apps/api/prisma/seed.js';
import { LESSONS } from '../apps/web/src/content/lessons.js';
import { stageGroup } from '../apps/web/src/lib/stageGroup.js';

/**
 * Aulas e roteamento. Um conceito sem prefixo casado no stageGroup cai calado
 * em "Fundamentos", e uma aula sem lição vira texto genérico — os dois falham
 * sem erro nenhum, então só um teste pega.
 */

const stages = WORLDS.flatMap((w) => w.stages.map((s) => ({ s, w })));
const aulas = stages.filter(({ s }) => s.exercises.length === 0);

describe('aulas', () => {
  it('toda aula tem lição escrita', () => {
    const semLicao = aulas
      .filter(({ s }) => !LESSONS[s.concept as keyof typeof LESSONS])
      .map(({ s, w }) => `[M${w.order}] ${s.title} (concept: ${s.concept})`);

    expect(semLicao).toEqual([]);
  });
});

describe('mini-jogos das aulas', () => {
  const games = Object.entries(LESSONS).flatMap(([lesson, steps]) =>
    steps.map((step, i) => ({ lesson, i, step })),
  );

  it('order/match: itens únicos (o jogo identifica pelo texto — repetido quebra)', () => {
    const bad: string[] = [];
    for (const { lesson, step } of games) {
      if (step.kind === 'order' && new Set(step.items).size !== step.items.length)
        bad.push(`${lesson}: order com item repetido`);
      if (step.kind === 'match') {
        if (new Set(step.pairs.map((p) => p[0])).size !== step.pairs.length) bad.push(`${lesson}: match com lado esquerdo repetido`);
        if (new Set(step.pairs.map((p) => p[1])).size !== step.pairs.length) bad.push(`${lesson}: match com lado direito repetido`);
      }
    }
    expect(bad).toEqual([]);
  });

  it('tapall: alvo nunca é igual a isca (ficaria visualmente impossível)', () => {
    const bad: string[] = [];
    for (const { lesson, step } of games) {
      if (step.kind !== 'tapall') continue;
      if (step.targets.length === 0) bad.push(`${lesson}: tapall sem alvos`);
      const t = new Set(step.targets);
      for (const d of step.decoys) if (t.has(d)) bad.push(`${lesson}: "${d}" é alvo E isca`);
    }
    expect(bad).toEqual([]);
  });

  it('memory: nenhuma face repetida (duas cartas iguais de pares diferentes é injusto)', () => {
    const bad: string[] = [];
    for (const { lesson, step } of games) {
      if (step.kind !== 'memory') continue;
      const faces = step.pairs.flat();
      if (new Set(faces).size !== faces.length) bad.push(`${lesson}: memory com face repetida`);
    }
    expect(bad).toEqual([]);
  });
});

describe('stageGroup', () => {
  it('nenhum conceito do Avançado cai em Fundamentos por engano', () => {
    // Fundamentos é o fallback: se um conceito novo cai lá, faltou prefixo.
    const caiuNoFallback = stages
      .filter(({ w }) => w.order === 3)
      .filter(({ s }) => stageGroup(s.concept) === 'Fundamentos')
      .map(({ s }) => `${s.concept} → Fundamentos`);

    expect(caiuNoFallback).toEqual([]);
  });

  it('a ordem dos regexes importa: Textura vem antes de teste/board', () => {
    // 'Textura teste' casa /teste/ E /^textura/i — o grupo certo é Textura.
    expect(stageGroup('Textura teste')).toBe('Textura');
    expect(stageGroup('Textura seco')).toBe('Textura');
    expect(stageGroup('Textura molhado')).toBe('Textura');
  });

  it('todo conceito do seed tem grupo', () => {
    const semGrupo = stages.filter(({ s }) => !stageGroup(s.concept)).map(({ s }) => s.concept);
    expect(semGrupo).toEqual([]);
  });
});
