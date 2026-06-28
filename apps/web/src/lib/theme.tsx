import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

type Theme = 'light' | 'dark';
const KEY = 'pp.theme';

const ThemeCtx = createContext<{ theme: Theme; toggle: () => void } | null>(null);

function apply(theme: Theme) {
  document.documentElement.dataset.theme = theme;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem(KEY) as Theme | null;
    return saved ?? 'light';
  });
  useEffect(() => { apply(theme); localStorage.setItem(KEY, theme); }, [theme]);
  return (
    <ThemeCtx.Provider value={{ theme, toggle: () => setTheme((t) => (t === 'light' ? 'dark' : 'light')) }}>
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
