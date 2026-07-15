// Gera prisma/schema.postgres.prisma a partir do schema.prisma (dev = SQLite),
// trocando apenas o provider do datasource. Usado no build de produção (Render):
// assim o schema principal continua sendo a única fonte de verdade.
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(resolve(here, 'schema.prisma'), 'utf8');

if (!src.includes('provider = "sqlite"')) {
  console.error('schema.prisma não tem provider = "sqlite" — revise este script.');
  process.exit(1);
}

const out =
  '// ARQUIVO GERADO — não edite. Fonte: schema.prisma (rode make-postgres-schema.mjs).\n' +
  src.replace('provider = "sqlite"', 'provider = "postgresql"');

writeFileSync(resolve(here, 'schema.postgres.prisma'), out);
console.log('✔ prisma/schema.postgres.prisma gerado (provider: postgresql)');
