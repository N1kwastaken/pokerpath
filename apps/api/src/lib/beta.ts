/**
 * Legado de compatibilidade. Beta aberto não concede mais DEV: somente a
 * allow-list persistida de contas administrativas pode receber essa permissão.
 * Novos cadastros usam `isDev: false` explicitamente em auth.routes.ts.
 */
export function betaSignup(): false {
  return false;
}
