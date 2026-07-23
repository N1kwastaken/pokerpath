import { useState } from 'react';
import { IconBook } from './Icons.js';
import { Link } from 'react-router-dom';
import type { Position } from '@pokerpath/shared';
import { useRange } from '../hooks/useGame.js';
import { Mascot } from './Mascot.js';
import { LessonVisual } from './LessonVisual.js';
import { LessonHandTable } from './LessonHandTable.js';
import { PositionRangeCard } from './PositionRangeCard.js';
import { RangeGridView } from './RangeGridView.js';
import { OrderGame, MatchGame, TapAllGame, MemoryGame } from './LessonGames.js';
import { Glossarized } from './Glossarized.js';
import { lessonFor } from '../content/lessons.js';
import { sound } from '../lib/sound.js';

/**
 * Player de AULA (passos de lessons.ts) — compartilhado entre a fase logada
 * (StagePlayPage) e o modo convidado (GuestStagePage). Controla os passos e
 * as respostas internamente; quem usa só recebe o onFinish(perfect).
 */
const LABEL: Record<'FOLD' | 'CALL' | 'RAISE', string> = { FOLD: 'Fold', CALL: 'Call', RAISE: 'Raise' };
const LESSON_POSITION: Record<string, Position> = {
  'Ler o gráfico': 'UTG',
  'UTG explicado': 'UTG', 'Range de UTG': 'UTG',
  'MP explicado': 'MP', 'Range de MP': 'MP',
  'CO explicado': 'CO', 'Range de CO': 'CO',
  'BTN explicado': 'BTN', 'Range de BTN': 'BTN',
  'SB explicado': 'SB', 'Range de SB': 'SB',
};

export function LessonPlayer({ title, concept, onExit, onFinish, finishing = false, glossaryTo = '/glossary' }: {
  title: string;
  concept: string;
  onExit: () => void;
  /** Chamado no "Concluir aula". perfect = nenhum erro (e sem pular ao fim). */
  onFinish: (perfect: boolean) => void;
  finishing?: boolean;
  glossaryTo?: string;
}) {
  const steps = lessonFor(concept);
  const [lessonIdx, setLessonIdx] = useState(0);
  const [quizPick, setQuizPick] = useState<number | null>(null);
  const [handPick, setHandPick] = useState<'FOLD' | 'RAISE' | 'CALL' | null>(null);
  const [gameDone, setGameDone] = useState(false);
  const [mistakes, setMistakes] = useState(0);

  const lessonPosition = LESSON_POSITION[concept];
  const rangeQ = useRange(
    { gameType: 'CASH', tableSize: 'SIX_MAX', stack: 100, position: lessonPosition ?? 'BTN' },
    { enabled: !!lessonPosition },
  );

  const step = steps[lessonIdx];
  const last = lessonIdx >= steps.length - 1;
  const needsAnswer = step.kind === 'quiz' || step.kind === 'hand' || step.kind === 'order' || step.kind === 'match' || step.kind === 'tapall' || step.kind === 'memory';
  const answered =
    step.kind === 'hand' ? handPick !== null
    : step.kind === 'quiz' ? quizPick !== null
    : step.kind === 'order' || step.kind === 'match' || step.kind === 'tapall' || step.kind === 'memory' ? gameDone
    : true;

  function resetStepState() { setQuizPick(null); setHandPick(null); setGameDone(false); }

  return (
    <div className="flex min-h-dvh flex-col px-6 py-8">
      <div className="flex items-center justify-between">
        <button onClick={onExit} className="text-sm font-medium text-subtle">Sair</button>
        <Link to={glossaryTo} className="flex items-center gap-1.5 text-sm font-medium text-primary"><IconBook size={16} /> Glossário</Link>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <Mascot mood="happy" size={72} float={false} />
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-widest text-primary">Aula</p>
          <h1 className="truncate text-xl font-extrabold leading-tight text-title">{title}</h1>
        </div>
      </div>

      <div className="mt-4 flex justify-center gap-1.5">
        {steps.map((_, i) => <span key={i} className={`h-1.5 rounded-full transition-all ${i === lessonIdx ? 'w-6 bg-primary' : 'w-1.5 bg-line'}`} />)}
      </div>

      <div className="mt-5 flex flex-1 flex-col">
        {step.kind === 'visual' ? (
          <LessonVisual visual={step.visual} />
        ) : step.kind === 'hand' ? (
          <div className="flex flex-col gap-3">
            <LessonHandTable position={step.position} hand={step.hand} facing={step.facing} />
            {answered ? (
              <>
                <div className={`rounded-2xl border p-4 ${handPick === step.answer ? 'border-primary/40 bg-primary/10' : 'border-error/40 bg-error/10'}`}>
                  <p className={`font-bold ${handPick === step.answer ? 'text-primary' : 'text-error'}`}>
                    {handPick === step.answer ? 'Correto!' : `Era ${LABEL[step.answer]}`}
                  </p>
                  <p className="mt-0.5 text-sm text-text"><Glossarized text={step.explain} /></p>
                </div>
                {/* O range de abertura (RFI) só faz sentido sem aposta do vilão */}
                {!step.facing && step.answer !== 'CALL' && (
                  <PositionRangeCard position={step.position} hand={step.hand} action={step.answer} />
                )}
              </>
            ) : (
              <div className={`grid gap-3 ${step.facing ? 'grid-cols-3' : 'grid-cols-2'}`}>
                {((step.facing ? ['FOLD', 'CALL', 'RAISE'] : ['FOLD', 'RAISE']) as ('FOLD' | 'CALL' | 'RAISE')[]).map((act) => (
                  <button key={act}
                    onClick={() => { setHandPick(act); if (step.answer === act) sound.correct(); else { sound.wrong(); setMistakes((m) => m + 1); } }}
                    className={`btn3d rounded-2xl py-4 font-bold text-white ${act === 'FOLD' ? 'bg-error' : act === 'CALL' ? 'bg-call' : 'bg-primary'}`}>
                    {LABEL[act]}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : step.kind === 'order' ? (
          <OrderGame key={lessonIdx} prompt={step.prompt} items={step.items} explain={step.explain} level={step.level}
            onComplete={() => setGameDone(true)} onMistake={() => setMistakes((m) => m + 1)} />
        ) : step.kind === 'match' ? (
          <MatchGame key={lessonIdx} prompt={step.prompt} pairs={step.pairs} explain={step.explain} level={step.level}
            onComplete={() => setGameDone(true)} onMistake={() => setMistakes((m) => m + 1)} />
        ) : step.kind === 'tapall' ? (
          <TapAllGame key={lessonIdx} prompt={step.prompt} targets={step.targets} decoys={step.decoys} explain={step.explain} level={step.level}
            onComplete={() => setGameDone(true)} onMistake={() => setMistakes((m) => m + 1)} />
        ) : step.kind === 'memory' ? (
          <MemoryGame key={lessonIdx} prompt={step.prompt} pairs={step.pairs} explain={step.explain} level={step.level}
            onComplete={() => setGameDone(true)} onMistake={() => setMistakes((m) => m + 1)} />
        ) : step.kind === 'text' ? (
          <>
            <div className="whitespace-pre-line px-1 text-xl font-medium leading-relaxed text-title"><Glossarized text={step.text} /></div>
            {lessonPosition && rangeQ.data && rangeQ.data.cells.length > 0 && (
              <div className="card mt-4 p-4">
                <p className="mb-3 text-xs font-bold uppercase tracking-widest text-subtle">Range de abertura · {lessonPosition}</p>
                <RangeGridView grid={rangeQ.data} />
              </div>
            )}
          </>
        ) : (
          <div className="card p-5">
            {step.table && (
              <div className="mb-4">
                <LessonHandTable position={step.table.position} hand={step.table.hand} board={step.table.board} />
              </div>
            )}
            <p className="text-base font-semibold text-title">{step.q}</p>
            <div className="mt-4 space-y-2.5">
              {step.options.map((opt, i) => {
                const correct = i === step.answer;
                let cls = 'chip-off';
                if (answered) {
                  if (correct) cls = 'border-primary bg-primary/10 text-primary';
                  else if (quizPick === i) cls = 'border-error bg-error/10 text-error';
                  else cls = 'chip-off opacity-50';
                }
                return (
                  <button key={i} disabled={answered} onClick={() => { setQuizPick(i); if (correct) sound.correct(); else { sound.wrong(); setMistakes((m) => m + 1); } }} className={`chip w-full text-left ${cls}`}>{opt}</button>
                );
              })}
            </div>
            {answered && (
              <div className={`mt-4 rounded-xl p-3 text-sm ${quizPick === step.answer ? 'bg-primary/10' : 'bg-error/10'}`}>
                <span className={`font-bold ${quizPick === step.answer ? 'text-primary' : 'text-error'}`}>{quizPick === step.answer ? 'Correto! ' : 'Quase! '}</span>
                <span className="text-text"><Glossarized text={step.explain} /></span>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="space-y-3 pt-4">
        <button className="btn-primary w-full" disabled={(needsAnswer && !answered) || finishing}
          onClick={() => { if (last) { sound.click(); onFinish(mistakes === 0); } else { sound.click(); setLessonIdx((i) => i + 1); resetStepState(); } }}>
          {needsAnswer && !answered ? 'Responda para continuar' : last ? (finishing ? 'Concluindo...' : 'Concluir aula') : 'Próximo'}
        </button>
        {!last && <button className="btn-ghost w-full" onClick={() => { setLessonIdx(steps.length - 1); resetStepState(); setMistakes((m) => m + 1); }}>Pular ao fim</button>}
      </div>
    </div>
  );
}
