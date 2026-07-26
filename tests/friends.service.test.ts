import { beforeEach, describe, expect, it, vi } from 'vitest';

// O serviço é testado sem banco: a regra importante aqui é que a consulta do
// perfil pare ANTES de ler o usuário quando não há amizade entre as contas.
const db = vi.hoisted(() => ({
  friendship: {
    findFirst: vi.fn(),
    create: vi.fn(),
  },
  user: {
    findUnique: vi.fn(),
  },
}));

vi.mock('../apps/api/src/lib/prisma.js', () => ({ prisma: db }));

import { addFriendByUsername, getFriendProfile } from '../apps/api/src/services/friends.service.js';

const FRIEND = {
  id: 'friend-1',
  name: 'Ana',
  username: 'ana',
  totalXp: 420,
  isDev: false,
  showcaseBadges: JSON.stringify(['ach:FIRST_HAND', 'streak:3']),
  avatar: null,
  streak: {
    currentStreak: 3,
    maxStreak: 3,
    lastActiveAt: new Date(),
  },
  achievements: [{
    achievement: {
      code: 'FIRST_HAND',
      name: 'Primeira mão',
      description: 'Você respondeu seu primeiro exercício.',
    },
  }],
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('perfis de amigos', () => {
  it('não lê nem expõe um perfil fora de uma amizade', async () => {
    db.friendship.findFirst.mockResolvedValue(null);

    await expect(getFriendProfile('me', 'stranger')).rejects.toMatchObject({
      code: 'FRIEND_NOT_FOUND',
      statusCode: 404,
    });
    expect(db.friendship.findFirst).toHaveBeenCalledWith({
      where: {
        OR: [
          { userId: 'me', friendId: 'stranger' },
          { userId: 'stranger', friendId: 'me' },
        ],
      },
      select: { id: true },
    });
    expect(db.user.findUnique).not.toHaveBeenCalled();
  });

  it('expõe somente o cartão social e badges nomeadas para um amigo', async () => {
    db.friendship.findFirst.mockResolvedValue({ id: 'relation-1' });
    db.user.findUnique.mockResolvedValue(FRIEND);

    const profile = await getFriendProfile('me', FRIEND.id);

    expect(profile).toMatchObject({
      id: FRIEND.id,
      username: 'ana',
      maxStreak: 3,
      badges: [
        { id: 'ach:FIRST_HAND', name: 'Primeira mão' },
        { id: 'streak:3', name: 'Faísca · 3 dias' },
      ],
    });
    expect(profile).not.toHaveProperty('email');
    expect(profile).not.toHaveProperty('plan');
  });
});

describe('adicionar amigo por @', () => {
  it('normaliza o @ e cria a mesma amizade mútua do fluxo legado', async () => {
    db.user.findUnique.mockResolvedValue({ ...FRIEND, achievements: undefined });
    db.friendship.findFirst.mockResolvedValue(null);
    db.friendship.create.mockResolvedValue({ id: 'relation-1' });

    const friend = await addFriendByUsername('me', '@ANA');

    expect(db.user.findUnique).toHaveBeenCalledWith({
      where: { username: 'ana' },
      include: { streak: true },
    });
    // A dupla é canônica para uma corrida A→B / B→A não criar duas amizades.
    expect(db.friendship.create).toHaveBeenCalledWith({ data: { userId: FRIEND.id, friendId: 'me' } });
    expect(friend).toMatchObject({ id: FRIEND.id, username: 'ana' });
  });

  it('rejeita @ inválido antes de consultar qualquer conta', async () => {
    await expect(addFriendByUsername('me', '@não-válido')).rejects.toMatchObject({
      code: 'VALIDATION_ERROR',
      statusCode: 400,
    });
    expect(db.user.findUnique).not.toHaveBeenCalled();
  });
});
