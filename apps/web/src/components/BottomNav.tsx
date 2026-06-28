import { NavLink } from 'react-router-dom';
import { IconHome, IconTarget, IconGrid, IconChart, IconUser } from './Icons.js';

const TABS = [
  { to: '/', label: 'Início', Icon: IconHome, end: true },
  { to: '/worlds', label: 'Treino', Icon: IconTarget, end: false },
  { to: '/review', label: 'Revisão', Icon: IconGrid, end: false },
  { to: '/stats', label: 'Stats', Icon: IconChart, end: false },
  { to: '/profile', label: 'Perfil', Icon: IconUser, end: false },
];

/** Navegação inferior minimalista (iOS-like). */
export function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-1/2 z-40 w-full max-w-md -translate-x-1/2 border-t border-line bg-card">
      <div className="flex items-stretch justify-around px-2 pb-[env(safe-area-inset-bottom)] pt-2">
        {TABS.map(({ to, label, Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center gap-1 rounded-xl py-1.5 text-[11px] font-medium transition-colors ${
                isActive ? 'text-primary' : 'text-subtle'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={23} className={isActive ? 'scale-105' : ''} />
                <span>{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
