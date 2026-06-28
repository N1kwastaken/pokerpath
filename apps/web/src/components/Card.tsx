/**
 * Carta de poker no estilo real (PRD 12.3): fundo branco, naipe colorido,
 * valor no canto superior esquerdo e inferior direito.
 *
 * Importante: a carta é sempre branca, então usamos cores FIXAS (preto/vermelho)
 * para o texto — não os tokens do tema (que no dark seriam claros e sumiriam).
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
      className="relative flex h-24 w-16 flex-col justify-between rounded-lg border border-black/10 bg-white p-1.5 shadow-md sm:h-28 sm:w-20"
      style={{ color }}
      aria-label={`${label} de ${suit}`}
    >
      <span className="text-base font-black leading-none">
        {label}
        <span className="block text-sm">{suit}</span>
      </span>
      <span className="self-center text-2xl">{suit}</span>
      <span className="rotate-180 self-end text-base font-black leading-none">
        {label}
        <span className="block text-sm">{suit}</span>
      </span>
    </div>
  );
}

/** Quebra uma mão "A♠J♣" em tokens ["A♠","J♣"] e renderiza as cartas. */
export function Hand({ hand }: { hand: string }) {
  const tokens: string[] = [];
  for (let i = 0; i < hand.length; i += 2) tokens.push(hand.slice(i, i + 2));
  return (
    <div className="flex justify-center gap-3">
      {tokens.map((t, i) => (
        <Card key={i} token={t} />
      ))}
    </div>
  );
}
