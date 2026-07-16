import type { CSSProperties } from 'react';
import type { Position, PublicExercise } from '@pokerpath/shared';
import { Card } from './Card.js';

/**
 * Mesa 6-max — HUD escuro estilo GTO Wizard. Os assentos dos vilões ROTACIONAM
 * (animado) quando a posição do hero muda; o hero fica fixo embaixo com as
 * cartas grandes e o rótulo da posição LOGO ABAIXO das cartas (sem overlap).
 */
const RING: Position[] = ['UTG', 'MP', 'CO', 'BTN', 'SB', 'BB'];
// slot 0 = embaixo (reservado ao hero); 1..5 giram ao redor.
const SLOTS = [
  { x: 50, y: 92 }, { x: 9, y: 66 }, { x: 9, y: 27 },
  { x: 50, y: 8 }, { x: 91, y: 27 }, { x: 91, y: 66 },
];

function tokens(hand: string): string[] {
  const t: string[] = [];
  for (let i = 0; i < hand.length; i += 2) t.push(hand.slice(i, i + 2));
  return t;
}

function Dealer() {
  return <span className="flex h-4 w-4 items-center justify-center rounded-full bg-white text-[9px] font-black text-black">D</span>;
}

/** Nome em português da posição — no modo simples a sigla sozinha não diz nada. */
const POS_NAME: Record<Position, string> = {
  UTG: 'primeiro a falar',
  MP: 'no meio',
  CO: 'antes do botão',
  BTN: 'no botão',
  SB: 'small blind',
  BB: 'big blind',
};

/** Estado do assento: na mão (verde), foldou (escuro dessaturado) ou ainda não agiu (escuro). */
type SeatState = 'in' | 'folded' | 'pending';

function SeatCards({ state }: { state: SeatState }) {
  const style: CSSProperties =
    state === 'in'
      ? { background: 'linear-gradient(145deg, #33cc7a, #177a43)', border: '1px solid rgba(255,255,255,0.55)' }
      : state === 'folded'
        ? { background: '#232628', border: '1px solid rgba(255,255,255,0.06)', filter: 'saturate(0)', opacity: 0.35 }
        : { background: '#33383d', border: '1px solid rgba(255,255,255,0.16)', opacity: 0.9 };
  return (
    <div className="flex -space-x-1">
      <span className="h-3.5 w-2.5 -rotate-6 rounded-[3px]" style={style} />
      <span className="h-3.5 w-2.5 rotate-6 rounded-[3px]" style={style} />
    </div>
  );
}

export function PokerTable({ ex, simple = false }: {
  ex: PublicExercise;
  /**
   * Mesa de INICIANTE (Mundo 0): esconde as siglas dos outros assentos e os
   * stacks — ruído puro para quem nunca jogou (teste com 3 iniciantes). Sobra
   * o essencial: suas cartas, onde você está (com o nome por extenso) e o pote.
   */
  simple?: boolean;
}) {
  const heroIdx = RING.indexOf(ex.heroPosition);
  const cards = tokens(ex.heroHand);

  return (
    <div className="relative mx-auto aspect-[10/9] w-full max-w-sm">
      {/* Rail + feltro */}
      <div
        className="absolute inset-1 rounded-[47%]"
        style={{
          background: 'radial-gradient(ellipse at 50% 36%, #1c8454 0%, #14613b 52%, #0c3d27 100%)',
          boxShadow: 'inset 0 0 0 7px rgba(0,0,0,0.5), inset 0 0 0 9px rgba(255,255,255,0.06), inset 0 0 55px rgba(0,0,0,0.55), 0 10px 30px -12px rgba(0,0,0,0.7)',
        }}
      />
      <div className="absolute inset-7 rounded-[47%] border border-white/10" />

      {/* Pot */}
      <div className="absolute left-1/2 top-[40%] flex -translate-x-1/2 -translate-y-1/2 flex-col items-center">
        {ex.board && (
          <div className="mb-2 flex gap-1">
            {tokens(ex.board).map((t, i) => <div key={i} className="scale-[0.72]"><Card token={t} /></div>)}
          </div>
        )}
        <div className="flex items-center gap-1.5 rounded-full bg-black/40 px-3 py-1">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-call ring-2 ring-white/70" />
          <span className="text-[11px] font-bold uppercase tracking-wide text-white/90">Pot {ex.potSize} BB</span>
        </div>
      </div>

      {/* Vilões (rotacionam ao mudar a posição do hero) */}
      {RING.filter((p) => p !== ex.heroPosition).map((pos) => {
        const slot = (RING.indexOf(pos) - heroIdx + 6) % 6;
        const { x, y } = SLOTS[slot];
        const isVillain = ex.villainPosition === pos;
        const isCaller = ex.callerPosition === pos;
        // RING é também a ordem de ação preflop: quem vem antes do hero já agiu
        // (foldou, se não é vilão/caller); quem vem depois ainda não jogou.
        // Com board (postflop), só hero e vilão seguem na mão.
        const seat: SeatState = isVillain || isCaller
          ? 'in'
          : ex.board || RING.indexOf(pos) < heroIdx ? 'folded' : 'pending';
        return (
          <div key={pos} className="absolute -translate-x-1/2 -translate-y-1/2 transition-[left,top] duration-500 ease-out" style={{ left: `${x}%`, top: `${y}%` }}>
            <div className="flex flex-col items-center gap-0.5">
              <SeatCards state={seat} />
              {simple ? (
                // Iniciante: os outros são só "jogadores" — a sigla viria antes
                // da hora e rouba a atenção da única pergunta que importa aqui.
                <span className={`rounded-lg bg-black/55 px-2 py-0.5 text-[10px] font-bold ${seat === 'folded' ? 'text-white/30' : 'text-white/60'}`}>
                  {seat === 'folded' ? 'saiu' : 'jogador'}
                </span>
              ) : (
                <>
                  <span className={`flex items-center gap-1 rounded-lg bg-black/55 px-2.5 py-1 text-xs font-extrabold tracking-wide ${seat === 'folded' ? 'text-white/35' : 'text-white/80'}`}>
                    {pos}{pos === 'BTN' && <Dealer />}
                  </span>
                  <span className={`text-[10px] font-semibold tabular-nums ${seat === 'folded' ? 'text-white/25' : 'text-white/50'}`}>{ex.stackBb} BB</span>
                </>
              )}
              {isVillain && ex.villainAction && (
                <span className="rounded bg-call/25 px-1.5 py-0.5 text-[9px] font-bold text-call">{ex.villainAction}</span>
              )}
              {isCaller && (
                <span className="rounded bg-white/15 px-1.5 py-0.5 text-[9px] font-bold text-white/75">Call</span>
              )}
            </div>
          </div>
        );
      })}

      {/* Hero: cartas grandes + posição LOGO ABAIXO */}
      <div className="absolute bottom-[3%] left-1/2 flex -translate-x-1/2 flex-col items-center gap-1.5">
        <div key={ex.heroHand} className="flex gap-2">
          {cards.map((t, i) => (
            <div key={i} className="animate-deal-in drop-shadow-[0_6px_10px_rgba(0,0,0,0.6)]" style={{ animationDelay: `${i * 90}ms` }}>
              <Card token={t} />
            </div>
          ))}
        </div>
        <div className="flex flex-col items-center gap-0.5">
          <span className="flex items-center gap-1 rounded-lg bg-primary px-3 py-1 text-xs font-extrabold tracking-wide text-white ring-2 ring-white/30">
            VOCÊ · {ex.heroPosition}{ex.heroPosition === 'BTN' && <Dealer />}
          </span>
          {simple ? (
            <span className="rounded bg-black/45 px-2 py-0.5 text-[10px] font-semibold text-white/70">{POS_NAME[ex.heroPosition]}</span>
          ) : (
            <span className="text-[10px] font-semibold tabular-nums text-white/60">{ex.stackBb} BB</span>
          )}
        </div>
      </div>
    </div>
  );
}
