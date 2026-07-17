import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';

type Theme = 'light' | 'dark';
const KEY = 'pp.theme';

const ThemeCtx = createContext<{ theme: Theme; toggle: () => void; set: (t: Theme) => void } | null>(null);

let animTimer: ReturnType<typeof setTimeout> | undefined;

function apply(theme: Theme, animate = false) {
  const root = document.documentElement;
  // Fade ao trocar: liga uma transição global por ~300ms e desliga depois, para
  // não deixar tudo com transição no uso normal (rolagem, hover ficariam moles).
  if (animate) {
    root.classList.add('theme-anim');
    clearTimeout(animTimer);
    animTimer = setTimeout(() => root.classList.remove('theme-anim'), 320);
  }
  root.dataset.theme = theme;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem(KEY) as Theme | null;
    return saved ?? 'dark';
  });
  // Aplica sem animar no 1º render (evita flash ao abrir); anima nas trocas.
  const first = useRef(true);
  useEffect(() => {
    apply(theme, !first.current);
    first.current = false;
    localStorage.setItem(KEY, theme);
  }, [theme]);
  return (
    <ThemeCtx.Provider value={{ theme, toggle: () => setTheme((t) => (t === 'light' ? 'dark' : 'light')), set: setTheme }}>
      {children}
    </ThemeCtx.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTheme() {
  const c = useContext(ThemeCtx);
  if (!c) throw new Error('useTheme deve ser usado dentro de <ThemeProvider>');
  return c;
}
