import { useState } from 'react';
import { Card } from './Card.js';
import { Confetti } from './Confetti.js';
import { IconSparkles } from './Icons.js';
import { sound } from '../lib/sound.js';

const TIPS = [
  { card: 'A♠', title: 'Jogue posição', text: 'Quanto mais tarde você age, mais informação tem. No BTN, pressione mais.' },
  { card: 'K♥', title: 'Fold também ganha', text: 'Poupar fichas em um spot ruim é uma decisão lucrativa, não uma derrota.' },
  { card: 'Q♦', title: 'Range antes da mão', text: 'Uma carta bonita não basta: pense no conjunto de mãos que chega até aqui.' },
  { card: 'J♣', title: 'Conte a história', text: 'A ação pré-flop muda o significado de cada aposta nas ruas seguintes.' },
  { card: '10♠', title: 'Tamanho comunica', text: 'Antes de apostar, saiba se quer valor, blefe ou negar equidade.' },
  { card: '9♥', title: 'Decisão, não resultado', text: 'Uma boa jogada pode perder a mão. Julgue o processo, não a carta seguinte.' },
  { card: '8♦', title: 'Pausa de um segundo', text: 'Veja posição, stack, ação e só então escolha. Velocidade vem depois da clareza.' },
  { card: '7♣', title: 'Revise o desconforto', text: 'A mão que você quase acertou ensina mais que a decisão automática.' },
] as const;

const STORAGE_KEY = 'pp.dailyCard';

function todayKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
}

function tipFor(date: string) {
  const hash = [...date].reduce((total, char) => total * 31 + char.charCodeAt(0), 7);
  return TIPS[Math.abs(hash) % TIPS.length];
}

/**
 * Um pequeno ritual diário com conteúdo fixo — novidade sem prêmio variável,
 * compra ou urgência artificial.
 */
export function DailyCard() {
  const date = todayKey();
  const [opened, setOpened] = useState(() => localStorage.getItem(STORAGE_KEY) === date);
  const [celebrate, setCelebrate] = useState(false);
  const tip = tipFor(date);

  function reveal() {
    localStorage.setItem(STORAGE_KEY, date);
    setOpened(true);
    setCelebrate(true);
    sound.correct();
  }

  if (!opened) {
    return (
      <button
        type="button"
        onClick={reveal}
        className="card group flex w-full items-center gap-4 overflow-hidden border-primary/30 p-4 text-left active:scale-[0.99]"
      >
        <span className="relative flex h-16 w-12 shrink-0 rotate-[-5deg] items-center justify-center overflow-hidden rounded-lg border-2 border-white/50 bg-primary shadow-pop transition-transform group-active:rotate-0">
          <span className="absolute inset-1 rounded border border-white/25" />
          <img src="/logo-mark-white.png" alt="" className="h-7 w-7 object-contain opacity-80" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-[0.18em] text-primary">
            <IconSparkles size={13} /> Carta do dia
          </span>
          <span className="mt-1 block font-black text-title">Vire para aquecer a leitura</span>
          <span className="mt-0.5 block text-xs text-subtle">Uma ideia curta, nova a cada dia.</span>
        </span>
        <span className="rounded-full bg-primary/15 px-3 py-1.5 text-xs font-black text-primary">Revelar</span>
      </button>
    );
  }

  return (
    <div className="card relative flex items-center gap-4 overflow-hidden border-primary/25 p-4">
      {celebrate && <Confetti count={22} />}
      <div className="shrink-0 rotate-[-3deg] scale-[0.58] -mx-4 -my-5">
        <Card token={tip.card} size="lg" />
      </div>
      <div className="min-w-0">
        <p className="flex items-center gap-1 text-[10px] font-black uppercase tracking-[0.18em] text-primary">
          <IconSparkles size={13} /> Carta do dia
        </p>
        <h2 className="mt-1 text-base font-black text-title">{tip.title}</h2>
        <p className="mt-0.5 text-xs leading-relaxed text-subtle">{tip.text}</p>
      </div>
    </div>
  );
}
