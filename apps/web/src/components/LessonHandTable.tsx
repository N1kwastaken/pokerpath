import type { Position } from '@pokerpath/shared';
import { Card } from './Card.js';

/**
 * Mini-mesa das aulas com ASSENTOS FIXOS. As cartas ficam no centro e um
 * marcador "VOCÊ" desliza até a posição atual — quando a posição muda entre
 * passos, a animação deixa claro que VOCÊ mudou de lugar na mesa.
 */
const RING: Position[] = ['UTG', 'MP', 'CO', 'BTN', 'SB', 'BB'];
const SEAT_XY: Record<Position, { x: number; y: number }> = {
  UTG: { x: 50, y: 88 },
  MP: { x: 13, y: 64 },
  CO: { x: 13, y: 26 },
  BTN: { x: 50, y: 9 },
  SB: { x: 87, y: 26 },
  BB: { x: 87, y: 64 },
};

function tokens(hand: string): string[] {
  const out: string[] = [];
  for (let i = 0; i < hand.length; i += 2) out.push(hand.slice(i, i + 2));
  return out;
}

export function LessonHandTable({ position, hand }: { position: Position; hand: string }) {
  const cards = tokens(hand);
  const hero = SEAT_XY[position];

  return (
    <div>
      <p className="mb-2 text-center text-sm font-semibold text-subtle">
        Você está em <span className="font-bold text-primary">{position}</span>
      </p>
      <div className="relative mx-auto aspect-[10/8] w-full max-w-xs">
        <div className="absolute inset-2 rounded-[44%] border border-line bg-gradient-to-b from-card2 to-card shadow-card" />
        <div className="absolute inset-6 rounded-[44%] border border-line/60" />

        {/* Assentos FIXOS */}
        {RING.map((pos) => {
          const { x, y } = SEAT_XY[pos];
          return (
            <div key={pos} className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: `${x}%`, top: `${y}%` }}>
              <span className="flex items-center gap-1 rounded-full border border-line bg-card px-2 py-0.5 text-[11px] font-bold text-subtle">
                {pos}
                {pos === 'BTN' && <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[#16181D] text-[8px] font-black text-white">D</span>}
              </span>
            </div>
          );
        })}

        {/* Marcador VOCÊ — desliza até o assento atual */}
        <div
          className="absolute z-20 -translate-x-1/2 -translate-y-1/2 transition-all duration-500 ease-out"
          style={{ left: `${hero.x}%`, top: `${hero.y}%` }}
        >
          <span className="absolute -top-5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-primary px-2 py-0.5 text-[9px] font-black uppercase tracking-wide text-white shadow-pop">Você</span>
          <span className="flex items-center gap-1 rounded-full border-2 border-primary bg-primary px-2.5 py-0.5 text-[11px] font-bold text-white shadow-pop">
            {position}
            {position === 'BTN' && <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-white text-[8px] font-black text-[#16181D]">D</span>}
          </span>
        </div>

        {/* Cartas no centro */}
        <div className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center">
          <div className="flex gap-2">
            {cards.map((t, i) => (
              <div key={i} className="animate-deal-in" style={{ animationDelay: `${i * 110}ms` }}>
                <Card token={t} />
              </div>
            ))}
          </div>
          <span className="mt-2 rounded-full bg-primary/10 px-3 py-0.5 text-xs font-bold text-primary">Sua mão</span>
        </div>
      </div>
    </div>
  );
}
