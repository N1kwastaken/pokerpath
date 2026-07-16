import { createHmac, timingSafeEqual } from 'node:crypto';
import { env } from '../config/env.js';

/**
 * Token de descadastro: assinado (HMAC) e SEM estado no banco.
 * O link do e-mail precisa funcionar em um clique, sem login — mas não pode
 * deixar qualquer um descadastrar terceiros, então vai assinado.
 */
const sign = (userId: string) =>
  createHmac('sha256', env.JWT_ACCESS_SECRET).update(`unsub:${userId}`).digest('base64url');

export function unsubscribeToken(userId: string): string {
  return `${Buffer.from(userId).toString('base64url')}.${sign(userId)}`;
}

/** Devolve o userId se a assinatura confere; senão null. */
export function verifyUnsubscribeToken(token: string): string | null {
  const [idPart, sig] = token.split('.');
  if (!idPart || !sig) return null;
  let userId: string;
  try {
    userId = Buffer.from(idPart, 'base64url').toString('utf8');
  } catch {
    return null;
  }
  if (!userId) return null;
  const expected = Buffer.from(sign(userId));
  const got = Buffer.from(sig);
  if (expected.length !== got.length) return null;
  return timingSafeEqual(expected, got) ? userId : null;
}
