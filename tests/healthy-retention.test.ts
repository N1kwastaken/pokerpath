import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { MISSIONS } from '../apps/api/prisma/seed.js';
import { streakReminderMail, welcomeMail } from '../apps/api/src/services/mail.service.js';

describe('retenção saudável', () => {
  it('mantém ao menos um dia de descanso até na missão semanal mais difícil', () => {
    const weeklyDayMissions = MISSIONS.filter((mission) => mission.code.startsWith('WEEKLY_') && mission.code.endsWith('_DAYS'));
    expect(Math.max(...weeklyDayMissions.map((mission) => mission.target))).toBeLessThanOrEqual(6);
  });

  it('lembra sem ameaçar apagar progresso ou usar culpa', () => {
    const reminder = streakReminderMail('Ana', 12, 'https://example.com/unsubscribe');
    const welcome = welcomeMail('Ana');
    expect(reminder.subject).toBe('Seu treino de hoje está disponível');
    expect(reminder.html).toContain('continuam salvos');
    expect(welcome.html).toContain('precisa descansar');
    for (const pressure of ['acaba hoje', 'não perca', 'Salvar meu streak']) {
      expect(reminder.html).not.toContain(pressure);
    }
  });

  it('a interface usa a mesma linguagem sem culpa', () => {
    const dashboard = readFileSync(
      new URL('../apps/web/src/pages/DashboardPage.tsx', import.meta.url),
      'utf8',
    );
    expect(dashboard).toContain('Seu progresso continua salvo');
    expect(dashboard).not.toContain('acaba hoje');
  });
});
