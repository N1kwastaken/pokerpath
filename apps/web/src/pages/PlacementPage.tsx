import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { gameApi } from '../api/game.js';
import { Mascot } from '../components/Mascot.js';
import { sound } from '../lib/sound.js';

/**
 * Prova de nivelamento: 12 perguntas em 3 blocos (básico, preflop,
 * intermediário). A nota por bloco decide onde o jogador começa —
 * inclusive no Mundo 0 se o básico não estiver firme.
 */
type Q = { block: 0 | 1 | 2; q: string; options: string[]; answer: number };

const QUESTIONS: Q[] = [
  // Bloco 0 — básico
  { block: 0, q: 'Quantas cartas você recebe na mão no Texas Hold\'em?', options: ['2', '5'], answer: 0 },
  { block: 0, q: 'Flush ou Sequência: quem ganha?', options: ['Flush', 'Sequência'], answer: 0 },
  { block: 0, q: 'Ninguém apostou e você quer passar a vez de graça. Qual ação?', options: ['Check', 'Call'], answer: 0 },
  { block: 0, q: 'Você tem 8♠ 8♦ e a mesa mostra K♥ 8♣ 3♠. Sua jogada é…', options: ['Um par', 'Trinca'], answer: 1 },
  // Bloco 1 — preflop (RFI)
  { block: 1, q: 'Você é o primeiro a agir (UTG) com A♠J♥ (AJo). E aí?', options: ['Raise', 'Fold'], answer: 1 },
  { block: 1, q: 'No botão (BTN), primeiro a agir, com 7♠6♠. E aí?', options: ['Raise', 'Fold'], answer: 0 },
  { block: 1, q: 'Qual posição abre o range MAIS apertado?', options: ['UTG', 'BTN'], answer: 0 },
  { block: 1, q: 'De UTG com 9♣9♦ (99), no range simplificado…', options: ['Raise', 'Fold'], answer: 1 },
  // Bloco 2 — intermediário
  { block: 2, q: 'Você está no BB com 7♦2♣ e o BTN abre 2,5x. E aí?', options: ['Call — está barato', 'Fold'], answer: 1 },
  { block: 2, q: 'O CO abre e você tem A♠A♥ no BTN. Melhor jogada?', options: ['3-bet', 'Call'], answer: 0 },
  { block: 2, q: 'Você tem J♥T♥ no flop 9♠8♦2♣ e o vilão aposta. E aí?', options: ['Call — projeto forte', 'Fold'], answer: 0 },
  { block: 2, q: 'Por que A5s é um bom blefe de relanço?', options: ['O Ás bloqueia AA/AK do vilão', 'Faz par de 5 fácil'], answer: 0 },
];

/** Nota por bloco → nível recomendado (mundo inicial). */
function recommend(scores: number[]): number {
  if (scores[0] < 3) return 0;
  if (scores[1] < 3) return 1;
  if (scores[2] < 3) return 2;
  return 3;
}

const LEVEL_NAME = ['Primeiros Passos', 'Iniciante', 'Intermediário', 'Avançado'];

export function PlacementPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [idx, setIdx] = useState(0);
  const [pick, setPick] = useState<number | null>(null);
  const [scores, setScores] = useState([0, 0, 0]);
  const [done, setDone] = useState(false);

  const placeMut = useMutation({
    mutationFn: (level: number) => gameApi.placement(level),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trail'] });
      queryClient.invalidateQueries({ queryKey: ['worlds'] });
      navigate('/worlds', { replace: true });
    },
  });

  const q = QUESTIONS[idx];
  const answered = pick !== null;
  const last = idx === QUESTIONS.length - 1;
  const level = recommend(scores);

  function choose(i: number) {
    if (answered) return;
    setPick(i);
    if (i === q.answer) {
      sound.correct();
      setScores((s) => s.map((v, b) => (b === q.block ? v + 1 : v)));
    } else {
      sound.wrong();
    }
  }
  function next() {
    sound.click();
    if (last) return setDone(true);
    setIdx(idx + 1);
    setPick(null);
  }

  if (done) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center px-6 py-10 text-center">
        <Mascot mood={level >= 2 ? 'cheer' : 'happy'} size={120} />
        <h1 className="mt-4 text-2xl font-bold text-title">Prova concluída!</h1>
        <p className="mt-2 text-subtle">
          Básico {scores[0]}/4 · Preflop {scores[1]}/4 · Intermediário {scores[2]}/4
        </p>
        <div className="mt-5 w-full rounded-2xl border border-primary/40 bg-primary/10 p-5">
          <p className="text-sm text-text">Recomendamos você começar no</p>
          <p className="mt-1 text-xl font-extrabold text-primary">Nível {level} — {LEVEL_NAME[level]}</p>
          {level > 0 && <p className="mt-1 text-xs text-subtle">Os mundos anteriores serão marcados como completos.</p>}
        </div>
        <div className="mt-6 w-full space-y-3">
          <button className="btn-primary w-full" disabled={placeMut.isPending}
            onClick={() => (level > 0 ? placeMut.mutate(level) : navigate('/worlds', { replace: true }))}>
            {placeMut.isPending ? 'Preparando...' : `Começar no ${LEVEL_NAME[level]}`}
          </button>
          <button className="btn-soft w-full" onClick={() => navigate('/worlds', { replace: true })}>
            Prefiro começar do zero
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col px-6 py-8">
      <div className="flex items-center justify-between">
        <button onClick={() => navigate('/worlds')} className="text-sm font-medium text-subtle">✕ Sair</button>
        <span className="text-xs font-bold tabular-nums text-subtle">{idx + 1}/{QUESTIONS.length}</span>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <Mascot mood="think" size={44} float={false} />
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-primary">Prova de nivelamento</p>
          <h1 className="text-xl font-extrabold leading-tight text-title">Onde você deve começar?</h1>
        </div>
      </div>

      <div className="mt-6 card flex-1 p-5">
        <p className="text-base font-semibold text-title">{q.q}</p>
        <div className="mt-4 space-y-2.5">
          {q.options.map((opt, i) => {
            let cls = 'chip-off';
            if (answered) {
              if (i === q.answer) cls = 'border-primary bg-primary/10 text-primary';
              else if (pick === i) cls = 'border-error bg-error/10 text-error';
              else cls = 'chip-off opacity-50';
            }
            return (
              <button key={i} disabled={answered} onClick={() => choose(i)} className={`chip w-full text-left ${cls}`}>
                {opt}
              </button>
            );
          })}
        </div>
      </div>

      <button className="btn-primary mt-4 w-full" disabled={!answered} onClick={next}>
        {!answered ? 'Responda para continuar' : last ? 'Ver resultado' : 'Próxima'}
      </button>
    </div>
  );
}
