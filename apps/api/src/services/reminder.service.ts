import { prisma } from '../lib/prisma.js';
import { viewStreak } from './streak.service.js';
import { unsubscribeToken } from '../lib/unsubscribe.js';
import { sendMail, streakReminderMail, unsubscribeUrl } from './mail.service.js';

/**
 * Lembrete diário de streak.
 *
 * Quem recebe: jogou ONTEM e ainda não hoje (o streak morre à meia-noite) —
 * exatamente o `atRisk` do viewStreak, a mesma regra do banner no app.
 * Quem NÃO recebe: quem já jogou hoje, quem já perdeu o streak (aí não há o
 * que salvar), quem optou por não receber, e quem já foi lembrado hoje.
 *
 * Idempotente: pode ser chamado várias vezes no mesmo dia sem duplicar e-mail.
 */
export interface ReminderReport {
  candidates: number;
  sent: number;
  skipped: number;
  failed: number;
}

const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

export async function sendStreakReminders(now: Date = new Date()): Promise<ReminderReport> {
  // Só quem tem streak vivo e aceita lembrete. O corte fino (ontem x hoje)
  // é feito em memória com viewStreak, para não duplicar a regra em SQL.
  const streaks = await prisma.streak.findMany({
    where: { currentStreak: { gt: 0 }, lastActiveAt: { not: null }, user: { emailReminders: true } },
    include: { user: { select: { id: true, name: true, email: true } } },
  });

  const report: ReminderReport = { candidates: 0, sent: 0, skipped: 0, failed: 0 };

  for (const s of streaks) {
    const sv = viewStreak(s, now);
    if (!sv.atRisk) { report.skipped++; continue; }          // jogou hoje ou já perdeu
    if (s.remindedAt && sameDay(s.remindedAt, now)) { report.skipped++; continue; } // já avisado hoje
    report.candidates++;
    try {
      await sendMail({
        to: s.user.email,
        ...streakReminderMail(s.user.name, sv.current, unsubscribeUrl(unsubscribeToken(s.user.id))),
      });
      await prisma.streak.update({ where: { userId: s.user.id }, data: { remindedAt: now } });
      report.sent++;
    } catch {
      report.failed++; // um e-mail com problema não pode derrubar o lote
    }
  }
  return report;
}
