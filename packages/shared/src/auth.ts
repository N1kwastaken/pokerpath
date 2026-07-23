import { z } from 'zod';

/**
 * Schemas de autenticação compartilhados (PRD seções 4.1, 15.5).
 * Usados tanto na validação do backend quanto nos formulários do frontend,
 * garantindo regras idênticas nas duas pontas.
 */

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email('E-mail inválido');

export const passwordSchema = z
  .string()
  .min(8, 'A senha deve ter pelo menos 8 caracteres')
  .max(72, 'A senha deve ter no máximo 72 caracteres');

export const nameSchema = z
  .string()
  .trim()
  .min(2, 'O nome deve ter pelo menos 2 caracteres')
  .max(60, 'O nome deve ter no máximo 60 caracteres');

/**
 * @username — o identificador único (o "@" que aparece embaixo do nome).
 *
 * Regras deliberadas: minúsculas apenas, começa com letra, 3–20 chars de
 * `a-z 0-9 _`. Guardado em minúsculo, então a unicidade do banco já é
 * case-insensitive (não existem dois `@Joao` e `@joao`). Diferente do NOME
 * (livre, com acento e espaço), o @ é técnico e estável.
 */
export const USERNAME_COOLDOWN_DAYS = 30;
export const usernameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3, 'O @ deve ter pelo menos 3 caracteres')
  .max(20, 'O @ deve ter no máximo 20 caracteres')
  .regex(/^[a-z][a-z0-9_]*$/, 'Use apenas letras, números e _, começando com letra');

/** Base de @ a partir de um texto livre (nome/e-mail) — para gerar o padrão. */
export function slugifyUsername(seed: string): string {
  const base = seed
    .normalize('NFD').replace(/[̀-ͯ]/g, '') // tira acento
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .replace(/^[0-9]+/, ''); // @ não começa com número
  if (base.length >= 3) return base.slice(0, 15);
  return (base + 'player').slice(0, 15); // curto demais → completa
}

export const registerSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema,
});
export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Informe a senha'),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});
export type RefreshInput = z.infer<typeof refreshSchema>;

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token ausente'),
  password: passwordSchema,
});
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

/** Formato público do usuário retornado pela API (sem dados sensíveis). */
export interface PublicUser {
  id: string;
  name: string;
  /** @username único (null = ainda não escolheu). Mostrado abaixo do nome. */
  username: string | null;
  /** Quando o @ poderá ser trocado de novo (null = já pode). Regra de 30 dias. */
  usernameNextChangeAt: string | null;
  email: string;
  plan: 'FREE' | 'PREMIUM';
  /** Beta tester pré-launch: premium liberado + badge DEV. */
  isDev: boolean;
  totalXp: number;
  level: number;
  levelName: string;
  /** Streak EFETIVO: já considera dias sem jogar (0 = elo quebrado). */
  currentStreak: number;
  /** Jogou ontem e ainda não hoje — joga hoje ou perde o streak. */
  streakAtRisk: boolean;
  /** Já garantiu o dia de hoje. */
  streakPlayedToday: boolean;
  /** Recorde de dias seguidos — é o que destrava recompensas de streak
   *  (usar o máximo garante que cosmético conquistado nunca se perde). */
  maxStreak: number;
  /** Badges escolhidos para a vitrine do perfil (máx. 2, ordem preservada). */
  showcaseBadges: string[];
  /** Foto de perfil como data URI (null = usa a inicial do nome). */
  avatar: string | null;
  /** Recebe o lembrete diário de streak por e-mail. */
  emailReminders: boolean;
  onboardingCompleted: boolean;
  createdAt: string;
}

/** Amigo na lista (adicionado via código curto). */
export interface FriendView {
  id: string;
  name: string;
  username: string | null;
  totalXp: number;
  level: number;
  levelName: string;
  currentStreak: number;
  isDev: boolean;
  /** A vitrine dele — é o que faz escolher badge valer a pena. */
  showcaseBadges: string[];
  avatar: string | null;
}

/**
 * Limite da foto de perfil. O cliente reduz para 96px antes de enviar; o
 * servidor não decodifica a imagem, então o que ele PODE garantir é o
 * formato e o tamanho — o bastante para a coluna não virar armazenamento
 * genérico de dados arbitrários.
 */
export const AVATAR_MAX_CHARS = 14_000;
export const AVATAR_RE = /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/]+={0,2}$/;

export function isValidAvatar(v: string): boolean {
  return v.length <= AVATAR_MAX_CHARS && AVATAR_RE.test(v);
}

export interface FriendsResponse {
  /** Seu código para compartilhar. */
  code: string;
  friends: FriendView[];
}

/** Resposta padrão de autenticação. */
export interface AuthResponse {
  user: PublicUser;
  accessToken: string;
  refreshToken: string;
}
