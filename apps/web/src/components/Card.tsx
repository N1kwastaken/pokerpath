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
      className="relative flex h-20 w-14 shrink-0 flex-col justify-between overflow-hidden rounded-md border border-black/10 bg-white p-1 shadow-md sm:h-24 sm:w-16"
      style={{ color }}
      aria-label={`${label} de ${suit}`}
    >
      <span className="text-sm font-black leading-none sm:text-base">
        {label}<span className="block text-[0.6rem] leading-none sm:text-xs">{suit}</span>
      </span>
      <span className="self-center text-xl leading-none sm:text-2xl">{suit}</span>
      <span className="rotate-180 self-end text-sm font-black leading-none sm:text-base">
        {label}<span className="block text-[0.6rem] leading-none sm:text-xs">{suit}</span>
      </span>
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
