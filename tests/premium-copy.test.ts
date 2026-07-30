import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const premiumPage = readFileSync(
  new URL('../apps/web/src/pages/PremiumPage.tsx', import.meta.url),
  'utf8',
);
const legalPage = readFileSync(
  new URL('../apps/web/src/pages/LegalPage.tsx', import.meta.url),
  'utf8',
);

describe('promessas comerciais do Premium', () => {
  it('não apresenta preço, teste ou benefício fictício antes da cobrança existir', () => {
    for (const promise of ['R$', '14 dias', 'Começar os 14', 'Sem anúncios']) {
      expect(premiumPage).not.toContain(promise);
    }
    expect(premiumPage).toContain('A assinatura ainda não está à venda');
    expect(premiumPage).toContain('Preços ainda não foram definidos');
  });

  it('não promete Premium para toda conta criada no beta', () => {
    expect(legalPage).not.toContain('Contas criadas nesta fase recebem os recursos Premium');
    expect(legalPage).toContain('Contas de desenvolvimento ou teste podem receber acesso Premium');
  });
});
