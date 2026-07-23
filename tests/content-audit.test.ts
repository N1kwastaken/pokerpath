import { describe, it, expect } from 'vitest';
import { WORLDS, MISSIONS } from '../apps/api/prisma/seed.js';
import { MILESTONES, MILESTONE_TRACKS, ownsBadge, STREAK_BADGE_DAYS } from '../packages/shared/src/gamification.js';
import { RANGE_DEFS, raiseSet, labelOfHand, rangeDefFor } from '../apps/api/prisma/ranges.js';

/** Auditoria além dos testes existentes: procura mãos erradas, ranges incoerentes,
 *  boards inválidos. Cada `it` junta as ocorrências e espera lista vazia. */

const all = WORLDS.flatMap((w) => w.stages.flatMap((s) => s.exercises.map((ex) => ({ ex, world: w, stage: s }))));
const rfi = (pos: string) => RANGE_DEFS.find((d) => d.scenario === 'RFI' && d.position === pos)!;
const CARD = /[2-9TJQKA][♠♥♦♣]/g;

// ─── Avaliador de mão (7 cartas → categoria feita 0..8) ────────
// Duas explicações erradas nasceram de mão MAL ROTULADA (projeto chamado de
// mão feita, etc.). Este avaliador deixa o teste checar força real vs. texto.
const RANKS = '23456789TJQKA';
type PCard = { r: number; s: string };
const cards = (str: string | null | undefined): PCard[] => (str?.match(CARD) ?? []).map((c) => ({ r: RANKS.indexOf(c[0]), s: c[1] }));
function combos5(a: PCard[]): PCard[][] {
  const out: PCard[][] = [];
  const rec = (start: number, acc: PCard[]) => {
    if (acc.length === 5) { out.push(acc); return; }
    for (let i = start; i < a.length; i++) rec(i + 1, [...acc, a[i]]);
  };
  rec(0, []);
  return out;
}
function catOf5(cs: PCard[]): number {
  const rs = cs.map((c) => c.r).sort((a, b) => b - a);
  const flush = cs.every((c) => c.s === cs[0].s);
  const uniq = [...new Set(rs)]; if (uniq.includes(12)) uniq.push(-1);
  const sorted = [...new Set(uniq)].sort((a, b) => a - b);
  let straight = false;
  for (let i = 0; i <= sorted.length - 5; i++) if (sorted[i + 4] - sorted[i] === 4) straight = true;
  const cnt = new Map<number, number>(); for (const r of rs) cnt.set(r, (cnt.get(r) ?? 0) + 1);
  const g = [...cnt.values()].sort((a, b) => b - a); const c1 = g[0], c2 = g[1] ?? 0;
  if (flush && straight) return 8;
  if (c1 === 4) return 7;
  if (c1 === 3 && c2 >= 2) return 6;
  if (flush) return 5;
  if (straight) return 4;
  if (c1 === 3) return 3;
  if (c1 === 2 && c2 === 2) return 2;
  if (c1 === 2) return 1;
  return 0;
}
const madeCat = (hero: string, board: string | null | undefined): number =>
  Math.max(...combos5([...cards(hero), ...cards(board)]).map(catOf5));

const postflop = all.filter(({ ex }) => ['C_BET', 'TURN', 'RIVER'].includes(ex.category));

describe('coerência mão × explicação (postflop)', () => {
  it('mão SEM PAR não é descrita como mão feita', () => {
    // "sequência feita", "mão forte", "top pair"… numa mão que nem par tem é
    // rótulo errado (foi o bug: projeto chamado de mão feita).
    const feita = /sequência feita|mão forte|trinca|dois pares|overpair|top pair|full house|na frente da maior parte/i;
    const bad = postflop
      .filter(({ ex }) => madeCat(ex.heroHand, ex.board) === 0 && feita.test(ex.explanation))
      .map(({ ex, stage }) => `${stage.title}/${ex.heroHand}|${ex.board}`);
    expect(bad).toEqual([]);
  });

  it('não se dá FOLD com dois pares ou mais enfrentando aposta', () => {
    const bad = postflop
      .filter(({ ex }) => ex.villainAction !== 'Check' && ex.correctAction === 'FOLD' && madeCat(ex.heroHand, ex.board) >= 2)
      .map(({ ex, stage }) => `${stage.title}/${ex.heroHand}|${ex.board}`);
    expect(bad).toEqual([]);
  });

  it('não se dá CHECK atrás com full house ou mais (spot de agressor)', () => {
    const bad = postflop
      .filter(({ ex }) => ex.villainAction === 'Check' && ex.correctAction === 'CALL' && madeCat(ex.heroHand, ex.board) >= 6)
      .map(({ ex, stage }) => `${stage.title}/${ex.heroHand}|${ex.board}`);
    expect(bad).toEqual([]);
  });
});

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

describe('vitrine de badges', () => {
  // A posse é validada NO SERVIDOR com esta função. Se ela afrouxar, qualquer
  // cliente passa a exibir conquista que nunca fez.
  const has = { achievements: ['PRIMEIRA_MAO'], maxStreak: 30 };

  it('só reconhece badge realmente conquistado', () => {
    const bad: string[] = [];
    const casos: [string, boolean][] = [
      ['ach:PRIMEIRA_MAO', true],
      ['ach:NAO_TENHO', false],
      ['streak:3', true],
      ['streak:30', true],
      ['streak:60', false],   // maxStreak 30 < 60
      ['streak:5', false],    // degrau que não existe
      ['streak:abc', false],
      ['qualquer', false],
      ['', false],
    ];
    for (const [id, esperado] of casos) {
      if (ownsBadge(id, has) !== esperado) bad.push(`${id}: esperado ${esperado}`);
    }
    expect(bad).toEqual([]);
  });

  it('todo degrau de badge de streak tem um marco correspondente', () => {
    const alvos = new Set(MILESTONES.filter((m) => m.track === 'STREAK').map((m) => m.target));
    const orfaos = STREAK_BADGE_DAYS.filter((d) => !alvos.has(d));
    expect(orfaos).toEqual([]);
  });
});

describe('river não fala em projeto', () => {
  // No river não vem mais carta: "open-ended", "semi-blefe", "outs", "pode
  // acertar depois" são lógica de flop/turn e viram erro pedagógico. Um river
  // ou tem mão FEITA, ou é blefe puro/desistência — nunca um projeto.
  it('nenhuma explicação de river menciona projeto/semi-blefe/outs', () => {
    const proibido = /open-ended|semi-blefe|acertar depois|flush draw|cartas que te d[ãa]o|gutshot|projeto de flush/i;
    const bad = all
      .filter(({ ex }) => ex.category === 'RIVER' && proibido.test(ex.explanation))
      .map(({ ex, stage }) => `${stage.title}/${ex.heroHand}`);
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
