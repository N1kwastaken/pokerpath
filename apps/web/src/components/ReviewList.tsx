import { useState } from 'react';
import type { ReviewItem, Action } from '@pokerpath/shared';
import { useReview } from '../hooks/useGame.js';
import { LogoLoader } from './LogoLoader.js';
import { Hand } from './Card.js';
import { GtoBars } from './GtoBars.js';
import { ReviewPlay } from './ReviewPlay.js';

const LABEL: Record<Action, string> = { FOLD: 'Fold', CALL: 'Call', RAISE: 'Raise' };

/** Rótulo de contexto do spot: "Preflop · Abertura", "Turn · Aposta", etc. */
function contextLabel(item: ReviewItem): string {
  const nCards = item.board ? item.board.replace(/\s/g, '').length / 2 : 0;
  const street = nCards === 0 ? 'Preflop' : nCards === 3 ? 'Flop' : nCards === 4 ? 'Turn' : 'River';
  let sit: string;
  if (item.villainAction === 'Check') sit = 'Aposta'; // spot de agressor
  else if (item.villainAction === 'Aposta') sit = 'Enfrentando aposta';
  else if (item.villainAction === '3-Bet 9bb') sit = '4-Bet';
  else if (item.callerPosition) sit = 'Squeeze';
  else if (item.villainAction === 'Raise 2.5x') sit = 'Defesa';
  else sit = 'Abertura';
  return `${street} · ${sit}`;
}

/** Onde o herói está e contra quem — curto. */
function seatLabel(item: ReviewItem): string {
  return item.villainPosition ? `${item.heroPosition} vs ${item.villainPosition}` : item.heroPosition;
}

/** Lista de mãos que o usuário ERROU, com gabarito e GTO (estudo). */
export function ReviewList() {
  const { data, isLoading } = useReview();
  const [playing, setPlaying] = useState(false);

  if (isLoading) return <div className="card"><LogoLoader inline /></div>;
  if (!data || data.length === 0) {
    return (
      <div className="card p-8 text-center">
        <p className="text-3xl">🎯</p>
        <p className="mt-2 font-semibold text-title">Nada para revisar</p>
        <p className="mt-1 text-sm text-subtle">As mãos que você errar aparecem aqui para reforçar.</p>
      </div>
    );
  }
  return (
    <div className="space-y-4">
      {playing && <ReviewPlay onClose={() => setPlaying(false)} />}
      {/* Rejogar: acertar aqui limpa o erro da lista. */}
      <button onClick={() => setPlaying(true)} className="btn-primary flex w-full items-center justify-center gap-2 text-base">
        🔁 Rejogar meus erros <span className="rounded-full bg-white/25 px-2 py-0.5 text-xs font-black">{data.length}</span>
      </button>
      <p className="text-xs text-subtle">Ou estude abaixo — o porquê de cada erro e o range certo.</p>
      {data.map((it) => <ReviewCard key={it.id} item={it} />)}
    </div>
  );
}

function ReviewCard({ item }: { item: ReviewItem }) {
  // Spot de agressor (vilão deu check): Raise/Call viram Bet/Check.
  const aggressor = item.villainAction === 'Check';
  const label = (a: Action) => (aggressor ? (a === 'RAISE' ? 'Bet' : a === 'CALL' ? 'Check' : 'Fold') : LABEL[a]);
  return (
    <div className="card space-y-3 p-4">
      {/* Contexto ESCRITO em cima — mais claro que remontar a mesa inteira. */}
      <div className="flex items-center justify-between">
        <span className="rounded-full bg-card2 px-3 py-1 text-[11px] font-black uppercase tracking-wide text-subtle">{contextLabel(item)}</span>
        <span className="text-xs font-black text-title">{seatLabel(item)}</span>
      </div>

      {/* A mão, grande e no centro (+ board menor se for pós-flop). */}
      <Hand hand={item.heroHand} />
      {item.board && (
        <div className="flex justify-center">
          <div className="scale-[0.62] origin-top opacity-90"><Hand hand={item.board.replace(/\s/g, '')} /></div>
        </div>
      )}

      <div className="rounded-xl border border-error/30 bg-error/10 p-3">
        <p className="text-sm font-bold text-error">Você: {label(item.yourAction)} · Certo: {label(item.correctAction)}</p>
        <p className="mt-0.5 text-xs text-text">{item.explanation}</p>
      </div>
      <GtoBars freq={item.frequencies} chosen={item.yourAction} correct={item.correctAction} aggressor={aggressor} />
    </div>
  );
}
