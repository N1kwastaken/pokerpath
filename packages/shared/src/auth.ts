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
  email: string;
  plan: 'FREE' | 'PREMIUM';
  /** Beta tester pré-launch: premium liberado + badge DEV. */
  isDev: boolean;
  totalXp: number;
  level: number;
  levelName: string;
  currentStreak: number;
  onboardingCompleted: boolean;
  createdAt: string;
}

/** Amigo na lista (adicionado via código curto). */
export interface FriendView {
  id: string;
  name: string;
  totalXp: number;
  level: number;
  levelName: string;
  currentStreak: number;
  isDev: boolean;
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
