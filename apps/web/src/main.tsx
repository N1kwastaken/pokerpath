import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './auth/AuthContext.js';
import { ThemeProvider } from './lib/theme.js';
import { App } from './App.js';
import './index.css';
import { initA11y } from './lib/a11y.js';
import { initAccent } from './lib/accent.js';

initAccent();
initA11y();

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
