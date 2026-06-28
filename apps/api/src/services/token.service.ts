import type { FastifyInstance } from 'fastify';
import { prisma } from '../lib/prisma.js';
import { env } from '../config/env.js';

/**
 * Serviço de tokens (PRD 15.5).
 * - Access token: curto (15m), enviado em cada request.
 * - Refresh token: longo (30d), persistido para permitir revogação.
 */

export interface TokenPayload {
  sub: string; // user id
  email: string;
}

/** Converte "30d" / "15m" em milissegundos para calcular expiração no banco. */
function durationToMs(duration: string): number {
  const match = /^(\d+)([smhd])$/.exec(duration);
  if (!match) return 0;
  const value = Number(match[1]);
  const unit = match[2];
  const multipliers: Record<string, number> = {
    s: 1000,
    m: 60_000,
    h: 3_600_000,
    d: 86_400_000,
  };
  return value * (multipliers[unit] ?? 0);
}

export function createTokenService(app: FastifyInstance) {
  return {
    /** Gera um access token JWT assinado. */
    signAccessToken(payload: TokenPayload): string {
      return app.jwt.sign(payload, {
        expiresIn: env.JWT_ACCESS_EXPIRES_IN,
      });
    },

    /** Gera um refresh token, persiste no banco e retorna a string. */
    async issueRefreshToken(userId: string, email: string): Promise<string> {
      const token = app.jwt.sign(
        { sub: userId, email },
        { expiresIn: env.JWT_REFRESH_EXPIRES_IN },
      );
      const expiresAt = new Date(
        Date.now() + durationToMs(env.JWT_REFRESH_EXPIRES_IN),
      );
      await prisma.refreshToken.create({
        data: { token, userId, expiresAt },
      });
      return token;
    },

    /**
     * Rotaciona um refresh token: valida o antigo, revoga-o e emite um novo.
     * Retorna o novo par (access + refresh) ou null se inválido.
     */
    async rotateRefreshToken(
      oldToken: string,
    ): Promise<{ accessToken: string; refreshToken: string; userId: string } | null> {
      const stored = await prisma.refreshToken.findUnique({
        where: { token: oldToken },
      });

      if (
        !stored ||
        stored.revokedAt !== null ||
        stored.expiresAt < new Date()
      ) {
        return null;
      }

      let payload: TokenPayload;
      try {
        payload = app.jwt.verify<TokenPayload>(oldToken);
      } catch {
        return null;
      }

      // Revoga o antigo e emite o novo dentro de uma transação.
      await prisma.refreshToken.update({
        where: { id: stored.id },
        data: { revokedAt: new Date() },
      });

      const accessToken = this.signAccessToken({
        sub: payload.sub,
        email: payload.email,
      });
      const refreshToken = await this.issueRefreshToken(
        payload.sub,
        payload.email,
      );

      return { accessToken, refreshToken, userId: payload.sub };
    },

    /** Revoga um refresh token (logout). */
    async revokeRefreshToken(token: string): Promise<void> {
      await prisma.refreshToken
        .updateMany({
          where: { token, revokedAt: null },
          data: { revokedAt: new Date() },
        })
        .catch(() => undefined);
    },
  };
}

export type TokenService = ReturnType<typeof createTokenService>;
