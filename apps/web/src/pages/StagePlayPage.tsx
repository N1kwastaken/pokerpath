import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
import { LessonPlayer } from '../components/LessonPlayer.js';
import { stageGroup } from '../lib/stageGroup.js';
import { Glossarized } from '../components/Glossarized.js';
import { TableTutorial, tableTutorialPending } from '../components/TableTutorial.js';
import { sound } from '../lib/sound.js';

// Apenas 3 ações no treino (PRD 7.1): Fold / Call / Raise.
const ACT: { key: Action; label: string; color: string }[] = [
  { key: 'FOLD', label: 'Fold', color: 'bg-error' },
  { key: 'CALL', label: 'Call', color: 'bg-call' },
  { key: 'RAISE', label: 'Raise', color: 'bg-primary' },
];
const LABEL: Record<Action, string> = { FOLD: 'Fold', CALL: 'Call', RAISE: 'Raise' };
function xpProgress(totalXp: number, level: number): { pct: number; hasNext: boolean } {
  const cur = USER_LEVELS[level - 1]?.xpRequired ?? 0;
  const nx = USER_LEVELS[level]?.xpRequired;
  if (nx == null) return { pct: 100, hasNext: false };
  return { pct: Math.max(0, Math.min(100, Math.round(((totalXp - cur) / (nx - cur)) * 100))), hasNext: true };
}
type Phase = 'playing' | 'feedback' | 'summary';

/** Sessão salva por fase: sair no meio e voltar retoma de onde parou. */
type SavedSession = { ids: string[]; answers: boolean[]; xp: number };
const sessionKey = (stageId: string) => `pp.session.${stageId}`;
function loadSession(stageId: string | undefined): SavedSession | null {
  if (!stageId) return null;
  try {
    const raw = localStorage.getItem(sessionKey(stageId));
    if (!raw) return null;
    const s = JSON.parse(raw) as SavedSession;
    if (!Array.isArray(s.ids) || !Array.isArray(s.answers) || typeof s.xp !== 'number') return null;
    return s;
  } catch {
    return null;
  }
}

export function StagePlayPage() {
  const { stageId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { setUser, user } = useAuth();
  const [saved] = useState(() => loadSession(stageId));
  const [resume, setResume] = useState(!!saved && saved.answers.length > 0);
  const { data, isLoading, error } = useStage(stageId, resume);
  const { data: energy } = useEnergy();

  const [phase, setPhase] = useState<Phase>('playing');
  const [idx, setIdx] = useState(0);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetPrev, setSheetPrev] = useState(false);
  const [tutorialOpen, setTutorialOpen] = useState(() => tableTutorialPending());
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
    mutationFn: (perfect: boolean) => gameApi.completeLesson(stageId!, perfect),
    onSuccess: (res) => {
      sound.correct();
      if (stageId) localStorage.setItem('pp.justCompleted', stageId);
      if (user) setUser({ ...user, totalXp: res.totalXp, level: res.level, levelName: res.levelName, currentStreak: res.currentStreak });
      backToWorld();
    },
  });

  const exercises = data?.exercises ?? [];
  // Cada sessão usa só o mínimo de exercícios, sorteados do pool (variedade).
  // Ao retomar uma sessão salva, a ordem original dela é preservada.
  const ordered = useMemo(() => {
    if (resume && saved && saved.ids.length === exercises.length) {
      const byId = new Map(exercises.map((e) => [e.id, e]));
      const arr = saved.ids.map((id) => byId.get(id)).filter(Boolean) as PublicExercise[];
      if (arr.length === exercises.length) return arr;
    }
    const a = [...exercises];
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  }, [exercises, resume, saved]);
  const current: PublicExercise | undefined = ordered[idx];
  const sessionLen = data
    ? (data.stage.minExercises > 0 ? Math.min(data.stage.minExercises, exercises.length) : exercises.length)
    : 0;

  // Restaura a sessão salva quando os dados chegam — só se o servidor estiver
  // em sincronia (mesma contagem de respostas); senão descarta e começa limpa.
  const [restored, setRestored] = useState(false);
  useEffect(() => {
    if (!data || !resume || !saved || restored) return;
    const ids = new Set(exercises.map((e) => e.id));
    const okOrder = saved.ids.length === exercises.length && saved.ids.every((id) => ids.has(id));
    const okServer = data.stage.exercisesDone === saved.answers.length;
    const partial = saved.answers.length > 0 && saved.answers.length < sessionLen;
    if (okOrder && okServer && partial) {
      setAnswers(saved.answers);
      setIdx(saved.answers.length);
      setSessionXp(saved.xp);
    } else {
      if (stageId) localStorage.removeItem(sessionKey(stageId));
      setResume(false); // refetch sem resume → servidor zera a run
    }
    setRestored(true);
  }, [data, resume, saved, restored, exercises, sessionLen, stageId]);

  // Persiste a sessão a cada resposta; limpa ao terminar (ou concluir a fase).
  useEffect(() => {
    if (!stageId || !data || data.stage.isLesson) return;
    if (answers.length === 0) return;
    if (completed || answers.length >= sessionLen) return localStorage.removeItem(sessionKey(stageId));
    localStorage.setItem(sessionKey(stageId), JSON.stringify({
      ids: ordered.map((e) => e.id), answers, xp: sessionXp,
    } satisfies SavedSession));
  }, [answers, sessionXp, completed, stageId, sessionLen, ordered, data]);

  // Cheat-sheet: chart da decisão do exercício atual. Disponível nas práticas
  // e testes de seção; escondido só na revisão final do mundo (Mix / Desafio
  // final), que é a prova de verdade. Dois modos:
  //  - RFI (abertura): chart raise/fold + seta de comparação com a posição anterior.
  //  - Defesa vs open (3-bet/call/fold): herói BTN vs UTG/MP/CO ou BB vs BTN.
  const RFI_ORDER: Position[] = ['UTG', 'MP', 'CO', 'BTN', 'SB'];
  const VS_CHARTS: Partial<Record<Position, Position[]>> = { BTN: ['UTG', 'MP', 'CO'], BB: ['BTN'] };
  const isTestStage = !data || stageGroup(data.stage.concept) === 'Revisão';
  const rfiPos: Position | undefined =
    current && current.category === 'OPEN_RAISE' && !current.villainAction && RFI_ORDER.includes(current.heroPosition)
      ? current.heroPosition
      : undefined;
  const vsVillain: Position | undefined =
    current && !current.board && !current.callerPosition && current.villainAction === 'Raise 2.5x'
      && current.villainPosition && VS_CHARTS[current.heroPosition]?.includes(current.villainPosition)
      ? current.villainPosition
      : undefined;
  const cheatPos: Position | undefined = rfiPos ?? (vsVillain ? current!.heroPosition : undefined);
  const cheatScenario = rfiPos ? 'RFI' : vsVillain ? `VS_${vsVillain}` : 'RFI';
  const showCheat = !!cheatPos && !isTestStage;
  const prevPos: Position | undefined = rfiPos && RFI_ORDER.indexOf(rfiPos) > 0
    ? RFI_ORDER[RFI_ORDER.indexOf(rfiPos) - 1]
    : undefined;
  const cheatQ = useRange(
    { gameType: 'CASH', tableSize: 'SIX_MAX', stack: 100, position: cheatPos ?? 'BTN', scenario: cheatScenario },
    { enabled: showCheat && sheetOpen },
  );
  const prevQ = useRange(
    { gameType: 'CASH', tableSize: 'SIX_MAX', stack: 100, position: prevPos ?? 'BTN' },
    { enabled: showCheat && sheetOpen && !!prevPos },
  );

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
    return (
      <LessonPlayer
        title={data.stage.title}
        concept={data.stage.concept}
        onExit={backToWorld}
        finishing={lessonMut.isPending}
        onFinish={(perfect) => lessonMut.mutate(perfect)}
      />
    );
  }

  if (!current) return null;

  function advance() {
    const isLast = idx + 1 >= sessionLen;
    if (completed || isLast) { scrollTop(); return setPhase('summary'); }
    setIdx((i) => i + 1); setResult(null); setLastChoice(null); setPhase('playing');
  }
  function retry() {
    if (stageId) localStorage.removeItem(sessionKey(stageId));
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
        <Mascot mood={worldDone ? 'cheer' : passed ? 'win' : 'sad'} size={176} />
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
  // Spot de agressor: o vilão deu check — os botões viram Bet/Check (sem fold,
  // porque dar check é grátis). Internamente Bet=RAISE e Check=CALL.
  const aggressor = current.villainAction === 'Check';
  const buttons: { key: Action; label: string; color: string }[] = aggressor
    ? [{ key: 'CALL', label: 'Check', color: 'bg-call' }, { key: 'RAISE', label: 'Bet', color: 'bg-primary' }]
    : ACT;
  const actionLabel = (a: Action) => (aggressor ? (a === 'RAISE' ? 'Bet' : a === 'CALL' ? 'Check' : 'Fold') : LABEL[a]);
  return (
    <div className="fixed inset-0 z-30 bg-bg">
      {fb && result?.correct && <Confetti key={idx} count={20} />}
      <div className="mx-auto flex h-full w-full max-w-md flex-col px-4 pb-4 pt-3 lg:max-w-5xl lg:flex-row lg:items-stretch lg:gap-6 lg:px-8 lg:py-6">
      <div className="flex min-h-0 flex-1 flex-col">

      <div className="flex items-center gap-3">
        <button onClick={backToWorld} className="text-subtle" aria-label="Sair"><IconX size={20} /></button>
        <div className="flex-1"><ProgressBar value={answers.length} max={sessionLen} /></div>
        <span className="text-xs font-bold tabular-nums text-subtle">{answers.length}/{sessionLen}</span>
        {showCheat && (
          <button onClick={() => { setSheetOpen(true); setSheetPrev(false); }}
            className="rounded-full bg-card2 px-2 py-0.5 text-xs font-bold text-subtle" aria-label="Ver range">
            📊
          </button>
        )}
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
                {result.correct ? 'Correto' : `Incorreto — era ${actionLabel(result.correctAction)}`}
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

          <GtoBars freq={result.frequencies} chosen={lastChoice ?? undefined} correct={result.correctAction} aggressor={aggressor} />

          {result.newAchievements.length > 0 && (
            <div className="rounded-xl border border-gold/30 bg-gold/10 p-2 text-center text-xs font-semibold text-gold">
              {result.newAchievements.map((a) => `${a.icon} ${a.name}`).join(' · ')}
            </div>
          )}

          <button className="btn-primary w-full" onClick={advance}>Continuar</button>
        </div>
      ) : (
        <div className={`grid gap-2.5 ${aggressor ? 'grid-cols-2' : 'grid-cols-3'}`}>
          {buttons.map((b) => (
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
            <div className="card-2 p-2"><p className="text-lg font-bold text-title">{answers.length}/{sessionLen}</p><p className="text-[10px] text-subtle">Sessão</p></div>
            <div className="card-2 p-2"><p className="text-lg font-bold text-title">{answers.length ? Math.round((correctCount / answers.length) * 100) : 0}%</p><p className="text-[10px] text-subtle">Acerto</p></div>
          </div>
        </div>
        <div className="card flex-1 p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-subtle">Estratégia</p>
          {fb && result ? (
            <div className="mt-3"><GtoBars freq={result.frequencies} chosen={lastChoice ?? undefined} correct={result.correctAction} aggressor={aggressor} /></div>
          ) : (
            <p className="mt-3 text-sm text-subtle">Responda a mão para ver as frequências GTO.</p>
          )}
        </div>
      </aside>

      </div>

      {/* Tutorial guiado: só na primeira prática de mesa da vida do usuário */}
      {tutorialOpen && phase === 'playing' && answers.length === 0 && (
        <TableTutorial onDone={() => setTutorialOpen(false)} />
      )}

      {/* Cheat-sheet: balão com o range da posição (e comparação com a anterior) */}
      {sheetOpen && cheatPos && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-5" onClick={() => setSheetOpen(false)}>
          <div className="card w-full max-w-sm p-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-widest text-subtle">
                {vsVillain
                  ? `Defesa · ${cheatPos} vs open de ${vsVillain}`
                  : `Range de abertura · ${sheetPrev && prevPos ? prevPos : cheatPos}`}
              </p>
              <button onClick={() => setSheetOpen(false)} className="text-subtle" aria-label="Fechar"><IconX size={18} /></button>
            </div>
            {sheetPrev && prevPos && (
              <p className="mt-1 text-[11px] text-subtle">Contorno dourado = mãos que mudam em relação a {cheatPos}.</p>
            )}
            <div className="mt-3">
              {sheetPrev && prevPos ? (
                prevQ.data ? <RangeGridView grid={prevQ.data} diffWith={cheatQ.data ?? undefined} /> : <p className="text-sm text-subtle">Carregando…</p>
              ) : (
                cheatQ.data ? <RangeGridView grid={cheatQ.data} /> : <p className="text-sm text-subtle">Carregando…</p>
              )}
            </div>
            {prevPos && (
              <button onClick={() => setSheetPrev((v) => !v)} className="btn-soft mt-3 w-full text-sm">
                {sheetPrev ? `Voltar para ${cheatPos} ▶` : `◀ Comparar com ${prevPos}`}
              </button>
            )}
          </div>
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
