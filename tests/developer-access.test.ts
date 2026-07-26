import { describe, expect, it } from 'vitest';
import {
  effectivePlan,
  canClaimUsername,
  isDeveloperAccount,
  isDeveloperBypass,
  isDeveloperUsername,
  isReservedDeveloperUsername,
} from '../apps/api/src/lib/godmode.js';

describe('allow-list de desenvolvimento', () => {
  it('reconhece somente os três @ reservados', () => {
    for (const username of ['kowalski', 'sousa', 'dev', 'DEV']) {
      expect(isDeveloperUsername(username)).toBe(true);
      expect(isReservedDeveloperUsername(username)).toBe(true);
    }
    for (const username of ['developer', 'dev1', 'sousa_', 'kowalsk1', null]) {
      expect(isDeveloperUsername(username)).toBe(false);
      expect(isReservedDeveloperUsername(username)).toBe(false);
    }
  });

  it('não dá permissão só porque o @ parece especial', () => {
    expect(isDeveloperAccount({ username: 'dev', isDev: false })).toBe(false);
    expect(isDeveloperAccount({ username: 'jogador', isDev: true })).toBe(false);
    expect(isDeveloperAccount({ username: 'sousa', isDev: true })).toBe(true);
  });

  it('reserva aliases contra tomada por uma conta comum', () => {
    expect(canClaimUsername({ username: 'jogador', isDev: false }, 'dev')).toBe(false);
    expect(canClaimUsername({ username: 'jogador', isDev: false }, 'novo_nome')).toBe(true);
    // A identidade DEV é fixa: trocar o @ derrubaria a conta da allow-list.
    expect(canClaimUsername({ username: 'kowalski', isDev: true }, 'sousa')).toBe(false);
    expect(canClaimUsername({ username: 'kowalski', isDev: true }, 'novo_nome')).toBe(false);
    expect(canClaimUsername({ username: 'kowalski', isDev: true }, 'kowalski')).toBe(true);
    // Uma flag legada sozinha não permite tomar um alias especial.
    expect(canClaimUsername({ username: 'jogador', isDev: true }, 'dev')).toBe(false);
  });

  it('falha fechada quando uma consulta esquece o @ e permite simular FREE', () => {
    expect(effectivePlan({ plan: 'FREE', isDev: true })).toBe('FREE');
    expect(effectivePlan({ plan: 'FREE', isDev: true, username: 'kowalski' })).toBe('PREMIUM');
    expect(isDeveloperBypass({ isDev: true, username: 'kowalski' })).toBe(true);
    expect(isDeveloperBypass({ isDev: true, username: 'kowalski', devSimulation: true })).toBe(false);
    expect(effectivePlan({ plan: 'FREE', isDev: true, username: 'kowalski', devSimulation: true })).toBe('FREE');
    expect(effectivePlan({ plan: 'PREMIUM', isDev: false, username: 'jogador' })).toBe('PREMIUM');
  });

});
