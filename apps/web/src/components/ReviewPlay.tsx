import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Action, PublicExercise, ReviewAnswerResult } from '@pokerpath/shared';
import { gameApi } from '../api/game.js';
import { PokerTable } from './PokerTable.js';
import { GtoBars } from './GtoBars.js';
import { LogoLoader } from './LogoLoader.js';
import { Explanation } from './Explanation.js';
import { IconX, IconCheck } from './Icons.js';
import { sound } from '../lib/sound.js';

/**
 * Rejogar os erros. Cada acerto aqui é gravado no servidor e FAZ o erro sair da
 * revisão (a lista se limpa sozinha ao voltar). Não dá XP nem mexe na trilha —
 * é treino puro. Cores das ações iguais às do treino: fold vermelho, call azul,
 * raise roxo.
 */
const LABEL: Record<Action, string> = { FOLD: 'Fold', CALL: 'Call', RAISE: 'Raise' };
const ACT: { key: Action; label: string; color: string }[] = [
  { key: 'FOLD', label: 'Fold', color: 'bg-error' },
  { key: 'CALL', label: 'Call', color: 'bg-call' },
  { key: 'RAISE', label: 'Raise', color: 'bg-accent' },
];

export function ReviewPlay({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const { data: exercises, isLoading } = useQuery({ queryKey: ['reviewPlay'], queryFn: gameApi.reviewPlay, staleTime: 0 });
  const [idx, setIdx] = useState(0);
  const [result, setResult] = useState<ReviewAnswerResult | null>(null);
  const [chosen, setChosen] = useState<Action | null>(null);
  const [right, setRight] = useState(0);

  const list = exercises ?? [];
  const current: PublicExercise | undefined = list[idx];
  const aggressor = current?.villainAction === 'Check';

  // Grava a resposta em segundo plano (é o que faz o erro sair da revisão). O
  // feedback já apareceu local; a revisão não dá XP, então não há o que
  // reconciliar do servidor.
  const mut = useMutation({
    mutationFn: (a: Action) => gameApi.reviewAnswer({ exerciseId: current!.id, selectedAction: a }),
  });

  function choose(a: Action) {
    if (result) return;
    // Validação LOCAL, instantânea (o gabarito viaja no exercício).
    const correct = a === current!.correctAction;
    setChosen(a);
    correct ? sound.correct() : sound.wrong();
    if (correct) setRight((n) => n + 1);
    setResult({
      correct,
      correctAction: current!.correctAction,
      explanation: current!.explanation,
      frequencies: current!.frequencies,
    });
    mut.mutate(a);
  }
  function next() { setResult(null); setChosen(null); setIdx((i) => i + 1); }
  function finish() {
    qc.invalidateQueries({ queryKey: ['review'] });
    qc.invalidateQueries({ queryKey: ['stats'] });
    onClose();
  }

  if (isLoading) return <div className="fixed inset-0 z-50 bg-bg"><LogoLoader label="Carregando seus erros..." /></div>;

  // Fim (ou nada a rejogar).
  if (list.length === 0 || !current) {
    const perfect = list.length > 0 && right === list.length;
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-bg px-6 text-center">
        <p className="text-6xl">{list.length === 0 ? '🎯' : perfect ? '🏆' : '💪'}</p>
        <h2 className="text-2xl font-black text-title">
          {list.length === 0 ? 'Nada para rejogar' : `${right}/${list.length} corrigidos`}
        </h2>
        <p className="text-subtle">
          {list.length === 0 ? 'Você está em dia com seus erros!' : 'Os que você acertou saíram da revisão.'}
        </p>
        <button className="btn-primary w-full max-w-xs" onClick={finish}>Voltar à revisão</button>
      </div>
    );
  }

  const buttons = aggressor
    ? [{ key: 'CALL' as Action, label: 'Check', color: 'bg-call' }, { key: 'RAISE' as Action, label: 'Bet', color: 'bg-accent' }]
    : ACT;
  const actLabel = (a: Action) => (aggressor ? (a === 'RAISE' ? 'Bet' : a === 'CALL' ? 'Check' : 'Fold') : LABEL[a]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col overflow-hidden overscroll-none bg-bg">
      <div className="mx-auto flex h-full w-full max-w-md flex-col px-4 pb-4 pt-3">
        <div className="flex items-center gap-3">
          <button onClick={finish} aria-label="Sair"><IconX size={20} /></button>
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-card2">
            <div className="h-full rounded-full bg-primary transition-[width]" style={{ width: `${(idx / list.length) * 100}%` }} />
          </div>
          <span className="text-xs font-bold tabular-nums text-subtle">{idx + 1}/{list.length}</span>
        </div>

        {/* Mesa fixa (sem pulo). Área de baixo (flex-1 justify-end) ancora os
            controles no rodapé; a tela é travada e o card rola por dentro. */}
        <div className={`mt-[8dvh] shrink-0 ${result && !result.correct ? 'animate-shake' : ''}`}>
          <PokerTable ex={current} />
        </div>

        <div className="flex min-h-0 flex-1 flex-col justify-end">
        {result ? (
          <div className="animate-slide-up flex max-h-full flex-col rounded-2xl border border-line bg-card p-4">
            <div className="min-h-0 space-y-3 overflow-y-auto no-scrollbar">
            <div className="flex items-center gap-3">
              <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white ${result.correct ? 'bg-primary' : 'bg-error'}`}>
                {result.correct ? <IconCheck size={20} /> : <span className="text-lg font-black">✕</span>}
              </span>
              <div className="min-w-0 flex-1">
                <p className={`font-extrabold ${result.correct ? 'text-primary' : 'text-error'}`}>
                  {result.correct ? 'Corrigido!' : `Ainda não — era ${actLabel(result.correctAction)}`}
                </p>
              </div>
            </div>
            {result.explanation && <Explanation text={result.explanation} />}
            <GtoBars freq={result.frequencies} chosen={chosen ?? undefined} correct={result.correctAction} aggressor={aggressor} />
            </div>
            <button className="btn-primary mt-3 w-full shrink-0" onClick={next}>Continuar</button>
          </div>
        ) : (
          <div className={`grid gap-2.5 ${aggressor ? 'grid-cols-2' : 'grid-cols-3'}`}>
            {buttons.map((b) => (
              <button key={b.key} onClick={() => choose(b.key)}
                className={`btn3d rounded-2xl py-6 text-lg font-black text-white transition hover:brightness-110 ${b.color}`}>
                {b.label}
              </button>
            ))}
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
