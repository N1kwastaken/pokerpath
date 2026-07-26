// Reconcilia a permissão DEV com a allow-list de @s do produto.
//
// Segurança: por padrão este script só mostra o que FARIA. Ele exige que as
// três contas existam antes de alterar qualquer uma, para não remover o único
// acesso de debug por engano. Uso:
//   npm run db:dev-accounts -w @pokerpath/api
//   npm run db:dev-accounts -w @pokerpath/api -- --apply
//
// Em produção, exporte DATABASE_URL explicitamente; não execute no deploy
// automático sem conferir o dry-run primeiro.
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

const DEV_USERNAMES = ['kowalski', 'sousa', 'dev'];
const apply = process.argv.slice(2).includes('--apply');
const prisma = new PrismaClient();

function printUser(user) {
  return `@${user.username ?? '—'}  ${user.email}  isDev=${user.isDev}`;
}

async function main() {
  const [targets, currentlyDev] = await Promise.all([
    prisma.user.findMany({
      where: { username: { in: DEV_USERNAMES } },
      select: { id: true, username: true, email: true, isDev: true },
      orderBy: { username: 'asc' },
    }),
    prisma.user.findMany({
      where: { isDev: true },
      select: { id: true, username: true, email: true, isDev: true },
      orderBy: { email: 'asc' },
    }),
  ]);

  const found = new Set(targets.map((u) => u.username));
  const missing = DEV_USERNAMES.filter((username) => !found.has(username));
  console.log('Contas DEV esperadas:');
  for (const username of DEV_USERNAMES) {
    const user = targets.find((u) => u.username === username);
    console.log(user ? `  ${printUser(user)}` : `  @${username}  AUSENTE`);
  }

  const targetIds = new Set(targets.map((u) => u.id));
  const toDemote = currentlyDev.filter((u) => !targetIds.has(u.id));
  console.log(`\nSerão removidas ${toDemote.length} permissão(ões) DEV fora da allow-list.`);
  for (const user of toDemote) console.log(`  ${printUser(user)}`);

  if (missing.length > 0) {
    throw new Error(
      `Abortado: faltam as contas ${missing.map((username) => `@${username}`).join(', ')}. ` +
      'Crie/recupere as contas corretas antes de reconciliar permissões.',
    );
  }

  if (!apply) {
    console.log('\nDry-run: nenhum dado foi alterado. Rode novamente com --apply para confirmar.');
    return;
  }

  const ids = targets.map((u) => u.id);
  const result = await prisma.$transaction(async (tx) => {
    const demoted = await tx.user.updateMany({
      where: { isDev: true, NOT: { id: { in: ids } } },
      data: { isDev: false, devSimulation: false },
    });
    const promoted = await tx.user.updateMany({
      where: { id: { in: ids } },
      data: { isDev: true, devSimulation: false },
    });
    return { demoted: demoted.count, promoted: promoted.count };
  });
  console.log(`\nConcluído: ${result.promoted} conta(s) confirmada(s) DEV; ${result.demoted} removida(s) da permissão DEV.`);
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
