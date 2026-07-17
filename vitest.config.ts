import { defineConfig } from 'vitest/config';

/**
 * Testes do monorepo, num projeto só (rodam em node, sem DOM).
 *
 * O alvo é o conteúdo e as regras de domínio — o que já causou bug de verdade:
 * charts × exercícios, cartas duplicadas, preflop atrás do paywall, streak.
 * Nada aqui toca o banco: o seed.ts só declara o conteúdo (quem executa é o
 * seed.main.ts), então dá para importar e conferir direto.
 */
export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
});
