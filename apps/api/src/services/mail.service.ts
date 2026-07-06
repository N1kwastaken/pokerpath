/**
 * Envio de e-mail com driver plugável (env MAIL_DRIVER):
 *  - 'console' (padrão em dev): imprime o e-mail no log da API — nada é enviado.
 *  - 'resend': envia de verdade via Resend (exige RESEND_API_KEY e MAIL_FROM).
 * Trocar de driver em produção é só configurar as envs — nenhum código muda.
 */
export interface MailMessage {
  to: string;
  subject: string;
  html: string;
}

export async function sendMail(msg: MailMessage): Promise<void> {
  const driver = process.env.MAIL_DRIVER ?? 'console';
  if (driver === 'resend') return sendViaResend(msg);
  // Driver console: loga o conteúdo para copiar o link em dev.
  console.log('📧 [mail:console] ────────────────────────────────');
  console.log(`  Para: ${msg.to}`);
  console.log(`  Assunto: ${msg.subject}`);
  console.log(`  ${msg.html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()}`);
  console.log('──────────────────────────────────────────────────');
}

async function sendViaResend(msg: MailMessage): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.MAIL_FROM;
  if (!apiKey || !from) throw new Error('MAIL_DRIVER=resend exige RESEND_API_KEY e MAIL_FROM');
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from, to: msg.to, subject: msg.subject, html: msg.html }),
  });
  if (!res.ok) throw new Error(`Resend falhou (${res.status}): ${await res.text()}`);
}
