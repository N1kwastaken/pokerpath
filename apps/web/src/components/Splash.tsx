import { LogoLoader } from './LogoLoader.js';

/** Splash de boot (restauração da sessão) — usa a animação da logo. */
export function Splash({ label }: { label?: string }) {
  return <LogoLoader label={label ?? 'Carregando...'} />;
}
