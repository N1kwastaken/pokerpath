import type { RangeGrid, CellAction } from '@pokerpath/shared';

/** Grid 13x13 de um range, reutilizável (Charts e aulas). */
const CELL_COLOR: Record<CellAction, string> = {
  RAISE: 'bg-success text-white',
  CALL: 'bg-call text-white',
  FOLD: 'bg-card2 text-subtle',
  MIXED: 'bg-gradient-to-br from-success to-call text-white',
};

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
                className={`flex aspect-square items-center justify-center rounded-[3px] text-[7px] font-bold leading-none sm:text-[9px] ${CELL_COLOR[cell.action]} ${on ? 'z-10 scale-110 outline outline-2 outline-gold ring-2 ring-gold/40' : ''} ${changed ? 'outline outline-2 outline-gold' : ''}`}
                title={`${cell.hand} · ${cell.action}${changed ? ' · muda aqui' : ''}`}
              >
                {cell.hand}
              </div>
            );
          }),
        )}
      </div>
      {legend && (
        <div className="mt-3 flex flex-wrap gap-4 px-1">
          <Legend color="bg-success" label="Raise" />
          <Legend color="bg-call" label="Call" />
          <Legend color="bg-card2 border border-line" label="Fold" />
        </div>
      )}
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className={`h-3 w-3 rounded ${color}`} />
      <span className="text-xs font-medium text-text">{label}</span>
    </div>
  );
}
