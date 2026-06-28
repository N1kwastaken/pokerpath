import { Outlet } from 'react-router-dom';
import { BottomNav } from './BottomNav.js';

/** Layout das telas com navegação inferior (deixa espaço para a nav). */
export function AppShell() {
  return (
    <div className="min-h-dvh pb-24">
      <Outlet />
      <BottomNav />
    </div>
  );
}
