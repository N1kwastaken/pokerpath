import bcrypt from 'bcryptjs';

/**
 * Hash de senhas (PRD 15.5). Custo 10 é um bom equilíbrio
 * entre segurança e performance para autenticação interativa.
 */
const SALT_ROUNDS = 10;

export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

export function verifyPassword(
  plain: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}
