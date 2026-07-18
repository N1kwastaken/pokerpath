/**
 * Carta de poker — tamanho fixo, um pouco menor no mobile e maior no desktop (sm:).
 * Fundo branco; naipes vermelho/preto fixos (não usam tokens do tema).
 */
const RED_SUITS = new Set(['♥', '♦']);
const INK = '#16181D';
const RED = '#D9363E';

function rankLabel(rank: string): string {
  return rank === 'T' ? '10' : rank;
}

export function Card({ token }: { token: string }) {
  const rank = token.slice(0, token.length - 1);
  const suit = token.slice(-1);
  const color = RED_SUITS.has(suit) ? RED : INK;
  const label = rankLabel(rank);

  return (
    <div
      className="flex h-28 w-20 shrink-0 flex-col items-center justify-center gap-1 rounded-xl border border-black/5 bg-white shadow-[0_4px_10px_-2px_rgba(0,0,0,0.45)] sm:h-32 sm:w-24"
      style={{ color }}
      aria-label={`${label} de ${suit}`}
    >
      {/* Estilo minimalista: rank grande + naipe embaixo, centralizado. */}
      <span className="text-3xl font-black leading-none tracking-tight sm:text-4xl">{label}</span>
      <span className="text-xl leading-none sm:text-2xl">{suit}</span>
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
