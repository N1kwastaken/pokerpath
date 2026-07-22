import { Outlet } from 'react-router-dom';
import { BottomNav } from './BottomNav.js';

/**
 * Layout das telas com navegação inferior (deixa espaço para a nav).
 *
 * O topo respeita a `safe-area`: com `viewport-fit=cover` no index.html, o
 * conteúdo vai até a borda física e ficava embaixo da barra de status no PWA
 * do iOS. Quem quiser sangrar até o topo (o banner do perfil) desfaz este
 * padding com margem negativa.
 */
export function AppShell() {
  return (
    <div className="min-h-dvh pb-24 pt-[env(safe-area-inset-top)]">
      <Outlet />
      <BottomNav />
    </div>
  );
}
