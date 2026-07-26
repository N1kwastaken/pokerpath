// Troca de forma segura o e-mail da conta identificada por @sousa.
//
// Por padrão é somente leitura (dry-run). Para gravar:
//   npm run db:sousa-email -w @pokerpath/api -- --apply
//
// O script valida que existe uma única conta @sousa e que o e-mail de destino
// não pertence a outra pessoa. Também revoga refresh tokens para exigir novo
// login depois da troca. Não rode em produção sem fazer primeiro o dry-run.
import { PrismaClient } from '@prisma/client';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

if (!process.env.DATABASE_URL) {
  try {
    process.loadEnvFile?.(resolve(dirname(fileURLToPath(import.meta.url)), '../.env'));
  } catch {
    // Sem .env também funciona quando DATABASE_URL veio do ambiente.
  }
}

const USERNAME = 'sousa';
const TARGET_EMAIL = 'benjaminfarias.sousa@gmail.com';
const apply = process.argv.slice(2).includes('--apply');
const prisma = new PrismaClient();

async function main() {
  const accounts = await prisma.user.findMany({
    where: { username: USERNAME },
    select: { id: true, name: true, username: true, email: true },
  });
  if (accounts.length !== 1) {
    throw new Error(`Abortado: esperado exatamente uma conta @${USERNAME}; encontradas ${accounts.length}.`);
  }
  const account = accounts[0];
  const emailOwner = await prisma.user.findUnique({
    where: { email: TARGET_EMAIL },
    select: { id: true, username: true, email: true },
  });
  if (emailOwner && emailOwner.id !== account.id) {
    throw new Error(`Abortado: ${TARGET_EMAIL} já pertence a @${emailOwner.username ?? '—'}.`);
  }

  console.log(`Conta: ${account.name} (@${account.username})`);
  console.log(`E-mail atual: ${account.email}`);
  console.log(`Novo e-mail:  ${TARGET_EMAIL}`);
  if (account.email === TARGET_EMAIL) {
    console.log('\nNenhuma alteração necessária: o e-mail já está correto.');
    return;
  }
  if (!apply) {
    console.log('\nDry-run: nenhum dado foi alterado. Rode novamente com --apply para confirmar.');
    return;
  }

  const [, revoked] = await prisma.$transaction([
    prisma.user.update({ where: { id: account.id }, data: { email: TARGET_EMAIL } }),
    prisma.refreshToken.updateMany({
      where: { userId: account.id, revokedAt: null },
      data: { revokedAt: new Date() },
    }),
  ]);
  console.log(`\nE-mail atualizado. ${revoked.count} sessão(ões) persistente(s) revogada(s); entre novamente.`);
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
