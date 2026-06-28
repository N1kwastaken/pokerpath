/** Visuais das aulas: baralho/naipes, ordem, ranking, posições e demonstração de mãos. */
const RED = new Set(['♥', '♦']);

function MiniCard({ rank, suit }: { rank: string; suit: string }) {
  const color = RED.has(suit) ? '#D9363E' : '#16181D';
  return (
    <div className="flex h-12 w-9 shrink-0 flex-col items-center justify-center rounded-md border border-black/10 bg-white shadow-soft" style={{ color }}>
      <span className="text-sm font-black leading-none">{rank}</span>
      <span className="text-xs leading-none">{suit}</span>
    </div>
  );
}

/** Carta compacta usada na demonstração das mãos. `made` = compõe a jogada. */
function HandCard({ card, made }: { card: string; made: boolean }) {
  const suit = card.slice(-1);
  const rank = card.slice(0, -1);
  const color = RED.has(suit) ? '#D9363E' : '#16181D';
  return (
    <div
      className={`flex h-11 w-8 shrink-0 flex-col items-center justify-center rounded-md border bg-white ${made ? 'border-gold ring-2 ring-gold/50 shadow-pop' : 'border-black/10 opacity-35'}`}
      style={{ color }}
    >
      <span className="text-xs font-black leading-none">{rank}</span>
      <span className="text-[10px] leading-none">{suit}</span>
    </div>
  );
}

const SUITS = [
  { s: '♠', name: 'Espadas' }, { s: '♥', name: 'Copas' },
  { s: '♦', name: 'Ouros' }, { s: '♣', name: 'Paus' },
];
const ORDER = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
const RANKING = [
  'Carta alta', 'Par', 'Dois pares', 'Trinca', 'Sequência',
  'Flush', 'Full house', 'Quadra', 'Straight flush', 'Royal flush',
];
const SEATS = ['UTG', 'MP', 'CO', 'BTN', 'SB', 'BB'];

/** Demonstrações: mão do jogador (2) + mesa (5); `made` = cartas que formam a jogada. */
type HandDemo = { name: string; note: string; hole: string[]; board: string[]; made: string[] };
const HAND_DEMOS: HandDemo[] = [
  { name: 'Royal flush', note: 'A sequência máxima, do mesmo naipe', hole: ['A♠', 'K♠'], board: ['Q♠', 'J♠', '10♠', '4♦', '2♣'], made: ['A♠', 'K♠', 'Q♠', 'J♠', '10♠'] },
  { name: 'Straight flush', note: 'Cinco em sequência, do mesmo naipe', hole: ['7♥', '6♥'], board: ['8♥', '5♥', '4♥', 'K♠', '2♣'], made: ['8♥', '7♥', '6♥', '5♥', '4♥'] },
  { name: 'Quadra', note: 'Quatro cartas iguais', hole: ['9♠', '9♦'], board: ['9♥', '9♣', '5♠', '3♦', '2♣'], made: ['9♠', '9♦', '9♥', '9♣'] },
  { name: 'Full house', note: 'Uma trinca + um par', hole: ['K♠', 'K♦'], board: ['K♥', '7♣', '7♠', '3♦', '2♣'], made: ['K♠', 'K♦', 'K♥', '7♣', '7♠'] },
  { name: 'Flush', note: 'Cinco cartas do mesmo naipe', hole: ['A♠', 'J♠'], board: ['8♠', '5♠', '2♠', 'K♦', '7♥'], made: ['A♠', 'J♠', '8♠', '5♠', '2♠'] },
  { name: 'Sequência', note: 'Cinco cartas em ordem (naipes variados)', hole: ['9♠', '8♦'], board: ['7♣', '6♥', '5♠', 'K♦', '2♣'], made: ['9♠', '8♦', '7♣', '6♥', '5♠'] },
  { name: 'Trinca', note: 'Três cartas iguais', hole: ['Q♠', 'Q♦'], board: ['Q♥', '8♣', '5♠', '3♦', '2♣'], made: ['Q♠', 'Q♦', 'Q♥'] },
  { name: 'Dois pares', note: 'Dois pares diferentes', hole: ['A♠', 'K♦'], board: ['A♥', 'K♣', '7♠', '3♦', '2♣'], made: ['A♠', 'A♥', 'K♦', 'K♣'] },
  { name: 'Par', note: 'Duas cartas iguais', hole: ['K♠', 'K♦'], board: ['J♦', '9♣', '7♥', '4♠', '2♣'], made: ['K♠', 'K♦'] },
  { name: 'Carta alta', note: 'Nada conecta: vale a carta mais alta', hole: ['A♠', 'Q♥'], board: ['J♦', '8♣', '6♠', '4♥', '2♣'], made: ['A♠'] },
];

function HandRow({ cards, made }: { cards: string[]; made: Set<string> }) {
  return (
    <div className="flex gap-1">
      {cards.map((c, i) => <HandCard key={`${c}-${i}`} card={c} made={made.has(c)} />)}
    </div>
  );
}

export function LessonVisual({ visual }: { visual: 'suits' | 'order' | 'ranking' | 'positions' | 'handranks' }) {
  if (visual === 'suits') {
    return (
      <div className="card grid grid-cols-2 gap-3 p-4">
        {SUITS.map((it) => (
          <div key={it.s} className="flex items-center gap-3 rounded-2xl bg-card2 p-3">
            <span className="text-3xl" style={{ color: RED.has(it.s) ? '#D9363E' : '#16181D' }}>{it.s}</span>
            <span className="font-semibold text-title">{it.name}</span>
          </div>
        ))}
      </div>
    );
  }
  if (visual === 'order') {
    return (
      <div className="card p-4">
        <div className="flex items-center justify-between px-1 text-[11px] font-bold uppercase tracking-wide text-subtle">
          <span>Mais fraco</span><span>Mais forte →</span>
        </div>
        <div className="mt-2 flex gap-1.5 overflow-x-auto pb-1">
          {ORDER.map((r) => <MiniCard key={r} rank={r} suit="♠" />)}
        </div>
      </div>
    );
  }
  if (visual === 'ranking') {
    return (
      <div className="card divide-y divide-line">
        {RANKING.map((name, i) => (
          <div key={name} className="flex items-center gap-3 p-3">
            <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${i >= 7 ? 'bg-gradient-to-br from-gold to-primary text-white' : 'bg-card2 text-subtle'}`}>{i + 1}</span>
            <span className="font-medium text-title">{name}</span>
            {i === RANKING.length - 1 && <span className="ml-auto text-xs font-bold text-gold">imbatível</span>}
          </div>
        ))}
      </div>
    );
  }
  if (visual === 'handranks') {
    return (
      <div className="flex flex-col gap-3">
        {HAND_DEMOS.map((d, i) => {
          const made = new Set(d.made);
          return (
            <div key={d.name} className="card p-3">
              <div className="mb-2 flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-gold to-primary text-[11px] font-bold text-white">{i + 1}</span>
                <span className="font-bold text-title">{d.name}</span>
                <span className="ml-auto text-right text-[11px] leading-tight text-subtle">{d.note}</span>
              </div>
              <div className="flex items-end gap-2 overflow-x-auto pb-1">
                <div>
                  <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-primary">Sua mão</p>
                  <HandRow cards={d.hole} made={made} />
                </div>
                <span className="pb-3 text-subtle">+</span>
                <div>
                  <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-subtle">Mesa</p>
                  <HandRow cards={d.board} made={made} />
                </div>
              </div>
            </div>
          );
        })}
        <p className="px-1 text-xs text-subtle">As cartas douradas são as 5 que formam a jogada. Você sempre usa a melhor combinação entre as 2 suas e as 5 da mesa.</p>
      </div>
    );
  }
  // positions
  return (
    <div className="card p-4">
      <div className="flex flex-wrap items-center gap-2">
        {SEATS.map((p, i) => (
          <div key={p} className="flex items-center gap-2">
            <span className={`flex items-center gap-1 rounded-full border px-3 py-1.5 text-sm font-bold ${p === 'BTN' ? 'border-primary bg-primary text-white shadow-pop' : 'border-line bg-card2 text-title'}`}>
              <span className="text-[10px] text-subtle">{i + 1}º</span> {p}
            </span>
            {i < SEATS.length - 1 && <span className="text-subtle">→</span>}
          </div>
        ))}
      </div>
      <p className="mt-3 text-xs text-subtle">UTG age primeiro (mais difícil); o BTN age por último (melhor posição).</p>
    </div>
  );
}
