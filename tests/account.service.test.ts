import { beforeEach, describe, expect, it, vi } from 'vitest';

const db = vi.hoisted(() => ({
  user: {
    findUnique: vi.fn(),
    update: vi.fn(),
  },
  refreshToken: {
    updateMany: vi.fn(),
  },
  $transaction: vi.fn(),
}));
const passwords = vi.hoisted(() => ({
  hashPassword: vi.fn(),
  verifyPassword: vi.fn(),
}));

vi.mock('../apps/api/src/lib/prisma.js', () => ({ prisma: db }));
vi.mock('../apps/api/src/lib/password.js', () => passwords);

import { updateAccountPassword } from '../apps/api/src/services/account.service.js';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('troca de senha da conta', () => {
  it('recusa a senha atual incorreta sem gravar nada', async () => {
    db.user.findUnique.mockResolvedValue({ passwordHash: 'hash-antigo' });
    passwords.verifyPassword.mockResolvedValue(false);

    await expect(updateAccountPassword('user-1', 'incorreta', 'nova-senha-segura'))
      .rejects.toMatchObject({ code: 'INVALID_CREDENTIALS' });

    expect(passwords.hashPassword).not.toHaveBeenCalled();
    expect(db.user.update).not.toHaveBeenCalled();
    expect(db.refreshToken.updateMany).not.toHaveBeenCalled();
    expect(db.$transaction).not.toHaveBeenCalled();
  });

  it('troca o hash e revoga todos os refresh tokens na mesma transação', async () => {
    const updatePassword = Promise.resolve({ id: 'user-1' });
    const revokeSessions = Promise.resolve({ count: 3 });
    db.user.findUnique.mockResolvedValue({ passwordHash: 'hash-antigo' });
    passwords.verifyPassword.mockResolvedValue(true);
    passwords.hashPassword.mockResolvedValue('hash-novo');
    db.user.update.mockReturnValue(updatePassword);
    db.refreshToken.updateMany.mockReturnValue(revokeSessions);
    db.$transaction.mockResolvedValue([]);

    await updateAccountPassword('user-1', 'senha-atual', 'nova-senha-segura');

    expect(db.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: { passwordHash: 'hash-novo' },
    });
    expect(db.refreshToken.updateMany).toHaveBeenCalledWith({
      where: { userId: 'user-1', revokedAt: null },
      data: { revokedAt: expect.any(Date) },
    });
    expect(db.$transaction).toHaveBeenCalledWith([updatePassword, revokeSessions]);
  });
});
