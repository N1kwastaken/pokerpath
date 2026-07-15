import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ProtectedRoute, PublicOnlyRoute, RequireOnboarding, OnboardingGate, GuestRoute } from './routes/guards.js';
import { GuestTrailPage } from './pages/GuestTrailPage.js';
import { GuestStagePage } from './pages/GuestStagePage.js';
import { AppShell } from './components/AppShell.js';
import { IntroPage } from './pages/IntroPage.js';
import { LoginPage } from './pages/LoginPage.js';
import { RegisterPage } from './pages/RegisterPage.js';
import { OnboardingPage } from './pages/OnboardingPage.js';
import { DashboardPage } from './pages/DashboardPage.js';
import { TrailPage } from './pages/TrailPage.js';
import { WorldDetailPage } from './pages/WorldDetailPage.js';
import { StagePlayPage } from './pages/StagePlayPage.js';
import { PremiumPage } from './pages/PremiumPage.js';
import { ChartsPage } from './pages/ChartsPage.js';
import { ReviewHubPage } from './pages/ReviewHubPage.js';
import { StatsPage } from './pages/StatsPage.js';
import { ProfilePage } from './pages/ProfilePage.js';
import { AchievementsPage } from './pages/AchievementsPage.js';
import { FriendsPage } from './pages/FriendsPage.js';
import { GlossaryPage } from './pages/GlossaryPage.js';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage.js';
import { ResetPasswordPage } from './pages/ResetPasswordPage.js';
import { PlacementPage } from './pages/PlacementPage.js';
import { SetupPage } from './pages/SetupPage.js';

export function App() {
  return (
    <BrowserRouter>
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
              <Route path="/friends" element={<FriendsPage />} />
              <Route path="/glossary" element={<GlossaryPage />} />
              <Route path="/premium" element={<PremiumPage />} />
            </Route>
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
