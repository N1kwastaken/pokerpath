import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { Action, AnswerResult, PublicExercise, Position } from '@pokerpath/shared';
import { useStage, useRange } from '../hooks/useGame.js';
import { gameApi } from '../api/game.js';
import { ApiError } from '../lib/api.js';
import { useAuth } from '../auth/AuthContext.js';
import { PokerTable } from '../components/PokerTable.js';
import { ProgressBar } from '../components/ProgressBar.js';
import { LogoLoader } from '../components/LogoLoader.js';
import { Confetti } from '../components/Confetti.js';
import { GtoBars } from '../components/GtoBars.js';
import { IconX } from '../components/Icons.js';
import { Mascot } from '../components/Mascot.js';
import { RangeGridView } from '../components/RangeGridView.js';
import { LessonHandTable } from '../components/LessonHandTable.js';
import { PositionRangeCard } from '../components/PositionRangeCard.js';
import { LessonVisual } from '../components/LessonVisual.js';
import { lessonFor } from '../content/lessons.js';
import { sound } from '../lib/sound.js';

type ButtonAction = Action | 'ALLIN';
const BTNS: { key: ButtonAction; label: string; color: string }[] = [
  { key: 'FOLD', label: 'Fold', color: 'bg-subtle' },
  { key: 'CALL', label: 'Call', color: 'bg-call' },
  { key: 'RAISE', label: 'Raise', color: 'bg-success' },
  { key: 'ALLIN', label: 'All In', color: 'bg-danger' },
];
const LABEL: Record<Action, string> = { FOLD: 'Fold', CALL: 'Call', RAISE: 'Raise' };
const LESSON_POSITION: Record<string, Position> = {
  'UTG explicado': 'UTG', 'Range de UTG': 'UTG',
  'MP explicado': 'MP', 'Range de MP': 'MP',
  'CO explicado': 'CO', 'Range de CO': 'CO',
  'BTN explicado': 'BTN', 'Range de BTN': 'BTN',
  'SB explicado': 'SB', 'Range de SB': 'SB',
};
type Phase = 'playing' | 'feedback' | 'summary';

export function StagePlayPage() {
  const { stageId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { setUser, user } = useAuth();
  const { data, isLoading, error } = useStage(stageId);
  const lessonPosition = data?.stage ? LESSON_POSITION[data.stage.concept] : undefined;
  const rangeQ = useRange(
    { gameType: 'CASH', tableSize: 'SIX_MAX', stack: 100, position: lessonPosition ?? 'BTN' },
    { enabled: !!lessonPosition },
  );

  const [lessonIdx, setLessonIdx] = useState(0);
  const [quizPick, setQuizPick] = useState<number | null>(null);
  const [handPick, setHandPick] = useState<'FOLD' | 'RAISE' | null>(null);
  const [phase, setPhase] = useState<Phase>('playing');
  const [idx, setIdx] = useState(0);
  const [result, setResult] = useState<AnswerResult | null>(null);
  const [answers, setAnswers] = useState<boolean[]>([]);
  const [sessionXp, setSessionXp] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [worldDone, setWorldDone] = useState(false);

  function scrollTop() { window.scrollTo({ top: 0 }); }
  function backToWorld() {
    queryClient.invalidateQueries({ queryKey: ['worlds'] });
    queryClient.invalidateQueries({ queryKey: ['world', data?.worldId] });
    queryClient.invalidateQueries({ queryKey: ['stats'] });
    navigate(`/worlds/${data?.worldId}`, { replace: true });
  }
  function goHome() {
    queryClient.invalidateQueries({ queryKey: ['worlds'] });
    queryClient.invalidateQueries({ queryKey: ['stats'] });
    navigate('/', { replace: true });
  }

  const lessonMut = useMutation({
    mutationFn: () => gameApi.completeLesson(stageId!),
    onSuccess: (res) => {
      sound.correct();
      if (user) setUser({ ...user, totalXp: res.totalXp, level: res.level, levelName: res.levelName, currentStreak: res.currentStreak });
      backToWorld();
    },
  });

  const exercises = data?.exercises ?? [];
  const current: PublicExercise | undefined = exercises[idx];

  const mutation = useMutation({
    mutationFn: (action: Action) => gameApi.answer({ exerciseId: current!.id, selectedAction: action }),
    onSuccess: (res) => {
      setResult(res);
      setAnswers((a) => [...a, res.correct]);
      setSessionXp((x) => x + res.xpGained);
      if (res.stageCompleted) setCompleted(true);
      if (res.worldCompleted) setWorldDone(true);
      res.correct ? sound.correct() : sound.wrong();
      if (res.leveledUp) setTimeout(() => sound.levelUp(), 250);
      if (user) setUser({ ...user, totalXp: res.totalXp, level: res.level, levelName: res.levelName, currentStreak: res.currentStreak });
      setPhase('feedback');
      setTimeout(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }), 60);
    },
    onError: (err) => { if (err instanceof ApiError && err.code === 'DAILY_LIMIT_REACHED') navigate('/premium'); },
  });

  useEffect(() => {
    if (error instanceof ApiError) navigate(error.code === 'PREMIUM_REQUIRED' ? '/premium' : '/worlds', { replace: true });
  }, [error, navigate]);

  if (error) return null;
  if (isLoading) return <LogoLoader label="Preparando exercícios..." />;
  if (!data) return null;

  // ─── AULA ────────────────────────────────────────────────────
  if (data.stage.isLesson) {
    const steps = lessonFor(data.stage.concept);
    const step = steps[lessonIdx];
    const last = lessonIdx >= steps.length - 1;
    const needsAnswer = step.kind === 'quiz' || step.kind === 'hand';
    const answered = step.kind === 'hand' ? handPick !== null : step.kind === 'quiz' ? quizPick !== null : true;
    return (
      <div className="flex min-h-dvh flex-col px-6 py-8">
        <div className="flex items-center justify-between">
          <button onClick={backToWorld} className="text-sm font-medium text-subtle">Sair</button>
          <Link to="/glossary" className="text-sm font-medium text-primary">📖 Glossário</Link>
        </div>

        <div className="mt-2 flex items-center gap-4 overflow-hidden rounded-3xl bg-gradient-to-br from-primary to-accent p-6 text-white shadow-pop">
          <Mascot mood="happy" size={88} />
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-white/70">Aula</p>
            <h1 className="mt-1 text-2xl font-bold leading-tight text-white">{data.stage.title}</h1>
          </div>
        </div>

        <div className="mt-6 flex flex-1 flex-col">
          {step.kind === 'visual' ? (
            <LessonVisual visual={step.visual} />
          ) : step.kind === 'hand' ? (
            <div className="flex flex-col gap-3">
              <LessonHandTable position={step.position} hand={step.hand} />
              {answered ? (
                <>
                  <div className={`rounded-2xl border p-4 ${handPick === step.answer ? 'border-success/30 bg-success/10' : 'border-error/30 bg-error/10'}`}>
                    <p className={`font-bold ${handPick === step.answer ? 'text-success' : 'text-error'}`}>
                      {handPick === step.answer ? 'Correto!' : `Era ${step.answer === 'RAISE' ? 'Raise' : 'Fold'}`}
                    </p>
                    <p className="mt-0.5 text-sm text-text">{step.explain}</p>
                  </div>
                  <PositionRangeCard position={step.position} hand={step.hand} action={step.answer} />
                </>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => { setHandPick('FOLD'); step.answer === 'FOLD' ? sound.correct() : sound.wrong(); }} className="btn3d rounded-2xl bg-subtle py-4 font-bold text-white">Fold</button>
                  <button onClick={() => { setHandPick('RAISE'); step.answer === 'RAISE' ? sound.correct() : sound.wrong(); }} className="btn3d rounded-2xl bg-success py-4 font-bold text-white">Raise</button>
                </div>
              )}
            </div>
          ) : step.kind === 'text' ? (
            <>
              <div className="card whitespace-pre-line p-6 text-lg leading-relaxed text-text">{step.text}</div>
              {lessonPosition && rangeQ.data && rangeQ.data.cells.length > 0 && (
                <div className="card mt-4 p-4">
                  <p className="mb-3 text-xs font-bold uppercase tracking-widest text-subtle">
                    Range de abertura · {lessonPosition}
                  </p>
                  <RangeGridView grid={rangeQ.data} />
                </div>
              )}
            </>
          ) : (
            <div className="card p-5">
              <p className="text-base font-semibold text-title">{step.q}</p>
              <div className="mt-4 space-y-2.5">
                {step.options.map((opt, i) => {
                  const correct = i === step.answer;
                  let cls = 'chip-off';
                  if (answered) {
                    if (correct) cls = 'border-success bg-success/10 text-success';
                    else if (quizPick === i) cls = 'border-error bg-error/10 text-error';
                    else cls = 'chip-off opacity-50';
                  }
                  return (
                    <button
                      key={i}
                      disabled={answered}
                      onClick={() => { setQuizPick(i); correct ? sound.correct() : sound.wrong(); }}
                      className={`chip w-full text-left ${cls}`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
              {answered && (
                <div className={`mt-4 rounded-2xl p-3 text-sm ${quizPick === step.answer ? 'bg-success/10' : 'bg-error/10'}`}>
                  <span className={`font-bold ${quizPick === step.answer ? 'text-success' : 'text-error'}`}>
                    {quizPick === step.answer ? 'Correto! ' : 'Quase! '}
                  </span>
                  <span className="text-text">{step.explain}</span>
                </div>
              )}
            </div>
          )}
          <div className="mt-5 flex justify-center gap-1.5">
            {steps.map((_, i) => <span key={i} className={`h-1.5 rounded-full transition-all ${i === lessonIdx ? 'w-6 bg-primary' : 'w-1.5 bg-line'}`} />)}
          </div>
        </div>

        <div className="space-y-3 pt-4">
          <button
            className="btn-primary w-full"
            disabled={(needsAnswer && !answered) || lessonMut.isPending}
            onClick={() => {
              if (last) { sound.click(); lessonMut.mutate(); }
              else { sound.click(); setLessonIdx((i) => i + 1); setQuizPick(null); setHandPick(null); }
            }}
          >
            {needsAnswer && !answered ? 'Responda para continuar' : last ? (lessonMut.isPending ? 'Concluindo...' : 'Concluir aula') : 'Próximo'}
          </button>
          {!last && <button className="btn-ghost w-full" onClick={() => { setLessonIdx(steps.length - 1); setQuizPick(null); setHandPick(null); }}>Pular ao fim</button>}
        </div>
      </div>
    );
  }

  if (!current) return null;

  function advance() {
    const isLast = idx + 1 >= exercises.length;
    if (completed || isLast) { scrollTop(); return setPhase('summary'); }
    setIdx((i) => i + 1); setResult(null); setPhase('playing'); scrollTop();
  }
  function retry() {
    setIdx(0); setAnswers([]); setSessionXp(0); setResult(null);
    setCompleted(false); setWorldDone(false); setPhase('playing'); scrollTop();
  }
  function choose(action: Action) {
    if (mutation.isPending || phase !== 'playing') return;
    sound.click(); mutation.mutate(action);
  }

  // ─── RESUMO ──────────────────────────────────────────────────
  if (phase === 'summary') {
    const correct = answers.filter(Boolean).length;
    const accuracy = answers.length ? Math.round((correct / answers.length) * 100) : 0;
    return (
      <div className="relative flex min-h-dvh flex-col items-center justify-center px-6 py-10 text-center">
        {completed && <Confetti count={60} />}
        <Mascot mood={completed ? 'excited' : 'sad'} size={140} />
        <h1 className="mt-5 text-3xl font-bold text-title">{completed ? 'Fase concluída!' : 'Quase lá!'}</h1>
        {worldDone && <p className="mt-1 font-bold text-gradient">Mundo completo! 🏆</p>}
        {!completed && <p className="mt-1 text-subtle">Você precisa de {Math.round(data.stage.passRate * 100)}% de acerto.</p>}
        <div className="mt-8 grid w-full grid-cols-3 gap-3">
          <Stat label="Acerto" value={`${accuracy}%`} />
          <Stat label="Acertos" value={`${correct}/${answers.length}`} />
          <Stat label="XP" value={`+${sessionXp}`} />
        </div>
        <div className="mt-8 w-full space-y-3">
          {worldDone ? (
            <button className="btn-primary w-full" onClick={goHome}>🏠 Voltar ao início</button>
          ) : completed ? (
            <>
              <button className="btn-primary w-full" onClick={backToWorld}>Continuar</button>
              <button className="btn-soft w-full" onClick={goHome}>Voltar ao início</button>
            </>
          ) : (
            <>
              <button className="btn-primary w-full" onClick={retry}>Tentar de novo</button>
              <button className="btn-soft w-full" onClick={backToWorld}>Voltar ao mundo</button>
            </>
          )}
        </div>
      </div>
    );
  }

  // ─── TRAINER ─────────────────────────────────────────────────
  const fb = phase === 'feedback' && result;
  return (
    <div className="relative flex min-h-dvh flex-col px-5 py-5">
      {fb && result?.correct && <Confetti key={idx} count={26} />}
      <div className="mb-3 flex items-center gap-3">
        <button onClick={backToWorld} className="text-subtle" aria-label="Sair"><IconX size={20} /></button>
        <div className="flex-1"><ProgressBar value={answers.length} max={exercises.length} /></div>
        <span className="text-xs font-bold text-subtle">{answers.length}/{exercises.length}</span>
      </div>
      <p className="text-center text-xs font-bold uppercase tracking-widest text-subtle">{data.stage.title}</p>
      <div className={`mt-1 ${fb && result && !result.correct ? 'animate-shake' : ''}`}><PokerTable ex={current} /></div>
      <div className="flex-1" />

      {fb && result && (
        <div className="mb-4 animate-slide-up space-y-4">
          <div className={`flex items-center gap-3 rounded-2xl border p-4 ${result.correct ? 'border-success/30 bg-success/10' : 'border-error/30 bg-error/10'}`}>
            <Mascot mood={result.correct ? 'happy' : 'sad'} size={48} float={false} />
            <div className="min-w-0 flex-1">
              <p className={`font-bold ${result.correct ? 'text-success' : 'text-error'}`}>{result.correct ? 'Correto!' : `Incorreto — era ${LABEL[result.correctAction]}`}</p>
              {result.explanation && <p className="text-sm text-text">{result.explanation}</p>}
            </div>
            {result.correct && <span className="shrink-0 font-bold text-success">+{result.xpGained} XP</span>}
          </div>
          <div className="card p-4"><GtoBars freq={result.frequencies} /></div>
          {result.newAchievements.length > 0 && (
            <div className="rounded-2xl border border-gold/30 bg-gold/10 p-3 text-center text-sm font-semibold text-gold">
              {result.newAchievements.map((a) => `${a.icon} ${a.name}`).join(' · ')}
            </div>
          )}
        </div>
      )}

      {fb ? (
        <button className="btn-primary w-full" onClick={advance}>Próximo</button>
      ) : (
        <div className="grid grid-cols-4 gap-2">
          {BTNS.map((b) => {
            const disabled = b.key === 'ALLIN' || mutation.isPending;
            return (
              <button key={b.key} onClick={() => b.key !== 'ALLIN' && choose(b.key as Action)} disabled={disabled}
                className={`btn3d rounded-2xl py-4 text-sm font-bold text-white ${b.color} ${b.key === 'ALLIN' ? 'opacity-30' : 'hover:brightness-110'}`}>
                {b.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="card-2 p-3">
      <p className="text-[11px] uppercase tracking-wide text-subtle">{label}</p>
      <p className="mt-1 text-lg font-bold text-title">{value}</p>
    </div>
  );
}
