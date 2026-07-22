import { useMemo, useRef, useState } from 'react';
import { sound } from '../lib/sound.js';

/**
 * Mini-jogos das aulas (estilo Duolingo): ordenar, combinar pares, caça-alvos
 * e jogo da memória. Todos recebem `level` (1–3) só para o SELO — a
 * dificuldade de verdade está no conteúdo que a aula passa para eles.
 */

function shuffled<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

/** Selo de dificuldade — mesmo vocabulário visual das missões. */
export type GameLevel = 1 | 2 | 3;
function LevelBadge({ level }: { level?: GameLevel }) {
  if (!level) return null;
  const s = {
    1: { label: 'Fácil', cls: 'bg-card2 text-subtle' },
    2: { label: 'Média', cls: 'bg-primary/15 text-primary' },
    3: { label: 'Difícil', cls: 'bg-gold/15 text-gold' },
  }[level];
  return (
    <span className={`shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${s.cls}`}>
      {s.label}
    </span>
  );
}

function GameTitle({ prompt, level }: { prompt: string; level?: GameLevel }) {
  return (
    <div className="flex items-start justify-between gap-2">
      <p className="text-base font-semibold text-title">{prompt}</p>
      <LevelBadge level={level} />
    </div>
  );
}

// ── Itens ilustrados: cartas de baralho de verdade nos jogos ──
const CARDS_RE = /^([AKQJT2-9][♠♥♦♣])( [AKQJT2-9][♠♥♦♣])*$/;
const SUIT_RE = /^[♠♥♦♣]$/;

/** "Desenho" do naipe: tile branco com o símbolo grande (vermelho ou preto). */
function SuitTile({ suit, big = false }: { suit: string; big?: boolean }) {
  const red = suit === '♥' || suit === '♦';
  return (
    <span
      className={`inline-flex items-center justify-center rounded-lg bg-white shadow-[0_1px_3px_rgba(0,0,0,0.4)] ring-1 ring-black/15 ${big ? 'h-12 w-12 text-3xl' : 'h-9 w-9 text-2xl'}`}
      style={{ color: red ? '#D6323C' : '#111' }}
    >
      {suit}
    </span>
  );
}

function MiniCard({ token, big = false }: { token: string; big?: boolean }) {
  const rank = token.slice(0, -1);
  const suit = token.slice(-1);
  const red = suit === '♥' || suit === '♦';
  return (
    <span
      className={`inline-flex flex-col items-center justify-center rounded-[4px] bg-white font-black leading-none shadow-[0_1px_3px_rgba(0,0,0,0.4)] ring-1 ring-black/15 ${big ? 'h-12 w-9 text-sm' : 'h-9 w-7 text-[11px]'}`}
      style={{ color: red ? '#D6323C' : '#111' }}
    >
      {rank}
      <span className={big ? 'text-base' : 'text-xs'}>{suit}</span>
    </span>
  );
}

/**
 * Renderiza um item do jogo:
 *  - "A♠"            → uma carta grande
 *  - "8♠ 8♥ 8♦"      → fileira de cartas
 *  - "Trinca|8♠ 8♥ 8♦" → rótulo + fileira de cartas embaixo
 *  - texto comum      → texto
 */
function ItemView({ item, numbered }: { item: string; numbered?: number }) {
  const [label, cards] = item.includes('|') ? item.split('|') : [null, item];
  if (SUIT_RE.test(cards.trim())) {
    return (
      <span className="flex flex-col items-center gap-1">
        {label && <span className="text-xs font-bold">{label}</span>}
        <SuitTile suit={cards.trim()} big={!label} />
      </span>
    );
  }
  const isCards = CARDS_RE.test(cards.trim());
  return (
    <span className="flex flex-col items-center gap-1">
      {label && <span className="text-xs font-bold">{numbered != null ? `${numbered}. ` : ''}{label}</span>}
      {isCards ? (
        <span className="flex items-center gap-0.5">
          {!label && numbered != null && <span className="mr-1 text-xs font-black">{numbered}.</span>}
          {cards.trim().split(' ').map((t, i) => <MiniCard key={i} token={t} big={!label && cards.trim().split(' ').length === 1} />)}
        </span>
      ) : (
        !label && <span>{numbered != null ? `${numbered}. ` : ''}{cards}</span>
      )}
    </span>
  );
}


/** Ordenar: toque nos itens na ordem certa; conferir valida a sequência. */
export function OrderGame({ prompt, items, explain, level, onComplete, onMistake }: {
  prompt: string; items: string[]; explain: string; level?: GameLevel;
  onComplete: () => void; onMistake: () => void;
}) {
  const pool0 = useMemo(() => shuffled(items), [items]);
  const [chosen, setChosen] = useState<string[]>([]);
  const [state, setState] = useState<'playing' | 'wrong' | 'done'>('playing');
  const pool = pool0.filter((x) => !chosen.includes(x));

  function pick(x: string) {
    if (state === 'done') return;
    sound.click();
    setState('playing');
    setChosen((c) => [...c, x]);
  }
  function unpick(x: string) {
    if (state === 'done') return;
    setChosen((c) => c.filter((y) => y !== x));
    setState('playing');
  }
  function check() {
    if (chosen.every((x, i) => x === items[i])) {
      sound.correct(); setState('done'); onComplete();
    } else {
      sound.wrong(); setState('wrong'); onMistake(); setChosen([]);
    }
  }

  return (
    <div className="card p-5">
      <GameTitle prompt={prompt} level={level} />
      <div className={`mt-4 flex min-h-[52px] flex-wrap items-center gap-2 rounded-xl border-2 border-dashed p-2 ${state === 'wrong' ? 'animate-shake border-error/60' : state === 'done' ? 'border-primary/60' : 'border-line'}`}>
        {chosen.length === 0 && <span className="px-1 text-xs text-subtle">Toque nos itens abaixo, na ordem</span>}
        {chosen.map((x, i) => (
          <button key={x} onClick={() => unpick(x)}
            className={`chip px-2.5 py-1.5 text-sm font-bold ${state === 'done' ? 'border-primary bg-primary/10 text-primary' : 'chip-on'}`}>
            <ItemView item={x} numbered={i + 1} />
          </button>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {pool.map((x) => (
          <button key={x} onClick={() => pick(x)} className="chip chip-off px-2.5 py-1.5 text-sm font-bold">
            <ItemView item={x} />
          </button>
        ))}
      </div>
      {state === 'wrong' && <p className="mt-2 text-sm font-semibold text-error">Não foi dessa vez — tente outra ordem!</p>}
      {state === 'done' ? (
        <div className="mt-3 rounded-xl bg-primary/10 p-3 text-sm"><span className="font-bold text-primary">Perfeito! </span><span className="text-text">{explain}</span></div>
      ) : (
        <button className="btn-primary mt-3 w-full" disabled={chosen.length !== items.length} onClick={check}>Conferir</button>
      )}
    </div>
  );
}

/** Combinar: toque num item da esquerda e no par dele à direita. */
export function MatchGame({ prompt, pairs, explain, level, onComplete, onMistake }: {
  prompt: string; pairs: [string, string][]; explain: string; level?: GameLevel;
  onComplete: () => void; onMistake: () => void;
}) {
  const left = useMemo(() => shuffled(pairs.map((p) => p[0])), [pairs]);
  const right = useMemo(() => shuffled(pairs.map((p) => p[1])), [pairs]);
  const [sel, setSel] = useState<string | null>(null);
  const [matched, setMatched] = useState<Set<string>>(new Set());
  const [wrong, setWrong] = useState<string | null>(null);
  const done = matched.size === pairs.length;

  function tapLeft(x: string) {
    if (matched.has(x)) return;
    sound.click();
    setSel(sel === x ? null : x);
  }
  function tapRight(y: string) {
    if (!sel || done) return;
    const pair = pairs.find((p) => p[0] === sel);
    if (matched.has(pair?.[0] ?? '') || pairs.some((p) => p[1] === y && matched.has(p[0]) )) return;
    if (pair && pair[1] === y) {
      sound.correct();
      const next = new Set(matched); next.add(sel);
      setMatched(next); setSel(null);
      if (next.size === pairs.length) onComplete();
    } else {
      sound.wrong(); onMistake();
      setWrong(y); setSel(null);
      setTimeout(() => setWrong(null), 500);
    }
  }
  const rightMatched = (y: string) => pairs.some((p) => p[1] === y && matched.has(p[0]));

  return (
    <div className="card p-5">
      <GameTitle prompt={prompt} level={level} />
      <div className="mt-4 grid grid-cols-2 gap-2.5">
        <div className="space-y-2">
          {left.map((x) => (
            <button key={x} onClick={() => tapLeft(x)} disabled={matched.has(x)}
              className={`chip w-full px-3 py-2 text-sm font-bold ${matched.has(x) ? 'border-primary bg-primary/10 text-primary opacity-60' : sel === x ? 'chip-on' : 'chip-off'}`}>
              {x}
            </button>
          ))}
        </div>
        <div className="space-y-2">
          {right.map((y) => (
            <button key={y} onClick={() => tapRight(y)} disabled={rightMatched(y)}
              className={`chip flex w-full items-center justify-center px-2 py-2 text-sm ${rightMatched(y) ? 'border-primary bg-primary/10 text-primary opacity-60' : wrong === y ? 'animate-shake border-error bg-error/10 text-error' : 'chip-off'}`}>
              <ItemView item={y} />
            </button>
          ))}
        </div>
      </div>
      {done && (
        <div className="mt-3 rounded-xl bg-primary/10 p-3 text-sm"><span className="font-bold text-primary">Mandou bem! </span><span className="text-text">{explain}</span></div>
      )}
    </div>
  );
}

/**
 * Caça-alvos: toque em TODOS os itens que obedecem à regra do enunciado.
 * Errar não trava o jogo — marca o erro e segue (como no Duolingo).
 */
export function TapAllGame({ prompt, targets, decoys, explain, level, onComplete, onMistake }: {
  prompt: string; targets: string[]; decoys: string[]; explain: string; level?: GameLevel;
  onComplete: () => void; onMistake: () => void;
}) {
  // ids estáveis: itens podem se repetir ("♥" duas vezes), então o alvo é o
  // ÍNDICE, nunca o texto.
  const items = useMemo(
    () => shuffled([
      ...targets.map((v, i) => ({ id: i, v, hit: true })),
      ...decoys.map((v, i) => ({ id: targets.length + i, v, hit: false })),
    ]),
    [targets, decoys],
  );
  const [found, setFound] = useState<Set<number>>(new Set());
  const [wrongId, setWrongId] = useState<number | null>(null);
  const done = found.size === targets.length;

  function tap(it: { id: number; hit: boolean }) {
    if (done || found.has(it.id)) return;
    if (it.hit) {
      sound.correct();
      const next = new Set(found); next.add(it.id);
      setFound(next);
      if (next.size === targets.length) onComplete();
    } else {
      sound.wrong(); onMistake();
      setWrongId(it.id);
      setTimeout(() => setWrongId(null), 500);
    }
  }

  return (
    <div className="card p-5">
      <GameTitle prompt={prompt} level={level} />
      <p className="mt-1 text-xs text-subtle">{found.size}/{targets.length} encontrados</p>
      <div className="mt-4 flex flex-wrap justify-center gap-2.5">
        {items.map((it) => (
          <button key={it.id} onClick={() => tap(it)}
            className={`chip px-2.5 py-2 text-sm font-bold transition ${
              found.has(it.id) ? 'border-primary bg-primary/10 text-primary'
              : wrongId === it.id ? 'animate-shake border-error bg-error/10 text-error'
              : 'chip-off'}`}>
            <ItemView item={it.v} />
          </button>
        ))}
      </div>
      {done && (
        <div className="mt-3 rounded-xl bg-primary/10 p-3 text-sm"><span className="font-bold text-primary">Achou todos! </span><span className="text-text">{explain}</span></div>
      )}
    </div>
  );
}

/**
 * Jogo da memória: cartas viradas para baixo; ache os pares (nome ↔ desenho).
 * Um par errado conta erro e desvira sozinho.
 */
export function MemoryGame({ prompt, pairs, explain, level, onComplete, onMistake }: {
  prompt: string; pairs: [string, string][]; explain: string; level?: GameLevel;
  onComplete: () => void; onMistake: () => void;
}) {
  const cards = useMemo(
    () => shuffled(pairs.flatMap(([a, b], pi) => [
      { id: pi * 2, pi, face: a },
      { id: pi * 2 + 1, pi, face: b },
    ])),
    [pairs],
  );
  const [open, setOpen] = useState<number[]>([]);
  const [foundPairs, setFoundPairs] = useState<Set<number>>(new Set());
  // trava durante a espera do par errado — sem ela dá para abrir uma 3ª carta
  const locked = useRef(false);
  const done = foundPairs.size === pairs.length;

  function flip(c: { id: number; pi: number }) {
    if (locked.current || done || foundPairs.has(c.pi) || open.includes(c.id)) return;
    sound.click();
    if (open.length === 0) return setOpen([c.id]);
    const first = cards.find((x) => x.id === open[0])!;
    setOpen([open[0], c.id]);
    if (first.pi === c.pi) {
      sound.correct();
      const next = new Set(foundPairs); next.add(c.pi);
      setFoundPairs(next); setOpen([]);
      if (next.size === pairs.length) onComplete();
    } else {
      locked.current = true;
      onMistake();
      setTimeout(() => { sound.wrong(); setOpen([]); locked.current = false; }, 700);
    }
  }

  const cols = cards.length <= 8 ? 'grid-cols-4' : 'grid-cols-4';
  return (
    <div className="card p-5">
      <GameTitle prompt={prompt} level={level} />
      <div className={`mt-4 grid ${cols} gap-2`}>
        {cards.map((c) => {
          const up = open.includes(c.id) || foundPairs.has(c.pi);
          return (
            <button key={c.id} onClick={() => flip(c)}
              className={`flex min-h-[64px] items-center justify-center rounded-xl border p-1.5 text-center text-[11px] font-bold leading-tight transition ${
                foundPairs.has(c.pi) ? 'border-primary bg-primary/10 text-primary'
                : up ? 'border-line bg-card2 text-title'
                : 'border-line bg-primary/90 text-white/70'}`}>
              {up ? <ItemView item={c.face} /> : <span className="text-xl">♠</span>}
            </button>
          );
        })}
      </div>
      {done && (
        <div className="mt-3 rounded-xl bg-primary/10 p-3 text-sm"><span className="font-bold text-primary">Memória de elefante! </span><span className="text-text">{explain}</span></div>
      )}
    </div>
  );
}
