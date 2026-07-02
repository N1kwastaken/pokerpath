import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { Action, AnswerResult, PublicExercise, Position } from '@pokerpath/shared';
import { USER_LEVELS } from '@pokerpath/shared';
import { useStage, useRange, useEnergy } from '../hooks/useGame.js';
import { gameApi } from '../api/game.js';
import { ApiError } from '../lib/api.js';
import { useAuth } from '../auth/AuthContext.js';
import { PokerTable } from '../components/PokerTable.js';
import { ProgressBar } from '../components/ProgressBar.js';
import { LogoLoader } from '../components/LogoLoader.js';
import { Confetti } from '../components/Confetti.js';
import { GtoBars } from '../components/GtoBars.js';
import { IconX, IconCheck, IconBolt } from '../components/Icons.js';
import { Mascot } from '../components/Mascot.js';
import { RangeGridView } from '../components/RangeGridView.js';
import { LessonHandTable } from '../components/LessonHandTable.js';
import { PositionRangeCard } from '../components/PositionRangeCard.js';
import { LessonVisual } from '../components/LessonVisual.js';
import { lessonFor } from '../content/lessons.js';
import { Glossarized } from '../components/Glossarized.js';
import { sound } from '../lib/sound.js';

// Apenas 3 ações no treino (PRD 7.1): Fold / Call / Raise.
const ACT: { key: Action; label: string; color: string }[] = [
  { key: 'FOLD', label: 'Fold', color: 'bg-subtle' },
  { key: 'CALL', label: 'Call', color: 'bg-call' },
  { key: 'RAISE', label: 'Raise', color: 'bg-primary' },
];
const LABEL: Record<Action, string> = { FOLD: 'Fold', CALL: 'Call', RAISE: 'Raise' };
const LESSON_POSITION: Record<string, Position> = {
  'UTG explicado': 'UTG', 'Range de UTG': 'UTG',
  'MP explicado': 'MP', 'Range de MP': 'MP',
  'CO explicado': 'CO', 'Range de CO': 'CO',
  'BTN explicado': 'BTN', 'Range de BTN': 'BTN',
  'SB explicado': 'SB', 'Range de SB': 'SB',
};
function xpProgress(totalXp: number, level: number): { pct: number; hasNext: boolean } {
  const cur = USER_LEVELS[level - 1]?.xpRequired ?? 0;
  const nx = USER_LEVELS[level]?.xpRequired;
  if (nx == null) return { pct: 100, hasNext: false };
  return { pct: Math.max(0, Math.min(100, Math.round(((totalXp - cur) / (nx - cur)) * 100))), hasNext: true };
}
type Phase = 'playing' | 'feedback' | 'summary';

export function StagePlayPage() {
  const { stageId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { setUser, user } = useAuth();
  const { data, isLoading, error } = useStage(stageId);
  const { data: energy } = useEnergy();
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
  const [lastChoice, setLastChoice] = useState<Action | null>(null);
  const [answers, setAnswers] = useState<boolean[]>([]);
  const [sessionXp, setSessionXp] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [worldDone, setWorldDone] = useState(false);

  function scrollTop() { window.scrollTo({ top: 0 }); }
  function invalidateProgress() {
    queryClient.invalidateQueries({ queryKey: ['worlds'] });
    queryClient.invalidateQueries({ queryKey: ['trail'] });
    queryClient.invalidateQueries({ queryKey: ['stats'] });
  }
  function backToWorld() {
    invalidateProgress();
    navigate('/worlds', { replace: true, state: { fromExercise: true } });
  }
  function goHome() {
    invalidateProgress();
    navigate('/', { replace: true });
  }

  const lessonMut = useMutation({
    mutationFn: () => gameApi.completeLesson(stageId!),
    onSuccess: (res) => {
      sound.correct();
      if (stageId) localStorage.setItem('pp.justCompleted', stageId);
      if (user) setUser({ ...user, totalXp: res.totalXp, level: res.level, levelName: res.levelName, currentStreak: res.currentStreak });
      backToWorld();
    },
  });

  const exercises = data?.exercises ?? [];
  // Cada sessão usa só o mínimo de exercícios, sorteados do pool (variedade).
  const ordered = useMemo(() => {
    const a = [...exercises];
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  }, [exercises]);
  const current: PublicExercise | undefined = ordered[idx];

  const mutation = useMutation({
    mutationFn: (action: Action) => gameApi.answer({ exerciseId: current!.id, selectedAction: action }),
    onSuccess: (res) => {
      setResult(res);
      setAnswers((a) => [...a, res.correct]);
      setSessionXp((x) => x + res.xpGained);
      if (res.stageCompleted) { setCompleted(true); if (stageId) localStorage.setItem('pp.justCompleted', stageId); }
      if (res.worldCompleted) setWorldDone(true);
      res.correct ? sound.correct() : sound.wrong();
      if (res.leveledUp) setTimeout(() => sound.levelUp(), 250);
      if (user) setUser({ ...user, totalXp: res.totalXp, level: res.level, levelName: res.levelName, currentStreak: res.currentStreak });
      queryClient.invalidateQueries({ queryKey: ['energy'] });
      setPhase('feedback');
    },
    onError: (err) => { if (err instanceof ApiError && err.code === 'DAILY_LIMIT_REACHED') navigate('/premium'); },
  });

  useEffect(() => {
    if (error instanceof ApiError) navigate(error.code === 'PREMIUM_REQUIRED' ? '/premium' : '/worlds', { replace: true, state: { fromExercise: true } });
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

        <div className="mt-4 flex items-center gap-3">
          <Mascot mood="happy" size={44} float={false} />
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-widest text-primary">Aula</p>
            <h1 className="truncate text-xl font-extrabold leading-tight text-title">{data.stage.title}</h1>
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
              <LessonHandTable position={step.position} hand={step.hand} />
              {answered ? (
                <>
                  <div className={`rounded-2xl border p-4 ${handPick === step.answer ? 'border-primary/40 bg-primary/10' : 'border-error/40 bg-error/10'}`}>
                    <p className={`font-bold ${handPick === step.answer ? 'text-primary' : 'text-error'}`}>
                      {handPick === step.answer ? 'Correto!' : `Era ${step.answer === 'RAISE' ? 'Raise' : 'Fold'}`}
                    </p>
                    <p className="mt-0.5 text-sm text-text"><Glossarized text={step.explain} /></p>
                  </div>
                  <PositionRangeCard position={step.position} hand={step.hand} action={step.answer} />
                </>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => { setHandPick('FOLD'); step.answer === 'FOLD' ? sound.correct() : sound.wrong(); }} className="btn3d rounded-2xl bg-subtle py-4 font-bold text-white">Fold</button>
                  <button onClick={() => { setHandPick('RAISE'); step.answer === 'RAISE' ? sound.correct() : sound.wrong(); }} className="btn3d rounded-2xl bg-primary py-4 font-bold text-white">Raise</button>
                </div>
              )}
            </div>
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
                    <button key={i} disabled={answered} onClick={() => { setQuizPick(i); correct ? sound.correct() : sound.wrong(); }} className={`chip w-full text-left ${cls}`}>{opt}</button>
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
          <button className="btn-primary w-full" disabled={(needsAnswer && !answered) || lessonMut.isPending}
            onClick={() => { if (last) { sound.click(); lessonMut.mutate(); } else { sound.click(); setLessonIdx((i) => i + 1); setQuizPick(null); setHandPick(null); } }}>
            {needsAnswer && !answered ? 'Responda para continuar' : last ? (lessonMut.isPending ? 'Concluindo...' : 'Concluir aula') : 'Próximo'}
          </button>
          {!last && <button className="btn-ghost w-full" onClick={() => { setLessonIdx(steps.length - 1); setQuizPick(null); setHandPick(null); }}>Pular ao fim</button>}
        </div>
      </div>
    );
  }

  if (!current) return null;
  const sessionLen = data.stage.minExercises > 0 ? Math.min(data.stage.minExercises, ordered.length) : ordered.length;

  function advance() {
    const isLast = idx + 1 >= sessionLen;
    if (completed || isLast) { scrollTop(); return setPhase('summary'); }
    setIdx((i) => i + 1); setResult(null); setLastChoice(null); setPhase('playing');
  }
  function retry() {
    setIdx(0); setAnswers([]); setSessionXp(0); setResult(null); setLastChoice(null);
    setCompleted(false); setWorldDone(false); setPhase('playing'); scrollTop();
  }
  function choose(action: Action) {
    if (mutation.isPending || phase !== 'playing') return;
    setLastChoice(action); sound.click(); mutation.mutate(action);
  }

  // ─── RESUMO ──────────────────────────────────────────────────
  if (phase === 'summary') {
    const correct = answers.filter(Boolean).length;
    const accuracy = answers.length ? Math.round((correct / answers.length) * 100) : 0;
    const passed = answers.length > 0 && correct / answers.length >= data.stage.passRate;
    return (
      <div className="relative flex min-h-dvh flex-col items-center justify-center px-6 py-10 text-center">
        {passed && <Confetti count={50} />}
        <Mascot mood={worldDone ? 'cheer' : passed ? 'win' : 'sad'} size={132} />
        <h1 className="mt-5 text-3xl font-bold text-title">{passed ? 'Fase concluída!' : 'Quase lá!'}</h1>
        {worldDone && <p className="mt-1 font-bold text-primary">Mundo completo! 🏆</p>}
        {!passed && <p className="mt-1 text-subtle">Você precisa de {Math.round(data.stage.passRate * 100)}% de acerto.</p>}
        {passed && <div className="mt-4 animate-deal-in text-5xl">🎁</div>}
        <div className="mt-8 grid w-full grid-cols-3 gap-3">
          <Stat label="Acerto" value={`${accuracy}%`} />
          <Stat label="Acertos" value={`${correct}/${answers.length}`} />
          <Stat label="XP" value={`+${sessionXp}`} />
        </div>
        <div className="mt-8 w-full space-y-3">
          {worldDone ? (
            <button className="btn-primary w-full" onClick={goHome}>🏠 Voltar ao início</button>
          ) : passed ? (
            <>
              <button className="btn-primary w-full" onClick={backToWorld}>Continuar</button>
              <button className="btn-soft w-full" onClick={goHome}>Voltar ao início</button>
            </>
          ) : (
            <>
              <button className="btn-primary w-full" onClick={retry}>Tentar de novo</button>
              <button className="btn-soft w-full" onClick={backToWorld}>Voltar à trilha</button>
            </>
          )}
        </div>
      </div>
    );
  }

  // ─── EXERCÍCIO (1 tela, sem scroll) ──────────────────────────
  const fb = phase === 'feedback' && result;
  const correctCount = answers.filter(Boolean).length;
  return (
    <div className="fixed inset-0 z-30 bg-bg">
      {fb && result?.correct && <Confetti key={idx} count={20} />}
      <div className="mx-auto flex h-full w-full max-w-md flex-col px-4 pb-4 pt-3 lg:max-w-5xl lg:flex-row lg:items-stretch lg:gap-6 lg:px-8 lg:py-6">
      <div className="flex min-h-0 flex-1 flex-col">

      <div className="flex items-center gap-3">
        <button onClick={backToWorld} className="text-subtle" aria-label="Sair"><IconX size={20} /></button>
        <div className="flex-1"><ProgressBar value={answers.length} max={sessionLen} /></div>
        <span className="text-xs font-bold tabular-nums text-subtle">{answers.length}/{sessionLen}</span>
        {energy && <span className="flex items-center gap-0.5 rounded-full bg-card2 px-2 py-0.5 text-xs font-bold text-call"><IconBolt size={13} />{energy.infinite ? '∞' : energy.remaining}</span>}
        {user && <span className="rounded-full bg-card2 px-2 py-0.5 text-xs font-bold text-title">{user.currentStreak}🔥</span>}
      </div>

      <div className="flex flex-1 flex-col justify-center">
        <div className={`w-full ${fb && result && !result.correct ? 'animate-shake' : ''}`}><PokerTable ex={current} /></div>
      </div>

      {fb && result ? (
        <div className="animate-slide-up space-y-3 rounded-2xl border border-line bg-card p-4">
          <div className="flex items-center gap-3">
            <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white ${result.correct ? 'bg-primary' : 'bg-error'}`}>
              {result.correct ? <IconCheck size={20} /> : <span className="text-lg font-black">✕</span>}
            </span>
            <div className="min-w-0 flex-1">
              <p className={`font-extrabold ${result.correct ? 'text-primary' : 'text-error'}`}>
                {result.correct ? 'Correto' : `Incorreto — era ${LABEL[result.correctAction]}`}
              </p>
              {result.explanation && <p className="text-xs leading-snug text-text"><Glossarized text={result.explanation} /></p>}
            </div>
            {result.correct && <span className="shrink-0 text-sm font-black text-primary">+{result.xpGained} XP</span>}
          </div>

          {(() => {
            const xp = xpProgress(result.totalXp, result.level);
            return (
              <div className="flex items-center gap-2">
                <span className="w-9 shrink-0 text-[10px] font-bold text-subtle">Nv {result.level}</span>
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-black/30">
                  <div key={result.totalXp} className="h-full origin-left rounded-full bg-gold animate-grow-x" style={{ width: `${xp.pct}%` }} />
                </div>
                <span className="w-9 shrink-0 text-right text-[10px] font-bold text-subtle">{xp.hasNext ? `Nv ${result.level + 1}` : 'MAX'}</span>
              </div>
            );
          })()}
          {result.leveledUp && (
            <div className="animate-slide-up rounded-xl bg-primary/15 py-1.5 text-center text-sm font-black text-primary">⭐ Subiu de nível — {result.levelName}!</div>
          )}

          <GtoBars freq={result.frequencies} chosen={lastChoice ?? undefined} correct={result.correctAction} />

          {result.newAchievements.length > 0 && (
            <div className="rounded-xl border border-gold/30 bg-gold/10 p-2 text-center text-xs font-semibold text-gold">
              {result.newAchievements.map((a) => `${a.icon} ${a.name}`).join(' · ')}
            </div>
          )}

          <button className="btn-primary w-full" onClick={advance}>Continuar</button>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2.5">
          {ACT.map((b) => (
            <button key={b.key} onClick={() => choose(b.key)} disabled={mutation.isPending}
              className={`btn3d rounded-2xl py-5 text-base font-extrabold text-white ${b.color} hover:brightness-110`}>
              {b.label}
            </button>
          ))}
        </div>
      )}
      </div>

      <aside className="hidden w-[300px] shrink-0 flex-col gap-3 lg:flex">
        <div className="card p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-subtle">Sessão</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {answers.map((ok, i) => <span key={i} className={`h-4 w-4 rounded ${ok ? 'bg-primary' : 'bg-error'}`} />)}
            {answers.length === 0 && <span className="text-xs text-subtle">Sem respostas ainda.</span>}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 text-center">
            <div className="card-2 p-2"><p className="text-lg font-bold text-title">{answers.length}/{exercises.length}</p><p className="text-[10px] text-subtle">Fase</p></div>
            <div className="card-2 p-2"><p className="text-lg font-bold text-title">{answers.length ? Math.round((correctCount / answers.length) * 100) : 0}%</p><p className="text-[10px] text-subtle">Acerto</p></div>
          </div>
        </div>
        <div className="card flex-1 p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-subtle">Estratégia</p>
          {fb && result ? (
            <div className="mt-3"><GtoBars freq={result.frequencies} chosen={lastChoice ?? undefined} correct={result.correctAction} /></div>
          ) : (
            <p className="mt-3 text-sm text-subtle">Responda a mão para ver as frequências GTO.</p>
          )}
        </div>
      </aside>

      </div>
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
