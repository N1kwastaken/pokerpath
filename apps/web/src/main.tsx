import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './auth/AuthContext.js';
import { ThemeProvider } from './lib/theme.js';
import { App } from './App.js';
import './index.css';
import { initAccent } from './lib/accent.js';

initAccent();

// O iOS Safari IGNORA user-scalable=no do viewport: bloqueia o pinch-zoom
// manualmente (gesture* são eventos só do iOS). O double-tap-zoom é bloqueado
// pelo touch-action: manipulation no CSS.
for (const ev of ['gesturestart', 'gesturechange', 'gestureend']) {
  document.addEventListener(ev, (e) => e.preventDefault());
}

/**
 * Entrypoint.
 * Providers: React Query (cache de dados do servidor) + Auth (sessão).
 */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 30_000,
    },
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </QueryClientProvider>
    </ThemeProvider>
  </StrictMode>,
);
