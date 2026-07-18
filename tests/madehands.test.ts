import { it, expect } from 'vitest';
import { WORLDS } from '../apps/api/prisma/seed.js';

const RANK = '23456789TJQKA';
type C = { r: number; s: string };
function cards(s: string): C[] { return (s.match(/../g) ?? []).map((t) => ({ r: RANK.indexOf(t[0]), s: t[1] })); }

function evalMade(hand: string, board: string): string | null {
  const cs = [...cards(hand), ...cards(board)];
  // flush
  const bySuit: Record<string, number[]> = {};
  for (const c of cs) (bySuit[c.s] ??= []).push(c.r);
  const flush = Object.values(bySuit).some((rs) => rs.length >= 5);
  // straight (com A baixo)
  const set = new Set(cs.map((c) => c.r));
  if (set.has(12)) set.add(-1); // A como 1
  let straight = false;
  for (let hi = 12; hi >= 3; hi--) { if ([0,1,2,3,4].every((d) => set.has(hi - d))) { straight = true; break; } }
  // trips+
  const cnt: Record<number, number> = {};
  for (const c of cs) cnt[c.r] = (cnt[c.r] ?? 0) + 1;
  const trips = Object.values(cnt).some((n) => n >= 3);
  if (flush) return 'flush';
  if (straight) return 'straight';
  if (trips) return 'trinca+';
  return null;
}

it('nenhuma mão de FOLD tem mão feita forte (straight/flush/trinca)', () => {
  const all = WORLDS.flatMap((w) => w.stages.flatMap((s) => s.exercises.map((e) => ({ e, s }))));
  const bad = all
    .filter(({ e }) => e.board && e.correctAction === 'FOLD')
    .map(({ e, s }) => ({ made: evalMade(e.heroHand, e.board!), e, s }))
    .filter((x) => x.made)
    .map((x) => `${x.s.title} | ${x.e.heroHand} board ${x.e.board} = ${x.made} | "${x.e.explanation}"`);
  expect(bad).toEqual([]);
});
