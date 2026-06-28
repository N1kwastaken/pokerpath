import { buildApp } from './app.js';
import { env } from './config/env.js';

/** Entrypoint do servidor. */
async function main() {
  const app = await buildApp();

  try {
    await app.listen({ port: env.PORT, host: env.HOST });
    app.log.info(`🚀 API rodando em http://${env.HOST}:${env.PORT}/api`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }

  // Encerramento gracioso.
  for (const signal of ['SIGINT', 'SIGTERM'] as const) {
    process.on(signal, async () => {
      app.log.info(`Recebido ${signal}, encerrando...`);
      await app.close();
      process.exit(0);
    });
  }
}

main();
