import { describe, it, expect } from 'vitest';
import { WORLDS, MISSIONS } from '../apps/api/prisma/seed.js';
import { MILESTONES, MILESTONE_TRACKS } from '../packages/shared/src/gamification.js';
import { RANGE_DEFS, raiseSet, labelOfHand, rangeDefFor } from '../apps/api/prisma/ranges.js';

/** Auditoria além dos testes existentes: procura mãos erradas, ranges incoerentes,
 *  boards inválidos. Cada `it` junta as ocorrências e espera lista vazia. */

const all = WORLDS.flatMap((w) => w.stages.flatMap((s) => s.exercises.map((ex) => ({ ex, world: w, stage: s }))));
const rfi = (pos: string) => RANGE_DEFS.find((d) => d.scenario === 'RFI' && d.position === pos)!;
const CARD = /[2-9TJQKA][♠♥♦♣]/g;

describe('ranges RFI — coerência de poker', () => {
  it('monotonicidade: o que abre cedo tem que abrir tarde (UTG⊆MP⊆CO⊆BTN)', () => {
    const order = ['UTG', 'MP', 'CO', 'BTN'];
    const bad: string[] = [];
    for (let i = 0; i < order.length - 1; i++) {
      const tighter = raiseSet(rfi(order[i]).raise);
      const wider = raiseSet(rfi(order[i + 1]).raise);
      for (const h of tighter) if (!wider.has(h)) bad.push(`${h}: abre em ${order[i]} mas fold em ${order[i + 1]}`);
    }
    expect(bad).toEqual([]);
  });

  it('mãos premium (AA,KK,QQ,JJ,AKs,AKo) abrem de toda posição', () => {
    const bad: string[] = [];
    for (const pos of ['UTG', 'MP', 'CO', 'BTN', 'SB']) {
      const rs = raiseSet(rfi(pos).raise);
      for (const h of ['AA', 'KK', 'QQ', 'JJ', 'AKs', 'AKo']) if (!rs.has(h)) bad.push(`${h} não abre de ${pos}`);
    }
    expect(bad).toEqual([]);
  });
});

describe('charts de defesa (VS_) — sanidade', () => {
  it('as mãos nut (AA,KK) estão em raise/3-bet, nunca só fold', () => {
    const bad: string[] = [];
    for (const def of RANGE_DEFS.filter((d) => d.scenario !== 'RFI')) {
      const rs = raiseSet(def.raise);
      for (const h of ['AA', 'KK']) if (!rs.has(h)) bad.push(`${def.position} ${def.scenario}: ${h} não está no raise`);
    }
    expect(bad).toEqual([]);
  });
});

describe('boards postflop', () => {
  it('todo board tem 3/4/5 cartas válidas e distintas', () => {
    const bad: string[] = [];
    for (const { ex, stage } of all) {
      if (!ex.board) continue;
      const cs = ex.board.replace(/\s/g, '').match(CARD) ?? [];
      const raw = ex.board.replace(/\s/g, '');
      if (cs.join('').length !== raw.length) bad.push(`${stage.title}: board inválido "${ex.board}"`);
      else if (![3, 4, 5].includes(cs.length)) bad.push(`${stage.title}: board com ${cs.length} cartas "${ex.board}"`);
      else if (new Set(cs).size !== cs.length) bad.push(`${stage.title}: board com carta repetida "${ex.board}"`);
    }
    expect(bad).toEqual([]);
  });

  it('mão do herói sempre com 2 cartas válidas', () => {
    const bad: string[] = [];
    for (const { ex, stage } of all) {
      const cs = ex.heroHand.match(CARD) ?? [];
      if (cs.length !== 2 || cs.join('').length !== ex.heroHand.length) bad.push(`${stage.title}: mão inválida "${ex.heroHand}"`);
    }
    expect(bad).toEqual([]);
  });
});

describe('posições e ações', () => {
  it('herói ≠ vilão ≠ caller', () => {
    const bad: string[] = [];
    for (const { ex, stage } of all) {
      if (ex.villainPosition && ex.villainPosition === ex.heroPosition) bad.push(`${stage.title}: herói e vilão em ${ex.heroPosition} (${ex.heroHand})`);
      if (ex.callerPosition && (ex.callerPosition === ex.heroPosition || ex.callerPosition === ex.villainPosition)) bad.push(`${stage.title}: caller colide (${ex.heroHand})`);
    }
    expect(bad).toEqual([]);
  });

  it('correctAction é FOLD/CALL/RAISE (sem typo)', () => {
    const bad: string[] = [];
    for (const { ex, stage } of all) {
      if (!['FOLD', 'CALL', 'RAISE'].includes(ex.correctAction)) bad.push(`${stage.title}: ${ex.heroHand} correct="${ex.correctAction}"`);
    }
    expect(bad).toEqual([]);
  });

  it('RFI (open sem vilão) é raise-ou-fold — nunca CALL como resposta', () => {
    const bad: string[] = [];
    for (const { ex, stage } of all) {
      if (rangeDefFor(ex)?.scenario === 'RFI' && ex.correctAction === 'CALL') bad.push(`${stage.title}: ${ex.heroHand} pede CALL num RFI`);
    }
    expect(bad).toEqual([]);
  });

  it('potSize e stackBb, quando definidos, são positivos (undefined = default do schema)', () => {
    const bad: string[] = [];
    for (const { ex, stage } of all) {
      if (ex.potSize != null && ex.potSize <= 0) bad.push(`${stage.title}: ${ex.heroHand} pot=${ex.potSize}`);
      if (ex.stackBb != null && ex.stackBb <= 0) bad.push(`${stage.title}: ${ex.heroHand} stack=${ex.stackBb}`);
    }
    expect(bad).toEqual([]);
  });
});

describe('missões', () => {
  // O dia serve 2 fáceis + 2 médias + 1 difícil e a semana 1 de cada. Se uma
  // faixa ficar sem missões suficientes, o período passa a servir MENOS
  // missões — em silêncio, sem erro nenhum.
  const SLOTS = { DAILY: { EASY: 2, MEDIUM: 2, HARD: 1 }, WEEKLY: { EASY: 1, MEDIUM: 1, HARD: 1 } };

  it('toda faixa tem missões suficientes para preencher as vagas', () => {
    const faltando: string[] = [];
    for (const [type, slots] of Object.entries(SLOTS)) {
      for (const [level, n] of Object.entries(slots)) {
        const have = MISSIONS.filter((m) => m.type === type && m.difficulty === level).length;
        if (have < n) faltando.push(`${type}/${level}: ${have} missões para ${n} vagas`);
      }
    }
    expect(faltando).toEqual([]);
  });

  it('toda missão tem dificuldade válida e alvo positivo', () => {
    const bad = MISSIONS
      .filter((m) => !['EASY', 'MEDIUM', 'HARD'].includes(m.difficulty) || !(m.target > 0))
      .map((m) => `${m.code}: difficulty=${m.difficulty} target=${m.target}`);
    expect(bad).toEqual([]);
  });

  it('dentro de uma faixa, o XP cresce com a dificuldade', () => {
    const maxOf = (t: string, d: string) => Math.max(...MISSIONS.filter((m) => m.type === t && m.difficulty === d).map((m) => m.xpReward));
    const bad: string[] = [];
    for (const t of ['DAILY', 'WEEKLY']) {
      if (!(maxOf(t, 'EASY') < maxOf(t, 'HARD'))) bad.push(`${t}: fácil paga tanto quanto difícil`);
    }
    expect(bad).toEqual([]);
  });
});

describe('marcos', () => {
  // Marco é DEGRAU: dentro da trilha o alvo tem que subir e a recompensa
  // junto. Um degrau fora de ordem faria a escada mostrar o marco maior como
  // "próximo" antes do menor — sem erro nenhum, só confusão.
  it('dentro de cada trilha, alvo e recompensa sobem juntos', () => {
    const bad: string[] = [];
    for (const track of MILESTONE_TRACKS) {
      const items = MILESTONES.filter((m) => m.track === track);
      for (let i = 1; i < items.length; i++) {
        if (items[i].target <= items[i - 1].target) bad.push(`${track}: ${items[i].code} não sobe o alvo`);
        if (items[i].xpReward <= items[i - 1].xpReward) bad.push(`${track}: ${items[i].code} não paga mais XP`);
      }
    }
    expect(bad).toEqual([]);
  });

  it('todo marco tem código único, alvo positivo e trilha válida', () => {
    const seen = new Set<string>();
    const bad: string[] = [];
    for (const m of MILESTONES) {
      if (seen.has(m.code)) bad.push(`${m.code}: código repetido`);
      seen.add(m.code);
      if (!(m.target > 0)) bad.push(`${m.code}: alvo ${m.target}`);
      if (!MILESTONE_TRACKS.includes(m.track)) bad.push(`${m.code}: trilha ${m.track}`);
      if (m.xpReward <= 0) bad.push(`${m.code}: XP ${m.xpReward}`);
      if (m.energyReward < 0) bad.push(`${m.code}: energia ${m.energyReward}`);
    }
    expect(bad).toEqual([]);
  });
});

describe('formato das explicações', () => {
  // Título + tópicos numa string só (ver Explanation.tsx). Uma explicação que
  // volte ao formato de frase única não quebra nada — só volta a ser ilegível.
  it('toda explicação tem título e pelo menos 2 tópicos', () => {
    const bad: string[] = [];
    for (const { ex, stage } of all) {
      const [head, ...rest] = ex.explanation.split('\n');
      const bullets = rest.filter((l) => l.startsWith('• '));
      if (!head.endsWith(':')) bad.push(`${stage.title}/${ex.heroHand}: título sem ":" → "${head}"`);
      if (bullets.length < 2) bad.push(`${stage.title}/${ex.heroHand}: ${bullets.length} tópico(s)`);
      if (bullets.length !== rest.length) bad.push(`${stage.title}/${ex.heroHand}: linha que não é tópico`);
    }
    expect(bad).toEqual([]);
  });

  it('o negrito *assim* está sempre fechado', () => {
    const bad = all
      .filter(({ ex }) => (ex.explanation.match(/\*/g) ?? []).length % 2 !== 0)
      .map(({ ex, stage }) => `${stage.title}/${ex.heroHand}: asterisco solto`);
    expect(bad).toEqual([]);
  });

  it('nenhuma explicação passa de 360 caracteres (senão o cartão rola)', () => {
    const bad = all
      .filter(({ ex }) => ex.explanation.length > 360)
      .map(({ ex, stage }) => `${stage.title}/${ex.heroHand}: ${ex.explanation.length} chars`);
    expect(bad).toEqual([]);
  });
});

describe('board × categoria', () => {
  const expected: Record<string, number> = { C_BET: 3, TURN: 4, RIVER: 5 };
  it('a rua da categoria bate com o número de cartas do board', () => {
    const bad: string[] = [];
    for (const { ex, stage } of all) {
      const want = expected[ex.category];
      if (want == null) continue;
      const n = (ex.board?.replace(/\s/g, '').match(CARD) ?? []).length;
      if (n !== want) bad.push(`${stage.title}: ${ex.category} ${ex.heroHand} board tem ${n} cartas (esperado ${want}) "${ex.board}"`);
    }
    expect(bad).toEqual([]);
  });
});
