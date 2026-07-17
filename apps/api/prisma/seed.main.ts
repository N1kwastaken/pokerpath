import { main, prisma } from './seed.js';

/**
 * Ponto de entrada do seed (`prisma db seed` e `deploy:db`).
 *
 * Existe separado do seed.ts de propósito: assim importar o conteúdo (WORLDS,
 * RANGE_DEFS...) num teste não dispara escrita no banco. A entrada é explícita
 * — se este arquivo sair do package.json, o comando falha em vez de rodar um
 * seed vazio em silêncio.
 *
 * O `prisma` vem do seed.ts: é a instância que fez o trabalho, e é ela que
 * precisa desconectar — um client novo aqui desconectaria o errado.
 */
main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
