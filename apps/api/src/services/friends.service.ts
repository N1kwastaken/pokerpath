import {
  achievementBadgeId,
  friendshipStatusSchema,
  resolveLevel,
  STREAK_BADGE_DAYS,
  streakBadgeId,
  usernameSchema,
  type FriendProfileView,
  type FriendRequestUserView,
  type FriendRequestView,
  type FriendshipStatus,
  type FriendView,
  type FriendsResponse,
} from '@pokerpath/shared';
import { Prisma, type Streak, type User } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { viewStreak } from './streak.service.js';
import { parseShowcase } from './user.serializer.js';
import { BadRequestError, ConflictError, NotFoundError } from '../lib/errors.js';
import { isDeveloperAccount } from '../lib/godmode.js';

/**
 * Relação social canônica e sem direção:
 * - PENDING: só mostra identidade mínima até a outra pessoa aceitar;
 * - ACCEPTED: libera ranking, vitrine e perfil público completo.
 */
const STATUS = {
  PENDING: 'PENDING',
  ACCEPTED: 'ACCEPTED',
  REJECTED: 'REJECTED',
} as const satisfies Record<string, FriendshipStatus>;
const MAX_OUTGOING_REQUESTS = 20;
const REJECTED_REQUEST_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1_000;

// Sem 0/O/1/I — evita confusão nos convites antigos por código.
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const STREAK_BADGE_NAMES: Record<(typeof STREAK_BADGE_DAYS)[number], string> = {
  3: 'Faísca',
  7: 'Chama',
  14: 'Fogueira',
  30: 'Incêndio',
  60: 'Inferno',
  100: 'Chama fria',
};

function randomCode(len = 6): string {
  let value = '';
  for (let i = 0; i < len; i++) value += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  return value;
}

function toFriendView(user: User & { streak: Streak | null }): FriendView {
  const level = resolveLevel(user.totalXp);
  return {
    id: user.id,
    name: user.name,
    totalXp: user.totalXp,
    level: level.level,
    levelName: level.name,
    // Streak efetivo: um amigo que sumiu não pode aparecer com o elo antigo.
    currentStreak: viewStreak(user.streak).current,
    isDev: isDeveloperAccount(user),
    username: user.username,
    showcaseBadges: parseShowcase(user.showcaseBadges),
    avatar: user.avatar,
  };
}

function toFriendRequestUserView(user: User): FriendRequestUserView {
  return {
    id: user.id,
    name: user.name,
    username: user.username,
    avatar: user.avatar,
  };
}

function toFriendRequestView(
  row: { id: string; createdAt: Date },
  user: User,
): FriendRequestView {
  return {
    id: row.id,
    user: toFriendRequestUserView(user),
    createdAt: row.createdAt.toISOString(),
  };
}

/** O perfil público só existe para quem já é amigo — não vira busca de contas. */
function toFriendProfileView(
  user: User & {
    streak: Streak | null;
    achievements: { achievement: { code: string; name: string; description: string } }[];
  },
): FriendProfileView {
  const streak = viewStreak(user.streak);
  const maxStreak = Math.max(streak.current, user.streak?.maxStreak ?? 0);
  return {
    ...toFriendView(user),
    maxStreak,
    badges: [
      ...user.achievements.map(({ achievement }) => ({
        id: achievementBadgeId(achievement.code),
        name: achievement.name,
        description: achievement.description,
      })),
      ...STREAK_BADGE_DAYS.filter((days) => maxStreak >= days).map((days) => ({
        id: streakBadgeId(days),
        name: `${STREAK_BADGE_NAMES[days]} · ${days} dias`,
        description: `Recorde de sequência de ${days} dias.`,
      })),
    ],
  };
}

/** Garante que o usuário tem um friendCode legado (gera sob demanda). */
export async function ensureFriendCode(userId: string): Promise<string> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { friendCode: true } });
  if (!user) throw new NotFoundError('Usuário não encontrado', 'USER_NOT_FOUND');
  if (user.friendCode) return user.friendCode;

  for (let attempt = 0; attempt < 5; attempt++) {
    const code = randomCode();
    try {
      await prisma.user.update({ where: { id: userId }, data: { friendCode: code } });
      return code;
    } catch {
      // Colisão da constraint única — tenta outro código.
    }
  }
  throw new Error('Não foi possível gerar um código de amigo');
}

export async function listFriends(userId: string): Promise<FriendsResponse> {
  const code = await ensureFriendCode(userId);
  const rows = await prisma.friendship.findMany({
    where: {
      status: { in: [STATUS.PENDING, STATUS.ACCEPTED] },
      OR: [{ userId }, { friendId: userId }],
    },
    include: {
      user: { include: { streak: true } },
      friend: { include: { streak: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  // Uma base antiga pode conter a dupla nos dois sentidos. A leitura continua
  // tolerante e jamais repete alguém na lista de amizades aceitas.
  const acceptedById = new Map<string, FriendView>();
  const incomingRequests: FriendRequestView[] = [];
  const outgoingRequests: FriendRequestView[] = [];

  for (const row of rows) {
    const parsedStatus = friendshipStatusSchema.safeParse(row.status);
    if (!parsedStatus.success) continue;
    const other = row.userId === userId ? row.friend : row.user;

    if (parsedStatus.data === STATUS.ACCEPTED) {
      acceptedById.set(other.id, toFriendView(other));
      continue;
    }

    // PENDING sem solicitante é inválido e não deve abrir dados por acidente.
    if (row.requestedById === userId) {
      outgoingRequests.push(toFriendRequestView(row, other));
    } else if (row.requestedById === other.id) {
      incomingRequests.push(toFriendRequestView(row, other));
    }
  }

  const friends = [...acceptedById.values()].sort((a, b) => b.totalXp - a.totalXp);
  return { code, friends, incomingRequests, outgoingRequests };
}

function throwExistingRelationship(
  relation: { status: string; requestedById: string | null },
  userId: string,
): never {
  if (relation.status === STATUS.ACCEPTED) {
    throw new ConflictError('Vocês já são amigos.', 'ALREADY_FRIENDS');
  }
  if (relation.status === STATUS.PENDING && relation.requestedById === userId) {
    throw new ConflictError('Você já enviou uma solicitação para esse @.', 'REQUEST_ALREADY_SENT');
  }
  if (relation.status === STATUS.PENDING) {
    throw new ConflictError(
      'Essa pessoa já enviou uma solicitação para você. Confira os pedidos recebidos.',
      'INCOMING_REQUEST_EXISTS',
    );
  }
  throw new ConflictError('Já existe uma relação entre essas contas.', 'FRIEND_RELATION_EXISTS');
}

async function enforceOutgoingRequestLimit(userId: string): Promise<void> {
  const pending = await prisma.friendship.count({
    where: {
      status: STATUS.PENDING,
      requestedById: userId,
    },
  });
  if (pending >= MAX_OUTGOING_REQUESTS) {
    throw new ConflictError(
      `Você pode ter até ${MAX_OUTGOING_REQUESTS} solicitações aguardando resposta.`,
      'FRIEND_REQUEST_LIMIT',
    );
  }
}

async function createFriendRequest(
  userId: string,
  other: User & { streak: Streak | null },
): Promise<FriendRequestView> {
  if (other.id === userId) {
    throw new BadRequestError('Essa é a sua própria conta 😄', 'CANNOT_ADD_SELF');
  }

  const existing = await prisma.friendship.findFirst({
    where: {
      OR: [
        { userId, friendId: other.id },
        { userId: other.id, friendId: userId },
      ],
    },
    select: {
      id: true,
      userId: true,
      friendId: true,
      status: true,
      requestedById: true,
      respondedAt: true,
    },
  });
  if (existing && existing.status !== STATUS.REJECTED) {
    throwExistingRelationship(existing, userId);
  }

  await enforceOutgoingRequestLimit(userId);

  if (existing?.status === STATUS.REJECTED) {
    const cooldownEndsAt = (existing.respondedAt?.getTime() ?? 0) + REJECTED_REQUEST_COOLDOWN_MS;
    if (existing.requestedById === userId && cooldownEndsAt > Date.now()) {
      const days = Math.max(1, Math.ceil((cooldownEndsAt - Date.now()) / (24 * 60 * 60 * 1_000)));
      throw new ConflictError(
        `Esse pedido foi recusado recentemente. Você poderá tentar de novo em ${days} dia${days === 1 ? '' : 's'}.`,
        'FRIEND_REQUEST_COOLDOWN',
      );
    }

    const createdAt = new Date();
    const reused = await prisma.friendship.updateMany({
      where: {
        id: existing.id,
        status: STATUS.REJECTED,
        requestedById: existing.requestedById,
      },
      data: {
        status: STATUS.PENDING,
        requestedById: userId,
        respondedAt: null,
        createdAt,
      },
    });
    if (reused.count !== 1) {
      throw new ConflictError(
        'A solicitação mudou enquanto era enviada. Atualize e tente novamente.',
        'FRIEND_REQUEST_CHANGED',
      );
    }
    return toFriendRequestView({ id: existing.id, createdAt }, other);
  }

  // A dupla ordenada faz A→B e B→A disputarem a mesma constraint em corridas.
  const [firstId, secondId] = [userId, other.id].sort();
  try {
    const request = await prisma.friendship.create({
      data: {
        userId: firstId,
        friendId: secondId,
        status: STATUS.PENDING,
        requestedById: userId,
      },
      select: { id: true, createdAt: true },
    });
    return toFriendRequestView(request, other);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      const raced = await prisma.friendship.findFirst({
        where: {
          OR: [
            { userId, friendId: other.id },
            { userId: other.id, friendId: userId },
          ],
        },
        select: { status: true, requestedById: true },
      });
      if (raced) throwExistingRelationship(raced, userId);
      throw new ConflictError('Já existe uma solicitação entre essas contas.', 'FRIEND_REQUEST_EXISTS');
    }
    throw error;
  }
}

/** Código curto é só compatibilidade; também cria pedido, nunca amizade direta. */
export async function sendFriendRequestByCode(
  userId: string,
  rawCode: string,
): Promise<FriendRequestView> {
  const code = rawCode.trim().toUpperCase();
  if (!code) throw new BadRequestError('Informe o código do seu amigo.', 'VALIDATION_ERROR');
  const other = await prisma.user.findUnique({
    where: { friendCode: code },
    include: { streak: true },
  });
  if (!other) {
    throw new NotFoundError('Código não encontrado — confira com seu amigo.', 'FRIEND_CODE_NOT_FOUND');
  }
  return createFriendRequest(userId, other);
}

/** Envia pelo identificador visível no perfil, com ou sem o @ digitado. */
export async function sendFriendRequestByUsername(
  userId: string,
  rawUsername: string,
): Promise<FriendRequestView> {
  const candidate = rawUsername.trim().replace(/^@/, '');
  const parsed = usernameSchema.safeParse(candidate);
  if (!parsed.success) {
    throw new BadRequestError(
      parsed.error.errors[0]?.message ?? 'Usuário inválido.',
      'VALIDATION_ERROR',
    );
  }
  const other = await prisma.user.findUnique({
    where: { username: parsed.data },
    include: { streak: true },
  });
  if (!other) {
    throw new NotFoundError('Esse @ não foi encontrado — confira com seu amigo.', 'USERNAME_NOT_FOUND');
  }
  return createFriendRequest(userId, other);
}

export async function acceptFriendRequest(
  userId: string,
  requestId: string,
): Promise<FriendView> {
  const request = await prisma.friendship.findUnique({
    where: { id: requestId },
    include: {
      user: { include: { streak: true } },
      friend: { include: { streak: true } },
    },
  });
  if (
    !request
    || request.status !== STATUS.PENDING
    || request.requestedById === userId
    || ![request.userId, request.friendId].includes(userId)
    || ![request.userId, request.friendId].includes(request.requestedById ?? '')
  ) {
    throw new NotFoundError('Solicitação não encontrada.', 'FRIEND_REQUEST_NOT_FOUND');
  }

  const result = await prisma.friendship.updateMany({
    where: {
      id: request.id,
      status: STATUS.PENDING,
      requestedById: request.requestedById,
    },
    data: {
      status: STATUS.ACCEPTED,
      respondedAt: new Date(),
    },
  });
  if (result.count !== 1) {
    throw new ConflictError('Esse pedido já foi respondido.', 'FRIEND_REQUEST_CHANGED');
  }

  const other = request.userId === userId ? request.friend : request.user;
  return toFriendView(other);
}

/**
 * DELETE é contextual: o remetente cancela; o destinatário recusa. Nenhum dos
 * dois fluxos deixa histórico exposto nem bloqueia um pedido futuro.
 */
export async function deleteFriendRequest(
  userId: string,
  requestId: string,
): Promise<{ ok: true; outcome: 'CANCELLED' | 'REJECTED' }> {
  const request = await prisma.friendship.findUnique({
    where: { id: requestId },
    select: {
      id: true,
      userId: true,
      friendId: true,
      status: true,
      requestedById: true,
    },
  });
  if (
    !request
    || request.status !== STATUS.PENDING
    || ![request.userId, request.friendId].includes(userId)
    || ![request.userId, request.friendId].includes(request.requestedById ?? '')
  ) {
    throw new NotFoundError('Solicitação não encontrada.', 'FRIEND_REQUEST_NOT_FOUND');
  }

  const outcome = request.requestedById === userId ? 'CANCELLED' : 'REJECTED';
  const where = {
    id: request.id,
    status: STATUS.PENDING,
    requestedById: request.requestedById,
  };
  const result = outcome === 'CANCELLED'
    ? await prisma.friendship.deleteMany({ where })
    : await prisma.friendship.updateMany({
      where,
      data: {
        status: STATUS.REJECTED,
        respondedAt: new Date(),
      },
    });
  if (result.count !== 1) {
    throw new ConflictError('Esse pedido já foi respondido.', 'FRIEND_REQUEST_CHANGED');
  }
  return {
    ok: true,
    outcome,
  };
}

/**
 * Mostra conquistas somente depois da aceitação. Um pedido pendente não
 * permite enumerar perfil, XP, sequência ou badges.
 */
export async function getFriendProfile(userId: string, friendId: string): Promise<FriendProfileView> {
  const relationship = await prisma.friendship.findFirst({
    where: {
      status: STATUS.ACCEPTED,
      OR: [
        { userId, friendId },
        { userId: friendId, friendId: userId },
      ],
    },
    select: { id: true },
  });
  if (!relationship) throw new NotFoundError('Amigo não encontrado.', 'FRIEND_NOT_FOUND');

  const friend = await prisma.user.findUnique({
    where: { id: friendId },
    include: {
      streak: true,
      achievements: {
        select: {
          achievement: {
            select: { code: true, name: true, description: true },
          },
        },
      },
    },
  });
  if (!friend) throw new NotFoundError('Amigo não encontrado.', 'FRIEND_NOT_FOUND');
  return toFriendProfileView(friend);
}

export async function removeFriend(userId: string, friendId: string): Promise<{ ok: true }> {
  await prisma.friendship.deleteMany({
    where: {
      status: STATUS.ACCEPTED,
      OR: [
        { userId, friendId },
        { userId: friendId, friendId: userId },
      ],
    },
  });
  return { ok: true };
}
