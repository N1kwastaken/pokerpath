import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ProtectedRoute, PublicOnlyRoute, RequireOnboarding, OnboardingGate, GuestRoute } from './routes/guards.js';
import { AppShell } from './components/AppShell.js';
import { Splash } from './components/Splash.js';

// Cada jornada vira um chunk: quem abre a home não baixa trainer, charts,
// configurações e todas as telas públicas antes de enxergar o primeiro frame.
const GuestTrailPage = lazy(() => import('./pages/GuestTrailPage.js').then((m) => ({ default: m.GuestTrailPage })));
const GuestStagePage = lazy(() => import('./pages/GuestStagePage.js').then((m) => ({ default: m.GuestStagePage })));
const IntroPage = lazy(() => import('./pages/IntroPage.js').then((m) => ({ default: m.IntroPage })));
const LoginPage = lazy(() => import('./pages/LoginPage.js').then((m) => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import('./pages/RegisterPage.js').then((m) => ({ default: m.RegisterPage })));
const OnboardingPage = lazy(() => import('./pages/OnboardingPage.js').then((m) => ({ default: m.OnboardingPage })));
const DashboardPage = lazy(() => import('./pages/DashboardPage.js').then((m) => ({ default: m.DashboardPage })));
const TrailPage = lazy(() => import('./pages/TrailPage.js').then((m) => ({ default: m.TrailPage })));
const WorldDetailPage = lazy(() => import('./pages/WorldDetailPage.js').then((m) => ({ default: m.WorldDetailPage })));
const StagePlayPage = lazy(() => import('./pages/StagePlayPage.js').then((m) => ({ default: m.StagePlayPage })));
const PremiumPage = lazy(() => import('./pages/PremiumPage.js').then((m) => ({ default: m.PremiumPage })));
const ChartsPage = lazy(() => import('./pages/ChartsPage.js').then((m) => ({ default: m.ChartsPage })));
const ReviewHubPage = lazy(() => import('./pages/ReviewHubPage.js').then((m) => ({ default: m.ReviewHubPage })));
const StatsPage = lazy(() => import('./pages/StatsPage.js').then((m) => ({ default: m.StatsPage })));
const ProfilePage = lazy(() => import('./pages/ProfilePage.js').then((m) => ({ default: m.ProfilePage })));
const AchievementsPage = lazy(() => import('./pages/AchievementsPage.js').then((m) => ({ default: m.AchievementsPage })));
const MilestonesPage = lazy(() => import('./pages/MilestonesPage.js').then((m) => ({ default: m.MilestonesPage })));
const SettingsPage = lazy(() => import('./pages/SettingsPage.js').then((m) => ({ default: m.SettingsPage })));
const PrivacyPage = lazy(() => import('./pages/LegalPage.js').then((m) => ({ default: m.PrivacyPage })));
const TermsPage = lazy(() => import('./pages/LegalPage.js').then((m) => ({ default: m.TermsPage })));
const FriendsPage = lazy(() => import('./pages/FriendsPage.js').then((m) => ({ default: m.FriendsPage })));
const FriendProfilePage = lazy(() => import('./pages/FriendProfilePage.js').then((m) => ({ default: m.FriendProfilePage })));
const LevelsPage = lazy(() => import('./pages/LevelsPage.js').then((m) => ({ default: m.LevelsPage })));
const GlossaryPage = lazy(() => import('./pages/GlossaryPage.js').then((m) => ({ default: m.GlossaryPage })));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage.js').then((m) => ({ default: m.ForgotPasswordPage })));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage.js').then((m) => ({ default: m.ResetPasswordPage })));
const PlacementPage = lazy(() => import('./pages/PlacementPage.js').then((m) => ({ default: m.PlacementPage })));
const SetupPage = lazy(() => import('./pages/SetupPage.js').then((m) => ({ default: m.SetupPage })));
const EnergyLoadoutPage = lazy(() => import('./pages/EnergyLoadoutPage.js').then((m) => ({ default: m.EnergyLoadoutPage })));

export function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<Splash label="Abrindo sua mesa..." />}>
      <Routes>
        <Route element={<PublicOnlyRoute />}>
          <Route path="/welcome" element={<IntroPage />} />
          <Route path="/setup" element={<SetupPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
        </Route>

        {/* Modo convidado: Mundo 0 jogável sem conta */}
        <Route element={<GuestRoute />}>
          <Route path="/g/stages/:stageId" element={<GuestStagePage />} />
          <Route element={<AppShell />}>
            <Route path="/g" element={<GuestTrailPage />} />
            <Route path="/g/glossary" element={<GlossaryPage />} />
          </Route>
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route element={<OnboardingGate />}>
            <Route path="/onboarding" element={<OnboardingPage />} />
          </Route>

          <Route element={<RequireOnboarding />}>
            {/* Trainer em tela cheia (sem bottom nav) */}
            <Route path="/stages/:stageId" element={<StagePlayPage />} />
            <Route path="/placement" element={<PlacementPage />} />
            <Route path="/tour" element={<IntroPage review />} />
            {/* Telas com navegação inferior */}
            <Route element={<AppShell />}>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/worlds" element={<TrailPage />} />
              <Route path="/worlds/:worldId" element={<WorldDetailPage />} />
              <Route path="/charts" element={<ChartsPage />} />
              <Route path="/review" element={<ReviewHubPage />} />
              <Route path="/stats" element={<StatsPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/achievements" element={<AchievementsPage />} />
              <Route path="/milestones" element={<MilestonesPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/privacidade" element={<PrivacyPage />} />
              <Route path="/termos" element={<TermsPage />} />
              <Route path="/friends" element={<FriendsPage />} />
              <Route path="/friends/:friendId" element={<FriendProfilePage />} />
              <Route path="/levels" element={<LevelsPage />} />
              <Route path="/glossary" element={<GlossaryPage />} />
              <Route path="/premium" element={<PremiumPage />} />
              <Route path="/loadout" element={<EnergyLoadoutPage />} />
            </Route>
          </Route>
        </Route>
      </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
