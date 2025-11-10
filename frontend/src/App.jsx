import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './components/layouts/DashboardLayout';

// Import all pages
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

// Import layout components (TODO: Create these)
// import Navbar from './components/layout/Navbar';
// import Footer from './components/layout/Footer';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          {/* TODO: Add Navbar component */}
          {/* <Navbar /> */}

          <main className="main-content">
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
              <Route path="/error" element={<ErrorPage />} />

              {/* Protected dashboard routes mounted under a single layout so it stays mounted */}
              <Route
                element={
                  <ProtectedRoute>
                    <DashboardLayout />
                  </ProtectedRoute>
                }
              >
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/goals" element={<GoalsPage />} />
                <Route path="/challenges" element={<ChallengesPage />} />
                <Route path="/progress" element={<ProgressPage />} />
                <Route path="/leaderboard" element={<LeaderboardPage />} />
                <Route path="/peer-review" element={<PeerReviewPage />} />
                <Route path="/profile" element={<ProfilePage />} />
              </Route>

              {/* Catch-all route for 404 */}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </main>

          {/* TODO: Add Footer component */}
          {/* <Footer /> */}
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
