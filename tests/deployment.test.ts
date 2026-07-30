import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { runningVersion } from '../apps/api/src/routes/health.routes.js';

describe('segurança do deploy', () => {
  it('não autoriza perda de dados automaticamente no banco de produção', () => {
    const packageJson = JSON.parse(
      readFileSync(new URL('../apps/api/package.json', import.meta.url), 'utf8'),
    ) as { scripts: Record<string, string>; prisma?: unknown };
    const prismaConfig = readFileSync(
      new URL('../apps/api/prisma.config.ts', import.meta.url),
      'utf8',
    );

    expect(packageJson.scripts['deploy:db']).toContain('prisma db push');
    expect(packageJson.scripts['deploy:db']).not.toContain('--accept-data-loss');
    expect(packageJson.prisma).toBeUndefined();
    expect(prismaConfig).toContain("seed: 'tsx prisma/seed.main.ts'");
  });

  it('expõe o SHA curto fornecido pelo Render', () => {
    expect(runningVersion({
      RENDER_GIT_COMMIT: '92dad460780d256bdc1d8868c8c8fead47724001',
    } as NodeJS.ProcessEnv)).toBe('92dad46');
    expect(runningVersion({} as NodeJS.ProcessEnv)).toBe('dev');
  });

  it('só libera o Render depois do CI validar o build de produção', () => {
    const blueprint = readFileSync(new URL('../render.yaml', import.meta.url), 'utf8');
    const workflow = readFileSync(
      new URL('../.github/workflows/ci.yml', import.meta.url),
      'utf8',
    );

    expect(blueprint).toMatch(/autoDeployTrigger:\s*checksPass/);
    expect(workflow).toContain('npm run deploy:generate -w @pokerpath/api');
    expect(workflow).toMatch(/- run: npm run build\s/);
  });
});
