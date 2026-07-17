import type { RangeGrid, RangeCell, CellAction, Frequencies } from '@pokerpath/shared';

/** Grid 13x13 de um range, reutilizável (Charts e aulas). */
export const CELL_BG: Record<CellAction, string> = {
  RAISE: '#1B8A4C',
  CALL: '#4878A8', // azul suavizado (o token 'call' é forte demais em área grande)
  FOLD: 'rgb(var(--card2))', // neutro: o fold é o "resto" do range, não compete com raise/call
  MIXED: '#1B8A4C', // legado: com `freq`, célula mista é gradiente — nunca uma cor só
};

/**
 * Ordem fixa das faixas, para o chart inteiro ler igual célula a célula.
 * Sem 'MIXED': ele é um rótulo de célula, não uma ação com frequência própria.
 */
const STRIPE_ORDER = ['RAISE', 'CALL', 'FOLD'] as const satisfies readonly CellAction[];
const ACTION_LABEL: Record<CellAction, string> = { RAISE: 'Raise', CALL: 'Call', FOLD: 'Fold', MIXED: 'Mista' };

/**
 * As frequências da célula. `freq` é a fonte de verdade; `mix` é o formato
 * antigo (só sabe 2 ações) e sobrevive em linha de `Range` gravada antes dele —
 * o seed nunca apaga linha, então elas atravessam deploys.
 */
function freqOf(cell: RangeCell): Frequencies {
  if (cell.freq) return cell.freq;
  const zero: Frequencies = { FOLD: 0, CALL: 0, RAISE: 0 };
  if (cell.mix && cell.action !== 'MIXED' && cell.mix.alt !== 'MIXED') {
    return { ...zero, [cell.action]: cell.mix.pct, [cell.mix.alt]: 100 - cell.mix.pct };
  }
  return cell.action === 'MIXED' ? { ...zero, RAISE: 100 } : { ...zero, [cell.action]: 100 };
}

/**
 * Fundo da célula: faixas de corte duro na proporção de cada ação. Mão pura
 * vira cor sólida; mista mostra a proporção real — inclusive com 3 ações, o que
 * o formato `mix` não conseguia representar.
 */
export function cellBackground(cell: RangeCell): string {
  const freq = freqOf(cell);
  const faixas = STRIPE_ORDER.filter((a) => (freq[a] ?? 0) > 0);
  if (faixas.length <= 1) return CELL_BG[faixas[0] ?? cell.action];

  const stops: string[] = [];
  let acc = 0;
  for (const a of faixas) {
    const cor = CELL_BG[a];
    stops.push(`${cor} ${acc}%`, `${cor} ${(acc += freq[a] ?? 0)}%`);
  }
  return `linear-gradient(135deg, ${stops.join(', ')})`;
}

export function cellTitle(cell: RangeCell): string {
  const freq = freqOf(cell);
  const partes = STRIPE_ORDER.filter((a) => (freq[a] ?? 0) > 0).map((a) => `${ACTION_LABEL[a]} ${freq[a]}%`);
  return `${cell.hand} · ${partes.join(' / ')}`;
}

/**
 * Texto escuro só quando a célula é majoritariamente fold (fundo neutro claro).
 * Numa mista de fronteira o fundo tem cor forte e o branco continua legível.
 */
function textClass(cell: RangeCell): string {
  return (freqOf(cell).FOLD ?? 0) > 50 ? 'text-subtle' : 'text-white';
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
                className={`flex aspect-square items-center justify-center rounded-[3px] text-[7px] font-bold leading-none sm:text-[9px] ${textClass(cell)} ${on ? 'z-10 scale-110 outline outline-2 outline-gold ring-2 ring-gold/40' : ''} ${changed ? 'outline outline-2 outline-gold' : ''}`}
                title={`${cellTitle(cell)}${changed ? ' · muda aqui' : ''}`}
              >
                {cell.hand}
              </div>
            );
          }),
        )}
      </div>
      {legend && <RangeLegend />}
    </div>
  );
}

/** Legenda do grid. Exportada porque o "Como ler o chart" mostra a mesma. */
export function RangeLegend({ className = 'mt-3' }: { className?: string }) {
  return (
    <div className={`flex flex-wrap gap-4 px-1 ${className}`}>
      <Legend bg={CELL_BG.RAISE} label="Raise" />
      <Legend bg={CELL_BG.CALL} label="Call" />
      <Legend bg={CELL_BG.FOLD} border label="Fold" />
      <Legend
        bg={`linear-gradient(135deg, ${CELL_BG.RAISE} 0%, ${CELL_BG.RAISE} 65%, ${CELL_BG.FOLD} 65%, ${CELL_BG.FOLD} 100%)`}
        border
        label="Mista (proporção)"
      />
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
