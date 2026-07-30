import { describe, expect, it } from 'vitest';
import { loginSchema } from '@pokerpath/shared';

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
