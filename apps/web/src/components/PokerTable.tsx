import type { CSSProperties } from 'react';
import type { Position, PublicExercise } from '@pokerpath/shared';
import { Card } from './Card.js';

/**
 * Mesa 6-max — visual inspirado no trainer de referência (GTO-Wizard-like):
 * feltro VERDE escuro (marca) + ANEL DE NEON na cor do app que vaza pra dentro,
 * assentos como pílulas de duas partes ([POS] 100BB), cartas-verso listradas
 * atrás de quem segue na mão e D dourado no botão. Os assentos dos vilões
 * ROTACIONAM (animado) quando a posição do hero muda; o hero fica fixo embaixo
 * com as cartas grandes e a pílula LOGO ABAIXO (sem overlap).
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

/** Botão do dealer — disco DOURADO como no trainer de referência. */
function Dealer() {
  return (
    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-gold text-[9px] font-black text-black ring-1 ring-black/30">
      D
    </span>
  );
}

/** Fichinha (só enfeite) — ecoa as pilhas de fichas do trainer sem inventar valor. */
function Chip() {
  return <span className="inline-block h-2.5 w-2.5 rounded-full bg-gold ring-1 ring-black/40" />;
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

/** Estado do assento: na mão (verso aceso), foldou (dessaturado) ou ainda não agiu (verso apagado). */
type SeatState = 'in' | 'folded' | 'pending';

/** Cartas-verso do assento — listradas na cor do app, como os versos azuis do trainer. */
function SeatCards({ state }: { state: SeatState }) {
  if (state === 'folded') {
    return (
      <div className="flex -space-x-1 opacity-30 saturate-0">
        <span className="h-4 w-3 -rotate-6 rounded-[3px] bg-[#232628] ring-1 ring-white/10" />
        <span className="h-4 w-3 rotate-6 rounded-[3px] bg-[#232628] ring-1 ring-white/10" />
      </div>
    );
  }
  const back: CSSProperties = {
    backgroundColor: 'rgb(var(--primary2))',
    backgroundImage: 'repeating-linear-gradient(45deg, rgb(var(--primary) / 0.65) 0 3px, transparent 3px 6px)',
    border: '1px solid rgba(255,255,255,0.4)',
  };
  return (
    <div className={`flex -space-x-1 ${state === 'pending' ? 'opacity-55' : ''}`}>
      <span className="h-4 w-3 -rotate-6 rounded-[3px]" style={back} />
      <span className="h-4 w-3 rotate-6 rounded-[3px]" style={back} />
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
    <div className="relative mx-auto aspect-[7/6] w-full max-w-md">
      {/* Feltro — VERDE escuro (marca) e ESCURO no centro, pra o anel de neon
          estourar no aro (o trainer de referência é escuro no meio, aceso na
          borda). Nada de verde brilhante chapado. */}
      <div
        className="absolute inset-1 rounded-[42%]"
        style={{
          background: 'radial-gradient(ellipse at 50% 44%, #0a3020 0%, #0c3826 46%, #114931 82%, #15543a 100%)',
          boxShadow:
            'inset 0 0 0 4px rgba(0,0,0,0.55), inset 0 0 0 6px rgba(255,255,255,0.05), inset 0 0 60px rgba(0,0,0,0.6), 0 12px 30px -12px rgba(0,0,0,0.75)',
        }}
      />
      {/* Anel de NEON na cor do app: aro aceso + glow que vaza pra fora E pra
          dentro do feltro. É a assinatura visual do trainer, mas no nosso accent. */}
      <div
        className="pointer-events-none absolute inset-1 rounded-[42%]"
        style={{
          boxShadow:
            '0 0 20px 2px rgb(var(--primary) / 0.5), 0 0 55px 10px rgb(var(--primary) / 0.22), inset 0 0 22px 2px rgb(var(--primary) / 0.4), inset 0 0 0 2.5px rgb(var(--primary) / 0.9)',
        }}
      />
      <div className="pointer-events-none absolute inset-7 rounded-[42%] border" style={{ borderColor: 'rgb(var(--primary) / 0.22)' }} />

      {/* Pot + board no centro */}
      <div className="absolute left-1/2 top-[40%] flex -translate-x-1/2 -translate-y-1/2 flex-col items-center">
        {ex.board && (() => {
          // Turn/River: 3 cartas em cima e o resto embaixo (com as cartas
          // maiores, 5 em linha estouraria a mesa). Flop segue em 1 linha.
          const bc = tokens(ex.board);
          const rows = bc.length <= 3 ? [bc] : [bc.slice(0, 3), bc.slice(3)];
          return (
            <div className="mb-2 flex flex-col items-center gap-1">
              {rows.map((row, r) => (
                <div key={r} className="flex gap-1">
                  {row.map((t, i) => <div key={i} className="scale-[0.72]"><Card token={t} /></div>)}
                </div>
              ))}
            </div>
          );
        })()}
        <div className="flex items-center gap-1.5 rounded-full bg-black/45 px-3 py-1 ring-1 ring-white/10">
          <Chip />
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
                // Pílula de DUAS PARTES como no trainer: [POS] em caixa + stack.
                <span className="flex items-center gap-1 rounded-lg bg-black/60 p-1 ring-1 ring-white/10">
                  <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-extrabold leading-none ${seat === 'folded' ? 'bg-white/5 text-white/30' : 'bg-white/[0.12] text-white'}`}>{pos}</span>
                  <span className={`pr-1 text-[10px] font-semibold leading-none tabular-nums ${seat === 'folded' ? 'text-white/25' : 'text-white/50'}`}>{ex.stackBb}BB</span>
                  {pos === 'BTN' && <Dealer />}
                </span>
              )}
              {isVillain && ex.villainAction && (
                <span className="flex animate-chip-pop items-center gap-1 rounded-md bg-primary px-1.5 py-0.5 text-[9px] font-bold text-white ring-1 ring-white/25">
                  <Chip />{ex.villainAction}
                </span>
              )}
              {isCaller && (
                <span className="flex items-center gap-1 rounded-md bg-white/15 px-1.5 py-0.5 text-[9px] font-bold text-white/80 ring-1 ring-white/10">
                  <Chip />Call
                </span>
              )}
            </div>
          </div>
        );
      })}

      {/* Hero: cartas grandes + pílula (POS verde) LOGO ABAIXO */}
      <div className="absolute bottom-[3%] left-1/2 flex -translate-x-1/2 flex-col items-center gap-1.5">
        <div key={ex.heroHand} className="flex gap-1.5">
          {cards.map((t, i) => (
            <div key={i} className="animate-deal-in drop-shadow-[0_6px_10px_rgba(0,0,0,0.6)]" style={{ animationDelay: `${i * 90}ms` }}>
              <Card token={t} />
            </div>
          ))}
        </div>
        <div className="flex flex-col items-center gap-0.5">
          <span className="flex items-center gap-1 rounded-lg bg-black/70 p-1 ring-1 ring-white/15">
            <span className="rounded-md bg-primary px-1.5 py-0.5 text-[10px] font-extrabold leading-none text-white">{ex.heroPosition}</span>
            {!simple && <span className="pr-1 text-[10px] font-semibold leading-none tabular-nums text-white/60">{ex.stackBb}BB</span>}
            {ex.heroPosition === 'BTN' && <Dealer />}
          </span>
          {simple && (
            <span className="rounded bg-black/45 px-2 py-0.5 text-[10px] font-semibold text-white/70">{POS_NAME[ex.heroPosition]}</span>
          )}
        </div>
      </div>
    </div>
  );
}
