import { useMemo, useState } from 'react';
import { sound } from '../lib/sound.js';

/** Mini-jogos das aulas: ordenar itens e combinar pares (estilo Duolingo). */

function shuffled<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

/** Ordenar: toque nos itens na ordem certa; conferir valida a sequência. */
export function OrderGame({ prompt, items, explain, onComplete, onMistake }: {
  prompt: string; items: string[]; explain: string;
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
      <p className="text-base font-semibold text-title">{prompt}</p>
      <div className={`mt-4 flex min-h-[52px] flex-wrap items-center gap-2 rounded-xl border-2 border-dashed p-2 ${state === 'wrong' ? 'animate-shake border-error/60' : state === 'done' ? 'border-primary/60' : 'border-line'}`}>
        {chosen.length === 0 && <span className="px-1 text-xs text-subtle">Toque nos itens abaixo, na ordem</span>}
        {chosen.map((x, i) => (
          <button key={x} onClick={() => unpick(x)}
            className={`chip px-3 py-1.5 text-sm font-bold ${state === 'done' ? 'border-primary bg-primary/10 text-primary' : 'chip-on'}`}>
            {i + 1}. {x}
          </button>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {pool.map((x) => (
          <button key={x} onClick={() => pick(x)} className="chip chip-off px-3 py-1.5 text-sm font-bold">{x}</button>
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
export function MatchGame({ prompt, pairs, explain, onComplete, onMistake }: {
  prompt: string; pairs: [string, string][]; explain: string;
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
      <p className="text-base font-semibold text-title">{prompt}</p>
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
              className={`chip w-full px-3 py-2 text-sm ${rightMatched(y) ? 'border-primary bg-primary/10 text-primary opacity-60' : wrong === y ? 'animate-shake border-error bg-error/10 text-error' : 'chip-off'}`}>
              {y}
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
