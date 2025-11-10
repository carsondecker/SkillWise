import React from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
} from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import DashboardPage from './pages/DashboardPage';
import GoalsPage from './pages/GoalsPage';
import ChallengesPage from './pages/ChallengesPage';
import ProgressPage from './pages/ProgressPage';
import LeaderboardPage from './pages/LeaderboardPage';
import PeerReviewPage from './pages/PeerReviewPage';
import ProfilePage from './pages/ProfilePage';
import NotFoundPage from './pages/NotFoundPage';
import ErrorPage from './pages/ErrorPage';
import Topbar from './components/common/TopBar';
import ChallengeSubmissionPage from './pages/ChallengeSubmissionPage';

/* ==============================
   🔹 Split into two components
   ============================== */

function AppContent() {
  const { user } = useAuth();
  const location = useLocation();

  // Hide topbar on login/signup
  const hideTopbar = ['/login', '/signup'].includes(location.pathname);

  return (
    <>
      {!hideTopbar && <Topbar />}

      <Routes>
        {/* Public routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/error" element={<ErrorPage />} />

        {/* Protected routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage key={user?.id || 'guest'} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/goals"
          element={
            <ProtectedRoute>
              <GoalsPage key={user?.id || 'guest'} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/challenges"
          element={
            <ProtectedRoute>
              <ChallengesPage key={user?.id || 'guest'} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/challenges/:id/submit"
          element={
            <ProtectedRoute>
              <ChallengeSubmissionPage key={user?.id || 'guest'} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/progress"
          element={
            <ProtectedRoute>
              <ProgressPage key={user?.id || 'guest'} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/leaderboard"
          element={
            <ProtectedRoute>
              <LeaderboardPage key={user?.id || 'guest'} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/peer-review"
          element={
            <ProtectedRoute>
              <PeerReviewPage key={user?.id || 'guest'} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage key={user?.id || 'guest'} />
            </ProtectedRoute>
          }
        />

        {/* Catch-all */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </>
  );
}

/* ==============================
   🔹 Main App wrapper
   ============================== */
export default function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}
