import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { z } from 'zod';

/**
 * Carrega o arquivo .env antes de validar (Node >= 20.12, sem dependência).
 * Procura o .env na raiz do app (apps/api/.env), independentemente do cwd.
 * Se já houver variáveis no ambiente (ex.: produção), elas têm prioridade.
 */
function loadDotEnv(): void {
  const loadEnvFile = (process as { loadEnvFile?: (path?: string) => void })
    .loadEnvFile;
  if (typeof loadEnvFile !== 'function') return;

  const here = dirname(fileURLToPath(import.meta.url)); // .../src/config (ou dist/config)
  const candidates = [
    resolve(here, '../../.env'), // apps/api/.env
    resolve(process.cwd(), '.env'), // fallback: cwd
  ];
  for (const path of candidates) {
    if (existsSync(path)) {
      try {
        loadEnvFile(path);
        return;
      } catch {
        // tenta o próximo candidato
      }
    }
  }
}

loadDotEnv();

/**
 * Validação de variáveis de ambiente.
 * O servidor não sobe se faltar algo essencial — falha cedo e claro.
 */
const envSchema = z.object({
  PORT: z.coerce.number().default(3333),
  HOST: z.string().default('0.0.0.0'),
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL é obrigatória'),
  JWT_ACCESS_SECRET: z.string().min(1, 'JWT_ACCESS_SECRET é obrigatória'),
  JWT_REFRESH_SECRET: z.string().min(1, 'JWT_REFRESH_SECRET é obrigatória'),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('30d'),
  WEB_ORIGIN: z.string().default('http://localhost:5173'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Variáveis de ambiente inválidas:');
  console.error(parsed.error.flatten().fieldErrors);
  console.error(
    '\nVerifique se apps/api/.env existe. Crie com: copy apps\\api\\.env.example apps\\api\\.env',
  );
  process.exit(1);
}

export const env = parsed.data;
export type Env = typeof env;
