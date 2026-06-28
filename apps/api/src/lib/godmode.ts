/**
 * GODMODE (debug): contas que ignoram qualquer trava — todos os mundos/fases
 * desbloqueados, sem gating premium nem limite diário. Use só para depuração.
 */
const GODMODE_EMAILS = new Set<string>(['sousa@gmail.com']);

export function isGodmodeEmail(email: string | null | undefined): boolean {
  return !!email && GODMODE_EMAILS.has(email.toLowerCase());
}
