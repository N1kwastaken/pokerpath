import { resolveLevel, type FriendView, type FriendsResponse } from '@pokerpath/shared';
import type { Streak, User } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { viewStreak } from './streak.service.js';
import { parseShowcase } from './user.serializer.js';
import { BadRequestError, NotFoundError } from '../lib/errors.js';

/**
 * Sistema de amigos: cada usuário tem um CÓDIGO curto; adicionar pelo código
 * cria uma amizade MÚTUA (uma linha só, lida nos dois sentidos).
 */

// Sem 0/O/1/I — evita confusão ao ditar o código.
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
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
    isDev: u.isDev,
    showcaseBadges: parseShowcase(u.showcaseBadges),
    avatar: u.avatar,
  };
}

/** Garante que o usuário tem um friendCode (gera sob demanda). */
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
  const friends = rows
    .map((r) => (r.userId === userId ? r.friend : r.user))
    .map(toFriendView)
    .sort((a, b) => b.totalXp - a.totalXp);
  return { code, friends };
}

export async function addFriend(userId: string, rawCode: string): Promise<FriendView> {
  const code = rawCode.trim().toUpperCase();
  if (!code) throw new BadRequestError('Informe o código do seu amigo.', 'VALIDATION_ERROR');
  const other = await prisma.user.findUnique({ where: { friendCode: code }, include: { streak: true } });
  if (!other) throw new NotFoundError('Código não encontrado — confira com seu amigo.', 'FRIEND_CODE_NOT_FOUND');
  if (other.id === userId) throw new BadRequestError('Esse é o seu próprio código 😄', 'CANNOT_ADD_SELF');
  const exists = await prisma.friendship.findFirst({
    where: { OR: [{ userId, friendId: other.id }, { userId: other.id, friendId: userId }] },
  });
  if (exists) throw new BadRequestError('Vocês já são amigos.', 'ALREADY_FRIENDS');
  await prisma.friendship.create({ data: { userId, friendId: other.id } });
  return toFriendView(other);
}

export async function removeFriend(userId: string, friendId: string): Promise<{ ok: true }> {
  await prisma.friendship.deleteMany({
    where: { OR: [{ userId, friendId }, { userId: friendId, friendId: userId }] },
  });
  return { ok: true };
}
