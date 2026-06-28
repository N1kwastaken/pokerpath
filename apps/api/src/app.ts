import Fastify from 'fastify';
import cors from '@fastify/cors';
import { ZodError } from 'zod';
import { env } from './config/env.js';
import { authPlugin } from './plugins/auth.plugin.js';
import { authRoutes } from './routes/auth.routes.js';
import { healthRoutes } from './routes/health.routes.js';
import { gameRoutes } from './routes/game.routes.js';
import { userRoutes } from './routes/user.routes.js';
import { AppError } from './lib/errors.js';

/**
 * Monta a instância do Fastify.
 * Separado do server.ts para facilitar testes de integração no futuro.
 */
export async function buildApp() {
  const app = Fastify({
    // Logger simples (JSON). Para logs formatados em dev, instale pino-pretty
    // e adicione um transport — opcional, não é dependência obrigatória.
    logger: {
      level: env.NODE_ENV === 'development' ? 'info' : 'warn',
    },
  });

  // ─── CORS (PRD 15.2) ─────────────────────────────────────
  await app.register(cors, {
    origin: env.WEB_ORIGIN,
    credentials: true,
  });

  // ─── Plugins ─────────────────────────────────────────────
  await app.register(authPlugin);

  // ─── Error handler global ────────────────────────────────
  app.setErrorHandler((error, request, reply) => {
    if (error instanceof AppError) {
      return reply
        .status(error.statusCode)
        .send({ error: error.message, code: error.code });
    }
    if (error instanceof ZodError) {
      return reply.status(400).send({
        error: error.errors[0]?.message ?? 'Dados inválidos',
        code: 'VALIDATION_ERROR',
      });
    }
    request.log.error(error);
    return reply
      .status(500)
      .send({ error: 'Erro interno do servidor', code: 'INTERNAL_ERROR' });
  });

  // ─── Rotas (prefixo /api) ────────────────────────────────
  await app.register(
    async (api) => {
      await healthRoutes(api);
      await authRoutes(api);
      await api.register(userRoutes);
      await api.register(gameRoutes);
    },
    { prefix: '/api' },
  );

  return app;
}
