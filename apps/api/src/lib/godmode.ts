/**
 * As três identidades de desenvolvimento são uma allow-list deliberadamente
 * pequena. `isDev` é a permissão persistida no banco; o @ é a segunda
 * verificação legível que impede uma conta promovida por engano de receber
 * poderes de debug. Nunca use o @ sozinho como autorização: ele é editável.
 */
export const DEVELOPER_USERNAMES = ['kowalski', 'sousa', 'dev'] as const;
const DEVELOPER_USERNAME_SET = new Set<string>(DEVELOPER_USERNAMES);

export function isDeveloperUsername(username: string | null | undefined): boolean {
  return !!username && DEVELOPER_USERNAME_SET.has(username.toLowerCase());
}

export function isDeveloperAccount(user: {
  username?: string | null;
  isDev: boolean;
}): boolean {
  return user.isDev && isDeveloperUsername(user.username);
}

/**
 * A central continua disponível para toda conta DEV, mas ela pode desligar o
 * bypass para experimentar o jogo exatamente como uma conta FREE. A flag não
 * concede permissão: só reduz privilégios de uma identidade já autorizada.
 */
export function isDeveloperBypass(user: {
  username?: string | null;
  isDev: boolean;
  devSimulation?: boolean;
}): boolean {
  return isDeveloperAccount(user) && !user.devSimulation;
}

/** Os @ especiais não podem ser ocupados por um cadastro comum. */
export const isReservedDeveloperUsername = isDeveloperUsername;

/**
 * Verifica uma tentativa de troca de @. Os aliases DEV são identidades fixas:
 * uma conta DEV ativa não pode trocar de nome e se auto-remover da allow-list;
 * uma conta comum nunca pode ocupar um alias reservado.
 */
export function canClaimUsername(
  user: { username?: string | null; isDev: boolean },
  nextUsername: string | null | undefined,
): boolean {
  if (isDeveloperAccount(user)) {
    return user.username?.toLowerCase() === nextUsername?.toLowerCase();
  }
  return !isReservedDeveloperUsername(nextUsername);
}

/**
 * Plano efetivo para gating. A checagem falha fechada se a consulta esqueceu
 * `username`, em vez de transformar todo `isDev=true` legado em Premium.
 */
export function effectivePlan(user: {
  plan: string;
  isDev: boolean;
  username?: string | null;
  devSimulation?: boolean;
}): string {
  return isDeveloperBypass(user) ? 'PREMIUM' : user.plan;
}
