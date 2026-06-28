import type { Position, PublicExercise } from '@pokerpath/shared';
import { Card } from './Card.js';

/**
 * Mesa de poker 6-max — visual limpo (estilo Preflop Wizard).
 * Assentos com posição + stack, pote central, dealer button e as cartas do
 * herói em destaque embaixo. Mantém 6-max e 3 ações (PRD 7.1).
 */
const RING: Position[] = ['UTG', 'MP', 'CO', 'BTN', 'SB', 'BB'];
const SLOTS = [
  { x: 50, y: 91 }, { x: 11, y: 67 }, { x: 11, y: 27 },
  { x: 50, y: 7 }, { x: 89, y: 27 }, { x: 89, y: 67 },
];

function tokens(hand: string): string[] {
  const t: string[] = [];
  for (let i = 0; i < hand.length; i += 2) t.push(hand.slice(i, i + 2));
  return t;
}

export function PokerTable({ ex }: { ex: PublicExercise }) {
  const heroIdx = RING.indexOf(ex.heroPosition);
  const cards = tokens(ex.heroHand);

  return (
    <div className="relative mx-auto aspect-[10/11] w-full max-w-sm">
      {/* Feltro */}
      <div className="absolute inset-3 rounded-[46%] border border-line bg-gradient-to-b from-card2 to-card shadow-card" />
      <div className="absolute inset-8 rounded-[46%] border border-line/70" />

      {/* Pote central */}
      <div className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center">
        {ex.board && (
          <div className="mb-2 flex gap-1">
            {tokens(ex.board).map((t, i) => <div key={i} className="scale-75"><Card token={t} /></div>)}
          </div>
        )}
        <div className="flex items-center gap-1.5 rounded-full border border-line bg-card px-3 py-1 shadow-soft">
          <span className="inline-block h-3 w-3 rounded-full border-2 border-white bg-call" />
          <span className="text-sm font-bold text-title">{ex.potSize} BB</span>
        </div>
        <span className="mt-1 text-[10px] uppercase tracking-widest text-subtle">pote</span>
      </div>

      {/* Assentos */}
      {RING.map((pos) => {
        const slot = (RING.indexOf(pos) - heroIdx + 6) % 6;
        const { x, y } = SLOTS[slot];
        const isHero = pos === ex.heroPosition;
        const isVillain = ex.villainPosition === pos;
        return (
          <div key={pos} className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: `${x}%`, top: `${y}%` }}>
            <div className="flex flex-col items-center gap-1">
              {isHero && (
                <div className="mb-1 flex gap-1">
                  {cards.map((t, i) => (
                    <div key={i} className="animate-deal-in" style={{ animationDelay: `${i * 110}ms` }}>
                      <Card token={t} />
                    </div>
                  ))}
                </div>
              )}
              <div className={`flex items-center gap-1 rounded-full border px-2.5 py-1 shadow-soft ${
                isHero ? 'border-primary bg-primary text-white' : 'border-line bg-card text-title'
              }`}>
                <span className="text-xs font-bold">{pos}</span>
                {pos === 'BTN' && (
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-white text-[9px] font-black text-[#16181D]">D</span>
                )}
              </div>
              <span className="text-[10px] font-semibold text-subtle">{ex.stackBb} BB</span>
              {isVillain && ex.villainAction && (
                <span className="rounded-full bg-call/15 px-2 py-0.5 text-[10px] font-bold text-call">{ex.villainAction}</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
