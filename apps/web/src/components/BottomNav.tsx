import { NavLink } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.js';
import { IconHome, IconTarget, IconGrid, IconChart, IconUser, IconLogin } from './Icons.js';

// Sem aba "Treino": o botão grande da Início já leva à trilha — a aba era
// redundante e roubava espaço da barra.
const TABS = [
  { to: '/', label: 'Início', Icon: IconHome, end: true },
  { to: '/review', label: 'Revisão', Icon: IconGrid, end: false },
  { to: '/stats', label: 'Stats', Icon: IconChart, end: false },
  { to: '/profile', label: 'Perfil', Icon: IconUser, end: false },
];

// Modo convidado: menos abas, e "Perfil" vira "Entrar" (porta com flechinha).
const GUEST_TABS = [
  { to: '/g', label: 'Treino', Icon: IconTarget, end: true },
  { to: '/g/glossary', label: 'Glossário', Icon: IconGrid, end: false },
  { to: '/login', label: 'Entrar', Icon: IconLogin, end: false },
];

/** Navegação inferior minimalista (iOS-like). */
export function BottomNav() {
  const { isAuthenticated } = useAuth();
  const tabs = isAuthenticated ? TABS : GUEST_TABS;
  return (
    <nav className="fixed bottom-0 left-1/2 z-40 w-full max-w-md -translate-x-1/2 px-3 pb-[calc(env(safe-area-inset-bottom)+0.55rem)] pt-2">
      <div className="flex items-stretch justify-around rounded-[1.45rem] border border-line/90 bg-card/95 px-1.5 py-1.5 shadow-[0_18px_35px_-18px_rgba(0,0,0,0.95)] backdrop-blur-xl">
        {tabs.map(({ to, label, Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `relative flex flex-1 flex-col items-center gap-1 rounded-2xl py-2 text-[10px] font-bold uppercase tracking-wide transition-all ${
                isActive ? 'bg-primary/12 text-primary' : 'text-subtle'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={22} className={isActive ? 'scale-105' : ''} />
                <span>{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
