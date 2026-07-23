import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { Action, AnswerResult, PublicExercise, Position } from '@pokerpath/shared';
import { XP_BY_DIFFICULTY } from '@pokerpath/shared';
import { useStage, useRange, useEnergy } from '../hooks/useGame.js';
import { gameApi } from '../api/game.js';
import { ApiError } from '../lib/api.js';
import { useAuth } from '../auth/AuthContext.js';
import { PokerTable } from '../components/PokerTable.js';
import { ProgressBar } from '../components/ProgressBar.js';
import { LogoLoader } from '../components/LogoLoader.js';
import { Confetti } from '../components/Confetti.js';
import { CountUp } from '../components/CountUp.js';
import { StreakBadge, tierForDays } from '../components/StreakBadge.js';
import { AchievementBadge } from '../components/AchievementBadge.js';
import { GtoBars } from '../components/GtoBars.js';
import { IconX, IconCheck, IconBolt, IconFlame, IconHome, IconChart, IconTrophy } from '../components/Icons.js';
import { Mascot } from '../components/Mascot.js';
import { RangeGridView } from '../components/RangeGridView.js';
import { LessonPlayer } from '../components/LessonPlayer.js';
import { stageGroup } from '../lib/stageGroup.js';
import { Explanation } from '../components/Explanation.js';
import { TableTutorial, tableTutorialPending } from '../components/TableTutorial.js';
import { sound } from '../lib/sound.js';
import { useScrollLock } from '../lib/useScrollLock.js';

// Apenas 3 ações no treino (PRD 7.1): Fold / Call / Raise.
// Cores FIXAS e distintas por ação: fold vermelho, call azul, raise roxo.
// Raise usa `bg-accent` (roxo) e não `bg-primary` — senão colide com o azul do
// call quando o usuário escolhe a cor azul do app.
const ACT: { key: Action; label: string; color: string }[] = [
  { key: 'FOLD', label: 'Fold', color: 'bg-error' },
  { key: 'CALL', label: 'Call', color: 'bg-call' },
  { key: 'RAISE', label: 'Raise', color: 'bg-accent' },
];
const LABEL: Record<Action, string> = { FOLD: 'Fold', CALL: 'Call', RAISE: 'Raise' };
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
  // Streak ANTES da sessão: se subir, esta sessão garantiu um novo dia — e é
  // isso que o resumo celebra (a recompensa que fecha o hábito diário).
  const [streakBefore] = useState(() => user?.currentStreak ?? 0);
  const { data, isLoading, error } = useStage(stageId, resume);
  // Trava a rolagem SÓ no treino: a tela de exercício é fixa e a página de
  // baixo não pode rolar junto. AULA rola de propósito (é texto longo), então
  // travar ali deixaria a lição inacessível.
  useScrollLock(!!data && !data.stage.isLesson);
  const { data: energy } = useEnergy();

  const [phase, setPhase] = useState<Phase>('playing');
  const [idx, setIdx] = useState(0);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetPrev, setSheetPrev] = useState(false);
  const [tutorialOpen, setTutorialOpen] = useState(() => tableTutorialPending());
  const [result, setResult] = useState<AnswerResult | null>(null);
  const [lastChoice, setLastChoice] = useState<Action | null>(null);
  // Combo = acertos seguidos na sessão. O ref evita closure velho no onSuccess;
  // o estado alimenta o selo. Zera ao errar.
  const comboRef = useRef(0);
  const [combo, setCombo] = useState(0);
  const [answers, setAnswers] = useState<boolean[]>([]);
  const [sessionXp, setSessionXp] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [worldDone, setWorldDone] = useState(false);
  // Energia devolvida pela fase perfeita — anunciada no resumo, que é onde a
  // pessoa está olhando quando termina.
  const [energyBack, setEnergyBack] = useState(0);
  // Nome do nível alcançado NESTA sessão (null = não subiu). Vai pro resumo:
  // subir de nível no meio da fase não pode ser um banner que some.
  const [levelUpTo, setLevelUpTo] = useState<string | null>(null);

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
      if (user) setUser({ ...user, totalXp: res.totalXp, level: res.level, levelName: res.levelName, currentStreak: res.currentStreak, streakAtRisk: false, streakPlayedToday: true });
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

  // O servidor roda em SEGUNDO PLANO (a validação já foi local, instantânea).
  // Aqui só reconciliamos o que é autoridade do servidor: XP/nível/conquistas
  // reais e o streak que persiste entre fases/sessões (rumo à conquista de 50).
  const mutation = useMutation({
    mutationFn: (action: Action) => gameApi.answer({ exerciseId: current!.id, selectedAction: action }),
    onSuccess: (res) => {
      setResult(res);
      comboRef.current = res.answerStreak;
      setCombo(res.answerStreak);
      if (res.stageCompleted) { setCompleted(true); if (stageId) localStorage.setItem('pp.justCompleted', stageId); }
      if (res.worldCompleted) setWorldDone(true);
      if (res.energyRestored > 0) setEnergyBack(res.energyRestored);
      if (res.leveledUp) { setLevelUpTo(res.levelName); setTimeout(() => sound.levelUp(), 250); }
      if (user) setUser({ ...user, totalXp: res.totalXp, level: res.level, levelName: res.levelName, currentStreak: res.currentStreak, streakAtRisk: false, streakPlayedToday: true });
      queryClient.invalidateQueries({ queryKey: ['energy'] });
    },
    onError: (err) => { if (err instanceof ApiError && err.code === 'DAILY_LIMIT_REACHED') navigate('/premium'); },
  });

  useEffect(() => {
    if (error instanceof ApiError) navigate(error.code === 'PREMIUM_REQUIRED' ? '/premium' : '/worlds', { replace: true, state: { fromExercise: true } });
  }, [error, navigate]);

  // Fanfarra ao entrar no resumo aprovado — o clímax da sessão.
  useEffect(() => {
    if (phase !== 'summary' || answers.length === 0 || !data) return;
    const acc = answers.filter(Boolean).length / answers.length;
    if (acc >= data.stage.passRate) sound.fanfare();
  }, [phase, answers, data]);

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
    comboRef.current = 0; setCombo(0);
    setCompleted(false); setWorldDone(false); setEnergyBack(0); setLevelUpTo(null); setPhase('playing'); scrollTop();
  }
  function choose(action: Action) {
    if (phase !== 'playing') return;
    setLastChoice(action);
    // Validação LOCAL, instantânea — o gabarito viaja no exercício (como nas
    // aulas). O núcleo (certo/errado + explicação + frequências) aparece na
    // hora; XP/nível/conquistas viram os do servidor quando a resposta chegar.
    const correct = action === current!.correctAction;
    const xpGained = correct ? XP_BY_DIFFICULTY[current!.difficulty] : 0;
    const newCombo = correct ? comboRef.current + 1 : 0;
    comboRef.current = newCombo;
    setCombo(newCombo);
    correct ? sound.correct(newCombo) : sound.wrong();
    setAnswers((a) => [...a, correct]);
    setSessionXp((x) => x + xpGained);
    setResult({
      correct,
      correctAction: current!.correctAction,
      explanation: current!.explanation,
      frequencies: current!.frequencies,
      xpGained,
      totalXp: (user?.totalXp ?? 0) + xpGained,
      level: user?.level ?? 1,
      levelName: user?.levelName ?? '',
      leveledUp: false,
      currentStreak: user?.currentStreak ?? 0,
      answerStreak: newCombo,
      newAchievements: [],
      stage: { stageId: stageId!, status: 'IN_PROGRESS', exercisesDone: answers.length + 1, correctAnswers: 0, accuracy: 0, xpEarned: sessionXp + xpGained, minExercises: sessionLen, passRate: data!.stage.passRate },
      stageCompleted: false,
      // Devolução de energia é decisão do servidor (ele é quem sabe se a fase
      // já tinha sido limpa sem erro antes); chega na reconciliação.
      worldCompleted: false,
      energyRestored: 0,
    });
    setPhase('feedback');
    mutation.mutate(action); // grava XP/progresso no servidor + reconcilia
  }

  // ─── RESUMO ──────────────────────────────────────────────────
  if (phase === 'summary') {
    const correct = answers.filter(Boolean).length;
    const accuracy = answers.length ? Math.round((correct / answers.length) * 100) : 0;
    const passed = answers.length > 0 && correct / answers.length >= data.stage.passRate;
    const streakAdvanced = !!user && user.currentStreak > streakBefore;
    return (
      <div className="relative flex min-h-dvh flex-col items-center justify-center px-6 py-10 text-center">
        {passed && <Confetti count={worldDone ? 90 : 50} />}
        {worldDone ? (
          // Fechar um MUNDO é o maior feito do jogo — merece o troféu em cena,
          // não uma linha de texto embaixo do título.
          <>
            <div className="relative animate-spin-in">
              <span className="absolute inset-0 -z-10 rounded-full bg-gold/25 blur-2xl" aria-hidden />
              <span className="flex h-28 w-28 items-center justify-center rounded-full border-4 border-gold bg-gold/15 shadow-pop"><IconTrophy size={56} className="text-gold" /></span>
            </div>
            <h1 className="mt-5 text-3xl font-black text-title">Mundo completo!</h1>
            <p className="mt-1 text-sm font-semibold text-gold">Todas as fases fechadas. O próximo mundo é seu.</p>
          </>
        ) : (
          <>
            <Mascot mood={passed ? 'win' : 'sad'} size={176} />
            <h1 className="mt-5 text-3xl font-bold text-title">{passed ? 'Fase concluída!' : 'Quase lá!'}</h1>
          </>
        )}
        {!passed && <p className="mt-1 text-subtle">Você precisa de {Math.round(data.stage.passRate * 100)}% de acerto.</p>}

        {/* Subiu de nível nesta sessão */}
        {levelUpTo && (
          <div className="mt-5 flex animate-slide-up items-center gap-3 rounded-2xl border border-primary/50 bg-primary/10 px-4 py-3">
            <span className="animate-spin-in text-3xl">⭐</span>
            <div className="text-left">
              <p className="text-lg font-extrabold text-primary">Subiu de nível!</p>
              <p className="text-xs text-subtle">Agora você é <b className="text-title">{levelUpTo}</b>.</p>
            </div>
          </div>
        )}

        {/* Fase perfeita: a energia gasta volta. É o incentivo a aprender de
            verdade em vez de chutar até passar no pass_rate. */}
        {energyBack > 0 && (
          <div className="mt-5 flex animate-slide-up items-center gap-3 rounded-2xl border border-call/50 bg-call/10 px-4 py-3">
            <IconBolt size={28} className="shrink-0 text-call" />
            <div className="text-left">
              <p className="text-lg font-extrabold text-call">Perfeito! Energia restaurada.</p>
              <p className="text-xs text-subtle">
                Sem errar nenhuma — os {energyBack} de energia desta fase voltaram para você.
              </p>
            </div>
          </div>
        )}

        {/* Streak conquistado nesta sessão — a recompensa que fecha o dia. */}
        {streakAdvanced && (
          <div className="mt-5 flex animate-slide-up items-center gap-3 rounded-2xl border border-gold/50 bg-gold/10 px-4 py-3">
            {tierForDays(user!.currentStreak) ? (
              <StreakBadge tier={tierForDays(user!.currentStreak)!} size={44} />
            ) : (
              <IconFlame size={30} className="animate-flame text-gold" />
            )}
            <div className="text-left">
              <p className="text-lg font-extrabold text-gold">
                {user!.currentStreak} {user!.currentStreak === 1 ? 'dia seguido' : 'dias seguidos'}
              </p>
              <p className="text-xs text-subtle">
                {user!.currentStreak === 1 ? 'Começou. Volte amanhã para somar 2.' : 'Dia garantido — volte amanhã para não perder.'}
              </p>
            </div>
          </div>
        )}

        <div className="mt-8 grid w-full grid-cols-3 gap-3">
          <Stat label="Acerto" delay={0}><CountUp to={accuracy} suffix="%" /></Stat>
          <Stat label="Acertos" delay={120}>{correct}/{answers.length}</Stat>
          <Stat label="XP" delay={240} gold={sessionXp > 0}><CountUp to={sessionXp} prefix="+" /></Stat>
        </div>
        <div className="mt-8 w-full space-y-3">
          {worldDone ? (
            <button className="btn-primary w-full" onClick={goHome}><IconHome size={18} /> Voltar ao início</button>
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
    ? [{ key: 'CALL', label: 'Check', color: 'bg-call' }, { key: 'RAISE', label: 'Bet', color: 'bg-accent' }]
    : ACT;
  const actionLabel = (a: Action) => (aggressor ? (a === 'RAISE' ? 'Bet' : a === 'CALL' ? 'Check' : 'Fold') : LABEL[a]);
  return (
    <div className="fixed inset-0 z-30 overflow-hidden overscroll-none bg-bg">
      {/* Confete cresce com o combo: acertar em sequência explode mais. */}
      {fb && result?.correct && <Confetti key={idx} count={Math.min(18 + combo * 8, 72)} />}
      <div className="mx-auto flex h-full w-full max-w-md flex-col px-4 pb-4 pt-3 lg:max-w-5xl lg:flex-row lg:items-stretch lg:gap-6 lg:px-8 lg:py-6">
      {/* Tela de treino TRAVADA (container overflow-hidden + overscroll-none):
          não rola pra baixo nem pros lados. Tudo cabe — a área de baixo ancora
          os controles no rodapé e o card de feedback rola por dentro se passar
          da altura (com o Continuar fixo, sempre visível). */}
      <div className="flex min-h-0 flex-1 flex-col">

      {/* Header do exercício — chips bold sem outline, no estilo da home. */}
      <div className="flex items-center gap-2">
        <button onClick={backToWorld} className="shrink-0 text-subtle" aria-label="Sair"><IconX size={24} /></button>
        <div className="flex-1"><ProgressBar value={answers.length} max={sessionLen} /></div>
        {showCheat && (
          <button onClick={() => { setSheetOpen(true); setSheetPrev(false); }}
            className="shrink-0 rounded-2xl bg-card2 px-2.5 py-1.5 text-base" aria-label="Ver range">
            <IconChart size={20} />
          </button>
        )}
        {energy && <span className="flex shrink-0 items-center gap-1 rounded-2xl bg-card2 px-2.5 py-1.5 text-lg font-black text-call"><IconBolt size={18} />{energy.infinite ? '∞' : energy.remaining}</span>}
        {user && <span className="flex shrink-0 items-center gap-1 rounded-2xl bg-card2 px-2.5 py-1.5 text-lg font-black text-title">{user.currentStreak}<IconFlame size={16} className="text-gold" /></span>}
      </div>

      {/* Mesa em posição FIXA (mesmo jogando e no feedback, sem pulo). Gap de
          topo em dvh pra centralizar. A área de baixo (flex-1 justify-end)
          ancora os controles no rodapé SEM overshoot. */}
      <div className={`mt-[8dvh] shrink-0 ${fb && result && !result.correct ? 'animate-shake' : ''}`}>
        <PokerTable ex={current} simple={data.worldOrder === 0} />
      </div>

      <div className="flex min-h-0 flex-1 flex-col justify-end">
      {fb && result ? (
        <div className="animate-slide-up flex max-h-full flex-col rounded-2xl border border-line bg-card p-4">
          <div className="min-h-0 space-y-3 overflow-y-auto no-scrollbar">
          <div className="flex items-center gap-3">
            <motion.span
              initial={{ scale: 0, rotate: result.correct ? -30 : 0 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 600, damping: 15 }}
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white ${result.correct ? 'bg-primary' : 'bg-error'}`}
            >
              {result.correct ? <IconCheck size={20} /> : <span className="text-lg font-black">✕</span>}
            </motion.span>
            <div className="min-w-0 flex-1">
              <p className={`font-extrabold ${result.correct ? 'text-primary' : 'text-error'}`}>
                {result.correct ? 'Correto' : `Incorreto — era ${actionLabel(result.correctAction)}`}
              </p>
            </div>
            {result.correct && (
              <motion.span
                initial={{ scale: 0, y: 8 }}
                animate={{ scale: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 500, damping: 12, delay: 0.05 }}
                className="shrink-0 text-sm font-black text-primary"
              >
                +{result.xpGained} XP
              </motion.span>
            )}
          </div>

          {/* A explicação ocupa a LARGURA TODA do cartão: dentro do cabeçalho
              ela dividia espaço com o ícone e o XP e quebrava em 4 linhas. */}
          {result.explanation && <Explanation text={result.explanation} />}

          {/* Frequências GTO no TOPO — o núcleo (a porcentagem) fica sempre
              visível. A barra de XP saiu (empurrava a porcentagem pra fora). */}
          <GtoBars freq={result.frequencies} chosen={lastChoice ?? undefined} correct={result.correctAction} aggressor={aggressor} />

          {/* Selo de combo: acertos em sequência (3+) ganham um destaque pulsante. */}
          {result.correct && combo >= 3 && (
            <motion.div
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 12 }}
              className="flex items-center justify-center gap-1.5 rounded-xl bg-gold/15 py-1.5 text-sm font-black text-gold"
            >
              <IconFlame size={16} className="animate-flame" /> {combo} seguidas — combo!
            </motion.div>
          )}

          {result.leveledUp && (
            <div className="animate-slide-up rounded-xl bg-primary/15 py-1.5 text-center text-sm font-black text-primary">⭐ Subiu de nível — {result.levelName}!</div>
          )}

          {result.newAchievements.length > 0 && (
            <div className="space-y-1.5">
              {result.newAchievements.map((a) => (
                <div key={a.name} className="flex items-center gap-2.5 rounded-xl border border-gold/40 bg-gold/10 px-3 py-2">
                  <span className="animate-spin-in"><AchievementBadge code={a.code} size={34} /></span>
                  <div className="min-w-0 text-left leading-tight">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gold">Conquista desbloqueada</p>
                    <p className="truncate text-sm font-extrabold text-title">{a.name}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          </div>
          <button className="btn-primary mt-3 w-full shrink-0" onClick={advance}>Continuar</button>
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
          {!fb || !result ? (
            <p className="mt-3 text-sm text-subtle">Responda a mão para ver as frequências GTO.</p>
          ) : result.frequencies ? (
            <div className="mt-3"><GtoBars freq={result.frequencies} chosen={lastChoice ?? undefined} correct={result.correctAction} aggressor={aggressor} /></div>
          ) : (
            // Sem chart por trás (postflop/4-bet/squeeze). Dizer isso é melhor
            // do que deixar o card vazio — ou do que inventar uma frequência.
            <p className="mt-3 text-sm text-subtle">
              Este spot ainda não tem chart de referência — a explicação da mão é o guia aqui.
            </p>
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

function Stat({ label, children, delay = 0, gold = false }: {
  label: string; children: React.ReactNode; delay?: number; gold?: boolean;
}) {
  return (
    <div className="card-2 animate-chip-pop p-3" style={{ animationDelay: `${delay}ms` }}>
      <p className="text-[11px] uppercase tracking-wide text-subtle">{label}</p>
      <p className={`mt-1 text-lg font-bold tabular-nums ${gold ? 'text-gold' : 'text-title'}`}>{children}</p>
    </div>
  );
}
