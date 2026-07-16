import type { RangeGrid, RangeCell, CellAction } from '@pokerpath/shared';

/** Grid 13x13 de um range, reutilizável (Charts e aulas). */
export const CELL_BG: Record<CellAction, string> = {
  RAISE: '#1B8A4C',
  CALL: '#4878A8', // azul suavizado (o token 'call' é forte demais em área grande)
  FOLD: '#B04A50', // vermelho suavizado — mesma linguagem dos botões (fold = vermelho)
  MIXED: '#1B8A4C',
};

/** Fundo da célula: cor sólida, ou gradiente de corte duro na proporção da mistura. */
export function cellBackground(cell: RangeCell): string {
  if (!cell.mix) return CELL_BG[cell.action];
  const a = CELL_BG[cell.action];
  const b = CELL_BG[cell.mix.alt];
  return `linear-gradient(135deg, ${a} 0%, ${a} ${cell.mix.pct}%, ${b} ${cell.mix.pct}%, ${b} 100%)`;
}

export function cellTitle(cell: RangeCell): string {
  return cell.mix
    ? `${cell.hand} · ${cell.action} ${cell.mix.pct}% / ${cell.mix.alt} ${100 - cell.mix.pct}%`
    : `${cell.hand} · ${cell.action}`;
}

export function RangeGridView({ grid, legend = true, highlight, diffWith }: {
  grid: RangeGrid; legend?: boolean; highlight?: string;
  /** Outro range para comparar: células com ação diferente ganham contorno dourado. */
  diffWith?: RangeGrid;
}) {
  return (
    <div>
      <div className="grid gap-[2px]" style={{ gridTemplateColumns: 'repeat(13, minmax(0, 1fr))' }}>
        {grid.cells.flatMap((row, r) =>
          row.map((cell, c) => {
            const on = highlight === cell.hand;
            const changed = !!diffWith && diffWith.cells[r]?.[c]?.action !== cell.action;
            return (
              <div
                key={`${r}-${c}`}
                style={{ background: cellBackground(cell) }}
                className={`flex aspect-square items-center justify-center rounded-[3px] text-[7px] font-bold leading-none text-white sm:text-[9px] ${cell.action === 'FOLD' && !cell.mix ? 'opacity-90' : ''} ${on ? 'z-10 scale-110 outline outline-2 outline-gold ring-2 ring-gold/40' : ''} ${changed ? 'outline outline-2 outline-gold' : ''}`}
                title={`${cellTitle(cell)}${changed ? ' · muda aqui' : ''}`}
              >
                {cell.hand}
              </div>
            );
          }),
        )}
      </div>
      {legend && (
        <div className="mt-3 flex flex-wrap gap-4 px-1">
          <Legend bg={CELL_BG.RAISE} label="Raise" />
          <Legend bg={CELL_BG.CALL} label="Call" />
          <Legend bg={CELL_BG.FOLD} border label="Fold" />
          <Legend bg={`linear-gradient(135deg, ${CELL_BG.RAISE} 0%, ${CELL_BG.RAISE} 65%, ${CELL_BG.FOLD} 65%, ${CELL_BG.FOLD} 100%)`} border label="Mista (proporção)" />
        </div>
      )}
    </div>
  );
}

function Legend({ bg, label, border }: { bg: string; label: string; border?: boolean }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className={`h-3 w-3 rounded ${border ? 'border border-line' : ''}`} style={{ background: bg }} />
      <span className="text-xs font-medium text-text">{label}</span>
    </div>
  );
}
