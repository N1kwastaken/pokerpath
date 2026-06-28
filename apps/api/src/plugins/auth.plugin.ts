import fp from 'fastify-plugin';
import fastifyJwt from '@fastify/jwt';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { env } from '../config/env.js';
import { createTokenService, type TokenService } from '../services/token.service.js';

/**
 * Plugin de autenticação.
 * - Registra @fastify/jwt com o segredo de access token.
 * - Expõe app.tokens (serviço de tokens).
 * - Adiciona o decorator request.authenticate para proteger rotas.
 */

declare module 'fastify' {
  interface FastifyInstance {
    tokens: TokenService;
    authenticate: (
      request: FastifyRequest,
      reply: FastifyReply,
    ) => Promise<void>;
  }
  interface FastifyRequest {
    user: { sub: string; email: string };
  }
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: { sub: string; email: string };
    user: { sub: string; email: string };
  }
}

export const authPlugin = fp(async (app) => {
  app.register(fastifyJwt, {
    secret: env.JWT_ACCESS_SECRET,
  });

  app.decorate('tokens', createTokenService(app));

  app.decorate(
    'authenticate',
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        await request.jwtVerify();
      } catch {
        return reply
          .status(401)
          .send({ error: 'Não autenticado', code: 'UNAUTHENTICATED' });
      }
    },
  );
});
