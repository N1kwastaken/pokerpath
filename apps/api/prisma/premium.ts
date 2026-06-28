import { PrismaClient } from '@prisma/client';

/**
 * Promove todas as contas existentes para o plano PREMIUM.
 * Uso (na pasta apps/api ou via workspace): npm run db:premium
 */
try {
  // Node >= 20.12 carrega o .env (apps/api/.env) — sem dependência externa.
  (process as { loadEnvFile?: (p?: string) => void }).loadEnvFile?.();
} catch {
  /* segue com process.env do ambiente */
}

const prisma = new PrismaClient();

async function main() {
  const r = await prisma.user.updateMany({ data: { plan: 'PREMIUM' } });
  console.log(`✓ ${r.count} conta(s) atualizada(s) para PREMIUM.`);
}

main()
  .catch((e) => {
    console.error('❌ Erro:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
