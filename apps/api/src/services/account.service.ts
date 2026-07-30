import { prisma } from '../lib/prisma.js';
import { hashPassword, verifyPassword } from '../lib/password.js';
import { NotFoundError, UnauthorizedError } from '../lib/errors.js';

/**
 * Troca a senha e encerra todas as sessões persistentes da conta.
 *
 * O servidor exige a senha atual mesmo com JWT válido: um access token roubado
 * não basta para tomar a conta. A transação impede que o hash mude sem que os
 * refresh tokens sejam revogados junto.
 */
export async function updateAccountPassword(
  userId: string,
  currentPassword: string,
  newPassword: string,
): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { passwordHash: true },
  });
  if (!user) throw new NotFoundError('Usuário não encontrado', 'USER_NOT_FOUND');
  if (!(await verifyPassword(currentPassword, user.passwordHash))) {
    throw new UnauthorizedError('Senha atual incorreta.', 'INVALID_CREDENTIALS');
  }

  const passwordHash = await hashPassword(newPassword);
  const now = new Date();
  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    }),
    prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: now },
    }),
  ]);
}
