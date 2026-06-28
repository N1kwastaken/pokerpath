import { useTheme } from '../lib/theme.js';
import { IconSun, IconMoon } from './Icons.js';

/** Botão de alternância de tema (sol/lua). */
export function ThemeToggle({ className = '' }: { className?: string }) {
  const { theme, toggle } = useTheme();
  return (
    <button
      onClick={toggle}
      aria-label={theme === 'light' ? 'Ativar tema escuro' : 'Ativar tema claro'}
      className={`flex h-10 w-10 items-center justify-center rounded-full border border-line bg-card text-text active:scale-95 ${className}`}
    >
      {theme === 'light' ? <IconMoon size={18} /> : <IconSun size={18} />}
    </button>
  );
}
