import { env } from '../config/env.js';

/**
 * Envio de e-mail com driver plugável (env MAIL_DRIVER):
 *  - 'console' (padrão em dev): imprime o e-mail no log da API — nada é enviado.
 *  - 'resend': envia de verdade via Resend (exige RESEND_API_KEY e MAIL_FROM).
 * Trocar de driver em produção é só configurar as envs — nenhum código muda.
 *
 * Os e-mails do produto ficam aqui embaixo (layout + templates tipados), para
 * que as rotas não montem HTML na mão.
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
  // Os href são extraídos ANTES de remover as tags — a limpeza engolia
  // justamente a URL, que é o motivo de existir deste driver.
  const links = [...msg.html.matchAll(/href="([^"]+)"/g)].map((m) => m[1]);
  console.log('📧 [mail:console] ────────────────────────────────');
  console.log(`  Para: ${msg.to}`);
  console.log(`  Assunto: ${msg.subject}`);
  console.log(`  ${msg.html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()}`);
  for (const l of links) console.log(`  🔗 ${l}`);
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

// ─── Templates ────────────────────────────────────────────────
// Regras: HTML de e-mail é conservador — tabelas, estilo inline, sem CSS
// externo. Nada de imagem remota (o Gmail bloqueia por padrão): o "logo" é
// texto. Cores batem com a marca do app.

const BRAND = '#1B8A4C';
const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));

/** Casca comum: cabeçalho da marca, corpo e rodapé (com descadastro). */
function layout(opts: { title: string; body: string; cta?: { label: string; href: string }; footer?: string }): string {
  const cta = opts.cta
    ? `<tr><td style="padding:28px 32px 4px;">
         <a href="${opts.cta.href}" style="display:inline-block;background:${BRAND};color:#fff;text-decoration:none;
            font-weight:800;font-size:16px;padding:14px 28px;border-radius:12px;">${escapeHtml(opts.cta.label)}</a>
       </td></tr>`
    : '';
  return `<!doctype html>
<html lang="pt-BR"><body style="margin:0;padding:24px 12px;background:#F4F6F5;
  font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:560px;margin:0 auto;
    background:#fff;border-radius:16px;overflow:hidden;border:1px solid #E3E8E5;">
    <tr><td style="background:${BRAND};padding:20px 32px;">
      <span style="color:#fff;font-size:20px;font-weight:800;letter-spacing:-0.3px;">&#9824; PokerPath</span>
    </td></tr>
    <tr><td style="padding:32px 32px 0;">
      <h1 style="margin:0 0 12px;font-size:22px;line-height:1.3;color:#16181D;">${escapeHtml(opts.title)}</h1>
      <div style="font-size:15px;line-height:1.6;color:#3C4249;">${opts.body}</div>
    </td></tr>
    ${cta}
    <tr><td style="padding:28px 32px 32px;">
      <hr style="border:none;border-top:1px solid #E3E8E5;margin:0 0 14px;">
      <p style="margin:0;font-size:12px;line-height:1.5;color:#8A9199;">
        ${opts.footer ?? 'Você recebeu este e-mail porque tem uma conta no PokerPath.'}
      </p>
    </td></tr>
  </table>
</body></html>`;
}

/** Link de descadastro do lembrete (um clique, sem login). */
export function unsubscribeUrl(token: string): string {
  return `${env.WEB_ORIGIN}/api/unsubscribe/${token}`;
}

export function passwordResetMail(name: string, link: string, ttlMin: number): Omit<MailMessage, 'to'> {
  return {
    subject: 'PokerPath — redefinir sua senha',
    html: layout({
      title: `Olá, ${escapeHtml(name)}!`,
      body: `<p style="margin:0 0 12px;">Recebemos um pedido para redefinir sua senha.
             O link abaixo vale por <b>${ttlMin} minutos</b> e só pode ser usado uma vez.</p>
             <p style="margin:0;color:#8A9199;font-size:13px;">Se não foi você, ignore este e-mail —
             sua senha continua a mesma.</p>`,
      cta: { label: 'Criar nova senha', href: link },
      footer: 'Este é um e-mail automático de segurança e não pode ser desativado.',
    }),
  };
}

export function welcomeMail(name: string): Omit<MailMessage, 'to'> {
  return {
    subject: 'Bem-vindo ao PokerPath ♠',
    html: layout({
      title: `Boa, ${escapeHtml(name)} — sua conta está pronta!`,
      body: `<p style="margin:0 0 12px;">Você vai aprender poker jogando: mãos reais, feedback na hora
             e o porquê de cada decisão.</p>
             <p style="margin:0 0 12px;"><b>Como tirar o máximo:</b></p>
             <ul style="margin:0 0 12px;padding-left:20px;">
               <li style="margin-bottom:6px;">Jogue <b>um pouco todo dia</b> — o streak é o que faz a diferença.</li>
               <li style="margin-bottom:6px;">Errar é de graça: cada erro vem com a explicação.</li>
               <li>Toque no <b>📊</b> dentro da fase para ver o gráfico da sua posição.</li>
             </ul>
             <p style="margin:0;padding:10px 12px;background:#FBF3DC;border-radius:8px;font-size:13px;color:#6B5A22;">
               📁 Achou este e-mail no <b>spam</b>? Marque como "não é spam" para não perder
               o lembrete do seu streak.
             </p>`,
      cta: { label: 'Jogar a primeira mão', href: env.WEB_ORIGIN },
    }),
  };
}

export function streakReminderMail(name: string, streak: number, unsubUrl: string): Omit<MailMessage, 'to'> {
  const dias = streak === 1 ? '1 dia' : `${streak} dias`;
  return {
    subject: `🔥 Seu streak de ${dias} acaba hoje`,
    html: layout({
      title: `${escapeHtml(name)}, não perca seus ${dias}`,
      body: `<p style="margin:0 0 12px;">Você jogou ontem, mas ainda não hoje. Uma mão mantém o streak vivo —
             leva menos de um minuto.</p>
             <p style="margin:0;font-size:32px;font-weight:800;color:${BRAND};">🔥 ${dias}</p>`,
      cta: { label: 'Salvar meu streak', href: env.WEB_ORIGIN },
      footer: `Não quer mais lembretes? <a href="${unsubUrl}" style="color:#8A9199;">Descadastrar</a>.`,
    }),
  };
}
