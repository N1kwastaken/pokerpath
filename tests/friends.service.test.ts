import { beforeEach, describe, expect, it, vi } from 'vitest';

// Regras sociais são testadas sem banco para provar os portões de privacidade
// e consentimento antes de qualquer consulta de perfil.
const db = vi.hoisted(() => ({
  friendship: {
    findFirst: vi.fn(),
    findMany: vi.fn(),
    findUnique: vi.fn(),
    count: vi.fn(),
    create: vi.fn(),
    updateMany: vi.fn(),
    deleteMany: vi.fn(),
  },
  user: {
    findUnique: vi.fn(),
    update: vi.fn(),
  },
}));

vi.mock('../apps/api/src/lib/prisma.js', () => ({ prisma: db }));

import {
  acceptFriendRequest,
  deleteFriendRequest,
  getFriendProfile,
  listFriends,
  sendFriendRequestByUsername,
} from '../apps/api/src/services/friends.service.js';

const NOW = new Date('2026-07-29T12:00:00.000Z');
const FRIEND = {
  id: 'friend-1',
  name: 'Ana',
  username: 'ana',
  email: 'ana@example.com',
  totalXp: 420,
  isDev: false,
  showcaseBadges: JSON.stringify(['ach:FIRST_HAND', 'streak:3']),
  avatar: null,
  streak: {
    currentStreak: 3,
    maxStreak: 3,
    lastActiveAt: NOW,
  },
  achievements: [{
    achievement: {
      code: 'FIRST_HAND',
      name: 'Primeira mão',
      description: 'Você respondeu seu primeiro exercício.',
    },
  }],
};
const ME = {
  ...FRIEND,
  id: 'me',
  name: 'Benjamin',
  username: 'sousa',
  email: 'benjamin@example.com',
  totalXp: 100,
  showcaseBadges: null,
  streak: null,
  achievements: [],
};

beforeEach(() => {
  vi.clearAllMocks();
  db.friendship.count.mockResolvedValue(0);
});

describe('solicitações de amizade', () => {
  it('normaliza o @ e cria um pedido pendente com a dupla canônica', async () => {
    db.user.findUnique.mockResolvedValue({ ...FRIEND, achievements: undefined });
    db.friendship.findFirst.mockResolvedValue(null);
    db.friendship.create.mockResolvedValue({ id: 'request-1', createdAt: NOW });

    const request = await sendFriendRequestByUsername('me', '@ANA');

    expect(db.user.findUnique).toHaveBeenCalledWith({
      where: { username: 'ana' },
      include: { streak: true },
    });
    expect(db.friendship.create).toHaveBeenCalledWith({
      data: {
        userId: FRIEND.id,
        friendId: 'me',
        status: 'PENDING',
        requestedById: 'me',
      },
      select: { id: true, createdAt: true },
    });
    expect(request).toEqual({
      id: 'request-1',
      user: {
        id: FRIEND.id,
        name: FRIEND.name,
        username: FRIEND.username,
        avatar: null,
      },
      createdAt: NOW.toISOString(),
    });
    expect(request.user).not.toHaveProperty('totalXp');
    expect(request.user).not.toHaveProperty('showcaseBadges');
  });

  it('não transforma um pedido oposto em amizade automática', async () => {
    db.user.findUnique.mockResolvedValue({ ...FRIEND, achievements: undefined });
    db.friendship.findFirst.mockResolvedValue({
      status: 'PENDING',
      requestedById: FRIEND.id,
    });

    await expect(sendFriendRequestByUsername('me', 'ana')).rejects.toMatchObject({
      code: 'INCOMING_REQUEST_EXISTS',
      statusCode: 409,
    });
    expect(db.friendship.create).not.toHaveBeenCalled();
  });

  it('rejeita @ inválido antes de consultar qualquer conta', async () => {
    await expect(sendFriendRequestByUsername('me', '@não-válido')).rejects.toMatchObject({
      code: 'VALIDATION_ERROR',
      statusCode: 400,
    });
    expect(db.user.findUnique).not.toHaveBeenCalled();
  });

  it('respeita a recusa por sete dias para impedir reenvio insistente', async () => {
    db.user.findUnique.mockResolvedValue({ ...FRIEND, achievements: undefined });
    db.friendship.findFirst.mockResolvedValue({
      id: 'request-1',
      userId: FRIEND.id,
      friendId: 'me',
      status: 'REJECTED',
      requestedById: 'me',
      respondedAt: new Date(),
    });

    await expect(sendFriendRequestByUsername('me', 'ana')).rejects.toMatchObject({
      code: 'FRIEND_REQUEST_COOLDOWN',
      statusCode: 409,
    });
    expect(db.friendship.updateMany).not.toHaveBeenCalled();
  });

  it('limita pedidos simultâneos sem afetar amizades existentes', async () => {
    db.user.findUnique.mockResolvedValue({ ...FRIEND, achievements: undefined });
    db.friendship.findFirst.mockResolvedValue(null);
    db.friendship.count.mockResolvedValue(20);

    await expect(sendFriendRequestByUsername('me', 'ana')).rejects.toMatchObject({
      code: 'FRIEND_REQUEST_LIMIT',
      statusCode: 409,
    });
    expect(db.friendship.create).not.toHaveBeenCalled();
  });

  it('só o destinatário aceita e a mudança é atômica', async () => {
    db.friendship.findUnique.mockResolvedValue({
      id: 'request-1',
      userId: FRIEND.id,
      friendId: 'me',
      status: 'PENDING',
      requestedById: FRIEND.id,
      user: { ...FRIEND, achievements: undefined },
      friend: ME,
    });
    db.friendship.updateMany.mockResolvedValue({ count: 1 });

    const friend = await acceptFriendRequest('me', 'request-1');

    expect(db.friendship.updateMany).toHaveBeenCalledWith({
      where: {
        id: 'request-1',
        status: 'PENDING',
        requestedById: FRIEND.id,
      },
      data: {
        status: 'ACCEPTED',
        respondedAt: expect.any(Date),
      },
    });
    expect(friend).toMatchObject({ id: FRIEND.id, username: 'ana', totalXp: 420 });
  });

  it('impede o próprio remetente de aceitar seu pedido', async () => {
    db.friendship.findUnique.mockResolvedValue({
      id: 'request-1',
      userId: FRIEND.id,
      friendId: 'me',
      status: 'PENDING',
      requestedById: FRIEND.id,
      user: FRIEND,
      friend: ME,
    });

    await expect(acceptFriendRequest(FRIEND.id, 'request-1')).rejects.toMatchObject({
      code: 'FRIEND_REQUEST_NOT_FOUND',
      statusCode: 404,
    });
    expect(db.friendship.updateMany).not.toHaveBeenCalled();
  });

  it('diferencia cancelamento do remetente e recusa do destinatário', async () => {
    db.friendship.findUnique
      .mockResolvedValueOnce({
        id: 'outgoing',
        userId: FRIEND.id,
        friendId: 'me',
        status: 'PENDING',
        requestedById: 'me',
      })
      .mockResolvedValueOnce({
        id: 'incoming',
        userId: FRIEND.id,
        friendId: 'me',
        status: 'PENDING',
        requestedById: FRIEND.id,
      });
    db.friendship.deleteMany.mockResolvedValue({ count: 1 });
    db.friendship.updateMany.mockResolvedValue({ count: 1 });

    await expect(deleteFriendRequest('me', 'outgoing')).resolves.toEqual({
      ok: true,
      outcome: 'CANCELLED',
    });
    await expect(deleteFriendRequest('me', 'incoming')).resolves.toEqual({
      ok: true,
      outcome: 'REJECTED',
    });
    expect(db.friendship.updateMany).toHaveBeenLastCalledWith({
      where: {
        id: 'incoming',
        status: 'PENDING',
        requestedById: FRIEND.id,
      },
      data: {
        status: 'REJECTED',
        respondedAt: expect.any(Date),
      },
    });
  });
});

describe('lista social', () => {
  it('separa amizades, recebidos e enviados sem abrir dados privados no pedido', async () => {
    const requester = { ...FRIEND, id: 'friend-2', username: 'bia', name: 'Bia', totalXp: 999 };
    const target = { ...FRIEND, id: 'friend-3', username: 'caio', name: 'Caio', totalXp: 888 };
    db.user.findUnique.mockResolvedValue({ friendCode: 'ABC123' });
    db.friendship.findMany.mockResolvedValue([
      {
        id: 'accepted',
        userId: 'me',
        friendId: FRIEND.id,
        status: 'ACCEPTED',
        requestedById: null,
        createdAt: NOW,
        user: ME,
        friend: FRIEND,
      },
      {
        id: 'incoming',
        userId: requester.id,
        friendId: 'me',
        status: 'PENDING',
        requestedById: requester.id,
        createdAt: NOW,
        user: requester,
        friend: ME,
      },
      {
        id: 'outgoing',
        userId: target.id,
        friendId: 'me',
        status: 'PENDING',
        requestedById: 'me',
        createdAt: NOW,
        user: target,
        friend: ME,
      },
    ]);

    const result = await listFriends('me');

    expect(result.friends).toHaveLength(1);
    expect(result.incomingRequests[0]).toMatchObject({
      id: 'incoming',
      user: { id: requester.id, username: 'bia' },
    });
    expect(result.outgoingRequests[0]).toMatchObject({
      id: 'outgoing',
      user: { id: target.id, username: 'caio' },
    });
    expect(result.incomingRequests[0].user).not.toHaveProperty('totalXp');
  });
});

describe('perfis de amigos', () => {
  it('não lê nem expõe um perfil fora de uma amizade aceita', async () => {
    db.friendship.findFirst.mockResolvedValue(null);

    await expect(getFriendProfile('me', 'stranger')).rejects.toMatchObject({
      code: 'FRIEND_NOT_FOUND',
      statusCode: 404,
    });
    expect(db.friendship.findFirst).toHaveBeenCalledWith({
      where: {
        status: 'ACCEPTED',
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
