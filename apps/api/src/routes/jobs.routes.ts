import { timingSafeEqual } from 'node:crypto';
import type { FastifyInstance } from 'fastify';
import { prisma } from '../lib/prisma.js';
import { sendStreakReminders } from '../services/reminder.service.js';
import { verifyUnsubscribeToken } from '../lib/unsubscribe.js';
import { ForbiddenError } from '../lib/errors.js';

/**
 * Rotas de tarefa agendada e descadastro.
 *
 * O disparo é por HTTP (e não por um worker) para funcionar em qualquer
 * agendador: cron do Render, cron-job.org, GitHub Actions… Basta um POST com
 * o header do segredo. Sem CRON_SECRET configurado, a rota fica desligada.
 */
function assertCronSecret(header: string | undefined): void {
  const secret = process.env.CRON_SECRET;
  if (!secret) throw new ForbiddenError('Tarefas agendadas desativadas (defina CRON_SECRET).', 'CRON_DISABLED');
  const a = Buffer.from(header ?? '');
  const b = Buffer.from(secret);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    throw new ForbiddenError('Segredo inválido.', 'CRON_FORBIDDEN');
  }
}

export async function jobsRoutes(app: FastifyInstance) {
  app.post<{ Headers: { 'x-cron-secret'?: string } }>('/jobs/streak-reminder', async (request) => {
    assertCronSecret(request.headers['x-cron-secret']);
    const report = await sendStreakReminders();
    request.log.info({ report }, 'lembrete de streak enviado');
    return report;
  });

  // Descadastro em UM clique, sem login (o token é assinado). Responde HTML
  // porque quem chega aqui veio de um cliente de e-mail, não do app.
  app.get<{ Params: { token: string } }>('/unsubscribe/:token', async (request, reply) => {
    const userId = verifyUnsubscribeToken(request.params.token);
    const ok = !!userId;
    if (userId) {
      await prisma.user.update({ where: { id: userId }, data: { emailReminders: false } }).catch(() => {});
    }
    return reply.type('text/html').send(`<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>PokerPath</title></head>
<body style="margin:0;display:grid;place-items:center;min-height:100vh;background:#F4F6F5;
  font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;text-align:center;padding:24px;">
  <div style="max-width:420px;background:#fff;border:1px solid #E3E8E5;border-radius:16px;padding:32px;">
    <p style="margin:0 0 8px;font-size:20px;font-weight:800;color:#1B8A4C;">&#9824; PokerPath</p>
    <h1 style="margin:0 0 8px;font-size:18px;color:#16181D;">${ok ? 'Pronto, lembretes desativados' : 'Link inválido'}</h1>
    <p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:#3C4249;">
      ${ok
        ? 'Você não vai mais receber o lembrete diário de streak. Pode reativar quando quiser, no seu perfil.'
        : 'Não conseguimos validar este link de descadastro. Você pode desativar os lembretes no seu perfil.'}
    </p>
    <a href="${process.env.WEB_ORIGIN ?? '/'}" style="display:inline-block;background:#1B8A4C;color:#fff;
      text-decoration:none;font-weight:700;padding:12px 22px;border-radius:10px;">Voltar ao PokerPath</a>
  </div>
</body></html>`);
  });
}
