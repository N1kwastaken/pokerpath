// Remove contas de TESTE do banco (as de e-mail @exemplo.com / @x.com criadas
// durante a verificação da feature de @username). Uso único, sob demanda.
//
// Como rodar apontando para produção (Neon):
//   DATABASE_URL="postgres://...seu-neon...?sslmode=require" \
//     node apps/api/prisma/purge-test-accounts.mjs
//
// Sem --apply ele só LISTA (dry-run). Com --apply, apaga (o delete cascateia
// para todo o dado da conta via os onDelete: Cascade do schema).
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const apply = process.argv.includes('--apply');

// Domínios que só aparecem em conta de teste. Ajuste se precisar.
const TEST_DOMAINS = ['@exemplo.com', '@x.com'];

async function main() {
  const where = { OR: TEST_DOMAINS.map((d) => ({ email: { endsWith: d } })) };
  const users = await prisma.user.findMany({ where, select: { id: true, name: true, email: true, username: true } });

  if (users.length === 0) {
    console.log('Nenhuma conta de teste encontrada.');
    return;
  }
  console.log(`${users.length} conta(s) de teste:`);
  for (const u of users) console.log(`  ${u.email}  (@${u.username ?? '—'}, ${u.name})`);

  if (!apply) {
    console.log('\nDry-run. Rode de novo com --apply para APAGAR de verdade.');
    return;
  }
  const res = await prisma.user.deleteMany({ where });
  console.log(`\nApagadas ${res.count} conta(s) (dados relacionados foram em cascata).`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
