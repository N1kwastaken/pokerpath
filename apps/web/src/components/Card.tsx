/**
 * Carta de poker — fundo branco, naipes vermelho/preto fixos (não usam tokens
 * do tema). Três tamanhos: `lg` (padrão, telas de destaque/aula), `md` (herói
 * na mesa) e `sm` (board na mesa). Na mesa as cartas são menores para caber no
 * oval em pé sem estourar os assentos.
 */
const RED_SUITS = new Set(['♥', '♦']);
const INK = '#16181D';
const RED = '#D9363E';

type CardSize = 'sm' | 'md' | 'lg';
const SIZES: Record<CardSize, { box: string; rank: string; suit: string }> = {
  lg: { box: 'h-28 w-20 gap-1 rounded-xl sm:h-32 sm:w-24', rank: 'text-3xl sm:text-4xl', suit: 'text-xl sm:text-2xl' },
  md: { box: 'h-[4.5rem] w-12 gap-0.5 rounded-lg sm:h-20 sm:w-14', rank: 'text-2xl sm:text-3xl', suit: 'text-base sm:text-lg' },
  sm: { box: 'h-14 w-10 gap-0.5 rounded-md sm:h-16 sm:w-11', rank: 'text-lg sm:text-xl', suit: 'text-xs sm:text-sm' },
};

function rankLabel(rank: string): string {
  return rank === 'T' ? '10' : rank;
}

export function Card({ token, size = 'lg' }: { token: string; size?: CardSize }) {
  const rank = token.slice(0, token.length - 1);
  const suit = token.slice(-1);
  const color = RED_SUITS.has(suit) ? RED : INK;
  const label = rankLabel(rank);
  const s = SIZES[size];

  return (
    <div
      className={`flex shrink-0 flex-col items-center justify-center border border-black/5 bg-white shadow-[0_4px_10px_-2px_rgba(0,0,0,0.45)] ${s.box}`}
      style={{ color }}
      aria-label={`${label} de ${suit}`}
    >
      {/* Estilo minimalista: rank grande + naipe embaixo, centralizado. */}
      <span className={`font-black leading-none tracking-tight ${s.rank}`}>{label}</span>
      <span className={`leading-none ${s.suit}`}>{suit}</span>
    </div>
  );
}

/** Quebra "A♠J♣" em cartas e renderiza. */
export function Hand({ hand }: { hand: string }) {
  const tokens: string[] = [];
  for (let i = 0; i < hand.length; i += 2) tokens.push(hand.slice(i, i + 2));
  return (
    <div className="flex justify-center gap-3">
      {tokens.map((t, i) => <Card key={i} token={t} />)}
    </div>
  );
}
