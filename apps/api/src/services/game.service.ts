import {
  ACTIONS,
  CATEGORIES,
  CATEGORY_LABELS,
  resolveLevel,
  XP_PER_WORLD_COMPLETE,
  FREE_DAILY_EXERCISE_LIMIT,
  type EnergyState,
  DAILY_LIMIT_CODE,
  type Action,
  type Frequencies,
  type CategoryStat,
  type StatsResult,
  type RangeGrid,
  type RangeCell,
  type GameType,
  type TableSize,
  type AnswerInput,
  type AnswerResult,
  type LessonResult,
  type Category,
  type Difficulty,
  type Position,
  type ProgressStatus,
  type PublicExercise,
  type StageSummary,
  type StagePlay,
  type ReviewItem,
  type WorldDetail,
  type WorldSummary,
} from '@pokerpath/shared';
import type { Stage, UserProgress } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { ForbiddenError, NotFoundError } from '../lib/errors.js';
import { computeStreak } from './streak.service.js';
import { evaluateAchievements } from './achievement.service.js';
import { isGodmodeEmail } from '../lib/godmode.js';

/** Todo o PRÉ-FLOP é grátis; o PÓS-FLOP (C-Bet em diante, Mundo 11+) é Premium. */
const POSTFLOP_MIN_ORDER = 2;

function isPremiumLocked(plan: string, worldOrder: number): boolean {
  return plan === 'FREE' && worldOrder >= POSTFLOP_MIN_ORDER;
}

function startOfToday(): Date {
  const n = new Date();
  return new Date(n.getFullYear(), n.getMonth(), n.getDate());
}

/** Monta o StageSummary a partir da fase, do status e do progresso. */
function toStageSummary(
  stage: Stage,
  status: ProgressStatus,
  isLesson: boolean,
  progress?: UserProgress,
): StageSummary {
  return {
    id: stage.id,
    order: stage.order,
    title: stage.title,
    concept: stage.concept,
    description: stage.description,
    minExercises: stage.minExercises,
    maxExercises: stage.maxExercises,
    passRate: stage.passRate,
    xpReward: stage.xpReward,
    status,
    isLesson,
    exercisesDone: progress?.exercisesDone ?? 0,
    correctAnswers: progress?.correctAnswers ?? 0,
    accuracy: progress?.accuracy ?? 0,
    xpEarned: progress?.xpEarned ?? 0,
  };
}


/** Frequências GTO do exercício: usa o JSON salvo ou deriva 100% na ação certa. */
function parseFrequencies(json: string | null, correct: Action): Frequencies {
  if (json) {
    try {
      const f = JSON.parse(json) as Partial<Frequencies>;
      return {
        FOLD: f.FOLD ?? 0,
        CALL: f.CALL ?? 0,
        RAISE: f.RAISE ?? 0,
        ...(f.ALLIN != null ? { ALLIN: f.ALLIN } : {}),
      };
    } catch {
      /* JSON inválido — cai no default */
    }
  }
  return { FOLD: correct === 'FOLD' ? 100 : 0, CALL: correct === 'CALL' ? 100 : 0, RAISE: correct === 'RAISE' ? 100 : 0 };
}

// ─── Mapa de Mundos (PRD 8.5) ──────────────────────────────────
export async function getWorldsForUser(
  userId: string,
  plan: string,
  godmode = false,
): Promise<WorldSummary[]> {
  const worlds = await prisma.world.findMany({
    orderBy: { order: 'asc' },
    include: { stages: { select: { id: true } } },
  });
  const progress = await prisma.userProgress.findMany({ where: { userId } });
  const progByStage = new Map(progress.map((p) => [p.stageId, p]));

  const result: WorldSummary[] = [];
  let prevWorldComplete = true;

  for (const w of worlds) {
    const total = w.stages.length;
    const completed = w.stages.filter(
      (s) => progByStage.get(s.id)?.status === 'COMPLETED',
    ).length;
    const xpEarned = w.stages.reduce(
      (sum, s) => sum + (progByStage.get(s.id)?.xpEarned ?? 0),
      0,
    );

    result.push({
      id: w.id,
      order: w.order,
      name: w.name,
      description: w.description,
      icon: w.icon,
      color: w.color,
      totalStages: total,
      completedStages: completed,
      locked: !godmode && !prevWorldComplete,
      premiumLocked: !godmode && isPremiumLocked(plan, w.order),
      xpEarned,
    });

    prevWorldComplete = total > 0 && completed === total;
  }

  return result;
}

// ─── Detalhe do Mundo (PRD 5.2) ────────────────────────────────
export async function getWorldDetail(
  userId: string,
  plan: string,
  worldId: string,
  godmode = false,
): Promise<WorldDetail> {
  const world = await prisma.world.findUnique({
    where: { id: worldId },
    include: { stages: { orderBy: { order: 'asc' }, include: { _count: { select: { exercises: true } } } } },
  });
  if (!world) throw new NotFoundError('Mundo não encontrado', 'WORLD_NOT_FOUND');

  // Mundo anterior precisa estar completo para este desbloquear.
  const locked = godmode ? false : await isWorldLockedByProgression(userId, world.order);
  const premiumLocked = godmode ? false : isPremiumLocked(plan, world.order);
  const accessible = !locked && !premiumLocked;

  const progress = await prisma.userProgress.findMany({
    where: { userId, stageId: { in: world.stages.map((s) => s.id) } },
  });
  const progByStage = new Map(progress.map((p) => [p.stageId, p]));

  const stages: StageSummary[] = [];
  let prevStageComplete = true;
  for (const s of world.stages) {
    const p = progByStage.get(s.id);
    let status: ProgressStatus;
    if (p?.status === 'COMPLETED') status = 'COMPLETED';
    else if (accessible && (godmode || prevStageComplete)) status = 'IN_PROGRESS';
    else status = 'LOCKED';
    stages.push(toStageSummary(s, status, s._count.exercises === 0, p));
    prevStageComplete = p?.status === 'COMPLETED';
  }

  return {
    id: world.id,
    order: world.order,
    name: world.name,
    description: world.description,
    icon: world.icon,
    color: world.color,
    locked,
    premiumLocked,
    stages,
  };
}

// ─── Trilha unificada: todos os mundos + fases num fluxo só ─────
export async function getTrail(userId: string, plan: string, godmode = false): Promise<WorldDetail[]> {
  const worlds = await prisma.world.findMany({
    orderBy: { order: 'asc' },
    include: { stages: { orderBy: { order: 'asc' }, include: { _count: { select: { exercises: true } } } } },
  });
  const progress = await prisma.userProgress.findMany({ where: { userId } });
  const byStage = new Map(progress.map((p) => [p.stageId, p]));

  const out: WorldDetail[] = [];
  let prevWorldComplete = true;
  for (const w of worlds) {
    const premiumLocked = godmode ? false : isPremiumLocked(plan, w.order);
    const progressionLocked = godmode ? false : w.order > 0 && !prevWorldComplete;
    const accessible = !premiumLocked && !progressionLocked;

    const stages: StageSummary[] = [];
    let prevStageComplete = true;
    let completedCount = 0;
    for (const s of w.stages) {
      const p = byStage.get(s.id);
      let status: ProgressStatus;
      if (p?.status === 'COMPLETED') { status = 'COMPLETED'; completedCount++; }
      else if (accessible && (godmode || prevStageComplete)) status = 'IN_PROGRESS';
      else status = 'LOCKED';
      stages.push(toStageSummary(s, status, s._count.exercises === 0, p));
      prevStageComplete = p?.status === 'COMPLETED';
    }
    out.push({
      id: w.id, order: w.order, name: w.name, description: w.description,
      icon: w.icon, color: w.color, locked: progressionLocked, premiumLocked, stages,
    });
    prevWorldComplete = w.stages.length > 0 && completedCount === w.stages.length;
  }
  return out;
}

/** Verdadeiro se o mundo está bloqueado porque o anterior não foi concluído. */
async function isWorldLockedByProgression(
  userId: string,
  worldOrder: number,
): Promise<boolean> {
  if (worldOrder <= 0) return false;
  const prev = await prisma.world.findUnique({
    where: { order: worldOrder - 1 },
    include: { stages: { select: { id: true } } },
  });
  if (!prev || prev.stages.length === 0) return false;
  const done = await prisma.userProgress.count({
    where: {
      userId,
      status: 'COMPLETED',
      stageId: { in: prev.stages.map((s) => s.id) },
    },
  });
  return done < prev.stages.length;
}

/** Garante que a fase pode ser jogada; lança erro caso contrário. */
async function assertStageAccessible(
  userId: string,
  plan: string,
  stage: Stage & { world: { order: number } },
  godmode = false,
): Promise<void> {
  if (godmode) return;
  if (isPremiumLocked(plan, stage.world.order)) {
    throw new ForbiddenError(
      'Este mundo é exclusivo do plano Premium.',
      'PREMIUM_REQUIRED',
    );
  }
  if (await isWorldLockedByProgression(userId, stage.world.order)) {
    throw new ForbiddenError(
      'Complete o mundo anterior para desbloquear este.',
      'WORLD_LOCKED',
    );
  }
  // Fases anteriores do mesmo mundo precisam estar completas.
  if (stage.order > 1) {
    const prevStages = await prisma.stage.findMany({
      where: { worldId: stage.worldId, order: { lt: stage.order } },
      select: { id: true },
    });
    const done = await prisma.userProgress.count({
      where: {
        userId,
        status: 'COMPLETED',
        stageId: { in: prevStages.map((s) => s.id) },
      },
    });
    if (done < prevStages.length) {
      throw new ForbiddenError(
        'Complete a fase anterior primeiro.',
        'STAGE_LOCKED',
      );
    }
  }
}

// ─── Jogar uma Fase (PRD 15.3) ─────────────────────────────────
export async function getStagePlay(
  userId: string,
  plan: string,
  stageId: string,
  godmode = false,
): Promise<StagePlay> {
  const stage = await prisma.stage.findUnique({
    where: { id: stageId },
    include: {
      world: true,
      exercises: { orderBy: { order: 'asc' } },
    },
  });
  if (!stage) throw new NotFoundError('Fase não encontrada', 'STAGE_NOT_FOUND');

  await assertStageAccessible(userId, plan, stage, godmode);

  // Cada ENTRADA na fase começa uma sessão limpa: zera contadores se ainda não
  // foi concluída (a precisão passa a medir só esta tentativa).
  const existingProg = await prisma.userProgress.findUnique({ where: { userId_stageId: { userId, stageId } } });
  let progress;
  if (!existingProg) {
    progress = await prisma.userProgress.create({ data: { userId, stageId, status: 'IN_PROGRESS' } });
  } else if (existingProg.status !== 'COMPLETED') {
    progress = await prisma.userProgress.update({
      where: { userId_stageId: { userId, stageId } },
      data: { exercisesDone: 0, correctAnswers: 0, accuracy: 0, xpEarned: 0 },
    });
  } else {
    progress = existingProg;
  }

  const exercises: PublicExercise[] = stage.exercises.map((ex) => ({
    id: ex.id,
    order: ex.order,
    heroPosition: ex.heroPosition as Position,
    villainPosition: (ex.villainPosition as Position | null) ?? null,
    callerPosition: (ex.callerPosition as Position | null) ?? null,
    stackBb: ex.stackBb,
    potSize: ex.potSize,
    heroHand: ex.heroHand,
    board: ex.board,
    villainAction: ex.villainAction,
    difficulty: ex.difficulty as Difficulty,
    category: ex.category as Category,
    options: ACTIONS,
  }));

  const status: ProgressStatus =
    progress.status === 'COMPLETED' ? 'COMPLETED' : 'IN_PROGRESS';

  return {
    stage: toStageSummary(stage, status, stage.exercises.length === 0, progress),
    worldId: stage.worldId,
    worldName: stage.world.name,
    exercises,
  };
}

// ─── Registrar Resposta (PRD 15.3 / 15.5) ──────────────────────
export async function submitAnswer(
  userId: string,
  input: AnswerInput,
): Promise<AnswerResult> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { streak: true },
  });
  if (!user) throw new NotFoundError('Usuário não encontrado', 'USER_NOT_FOUND');

  const exercise = await prisma.exercise.findUnique({
    where: { id: input.exerciseId },
    include: { stage: { include: { world: true } } },
  });
  if (!exercise) {
    throw new NotFoundError('Exercício não encontrado', 'EXERCISE_NOT_FOUND');
  }

  const godmode = isGodmodeEmail(user.email);
  await assertStageAccessible(userId, user.plan, exercise.stage, godmode);

  // Limite diário no plano FREE (PRD 13.2).
  if (user.plan === 'FREE' && !godmode) {
    const todayCount = await prisma.userAnswer.count({
      where: { userId, createdAt: { gte: startOfToday() } },
    });
    if (todayCount >= FREE_DAILY_EXERCISE_LIMIT) {
      throw new ForbiddenError(
        `Limite diário de ${FREE_DAILY_EXERCISE_LIMIT} exercícios atingido. Assine o Premium para jogar sem limites.`,
        DAILY_LIMIT_CODE,
      );
    }
  }

  // ── Validação server-side da resposta (a correta nunca vai ao cliente). ──
  const correctAction = exercise.correctAction as Action;
  const correct = input.selectedAction === correctAction;
  const xpGained = correct ? exercise.xpValue : 0;

  await prisma.userAnswer.create({
    data: {
      userId,
      exerciseId: exercise.id,
      selectedAction: input.selectedAction,
      isCorrect: correct,
    },
  });

  // ── Atualiza o progresso da fase. ──
  const stage = exercise.stage;
  const existing = await prisma.userProgress.findUnique({
    where: { userId_stageId: { userId, stageId: stage.id } },
  });
  const wasCompleted = existing?.status === 'COMPLETED';

  // Reinício de tentativa: se a tentativa anterior percorreu todos os exercícios
  // sem concluir, zera os contadores para medir só a tentativa atual (evita que
  // a precisão vire "vitalícia" e trave a conclusão da fase).
  const sessionTarget = stage.minExercises > 0 ? stage.minExercises : await prisma.exercise.count({ where: { stageId: stage.id } });
  const freshAttempt = !wasCompleted && (existing?.exercisesDone ?? 0) >= sessionTarget;
  const baseDone = freshAttempt ? 0 : existing?.exercisesDone ?? 0;
  const baseCorrect = freshAttempt ? 0 : existing?.correctAnswers ?? 0;
  const baseXpEarned = freshAttempt ? 0 : existing?.xpEarned ?? 0;

  const exercisesDone = baseDone + 1;
  const correctAnswers = baseCorrect + (correct ? 1 : 0);
  const accuracy = correctAnswers / exercisesDone;
  let xpEarned = baseXpEarned + xpGained;

  // Conclusão da fase: mínimo de exercícios atingido + taxa de acerto (PRD 6.4).
  const meetsCompletion =
    exercisesDone >= stage.minExercises && accuracy >= stage.passRate;
  const stageCompleted = !wasCompleted && meetsCompletion;

  let totalXpDelta = xpGained;
  let status: ProgressStatus = wasCompleted ? 'COMPLETED' : 'IN_PROGRESS';
  if (stageCompleted) {
    status = 'COMPLETED';
    xpEarned += stage.xpReward;
    totalXpDelta += stage.xpReward;
  }

  await prisma.userProgress.upsert({
    where: { userId_stageId: { userId, stageId: stage.id } },
    update: {
      status,
      exercisesDone,
      correctAnswers,
      accuracy,
      xpEarned,
      completedAt: stageCompleted ? new Date() : existing?.completedAt ?? null,
    },
    create: {
      userId,
      stageId: stage.id,
      status,
      exercisesDone,
      correctAnswers,
      accuracy,
      xpEarned,
      completedAt: stageCompleted ? new Date() : null,
    },
  });

  // ── Conclusão do mundo: todas as fases completas (PRD 4.5). ──
  let worldCompleted = false;
  if (stageCompleted) {
    const worldStages = await prisma.stage.findMany({
      where: { worldId: stage.worldId },
      select: { id: true },
    });
    const completedInWorld = await prisma.userProgress.count({
      where: {
        userId,
        status: 'COMPLETED',
        stageId: { in: worldStages.map((s) => s.id) },
      },
    });
    if (completedInWorld === worldStages.length) {
      worldCompleted = true;
      totalXpDelta += XP_PER_WORLD_COMPLETE;
    }
  }

  // ── XP total e nível. ──
  const xpBefore = user.totalXp;
  const totalXp = xpBefore + totalXpDelta;
  const levelBefore = resolveLevel(xpBefore);
  const levelAfter = resolveLevel(totalXp);
  const leveledUp = levelAfter.level > levelBefore.level;

  await prisma.user.update({
    where: { id: userId },
    data: { totalXp },
  });

  // ── Streak (PRD 9.3): conta um novo dia de atividade. ──
  const streakNow = computeStreak({
    currentStreak: user.streak?.currentStreak ?? 0,
    maxStreak: user.streak?.maxStreak ?? 0,
    lastActiveAt: user.streak?.lastActiveAt ?? null,
  });
  await prisma.streak.upsert({
    where: { userId },
    update: {
      currentStreak: streakNow.currentStreak,
      maxStreak: streakNow.maxStreak,
      lastActiveAt: streakNow.lastActiveAt,
    },
    create: {
      userId,
      currentStreak: streakNow.currentStreak,
      maxStreak: streakNow.maxStreak,
      lastActiveAt: streakNow.lastActiveAt,
    },
  });

  // ── Conquistas. ──
  const newAchievements = await evaluateAchievements({
    userId,
    currentStreak: streakNow.currentStreak,
  });

  return {
    correct,
    correctAction,
    explanation: exercise.explanation,
    xpGained,
    totalXp,
    level: levelAfter.level,
    levelName: levelAfter.name,
    leveledUp,
    currentStreak: streakNow.currentStreak,
    newAchievements,
    stage: {
      stageId: stage.id,
      status,
      exercisesDone,
      correctAnswers,
      accuracy,
      xpEarned,
      minExercises: stage.minExercises,
      passRate: stage.passRate,
    },
    stageCompleted,
    worldCompleted,
    frequencies: parseFrequencies(exercise.frequencies, correctAction),
  };
}



// ─── Concluir uma AULA (fase sem exercícios) ───────────────────
export async function completeLesson(userId: string, stageId: string): Promise<LessonResult> {
  const user = await prisma.user.findUnique({ where: { id: userId }, include: { streak: true } });
  if (!user) throw new NotFoundError('Usuário não encontrado', 'USER_NOT_FOUND');

  const stage = await prisma.stage.findUnique({
    where: { id: stageId },
    include: { world: true, _count: { select: { exercises: true } } },
  });
  if (!stage) throw new NotFoundError('Fase não encontrada', 'STAGE_NOT_FOUND');
  if (stage._count.exercises > 0) {
    throw new ForbiddenError('Esta fase é de prática, não uma aula.', 'NOT_A_LESSON');
  }

  const godmode = isGodmodeEmail(user.email);
  await assertStageAccessible(userId, user.plan, stage, godmode);

  const existing = await prisma.userProgress.findUnique({
    where: { userId_stageId: { userId, stageId } },
  });
  const wasCompleted = existing?.status === 'COMPLETED';
  const xpGained = wasCompleted ? 0 : stage.xpReward;

  await prisma.userProgress.upsert({
    where: { userId_stageId: { userId, stageId } },
    update: {
      status: 'COMPLETED',
      xpEarned: wasCompleted ? existing?.xpEarned ?? 0 : stage.xpReward,
      completedAt: existing?.completedAt ?? new Date(),
    },
    create: { userId, stageId, status: 'COMPLETED', xpEarned: stage.xpReward, completedAt: new Date() },
  });

  const totalXp = user.totalXp + xpGained;
  const before = resolveLevel(user.totalXp);
  const after = resolveLevel(totalXp);
  if (xpGained > 0) await prisma.user.update({ where: { id: userId }, data: { totalXp } });

  const streakNow = computeStreak({
    currentStreak: user.streak?.currentStreak ?? 0,
    maxStreak: user.streak?.maxStreak ?? 0,
    lastActiveAt: user.streak?.lastActiveAt ?? null,
  });
  await prisma.streak.upsert({
    where: { userId },
    update: { currentStreak: streakNow.currentStreak, maxStreak: streakNow.maxStreak, lastActiveAt: streakNow.lastActiveAt },
    create: { userId, currentStreak: streakNow.currentStreak, maxStreak: streakNow.maxStreak, lastActiveAt: streakNow.lastActiveAt },
  });

  const newAchievements = await evaluateAchievements({ userId, currentStreak: streakNow.currentStreak });

  return {
    xpGained,
    totalXp,
    level: after.level,
    levelName: after.name,
    leveledUp: after.level > before.level,
    currentStreak: streakNow.currentStreak,
    newAchievements,
  };
}

// ─── Pular "Primeiros Passos" (Mundo 0) ────────────────────────
export async function skipBasics(userId: string): Promise<{ ok: true; count: number }> {
  const w0 = await prisma.world.findUnique({ where: { order: 0 }, include: { stages: { select: { id: true } } } });
  if (!w0) return { ok: true, count: 0 };
  for (const st of w0.stages) {
    await prisma.userProgress.upsert({
      where: { userId_stageId: { userId, stageId: st.id } },
      update: { status: 'COMPLETED', completedAt: new Date() },
      create: { userId, stageId: st.id, status: 'COMPLETED', completedAt: new Date() },
    });
  }
  return { ok: true, count: w0.stages.length };
}

// ─── Reset de progresso (debug) ────────────────────────────────
/** Apaga TODO o progresso do usuário (respostas, fases, conquistas, missões,
 *  streak) e zera o XP. Usado pelo botão temporário de reiniciar. */
export async function resetProgress(userId: string): Promise<{ ok: true }> {
  await prisma.$transaction([
    prisma.userAnswer.deleteMany({ where: { userId } }),
    prisma.userProgress.deleteMany({ where: { userId } }),
    prisma.userAchievement.deleteMany({ where: { userId } }),
    prisma.userMission.deleteMany({ where: { userId } }),
    prisma.streak.deleteMany({ where: { userId } }),
    prisma.user.update({ where: { id: userId }, data: { totalXp: 0 } }),
  ]);
  return { ok: true };
}

// ─── Debug (godmode): manipulação de estado para testes ────────
/** Define o plano da conta (FREE/PREMIUM) para testar o gating premium. */
export async function debugSetPlan(userId: string, plan: string): Promise<{ ok: true; plan: string }> {
  const p = plan === 'PREMIUM' ? 'PREMIUM' : 'FREE';
  await prisma.user.update({ where: { id: userId }, data: { plan: p } });
  return { ok: true, plan: p };
}

/** Soma XP (pode ser negativo; nunca abaixo de zero) para testar níveis. */
export async function debugAddXp(userId: string, amount: number): Promise<{ ok: true; totalXp: number }> {
  const u = await prisma.user.findUnique({ where: { id: userId }, select: { totalXp: true } });
  if (!u) throw new NotFoundError('Usuário não encontrado', 'USER_NOT_FOUND');
  const totalXp = Math.max(0, u.totalXp + Math.trunc(amount));
  await prisma.user.update({ where: { id: userId }, data: { totalXp } });
  return { ok: true, totalXp };
}

/** Marca TODAS as fases como concluídas (desbloqueia/testa fim de mundo). */
export async function debugCompleteAll(userId: string): Promise<{ ok: true; count: number }> {
  const stages = await prisma.stage.findMany({ select: { id: true } });
  for (const st of stages) {
    await prisma.userProgress.upsert({
      where: { userId_stageId: { userId, stageId: st.id } },
      update: { status: 'COMPLETED', completedAt: new Date() },
      create: { userId, stageId: st.id, status: 'COMPLETED', completedAt: new Date() },
    });
  }
  return { ok: true, count: stages.length };
}

// ─── Energia diária (Premium = infinita) ───────────────────────
export async function getEnergy(userId: string): Promise<EnergyState> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { plan: true, email: true } });
  if (!user) throw new NotFoundError('Usuário não encontrado', 'USER_NOT_FOUND');
  const max = FREE_DAILY_EXERCISE_LIMIT;
  if (user.plan === 'PREMIUM' || isGodmodeEmail(user.email)) {
    return { max, used: 0, remaining: max, infinite: true };
  }
  const used = await prisma.userAnswer.count({ where: { userId, createdAt: { gte: startOfToday() } } });
  return { max, used, remaining: Math.max(0, max - used), infinite: false };
}

// ─── Estatísticas por categoria (PRD 9) ────────────────────────
export async function getStats(userId: string): Promise<StatsResult> {
  const rows = await prisma.userAnswer.findMany({
    where: { userId },
    select: { isCorrect: true, exercise: { select: { category: true } } },
  });

  const acc = new Map<string, { total: number; correct: number }>();
  for (const c of CATEGORIES) acc.set(c, { total: 0, correct: 0 });
  let totalCorrect = 0;
  for (const r of rows) {
    const cat = r.exercise.category;
    const a = acc.get(cat) ?? { total: 0, correct: 0 };
    a.total++;
    if (r.isCorrect) { a.correct++; totalCorrect++; }
    acc.set(cat, a);
  }

  const byCategory: CategoryStat[] = CATEGORIES.map((category) => {
    const a = acc.get(category)!;
    return {
      category,
      label: CATEGORY_LABELS[category],
      total: a.total,
      correct: a.correct,
      accuracy: a.total ? a.correct / a.total : 0,
    };
  });

  return {
    totalAnswered: rows.length,
    totalCorrect,
    overallAccuracy: rows.length ? totalCorrect / rows.length : 0,
    byCategory,
  };
}

// ─── Revisão: mãos que o usuário ERROU ─────────────────────────
export async function getReview(userId: string): Promise<ReviewItem[]> {
  const wrong = await prisma.userAnswer.findMany({
    where: { userId, isCorrect: false },
    orderBy: { createdAt: 'desc' },
    include: { exercise: true },
    take: 200,
  });
  const seen = new Set<string>();
  const out: ReviewItem[] = [];
  for (const a of wrong) {
    if (seen.has(a.exerciseId)) continue;
    seen.add(a.exerciseId);
    const ex = a.exercise;
    const correct = ex.correctAction as Action;
    out.push({
      id: ex.id,
      heroPosition: ex.heroPosition as Position,
      villainPosition: (ex.villainPosition as Position | null) ?? null,
      callerPosition: (ex.callerPosition as Position | null) ?? null,
      stackBb: ex.stackBb,
      potSize: ex.potSize,
      heroHand: ex.heroHand,
      board: ex.board,
      villainAction: ex.villainAction,
      correctAction: correct,
      yourAction: a.selectedAction as Action,
      explanation: ex.explanation,
      frequencies: parseFrequencies(ex.frequencies, correct),
      category: ex.category as Category,
    });
    if (out.length >= 40) break;
  }
  return out;
}

// ─── Range (grid 13x13) ────────────────────────────────────────
export async function getRange(filters: {
  gameType: string; tableSize: string; stackBb: number; position: string;
}): Promise<RangeGrid | null> {
  const row = await prisma.range.findUnique({
    where: {
      gameType_tableSize_stackBb_position: {
        gameType: filters.gameType,
        tableSize: filters.tableSize,
        stackBb: filters.stackBb,
        position: filters.position,
      },
    },
  });
  if (!row) return null;
  let cells: RangeCell[][] = [];
  try { cells = JSON.parse(row.cells) as RangeCell[][]; } catch { cells = []; }
  return {
    gameType: row.gameType as GameType,
    tableSize: row.tableSize as TableSize,
    stackBb: row.stackBb,
    position: row.position as RangeGrid['position'],
    label: row.label,
    cells,
  };
}
