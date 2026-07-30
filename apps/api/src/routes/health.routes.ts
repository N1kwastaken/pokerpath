import type { FastifyInstance } from 'fastify';

/** SHA curto do código em execução. Render fornece a variável automaticamente. */
export function runningVersion(environment: NodeJS.ProcessEnv = process.env): string {
  const commit = environment.RENDER_GIT_COMMIT ?? environment.GIT_COMMIT;
  return commit?.trim() ? commit.trim().slice(0, 7) : 'dev';
}

/** Healthcheck simples para monitoramento/uptime (PRD 17.3). */
export async function healthRoutes(app: FastifyInstance) {
  app.get('/health', async () => ({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: runningVersion(),
  }));
}
