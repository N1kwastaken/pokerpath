import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ProtectedRoute, PublicOnlyRoute, RequireOnboarding, OnboardingGate } from './routes/guards.js';
import { AppShell } from './components/AppShell.js';
import { IntroPage } from './pages/IntroPage.js';
import { LoginPage } from './pages/LoginPage.js';
import { RegisterPage } from './pages/RegisterPage.js';
import { OnboardingPage } from './pages/OnboardingPage.js';
import { DashboardPage } from './pages/DashboardPage.js';
import { WorldsPage } from './pages/WorldsPage.js';
import { WorldDetailPage } from './pages/WorldDetailPage.js';
import { StagePlayPage } from './pages/StagePlayPage.js';
import { PremiumPage } from './pages/PremiumPage.js';
import { ChartsPage } from './pages/ChartsPage.js';
import { StatsPage } from './pages/StatsPage.js';
import { ProfilePage } from './pages/ProfilePage.js';
import { AchievementsPage } from './pages/AchievementsPage.js';
import { GlossaryPage } from './pages/GlossaryPage.js';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<PublicOnlyRoute />}>
          <Route path="/welcome" element={<IntroPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route element={<OnboardingGate />}>
            <Route path="/onboarding" element={<OnboardingPage />} />
          </Route>

          <Route element={<RequireOnboarding />}>
            {/* Trainer em tela cheia (sem bottom nav) */}
            <Route path="/stages/:stageId" element={<StagePlayPage />} />
            <Route path="/tour" element={<IntroPage review />} />
            {/* Telas com navegação inferior */}
            <Route element={<AppShell />}>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/worlds" element={<WorldsPage />} />
              <Route path="/worlds/:worldId" element={<WorldDetailPage />} />
              <Route path="/charts" element={<ChartsPage />} />
              <Route path="/stats" element={<StatsPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/achievements" element={<AchievementsPage />} />
              <Route path="/glossary" element={<GlossaryPage />} />
              <Route path="/premium" element={<PremiumPage />} />
            </Route>
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
