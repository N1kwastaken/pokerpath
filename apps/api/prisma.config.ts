import { defineConfig } from 'prisma/config';

/**
 * Configuração nativa do Prisma CLI.
 *
 * O seed continua apontando para seed.main.ts: seed.ts apenas declara e
 * exporta o conteúdo, portanto não pode voltar a executar main() ao importar.
 */
export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.main.ts',
  },
});
