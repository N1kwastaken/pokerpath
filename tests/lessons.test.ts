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
