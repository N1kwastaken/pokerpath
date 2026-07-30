import { describe, expect, it } from 'vitest';
import { changePasswordSchema, loginSchema } from '@pokerpath/shared';

describe('identificador de login', () => {
  it.each([
    ['e-mail', { identifier: ' Jogador@Example.COM ', password: 'senha' }, 'jogador@example.com'],
    ['username', { identifier: 'Jogador_1', password: 'senha' }, 'jogador_1'],
    ['@username', { identifier: ' @Sousa ', password: 'senha' }, 'sousa'],
    ['cliente antigo', { email: 'LEGADO@example.com', password: 'senha' }, 'legado@example.com'],
  ])('normaliza %s', (_label, input, expected) => {
    const parsed = loginSchema.parse(input);
    expect(parsed).toEqual({ identifier: expected, password: 'senha' });
  });

  it.each(['', '@@invalido', 'ab', 'nome com espaço', 'email-incompleto@'])(
    'rejeita identificador inválido: %j',
    (identifier) => {
      expect(loginSchema.safeParse({ identifier, password: 'senha' }).success).toBe(false);
    },
  );

  it('continua exigindo senha', () => {
    expect(loginSchema.safeParse({ identifier: '@sousa', password: '' }).success).toBe(false);
  });
});

describe('troca de senha', () => {
  it('aceita senha atual e uma nova senha válida', () => {
    expect(changePasswordSchema.safeParse({
      currentPassword: 'senha-atual',
      newPassword: 'nova-senha-segura',
    }).success).toBe(true);
  });

  it('rejeita senha nova curta, ausente ou igual à atual', () => {
    expect(changePasswordSchema.safeParse({
      currentPassword: 'senha-atual',
      newPassword: 'curta',
    }).success).toBe(false);
    expect(changePasswordSchema.safeParse({
      currentPassword: '',
      newPassword: 'nova-senha-segura',
    }).success).toBe(false);
    expect(changePasswordSchema.safeParse({
      currentPassword: 'senha-repetida',
      newPassword: 'senha-repetida',
    }).success).toBe(false);
  });
});
