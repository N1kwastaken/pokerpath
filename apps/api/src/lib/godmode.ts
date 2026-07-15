/**
 * GODMODE (debug): contas que ignoram qualquer trava — todos os mundos/fases
 * desbloqueados, sem gating premium nem limite diário. Use só para depuração.
 */
const GODMODE_EMAILS = new Set<string>(['sousa@gmail.com']);

export function isGodmodeEmail(email: string | null | undefined): boolean {
  return !!email && GODMODE_EMAILS.has(email.toLowerCase());
}

/**
 * Plano EFETIVO para gating: contas DEV (beta testers pré-launch) são
 * tratadas como PREMIUM em todo lugar — fases premium e energia infinita.
 * A progressão normal (fase a fase) continua valendo, diferente do godmode.
 */
export function effectivePlan(user: { plan: string; isDev: boolean }): string {
  return user.isDev ? 'PREMIUM' : user.plan;
}
