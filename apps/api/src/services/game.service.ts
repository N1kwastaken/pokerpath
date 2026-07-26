import {
  ACTIONS,
  CATEGORIES,
  CATEGORY_LABELS,
  resolveLevel,
  XP_PER_WORLD_COMPLETE,
  BASE_ENERGY_CAP,
  remainingEnergy,
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
  type GuestWorld,
  type GuestStagePlay,
  type ReviewItem,
  type ReviewAnswerResult,
  type WorldDetail,
  type WorldSummary,
} from '@pokerpath/shared';
import type { Stage, UserProgress } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { BadRequestError, ForbiddenError, NotFoundError } from '../lib/errors.js';
import { computeStreak } from './streak.service.js';
import { evaluateAchievements, consecutiveCorrect } from './achievement.service.js';
import { isDeveloperBypass, effectivePlan } from '../lib/godmode.js';
import { awardWorldReward } from './world-reward.service.js';
import { awardPerfectStageCoins, getEnergyCap } from './economy.service.js';

/** Todo o PRÉ-FLOP é grátis; o PÓS-FLOP (C-Bet em diante, Mundo 11+) é Premium. */
/**
 * Premium é POR FASE (coluna Stage.premium: postflop dos níveis 2+).
 * Para o usuário FREE, fases premium ficam bloqueadas mas NÃO travam a
 * progressão: a corrente pula por cima delas, e o mundo "conta como completo"
 * quando todas as fases grátis foram concluídas — assim todo o preflop segue
 * jogável em qualquer nível.
 */
function isStagePremiumLocked(plan: string, stagePremium: boolean): boolean {
  return plan === 'FREE' && stagePremium;
}

function startOfToday(): Date {
  const n = new Date();
  return new Date(n.getFullYear(), n.getMonth(), n.getDate());
}

function outOfEnergy(cap: number): ForbiddenError {
  return new ForbiddenError(
    `Sua energia de hoje acabou (${cap} exercícios). Volte amanhã ou expanda o cap com itens.`,
    DAILY_LIMIT_CODE,
  );
}

/**
 * Reserva uma das cargas diárias antes de uma resposta ser escrita. O UPDATE
 * condicional é a trava real contra duas abas consumirem a mesma última carga.
 * Na primeira leitura depois da migração, preserva as respostas já feitas hoje
 * como baseline para não dar energia extra por causa do rollout.
 */
async function consumeExerciseEnergy(userId: string, cap: number): Promise<void> {
  const today = startOfToday();

  for (let attempt = 0; attempt < 2; attempt++) {
    const current = await prisma.user.findUnique({
      where: { id: userId },
      select: { energyUsed: true, energyUsageDate: true },
    });
    if (!current) throw new NotFoundError('Usuário não encontrado', 'USER_NOT_FOUND');

    if (current.energyUsageDate && current.energyUsageDate >= today) {
      const reserved = await prisma.user.updateMany({
        where: { id: userId, energyUsageDate: { gte: today }, energyUsed: { lt: cap } },
        data: { energyUsed: { increment: 1 } },
      });
      if (reserved.count === 1) return;
      throw outOfEnergy(cap);
    }

    const historicalUsed = await prisma.userAnswer.count({
      where: { userId, createdAt: { gte: today } },
    });
    if (historicalUsed >= cap) throw outOfEnergy(cap);

    // Só uma requisição vence a troca de dia. Quem perder dá uma volta curta
    // no loop e usa o UPDATE condicional acima.
    const initialized = await prisma.user.updateMany({
      where: {
        id: userId,
        OR: [{ energyUsageDate: null }, { energyUsageDate: { lt: today } }],
      },
      data: { energyUsed: historicalUsed + 1, energyUsageDate: today },
    });
    if (initialized.count === 1) return;
  }

  // Só é alcançável se houve corrida exata na virada do dia; não libera uma
  // resposta sem reserva nessa situação rara.
  throw outOfEnergy(cap);
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
    premium: stage.premium,
    perfect: !!progress?.perfectAt,
    exercisesDone: progress?.exercisesDone ?? 0,
    correctAnswers: progress?.correctAnswers ?? 0,
    accuracy: progress?.accuracy ?? 0,
    xpEarned: progress?.xpEarned ?? 0,
  };
}


/**
 * Frequências GTO do exercício, ou `null` quando não há chart por trás do spot
 * (postflop, 4-bet, squeeze) — o seed grava a coluna vazia nesse caso.
 *
 * Sem default de propósito: o antigo "100% na ação certa" transformava a
 * ausência de dado numa afirmação de estratégia, e o cliente não tinha como
 * distinguir uma da outra. `null` faz o app esconder as barras.
 */
function parseFrequencies(json: string | null): Frequencies | null {
  if (!json) return null;
  try {
    const f = JSON.parse(json) as Partial<Frequencies>;
    return {
      FOLD: f.FOLD ?? 0,
      CALL: f.CALL ?? 0,
      RAISE: f.RAISE ?? 0,
      ...(f.ALLIN != null ? { ALLIN: f.ALLIN } : {}),
    };
  } catch {
    return null; // JSON corrompido não vira estratégia inventada
  }
}

// ─── Mapa de Mundos (PRD 8.5) ──────────────────────────────────
export async function getWorldsForUser(
  userId: string,
  plan: string,
  godmode = false,
): Promise<WorldSummary[]> {
  const worlds = await prisma.world.findMany({
    orderBy: { order: 'asc' },
    include: { stages: { select: { id: true, premium: true } } },
  });
  const progress = await prisma.userProgress.findMany({ where: { userId } });
  const progByStage = new Map(progress.map((p) => [p.stageId, p]));

  const result: WorldSummary[] = [];
  let prevWorldComplete = true;

  for (const w of worlds) {
    // O contador do mapa também segue a regra de progressão: para FREE,
    // conteúdo premium não infla o denominador nem esconde um mundo concluído.
    const required = w.stages.filter((s) => godmode || !isStagePremiumLocked(plan, s.premium));
    const total = required.length;
    const completed = required.filter(
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
      premiumLocked: false, // premium agora é por fase, não por mundo
      xpEarned,
    });

    // Para FREE, fases premium não contam como exigidas para "completar".
    const requiredDone = required.filter((s) => progByStage.get(s.id)?.status === 'COMPLETED').length;
    prevWorldComplete = required.length > 0 && requiredDone === required.length;
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
  const locked = godmode ? false : await isWorldLockedByProgression(userId, world.order, plan);
  const accessible = !locked;

  const progress = await prisma.userProgress.findMany({
    where: { userId, stageId: { in: world.stages.map((s) => s.id) } },
  });
  const progByStage = new Map(progress.map((p) => [p.stageId, p]));

  const stages: StageSummary[] = [];
  let prevStageComplete = true;
  for (const s of world.stages) {
    const p = progByStage.get(s.id);
    const premiumBlocked = !godmode && isStagePremiumLocked(plan, s.premium);
    let status: ProgressStatus;
    if (p?.status === 'COMPLETED') status = 'COMPLETED';
    else if (!premiumBlocked && accessible && (godmode || prevStageComplete)) status = 'IN_PROGRESS';
    else status = 'LOCKED';
    stages.push(toStageSummary(s, status, s._count.exercises === 0, p));
    // Fase premium não trava a corrente do usuário FREE.
    prevStageComplete = p?.status === 'COMPLETED' || premiumBlocked;
  }

  return {
    id: world.id,
    order: world.order,
    name: world.name,
    description: world.description,
    icon: world.icon,
    color: world.color,
    locked,
    premiumLocked: false,
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
    const progressionLocked = godmode ? false : w.order > 0 && !prevWorldComplete;
    const accessible = !progressionLocked;

    const stages: StageSummary[] = [];
    let prevStageComplete = true;
    let requiredCount = 0;
    let requiredDone = 0;
    for (const s of w.stages) {
      const p = byStage.get(s.id);
      const premiumBlocked = !godmode && isStagePremiumLocked(plan, s.premium);
      let status: ProgressStatus;
      if (p?.status === 'COMPLETED') status = 'COMPLETED';
      else if (!premiumBlocked && accessible && (godmode || prevStageComplete)) status = 'IN_PROGRESS';
      else status = 'LOCKED';
      stages.push(toStageSummary(s, status, s._count.exercises === 0, p));
      if (!premiumBlocked) {
        requiredCount++;
        if (p?.status === 'COMPLETED') requiredDone++;
      }
      // Fase premium não trava a corrente do usuário FREE.
      prevStageComplete = p?.status === 'COMPLETED' || premiumBlocked;
    }
    out.push({
      id: w.id, order: w.order, name: w.name, description: w.description,
      icon: w.icon, color: w.color, locked: progressionLocked, premiumLocked: false, stages,
    });
    prevWorldComplete = requiredCount > 0 && requiredDone === requiredCount;
  }
  return out;
}

/**
 * Verdadeiro se o mundo está bloqueado porque o anterior não foi concluído.
 * Para FREE, fases premium do mundo anterior não são exigidas.
 */
async function isWorldLockedByProgression(
  userId: string,
  worldOrder: number,
  plan: string,
): Promise<boolean> {
  if (worldOrder <= 0) return false;
  const prev = await prisma.world.findUnique({
    where: { order: worldOrder - 1 },
    include: { stages: { select: { id: true, premium: true } } },
  });
  if (!prev) return false;
  const required = prev.stages.filter((s) => !isStagePremiumLocked(plan, s.premium));
  if (required.length === 0) return false;
  const done = await prisma.userProgress.count({
    where: {
      userId,
      status: 'COMPLETED',
      stageId: { in: required.map((s) => s.id) },
    },
  });
  return done < required.length;
}

/** Fases anteriores do mesmo mundo completas? (premium não trava o FREE) */
async function prevStagesDone(
  userId: string,
  stage: Stage,
  plan: string,
): Promise<boolean> {
  if (stage.order <= 1) return true;
  const prevStages = await prisma.stage.findMany({
    where: { worldId: stage.worldId, order: { lt: stage.order } },
    select: { id: true, premium: true },
  });
  const required = prevStages.filter((s) => !isStagePremiumLocked(plan, s.premium));
  if (required.length === 0) return true;
  const done = await prisma.userProgress.count({
    where: { userId, status: 'COMPLETED', stageId: { in: required.map((s) => s.id) } },
  });
  return done >= required.length;
}

/** Garante que a fase pode ser jogada; lança erro caso contrário. */
async function assertStageAccessible(
  userId: string,
  plan: string,
  stage: Stage & { world: { order: number } },
  godmode = false,
): Promise<void> {
  if (godmode) return;
  if (isStagePremiumLocked(plan, stage.premium)) {
    throw new ForbiddenError(
      'Esta fase é exclusiva do plano Premium.',
      'PREMIUM_REQUIRED',
    );
  }
  // As duas checagens são independentes — em paralelo (latência do Neon).
  const [worldLocked, prevOk] = await Promise.all([
    isWorldLockedByProgression(userId, stage.world.order, plan),
    prevStagesDone(userId, stage, plan),
  ]);
  if (worldLocked) {
    throw new ForbiddenError(
      'Complete o mundo anterior para desbloquear este.',
      'WORLD_LOCKED',
    );
  }
  if (!prevOk) {
    throw new ForbiddenError(
      'Complete a fase anterior primeiro.',
      'STAGE_LOCKED',
    );
  }
}

/**
 * A última fase acabou de ser concluída: restou alguma OUTRA fase exigida?
 * Para contas FREE, premium não entra nesta conta — a mesma regra da trilha.
 */
async function finishesWorld(
  userId: string,
  stage: Stage,
  free: boolean,
): Promise<boolean> {
  const remaining = await prisma.stage.count({
    where: {
      worldId: stage.worldId,
      id: { not: stage.id },
      ...(free ? { premium: false } : {}),
      NOT: { progress: { some: { userId, status: 'COMPLETED' } } },
    },
  });
  return remaining === 0;
}

// ─── Jogar uma Fase (PRD 15.3) ─────────────────────────────────
export async function getStagePlay(
  userId: string,
  plan: string,
  stageId: string,
  godmode = false,
  resume = false,
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
  // foi concluída (a precisão passa a medir só esta tentativa). Com resume=true
  // a sessão parcial é preservada — o cliente retoma de onde parou.
  const existingProg = await prisma.userProgress.findUnique({ where: { userId_stageId: { userId, stageId } } });
  let progress;
  if (!existingProg) {
    progress = await prisma.userProgress.create({ data: { userId, stageId, status: 'IN_PROGRESS' } });
  } else if (resume) {
    progress = existingProg;
  } else if (existingProg.status !== 'COMPLETED') {
    progress = await prisma.userProgress.update({
      where: { userId_stageId: { userId, stageId } },
      data: { exercisesDone: 0, correctAnswers: 0, accuracy: 0, xpEarned: 0, attemptStartedAt: null },
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
    // Gabarito embutido → o cliente valida local e mostra feedback na hora;
    // o POST /answers grava XP/progresso em segundo plano.
    correctAction: ex.correctAction as Action,
    explanation: ex.explanation,
    frequencies: parseFrequencies(ex.frequencies),
  }));

  const status: ProgressStatus =
    progress.status === 'COMPLETED' ? 'COMPLETED' : 'IN_PROGRESS';

  return {
    stage: toStageSummary(stage, status, stage.exercises.length === 0, progress),
    worldId: stage.worldId,
    worldName: stage.world.name,
    worldOrder: stage.world.order,
    exercises,
  };
}

// ─── Registrar Resposta (PRD 15.3 / 15.5) ──────────────────────
export async function submitAnswer(
  userId: string,
  input: AnswerInput,
): Promise<AnswerResult> {
  // Fase 1 de leitura — usuário e exercício em paralelo (latência do Neon).
  const [user, exercise] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, include: { streak: true } }),
    prisma.exercise.findUnique({
      where: { id: input.exerciseId },
      include: { stage: { include: { world: true } } },
    }),
  ]);
  if (!user) throw new NotFoundError('Usuário não encontrado', 'USER_NOT_FOUND');
  if (!exercise) {
    throw new NotFoundError('Exercício não encontrado', 'EXERCISE_NOT_FOUND');
  }

  const godmode = isDeveloperBypass(user);
  const stage = exercise.stage;
  const isFree = effectivePlan(user) === 'FREE' && !godmode;

  // Fase 2 de leitura — acesso, limite diário, progresso e tamanho da sessão
  // são independentes entre si: tudo em paralelo (assertStageAccessible lança
  // se a fase estiver travada, antes de qualquer escrita).
  const [, energyCap, existing, sessionTarget] = await Promise.all([
    assertStageAccessible(userId, effectivePlan(user), stage, godmode),
    isFree ? getEnergyCap(userId) : Promise.resolve(BASE_ENERGY_CAP),
    prisma.userProgress.findUnique({
      where: { userId_stageId: { userId, stageId: stage.id } },
    }),
    stage.minExercises > 0
      ? Promise.resolve(stage.minExercises)
      : prisma.exercise.count({ where: { stageId: stage.id } }),
  ]);

  // A ordem da sessão é sorteada no cliente, então não dá para exigir ordem
  // numérica. Em vez disso, guardamos o início da tentativa e recusamos o
  // mesmo exercício duas vezes nela — requisito para uma estrela ser honesta.
  const freshAttempt = (existing?.exercisesDone ?? 0) >= sessionTarget;
  const baseDone = freshAttempt ? 0 : existing?.exercisesDone ?? 0;
  const baseCorrect = freshAttempt ? 0 : existing?.correctAnswers ?? 0;
  const baseXpEarned = freshAttempt ? 0 : existing?.xpEarned ?? 0;
  const attemptStartedAt = freshAttempt || !existing?.attemptStartedAt
    ? new Date()
    : existing.attemptStartedAt;

  if (!freshAttempt && baseDone > 0) {
    const alreadyAnswered = existing?.attemptStartedAt
      ? !!await prisma.userAnswer.findFirst({
        where: { userId, exerciseId: exercise.id, createdAt: { gte: existing.attemptStartedAt } },
        select: { id: true },
      })
      // Fallback de rollout para tentativas criadas antes de attemptStartedAt.
      : (await prisma.userAnswer.findMany({
        where: { userId, exercise: { stageId: stage.id } },
        orderBy: { createdAt: 'desc' },
        take: baseDone,
        select: { exerciseId: true },
      })).some((answer) => answer.exerciseId === exercise.id);
    if (alreadyAnswered) {
      throw new BadRequestError('Este exercício já faz parte da tentativa atual.', 'EXERCISE_ALREADY_ANSWERED');
    }
  }

  if (isFree) await consumeExerciseEnergy(userId, energyCap);

  // ── Validação server-side da resposta (a correta nunca vai ao cliente). ──
  const correctAction = exercise.correctAction as Action;
  const correct = input.selectedAction === correctAction;
  const xpGained = correct ? exercise.xpValue : 0;

  // ── Atualiza o progresso da fase. ──
  const wasCompleted = existing?.status === 'COMPLETED';

  // Reinício de tentativa: se a tentativa anterior percorreu todos os exercícios,
  // zera os contadores para medir só a tentativa atual (evita que a precisão
  // vire "vitalícia"). Vale também para REPLAYS de fase concluída — assim cada
  // rejogo é uma sessão própria e pode conquistar a estrela de sessão perfeita.
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

  // Sessão perfeita: percorreu a sessão inteira sem errar nenhuma (estrela).
  // Uma vez conquistada, a estrela é permanente — vale em qualquer replay.
  const perfectRun =
    sessionTarget > 0 && exercisesDone >= sessionTarget && correctAnswers === exercisesDone;
  const perfectAt = existing?.perfectAt ?? (perfectRun ? new Date() : null);

  // Fase perfeita mantém o custo de cada exercício, mas dá fichas uma única
  // vez. O ledger no serviço de economia impede crédito duplicado em replay.
  const earnsPerfectCoins = perfectRun && !existing?.perfectAt;

  // ── Conclusão do mundo (PRD 4.5): checada ANTES das escritas, em 1 consulta —
  // "existe alguma OUTRA fase deste mundo ainda não completa?".
  // Premium não vira requisito escondido para uma conta FREE: a mesma regra
  // determina o XP de conclusão e o baú cosmético.
  const worldCompleted = stageCompleted && await finishesWorld(userId, stage, isFree);
  if (worldCompleted) totalXpDelta += XP_PER_WORLD_COMPLETE;

  // ── XP total e nível. ──
  const xpBefore = user.totalXp;
  const totalXp = xpBefore + totalXpDelta;
  const levelBefore = resolveLevel(xpBefore);
  const levelAfter = resolveLevel(totalXp);
  const leveledUp = levelAfter.level > levelBefore.level;

  // ── Streak (PRD 9.3): conta um novo dia de atividade. ──
  const streakNow = computeStreak({
    currentStreak: user.streak?.currentStreak ?? 0,
    maxStreak: user.streak?.maxStreak ?? 0,
    lastActiveAt: user.streak?.lastActiveAt ?? null,
  });

  // ── Escritas: linhas independentes → tudo em paralelo (1 ida ao banco de
  // latência total, em vez de 4 em sequência).
  const [, , , , worldReward] = await Promise.all([
    prisma.userAnswer.create({
      data: {
        userId,
        exerciseId: exercise.id,
        selectedAction: input.selectedAction,
        isCorrect: correct,
      },
    }),
    prisma.userProgress.upsert({
      where: { userId_stageId: { userId, stageId: stage.id } },
      update: {
        status,
        exercisesDone,
        correctAnswers,
        accuracy,
        xpEarned,
        completedAt: stageCompleted ? new Date() : existing?.completedAt ?? null,
        perfectAt,
        attemptStartedAt,
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
        perfectAt,
        attemptStartedAt,
      },
    }),
    prisma.user.update({ where: { id: userId }, data: { totalXp } }),
    prisma.streak.upsert({
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
    }),
    worldCompleted
      ? awardWorldReward(userId, stage.world)
      : Promise.resolve(null),
  ]);

  // Só depois de persistir a sessão perfeita: assim uma falha de progresso não
  // pode criar fichas. A chave única usuário+fase impede duplicação.
  const coinsGained = earnsPerfectCoins
    ? await awardPerfectStageCoins(userId, stage.id)
    : 0;

  // Acertos seguidos (persiste entre fases/sessões/níveis, vem do log). Só há
  // sequência quando a resposta foi certa; no erro é 0 por definição.
  const answerStreak = correct ? await consecutiveCorrect(userId) : 0;

  // ── Conquistas — só reavalia o que esta resposta pode ter mudado. ──
  const newAchievements = await evaluateAchievements({
    userId,
    currentStreak: streakNow.currentStreak,
    answered: true,
    correct,
    category: exercise.category,
    stageCompleted,
    worldCompleted,
    answerStreak,
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
    answerStreak,
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
    worldReward,
    coinsGained,
    frequencies: parseFrequencies(exercise.frequencies),
  };
}



// ─── Concluir uma AULA (fase sem exercícios) ───────────────────
export async function completeLesson(userId: string, stageId: string, perfect = false): Promise<LessonResult> {
  // Leituras independentes em paralelo (latência do Neon em produção).
  const [user, stage, existing] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, include: { streak: true } }),
    prisma.stage.findUnique({
      where: { id: stageId },
      include: { world: true, _count: { select: { exercises: true } } },
    }),
    prisma.userProgress.findUnique({ where: { userId_stageId: { userId, stageId } } }),
  ]);
  if (!user) throw new NotFoundError('Usuário não encontrado', 'USER_NOT_FOUND');
  if (!stage) throw new NotFoundError('Fase não encontrada', 'STAGE_NOT_FOUND');
  if (stage._count.exercises > 0) {
    throw new ForbiddenError('Esta fase é de prática, não uma aula.', 'NOT_A_LESSON');
  }

  const godmode = isDeveloperBypass(user);
  await assertStageAccessible(userId, effectivePlan(user), stage, godmode);

  const wasCompleted = existing?.status === 'COMPLETED';
  const free = effectivePlan(user) === 'FREE' && !godmode;
  const worldCompleted = !wasCompleted && await finishesWorld(userId, stage, free);
  const xpGained = wasCompleted ? 0 : stage.xpReward;
  const worldXp = worldCompleted ? XP_PER_WORLD_COMPLETE : 0;

  const totalXp = user.totalXp + xpGained + worldXp;
  const before = resolveLevel(user.totalXp);
  const after = resolveLevel(totalXp);
  const streakNow = computeStreak({
    currentStreak: user.streak?.currentStreak ?? 0,
    maxStreak: user.streak?.maxStreak ?? 0,
    lastActiveAt: user.streak?.lastActiveAt ?? null,
  });

  // Aula perfeita entra no perfil, mas não gera fichas: só fases práticas
  // possuem exercícios e participam da economia.
  const perfectAt = existing?.perfectAt ?? (perfect ? new Date() : null);

  // Escritas independentes → em paralelo.
  const [, , , worldReward] = await Promise.all([
    prisma.userProgress.upsert({
      where: { userId_stageId: { userId, stageId } },
      update: {
        status: 'COMPLETED',
        xpEarned: wasCompleted ? existing?.xpEarned ?? 0 : stage.xpReward,
        completedAt: existing?.completedAt ?? new Date(),
        perfectAt,
      },
      create: { userId, stageId, status: 'COMPLETED', xpEarned: stage.xpReward, completedAt: new Date(), perfectAt },
    }),
    xpGained > 0 || worldXp > 0
      ? prisma.user.update({ where: { id: userId }, data: { totalXp } })
      : Promise.resolve(),
    prisma.streak.upsert({
      where: { userId },
      update: { currentStreak: streakNow.currentStreak, maxStreak: streakNow.maxStreak, lastActiveAt: streakNow.lastActiveAt },
      create: { userId, currentStreak: streakNow.currentStreak, maxStreak: streakNow.maxStreak, lastActiveAt: streakNow.lastActiveAt },
    }),
    worldCompleted
      ? awardWorldReward(userId, stage.world)
      : Promise.resolve(null),
  ]);

  // Aula não registra resposta nem conclui prática com nota — só conquistas
  // de streak/exploração podem mudar aqui.
  const newAchievements = await evaluateAchievements({
    userId,
    currentStreak: streakNow.currentStreak,
    answered: false,
    correct: false,
    stageCompleted: !wasCompleted,
    worldCompleted,
  });

  return {
    xpGained,
    totalXp,
    level: after.level,
    levelName: after.name,
    leveledUp: after.level > before.level,
    currentStreak: streakNow.currentStreak,
    newAchievements,
    worldCompleted,
    worldReward,
  };
}

// ─── Pular "Primeiros Passos" (Mundo 0) ────────────────────────
/**
 * Prova de nivelamento: marca todos os mundos ANTERIORES ao nível recomendado
 * como completos, colocando o usuário direto no nível certo (0 = do zero).
 */
export async function placeAtLevel(userId: string, level: number): Promise<{ ok: true; completed: number }> {
  const lv = Math.max(0, Math.min(3, Math.floor(level)));
  const worlds = await prisma.world.findMany({
    where: { order: { lt: lv } },
    include: { stages: { select: { id: true } } },
  });
  let completed = 0;
  for (const w of worlds) {
    for (const st of w.stages) {
      await prisma.userProgress.upsert({
        where: { userId_stageId: { userId, stageId: st.id } },
        update: { status: 'COMPLETED', completedAt: new Date() },
        create: { userId, stageId: st.id, status: 'COMPLETED', completedAt: new Date() },
      });
      completed++;
    }
  }
  return { ok: true, completed };
}

// ─── Modo convidado: Mundo 0 jogável sem conta ─────────────────
// O gabarito viaja junto (validação local) — exceção controlada, só nos
// fundamentos. Sem energia, XP nem progressão de servidor.

export async function getGuestWorld0(): Promise<GuestWorld> {
  const world = await prisma.world.findFirst({
    where: { order: 0 },
    include: {
      stages: { orderBy: { order: 'asc' }, include: { _count: { select: { exercises: true } } } },
    },
  });
  if (!world) throw new NotFoundError('Mundo não encontrado', 'WORLD_NOT_FOUND');
  return {
    id: world.id,
    order: world.order,
    name: world.name,
    description: world.description,
    icon: world.icon,
    color: world.color,
    stages: world.stages.map((s) => toStageSummary(s, 'IN_PROGRESS', s._count.exercises === 0)),
  };
}

export async function getGuestStage(stageId: string): Promise<GuestStagePlay> {
  const stage = await prisma.stage.findUnique({
    where: { id: stageId },
    include: { world: true, exercises: { orderBy: { order: 'asc' } } },
  });
  if (!stage) throw new NotFoundError('Fase não encontrada', 'STAGE_NOT_FOUND');
  if (stage.world.order !== 0) {
    throw new ForbiddenError('Crie uma conta grátis para jogar esta fase.', 'GUEST_LOCKED');
  }
  return {
    stage: toStageSummary(stage, 'IN_PROGRESS', stage.exercises.length === 0),
    worldId: stage.worldId,
    worldName: stage.world.name,
    worldOrder: stage.world.order,
    exercises: stage.exercises.map((ex) => ({
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
      correctAction: ex.correctAction as Action,
      explanation: ex.explanation,
      frequencies: parseFrequencies(ex.frequencies),
    })),
  };
}

/** Ao criar conta, o progresso de convidado vira progresso real (só Mundo 0). */
export async function graduateGuest(
  userId: string,
  stageIds: string[],
): Promise<{ ok: true; completed: number }> {
  if (stageIds.length === 0) return { ok: true, completed: 0 };
  const stages = await prisma.stage.findMany({
    where: { id: { in: stageIds }, world: { order: 0 } },
    select: { id: true },
  });
  for (const st of stages) {
    await prisma.userProgress.upsert({
      where: { userId_stageId: { userId, stageId: st.id } },
      update: { status: 'COMPLETED', completedAt: new Date() },
      create: { userId, stageId: st.id, status: 'COMPLETED', completedAt: new Date() },
    });
  }
  return { ok: true, completed: stages.length };
}

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
    prisma.userWorldReward.deleteMany({ where: { userId } }),
    prisma.userItem.deleteMany({ where: { userId } }),
    prisma.userPerfectStageReward.deleteMany({ where: { userId } }),
    prisma.userMission.deleteMany({ where: { userId } }),
    prisma.streak.deleteMany({ where: { userId } }),
    prisma.user.update({ where: { id: userId }, data: { totalXp: 0, coins: 0, energyUsed: 0, energyUsageDate: null } }),
  ]);
  return { ok: true };
}

// ─── Debug (DEV): manipulação de estado para testes ────────────
/**
 * Alterna a simulação real de plano. FREE liga o modo de simulação (sem
 * bypass); PREMIUM o encerra e restaura o acesso normal da conta DEV.
 */
export async function debugSetPlan(
  userId: string,
  plan: string,
  requestedSimulation?: boolean,
): Promise<{ ok: true; plan: string; simulation: boolean }> {
  const p = plan === 'PREMIUM' ? 'PREMIUM' : 'FREE';
  const simulation = p === 'FREE' && requestedSimulation !== false;
  await prisma.user.update({ where: { id: userId }, data: { plan: p, devSimulation: simulation } });
  return { ok: true, plan: p, simulation };
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
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { plan: true, username: true, isDev: true, devSimulation: true, energyUsed: true, energyUsageDate: true },
  });
  if (!user) throw new NotFoundError('Usuário não encontrado', 'USER_NOT_FOUND');
  const max = await getEnergyCap(userId);
  const capBonus = max - BASE_ENERGY_CAP;
  if (effectivePlan(user) === 'PREMIUM') {
    return { max, baseMax: BASE_ENERGY_CAP, capBonus, used: 0, remaining: max, infinite: true };
  }
  const today = startOfToday();
  const used = user.energyUsageDate && user.energyUsageDate >= today
    ? user.energyUsed
    : await prisma.userAnswer.count({ where: { userId, createdAt: { gte: today } } });
  return {
    max,
    baseMax: BASE_ENERGY_CAP,
    capBonus,
    used,
    remaining: remainingEnergy(max, used),
    infinite: false,
  };
}

// ─── Estatísticas por categoria (PRD 9) ────────────────────────
export async function getStats(userId: string): Promise<StatsResult> {
  // Ordenado por data para dar, de brinde, a MAIOR sequência de acertos.
  const [rows, streak] = await Promise.all([
    prisma.userAnswer.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
      select: { isCorrect: true, exercise: { select: { category: true } } },
    }),
    prisma.streak.findUnique({ where: { userId }, select: { maxStreak: true } }),
  ]);

  const acc = new Map<string, { total: number; correct: number }>();
  for (const c of CATEGORIES) acc.set(c, { total: 0, correct: 0 });
  let totalCorrect = 0;
  let bestAnswerStreak = 0, run = 0; // maior nº de acertos seguidos, sem erro
  for (const r of rows) {
    const cat = r.exercise.category;
    const a = acc.get(cat) ?? { total: 0, correct: 0 };
    a.total++;
    if (r.isCorrect) { a.correct++; totalCorrect++; run++; if (run > bestAnswerStreak) bestAnswerStreak = run; }
    else run = 0;
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
    maxDayStreak: streak?.maxStreak ?? 0,
    bestAnswerStreak,
    byCategory,
  };
}

// ─── Revisão: mãos que o usuário ERROU e ainda não corrigiu ────
// Varre as respostas recentes e fica só com a MAIS recente de cada exercício:
// se a última foi um acerto, o exercício SAIU da revisão (o usuário acertou de
// novo, na trilha ou no modo rejogar). Antes a lista só crescia.
async function pendingMistakes(userId: string) {
  const recent = await prisma.userAnswer.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    include: { exercise: true },
    take: 600,
  });
  const seen = new Set<string>();
  const out: { ex: (typeof recent)[number]['exercise']; yourAction: string }[] = [];
  for (const a of recent) {
    if (seen.has(a.exerciseId)) continue;
    seen.add(a.exerciseId);
    if (a.isCorrect) continue; // acertou por último → não é mais um erro
    out.push({ ex: a.exercise, yourAction: a.selectedAction });
    if (out.length >= 40) break;
  }
  return out;
}

export async function getReview(userId: string): Promise<ReviewItem[]> {
  const items = await pendingMistakes(userId);
  return items.map(({ ex, yourAction }) => ({
    id: ex.id,
    heroPosition: ex.heroPosition as Position,
    villainPosition: (ex.villainPosition as Position | null) ?? null,
    callerPosition: (ex.callerPosition as Position | null) ?? null,
    stackBb: ex.stackBb,
    potSize: ex.potSize,
    heroHand: ex.heroHand,
    board: ex.board,
    villainAction: ex.villainAction,
    correctAction: ex.correctAction as Action,
    yourAction: yourAction as Action,
    explanation: ex.explanation,
    frequencies: parseFrequencies(ex.frequencies),
    category: ex.category as Category,
  }));
}

/** Os mesmos erros, mas SEM gabarito — para REJOGAR (validação no servidor). */
export async function getReviewPlay(userId: string): Promise<PublicExercise[]> {
  const items = await pendingMistakes(userId);
  return items.map(({ ex }) => ({
    id: ex.id,
    order: 0,
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
    correctAction: ex.correctAction as Action,
    explanation: ex.explanation,
    frequencies: parseFrequencies(ex.frequencies),
  }));
}

/**
 * Responde um exercício NO MODO REVISÃO. Registra a resposta (é o que faz o
 * erro sumir da revisão quando o usuário acerta) mas NÃO dá XP, NÃO mexe no
 * progresso de fase e NÃO completa nada — é treino puro dos erros. Para uma
 * conta FREE, ainda custa uma energia porque é um exercício respondido.
 */
export async function answerReview(
  userId: string,
  exerciseId: string,
  selectedAction: Action,
): Promise<ReviewAnswerResult> {
  const [user, ex] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { plan: true, username: true, isDev: true, devSimulation: true } }),
    prisma.exercise.findUnique({ where: { id: exerciseId } }),
  ]);
  if (!user) throw new NotFoundError('Usuário não encontrado', 'USER_NOT_FOUND');
  if (!ex) throw new NotFoundError('Exercício não encontrado', 'EXERCISE_NOT_FOUND');
  if (effectivePlan(user) === 'FREE' && !isDeveloperBypass(user)) {
    await consumeExerciseEnergy(userId, await getEnergyCap(userId));
  }
  const correctAction = ex.correctAction as Action;
  const correct = selectedAction === correctAction;
  await prisma.userAnswer.create({ data: { userId, exerciseId, selectedAction, isCorrect: correct } });
  return { correct, correctAction, explanation: ex.explanation, frequencies: parseFrequencies(ex.frequencies) };
}

// ─── Range (grid 13x13) ────────────────────────────────────────
export async function getRange(filters: {
  gameType: string; tableSize: string; stackBb: number; position: string; scenario?: string;
}): Promise<RangeGrid | null> {
  const row = await prisma.range.findUnique({
    where: {
      gameType_tableSize_stackBb_position_scenario: {
        gameType: filters.gameType,
        tableSize: filters.tableSize,
        stackBb: filters.stackBb,
        position: filters.position,
        scenario: filters.scenario ?? 'RFI',
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
    scenario: row.scenario,
    label: row.label,
    cells,
  };
}
