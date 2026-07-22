/**
 * Modo BETA: contas novas nascem com `isDev = true` (Premium liberado como
 * agradecimento a quem testou cedo).
 *
 * Por que uma variável de ambiente e não o `@default(true)` do schema: virar
 * a chave no launch passaria a ser uma MIGRATION, e mudar o default de uma
 * coluna no SQLite obriga o Prisma a recriar a tabela `users` — exatamente o
 * RedefineTables que já zerou os friendCode deste projeto uma vez. Aqui a
 * troca é uma variável no Render, sem tocar no banco.
 *
 * O valor é lido a cada chamada de propósito: dá para desligar o beta
 * reiniciando o serviço, sem novo deploy.
 *
 * ATENÇÃO ao virar para false: quem já se cadastrou MANTÉM o Premium — o
 * campo é gravado por usuário no momento do cadastro, não calculado depois.
 */
export function betaSignup(): boolean {
  const v = process.env.BETA_SIGNUP;
  // Padrão true: hoje o produto ainda não tem como cobrar ninguém.
  return v === undefined ? true : v === 'true' || v === '1';
}
