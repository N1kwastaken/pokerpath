import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const read = (path: string) => readFileSync(new URL(path, import.meta.url), 'utf8');
const app = read('../apps/web/src/App.tsx');
const dashboard = read('../apps/web/src/pages/DashboardPage.tsx');
const profile = read('../apps/web/src/pages/ProfilePage.tsx');
const rewards = read('../apps/web/src/pages/RewardsPage.tsx');

describe('central de recompensas', () => {
  it('tem uma rota própria e é a porta de entrada da home e do perfil', () => {
    expect(app).toContain('path="/rewards"');
    expect(dashboard).toContain("navigate('/rewards')");
    expect(profile).toContain('to="/rewards"');
  });

  it('concentra missões, marcos, inventário, conquistas e coleção', () => {
    expect(rewards).toContain('<MissionsCard');
    for (const destination of ['/loadout', '/milestones', '/achievements', '/profile#collection']) {
      expect(rewards).toContain(`to="${destination}"`);
    }
    expect(dashboard).not.toContain('<MissionsCard');
  });

  it('explica a origem determinística das recompensas', () => {
    expect(rewards).toContain('sem sorteio ou compra escondida');
    expect(rewards).toContain('Fase perfeita rende fichas uma única vez');
    expect(rewards).not.toContain('Math.random');
  });
});
