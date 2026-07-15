import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.js';
import { Splash } from '../components/Splash.js';

/**
 * Protege rotas que exigem autenticação. Visitantes vão para a landing.
 * Durante a restauração da sessão mostra a splash (PRD 11.2).
 */
export function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <Splash />;
  if (!isAuthenticated) return <Navigate to="/welcome" replace />;
  return <Outlet />;
}

/** Modo convidado (Mundo 0 sem conta): quem já tem conta vai para a trilha real. */
export function GuestRoute() {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <Splash />;
  if (isAuthenticated) return <Navigate to="/worlds" replace />;
  return <Outlet />;
}

/** Rotas exclusivas para visitantes (landing/login/cadastro). */
export function PublicOnlyRoute() {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <Splash />;
  if (isAuthenticated) return <Navigate to="/" replace />;
  return <Outlet />;
}

/** Exige onboarding concluído (PRD 4.1). */
export function RequireOnboarding() {
  const { user, isLoading } = useAuth();
  if (isLoading) return <Splash />;
  if (!user) return <Navigate to="/welcome" replace />;
  if (!user.onboardingCompleted) return <Navigate to="/onboarding" replace />;
  return <Outlet />;
}

/** Rota do onboarding: quem já concluiu vai direto para o app. */
export function OnboardingGate() {
  const { user, isLoading } = useAuth();
  if (isLoading) return <Splash />;
  if (!user) return <Navigate to="/welcome" replace />;
  if (user.onboardingCompleted) return <Navigate to="/" replace />;
  return <Outlet />;
}
