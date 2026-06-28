import type { PublicExercise, ReviewItem, Action } from '@pokerpath/shared';
import { useReview } from '../hooks/useGame.js';
import { LogoLoader } from './LogoLoader.js';
import { PokerTable } from './PokerTable.js';
import { GtoBars } from './GtoBars.js';

const LABEL: Record<Action, string> = { FOLD: 'Fold', CALL: 'Call', RAISE: 'Raise' };

/** Lista de mãos que o usuário ERROU, com gabarito e GTO (estudo). */
export function ReviewList() {
  const { data, isLoading } = useReview();
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
      <p className="text-xs text-subtle">Mãos que você errou — estude o porquê e fixe o range.</p>
      {data.map((it) => <ReviewCard key={it.id} item={it} />)}
    </div>
  );
}

function ReviewCard({ item }: { item: ReviewItem }) {
  const ex = {
    id: item.id, order: 0, heroPosition: item.heroPosition, villainPosition: item.villainPosition,
    stackBb: item.stackBb, potSize: item.potSize, heroHand: item.heroHand, board: item.board,
    villainAction: item.villainAction, difficulty: 'EASY', category: item.category, options: [],
  } as unknown as PublicExercise;
  return (
    <div className="card space-y-3 p-3">
      <div className="mx-auto max-w-[260px]"><PokerTable ex={ex} /></div>
      <div className="rounded-xl border border-error/30 bg-error/10 p-3">
        <p className="text-sm font-bold text-error">Você: {LABEL[item.yourAction]} · Certo: {LABEL[item.correctAction]}</p>
        <p className="mt-0.5 text-xs text-text">{item.explanation}</p>
      </div>
      <GtoBars freq={item.frequencies} chosen={item.yourAction} correct={item.correctAction} />
    </div>
  );
}
