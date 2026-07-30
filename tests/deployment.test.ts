import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { runningVersion } from '../apps/api/src/routes/health.routes.js';

describe('segurança do deploy', () => {
  it('não autoriza perda de dados automaticamente no banco de produção', () => {
    const packageJson = JSON.parse(
      readFileSync(new URL('../apps/api/package.json', import.meta.url), 'utf8'),
    ) as { scripts: Record<string, string> };

    expect(packageJson.scripts['deploy:db']).toContain('prisma db push');
    expect(packageJson.scripts['deploy:db']).not.toContain('--accept-data-loss');
  });

  it('expõe o SHA curto fornecido pelo Render', () => {
    expect(runningVersion({
      RENDER_GIT_COMMIT: '92dad460780d256bdc1d8868c8c8fead47724001',
    } as NodeJS.ProcessEnv)).toBe('92dad46');
    expect(runningVersion({} as NodeJS.ProcessEnv)).toBe('dev');
  });
});
