import type { FastifyInstance } from 'fastify';

/** Healthcheck simples para monitoramento/uptime (PRD 17.3). */
export async function healthRoutes(app: FastifyInstance) {
  app.get('/health', async () => ({
    status: 'ok',
    timestamp: new Date().toISOString(),
  }));
}
