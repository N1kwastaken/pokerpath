import { slugifyUsername } from '@pokerpath/shared';
import { prisma } from '../lib/prisma.js';

/**
 * Gera um @ ÚNICO a partir do nome (ou e-mail) no cadastro.
 *
 * Tenta a base limpa; se já existe, acrescenta um número aleatório e tenta de
 * novo. É melhor que pedir o @ no cadastro (mais fricção) — a pessoa começa com
 * um handle decente e troca depois se quiser. `usernameChangedAt` fica null, de
 * propósito: a primeira troca manual do @ gerado é grátis (a regra de 30 dias
 * só passa a valer a partir dela).
 */
export async function generateUniqueUsername(seed: string): Promise<string> {
  const base = slugifyUsername(seed);
  const taken = async (u: string) =>
    (await prisma.user.count({ where: { username: u } })) > 0;

  if (!(await taken(base))) return base;

  // sufixo numérico até achar um livre; teto de tentativas com fallback longo.
  for (let i = 0; i < 12; i++) {
    const n = Math.floor(Math.random() * 9000) + 100; // 3–4 dígitos
    const cand = `${base.slice(0, 15)}${n}`;
    if (!(await taken(cand))) return cand;
  }
  return `${base.slice(0, 12)}${Date.now().toString(36)}`;
}
