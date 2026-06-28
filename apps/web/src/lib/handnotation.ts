/** Converte uma mão "A♠J♣" na notação de range ("AJo", "AKs", "AA"). */
const RANK_ORDER = 'AKQJT98765432';
const rankIdx = (r: string) => RANK_ORDER.indexOf(r);

export function handToKey(hand: string): string {
  const r1 = hand[0], s1 = hand[1], r2 = hand[2], s2 = hand[3];
  if (r1 === r2) return r1 + r2;
  const [hi, lo] = rankIdx(r1) <= rankIdx(r2) ? [r1, r2] : [r2, r1];
  return hi + lo + (s1 === s2 ? 's' : 'o');
}
