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

/**
 * Identificador de login: aceita e-mail, `username` ou `@username`.
 *
 * O `@` visual não faz parte do username salvo no banco. Normalizar aqui
 * mantém frontend e API com a mesma regra e evita que diferenças de caixa ou
 * espaços façam uma credencial válida parecer incorreta.
 */
export const loginIdentifierSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, 'Informe seu e-mail ou @')
  .max(254, 'E-mail ou @ muito longo')
  .transform((value) => value.startsWith('@') ? value.slice(1) : value)
  .superRefine((value, ctx) => {
    const isEmail = emailSchema.safeParse(value).success;
    const isUsername = usernameSchema.safeParse(value).success;
    if (!isEmail && !isUsername) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Informe um e-mail ou @ válido',
      });
    }
  });

/**
 * `email` é aceito apenas na entrada para não quebrar versões antigas do web
 * que ainda estejam no cache durante um deploy. A saída é sempre `identifier`.
 */
export const loginSchema = z.preprocess((value) => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return value;
  const input = value as Record<string, unknown>;
  if (input.identifier !== undefined || input.email === undefined) return value;
  return { ...input, identifier: input.email };
}, z.object({
  identifier: loginIdentifierSchema,
  password: z.string().min(1, 'Informe a senha'),
}));
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
  /** Conta de desenvolvimento reconhecida pelo servidor. */
  isDev: boolean;
  /** Habilita a central de debug; a API continua validando cada operação. */
  debugEnabled: boolean;
  /** DEV desligou temporariamente o bypass para testar o fluxo FREE. */
  debugSimulation: boolean;
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

/** Estados persistidos da relação social. Prisma usa String; o Zod valida. */
export const friendshipStatusSchema = z.enum(['PENDING', 'ACCEPTED', 'REJECTED']);
export type FriendshipStatus = z.infer<typeof friendshipStatusSchema>;

/** Amigo confirmado na lista. */
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
 * Identidade mínima visível antes da amizade. XP, sequência, DEV e badges só
 * aparecem depois da aceitação para um @ conhecido não virar busca de perfis.
 */
export interface FriendRequestUserView {
  id: string;
  name: string;
  username: string | null;
  avatar: string | null;
}

export interface FriendRequestView {
  id: string;
  user: FriendRequestUserView;
  createdAt: string;
}

/** Um badge público já vem com o texto que a interface deve anunciar. */
export interface FriendBadgeView {
  id: string;
  name: string;
  description: string;
}

/**
 * Perfil de um amigo. Esta resposta deliberadamente não carrega e-mail,
 * plano ou dados de jogo: só a identidade e os feitos que a pessoa escolheu
 * compartilhar dentro da relação de amizade.
 */
export interface FriendProfileView extends FriendView {
  /** Melhor sequência já alcançada, usada para os badges de sequência. */
  maxStreak: number;
  /** Todos os badges já desbloqueados pelo amigo, com texto para a UI. */
  badges: FriendBadgeView[];
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
  /** Código legado, mantido para convites antigos; a interface usa o @. */
  code: string;
  /** Relações aceitas; só estas liberam perfil, ranking e badges. */
  friends: FriendView[];
  incomingRequests: FriendRequestView[];
  outgoingRequests: FriendRequestView[];
}

/** Resposta padrão de autenticação. */
export interface AuthResponse {
  user: PublicUser;
  accessToken: string;
  refreshToken: string;
}
