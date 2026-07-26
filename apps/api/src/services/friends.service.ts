import {
  achievementBadgeId,
  resolveLevel,
  STREAK_BADGE_DAYS,
  streakBadgeId,
  usernameSchema,
  type FriendProfileView,
  type FriendView,
  type FriendsResponse,
} from '@pokerpath/shared';
import { Prisma, type Streak, type User } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { viewStreak } from './streak.service.js';
import { parseShowcase } from './user.serializer.js';
import { BadRequestError, NotFoundError } from '../lib/errors.js';
import { isDeveloperAccount } from '../lib/godmode.js';

/**
 * Sistema de amigos: cada usuário pode ser encontrado pelo @ (ou pelo código
 * legado); ambos criam uma amizade MÚTUA, lida nos dois sentidos.
 */

// Sem 0/O/1/I — evita confusão ao ditar o código.
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
  let s = '';
  for (let i = 0; i < len; i++) s += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  return s;
}

function toFriendView(u: User & { streak: Streak | null }): FriendView {
  const lv = resolveLevel(u.totalXp);
  return {
    id: u.id,
    name: u.name,
    totalXp: u.totalXp,
    level: lv.level,
    levelName: lv.name,
    // Streak efetivo: um amigo que sumiu não pode aparecer com o elo antigo.
    currentStreak: viewStreak(u.streak).current,
    isDev: isDeveloperAccount(u),
    username: u.username,
    showcaseBadges: parseShowcase(u.showcaseBadges),
    avatar: u.avatar,
  };
}

/** O perfil público só existe para quem já é amigo — não vira busca de contas. */
function toFriendProfileView(
  u: User & { streak: Streak | null; achievements: { achievement: { code: string; name: string; description: string } }[] },
): FriendProfileView {
  const streak = viewStreak(u.streak);
  const maxStreak = Math.max(streak.current, u.streak?.maxStreak ?? 0);
  return {
    ...toFriendView(u),
    maxStreak,
    badges: [
      ...u.achievements.map(({ achievement }) => ({
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
  const u = await prisma.user.findUnique({ where: { id: userId }, select: { friendCode: true } });
  if (!u) throw new NotFoundError('Usuário não encontrado', 'USER_NOT_FOUND');
  if (u.friendCode) return u.friendCode;
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = randomCode();
    try {
      await prisma.user.update({ where: { id: userId }, data: { friendCode: code } });
      return code;
    } catch {
      // colisão de unique — tenta outro código
    }
  }
  throw new Error('Não foi possível gerar um código de amigo');
}

export async function listFriends(userId: string): Promise<FriendsResponse> {
  const code = await ensureFriendCode(userId);
  const rows = await prisma.friendship.findMany({
    where: { OR: [{ userId }, { friendId: userId }] },
    include: {
      user: { include: { streak: true } },
      friend: { include: { streak: true } },
    },
  });
  // Uma base antiga pode conter a dupla nos dois sentidos. A escrita nova é
  // canônica, mas a leitura continua tolerante e jamais repete alguém na lista.
  const byId = new Map<string, FriendView>();
  for (const row of rows) {
    const friend = row.userId === userId ? row.friend : row.user;
    byId.set(friend.id, toFriendView(friend));
  }
  const friends = [...byId.values()].sort((a, b) => b.totalXp - a.totalXp);
  return { code, friends };
}

async function createFriendship(
  userId: string,
  other: User & { streak: Streak | null },
): Promise<FriendView> {
  if (other.id === userId) throw new BadRequestError('Essa é a sua própria conta 😄', 'CANNOT_ADD_SELF');
  const exists = await prisma.friendship.findFirst({
    where: { OR: [{ userId, friendId: other.id }, { userId: other.id, friendId: userId }] },
  });
  if (exists) throw new BadRequestError('Vocês já são amigos.', 'ALREADY_FRIENDS');
  // Uma amizade é uma aresta sem direção. Gravar a dupla ordenada faz duas
  // requisições simultâneas (A adiciona B / B adiciona A) disputarem a mesma
  // constraint única, em vez de criar duas linhas espelhadas.
  const [firstId, secondId] = [userId, other.id].sort();
  try {
    await prisma.friendship.create({ data: { userId: firstId, friendId: secondId } });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new BadRequestError('Vocês já são amigos.', 'ALREADY_FRIENDS');
    }
    throw error;
  }
  return toFriendView(other);
}

/** Mantido para links e convites já existentes: código curto continua valendo. */
export async function addFriend(userId: string, rawCode: string): Promise<FriendView> {
  const code = rawCode.trim().toUpperCase();
  if (!code) throw new BadRequestError('Informe o código do seu amigo.', 'VALIDATION_ERROR');
  const other = await prisma.user.findUnique({ where: { friendCode: code }, include: { streak: true } });
  if (!other) throw new NotFoundError('Código não encontrado — confira com seu amigo.', 'FRIEND_CODE_NOT_FOUND');
  return createFriendship(userId, other);
}

/** Adiciona pelo identificador que aparece no perfil, com ou sem o @ digitado. */
export async function addFriendByUsername(userId: string, rawUsername: string): Promise<FriendView> {
  const candidate = rawUsername.trim().replace(/^@/, '');
  const parsed = usernameSchema.safeParse(candidate);
  if (!parsed.success) {
    throw new BadRequestError(parsed.error.errors[0]?.message ?? 'Usuário inválido.', 'VALIDATION_ERROR');
  }
  const other = await prisma.user.findUnique({ where: { username: parsed.data }, include: { streak: true } });
  if (!other) throw new NotFoundError('Esse @ não foi encontrado — confira com seu amigo.', 'USERNAME_NOT_FOUND');
  return createFriendship(userId, other);
}

/**
 * Mostra as conquistas de uma pessoa apenas depois da amizade existir. Assim
 * um id previsível não permite enumerar perfis ou dados de jogadores alheios.
 */
export async function getFriendProfile(userId: string, friendId: string): Promise<FriendProfileView> {
  const relationship = await prisma.friendship.findFirst({
    where: {
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
      achievements: { select: { achievement: { select: { code: true, name: true, description: true } } } },
    },
  });
  if (!friend) throw new NotFoundError('Amigo não encontrado.', 'FRIEND_NOT_FOUND');
  return toFriendProfileView(friend);
}

export async function removeFriend(userId: string, friendId: string): Promise<{ ok: true }> {
  await prisma.friendship.deleteMany({
    where: { OR: [{ userId, friendId }, { userId: friendId, friendId: userId }] },
  });
  return { ok: true };
}
