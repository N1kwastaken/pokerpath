import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import type { Action, GuestExercise } from '@pokerpath/shared';
import { guestApi } from '../api/guest.js';
import { markGuestDone } from '../lib/guestProgress.js';
import { PokerTable } from '../components/PokerTable.js';
import { ProgressBar } from '../components/ProgressBar.js';
import { LogoLoader } from '../components/LogoLoader.js';
import { Confetti } from '../components/Confetti.js';
import { GtoBars } from '../components/GtoBars.js';
import { Mascot } from '../components/Mascot.js';
import { Explanation } from '../components/Explanation.js';
import { LessonPlayer } from '../components/LessonPlayer.js';
import { TableTutorial, tableTutorialPending } from '../components/TableTutorial.js';
import { IconX, IconCheck } from '../components/Icons.js';
import { sound } from '../lib/sound.js';

/**
 * Fase do MODO CONVIDADO (Mundo 0 sem conta). Aulas usam o LessonPlayer;
 * práticas validam localmente (o gabarito vem no payload de convidado).
 * Sem energia/XP de servidor — progresso em localStorage.
 */
const ACT: { key: Action; label: string; color: string }[] = [
  { key: 'FOLD', label: 'Fold', color: 'bg-error' },
  { key: 'CALL', label: 'Call', color: 'bg-call' },
  { key: 'RAISE', label: 'Raise', color: 'bg-accent' },
];
const LABEL: Record<Action, string> = { FOLD: 'Fold', CALL: 'Call', RAISE: 'Raise' };

export function GuestStagePage() {
  const { stageId } = useParams();
  const navigate = useNavigate();
  const { data, isLoading } = useQuery({
    queryKey: ['guest-stage', stageId],
    queryFn: () => guestApi.stage(stageId!),
    enabled: !!stageId,
  });

  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<boolean[]>([]);
  const [choice, setChoice] = useState<Action | null>(null);
  const [summary, setSummary] = useState(false);
  const [tutorialOpen, setTutorialOpen] = useState(() => tableTutorialPending());

  const exercises = data?.exercises ?? [];
  const ordered = useMemo(() => {
    const a = [...exercises];
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  }, [exercises]);

  if (isLoading) return <LogoLoader label="Preparando exercícios..." />;
  if (!data) return null;

  function exit() { navigate('/g', { replace: true }); }

  // ─── AULA ───────────────────────────────────────────────────
  if (data.stage.isLesson) {
    return (
      <LessonPlayer
        title={data.stage.title}
        concept={data.stage.concept}
        glossaryTo="/g/glossary"
        onExit={exit}
        onFinish={() => { if (stageId) markGuestDone(stageId); sound.correct(); exit(); }}
      />
    );
  }

  // ─── PRÁTICA (validação local) ──────────────────────────────
  const sessionLen = data.stage.minExercises > 0 ? Math.min(data.stage.minExercises, exercises.length) : exercises.length;
  const current: GuestExercise | undefined = ordered[idx];
  if (!current) return null;

  const correctCount = answers.filter(Boolean).length;
  const passed = answers.length > 0 && correctCount / answers.length >= data.stage.passRate;

  if (summary) {
    return (
      <div className="relative flex min-h-dvh flex-col items-center justify-center px-6 py-10 text-center">
        {passed && <Confetti count={50} />}
        <Mascot mood={passed ? 'win' : 'sad'} size={176} />
        <h1 className="mt-5 text-3xl font-bold text-title">{passed ? 'Fase concluída!' : 'Quase lá!'}</h1>
        {!passed && <p className="mt-1 text-subtle">Você precisa de {Math.round(data.stage.passRate * 100)}% de acerto.</p>}
        <div className="mt-6 grid w-full grid-cols-2 gap-3">
          <div className="card p-4"><p className="text-2xl font-black text-title">{answers.length ? Math.round((correctCount / answers.length) * 100) : 0}%</p><p className="text-xs text-subtle">Acerto</p></div>
          <div className="card p-4"><p className="text-2xl font-black text-title">{correctCount}/{answers.length}</p><p className="text-xs text-subtle">Acertos</p></div>
        </div>
        {passed && (
          <p className="mt-5 rounded-2xl border border-primary/30 bg-primary/10 p-3 text-sm text-text">
            💡 Com uma conta grátis, isso valeria <b>+XP</b>, streak e conquistas — e seu progresso daqui vai junto.
          </p>
        )}
        <div className="mt-6 w-full space-y-3">
          {passed ? (
            <button className="btn-primary w-full" onClick={exit}>Continuar</button>
          ) : (
            <>
              <button className="btn-primary w-full" onClick={() => { setIdx(0); setAnswers([]); setChoice(null); setSummary(false); }}>Tentar de novo</button>
              <button className="btn-soft w-full" onClick={exit}>Voltar à trilha</button>
            </>
          )}
        </div>
      </div>
    );
  }

  const answered = choice !== null;
  const wasCorrect = answered && choice === current.correctAction;
  const aggressor = current.villainAction === 'Check';
  const buttons = aggressor
    ? [{ key: 'CALL' as Action, label: 'Check', color: 'bg-call' }, { key: 'RAISE' as Action, label: 'Bet', color: 'bg-accent' }]
    : ACT;
  const actionLabel = (a: Action) => (aggressor ? (a === 'RAISE' ? 'Bet' : a === 'CALL' ? 'Check' : 'Fold') : LABEL[a]);

  function choose(a: Action) {
    if (answered) return;
    setChoice(a);
    const ok = a === current!.correctAction;
    ok ? sound.correct() : sound.wrong();
    setAnswers((arr) => [...arr, ok]);
  }
  function next() {
    sound.click();
    if (answers.length >= sessionLen) {
      if (stageId && correctCount / answers.length >= data!.stage.passRate) markGuestDone(stageId);
      return setSummary(true);
    }
    setIdx((i) => i + 1);
    setChoice(null);
  }

  return (
    <div className="fixed inset-0 z-30 overflow-hidden overscroll-none bg-bg">
      {answered && wasCorrect && <Confetti key={idx} count={20} />}
      <div className="mx-auto flex h-full w-full max-w-md flex-col px-4 pb-4 pt-3">
        <div className="flex items-center gap-3">
          <button onClick={exit} className="text-subtle" aria-label="Sair"><IconX size={20} /></button>
          <div className="flex-1"><ProgressBar value={answers.length} max={sessionLen} /></div>
          <span className="text-xs font-bold tabular-nums text-subtle">{answers.length}/{sessionLen}</span>
          <span className="rounded-full bg-card2 px-2 py-0.5 text-xs font-bold text-subtle">Visitante</span>
        </div>

        {/* Mesa em posição FIXA (sem pulo). A área de baixo (flex-1 justify-end)
            ancora botões/feedback no rodapé SEM overshoot; a tela é travada
            (container overflow-hidden + overscroll-none) e o card de feedback
            rola por dentro se passar da altura, com o Continuar sempre visível. */}
        <div className={`mt-[8dvh] shrink-0 ${answered && !wasCorrect ? 'animate-shake' : ''}`}>
          <PokerTable ex={current} simple={data.worldOrder === 0} />
        </div>

        <div className="flex min-h-0 flex-1 flex-col justify-end">
        {answered ? (
          <div className="animate-slide-up flex max-h-full flex-col rounded-2xl border border-line bg-card p-4">
            <div className="min-h-0 space-y-3 overflow-y-auto no-scrollbar">
              <div className="flex items-center gap-3">
                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white ${wasCorrect ? 'bg-primary' : 'bg-error'}`}>
                  {wasCorrect ? <IconCheck size={20} /> : <span className="text-lg font-black">✕</span>}
                </span>
                <div className="min-w-0 flex-1">
                  <p className={`font-extrabold ${wasCorrect ? 'text-primary' : 'text-error'}`}>
                    {wasCorrect ? 'Correto' : `Incorreto — era ${actionLabel(current.correctAction)}`}
                  </p>
                </div>
              </div>
              {current.explanation && <Explanation text={current.explanation} />}
              <GtoBars freq={current.frequencies} chosen={choice ?? undefined} correct={current.correctAction} aggressor={aggressor} />
            </div>
            <button className="btn-primary mt-3 w-full shrink-0" onClick={next}>
              {answers.length >= sessionLen ? 'Ver resultado' : 'Próxima mão'}
            </button>
          </div>
        ) : (
          <div className={`grid gap-3 ${buttons.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
            {buttons.map((b) => (
              <button key={b.key} onClick={() => choose(b.key)} className={`btn3d rounded-2xl ${b.color} py-6 text-lg font-black text-white`}>
                {b.label}
              </button>
            ))}
          </div>
        )}
        </div>
      </div>
      {tutorialOpen && <TableTutorial onDone={() => setTutorialOpen(false)} />}
    </div>
  );
}
