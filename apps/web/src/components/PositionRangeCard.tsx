import type { Position } from '@pokerpath/shared';
import { useRange } from '../hooks/useGame.js';
import { RangeGridView } from './RangeGridView.js';
import { handToKey } from '../lib/handnotation.js';

/**
 * Mostra o chart GTO da posição com a célula da mão destacada — deixa visível
 * POR QUE a mesma mão é raise numa posição e fold em outra.
 */
export function PositionRangeCard({ position, hand, action }: { position: Position; hand: string; action: 'FOLD' | 'RAISE' }) {
  const key = handToKey(hand);
  const { data } = useRange({ gameType: 'CASH', tableSize: 'SIX_MAX', stack: 100, position });
  if (!data || !data.cells.length) return null;
  return (
    <div className="card p-4">
      <p className="mb-2 text-xs font-bold uppercase tracking-widest text-subtle">Chart GTO · {position}</p>
      <RangeGridView grid={data} highlight={key} />
      <p className="mt-3 text-sm text-text">
        No range de <b>{position}</b>, <b>{key}</b>{' '}
        {action === 'RAISE'
          ? 'aparece colorida (no range de abertura) → por isso, Raise.'
          : 'fica cinza (fora do range) → por isso, Fold.'}
      </p>
    </div>
  );
}
