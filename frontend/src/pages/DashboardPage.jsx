// src/pages/DashboardPage.jsx
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import DashboardOverview from '../components/dashboard/DashboardOverview';
import '../styles/DashboardPage.scss';
import Navigation from '../components/common/Navigation';
import TopBar from '../components/common/TopBar';

const DashboardPage = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const navigationItems = [
    { path: '/dashboard', label: 'Overview', icon: '📊' },
    { path: '/goals', label: 'Goals', icon: '🎯' },
    { path: '/challenges', label: 'Challenges', icon: '🚀' },
    { path: '/progress', label: 'Progress', icon: '📈' },
    { path: '/peer-review', label: 'Peer Review', icon: '👥' },
    { path: '/leaderboard', label: 'Leaderboard', icon: '🏆' },
    { path: '/profile', label: 'Profile', icon: '👤' },
  ];

  return (
    <div className="dashboard-page">
      <div className="dashboard-layout">
        <AnimatePresence>
          {sidebarOpen && (
            <motion.aside
              className="dashboard-sidebar"
              initial={{ x: -250, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -250, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="sidebar-header">
                <h2>⚡ SkillWise</h2>
                <p>Welcome, {user?.firstName || 'Student'}!</p>
              </div>

              <Navigation
                items={navigationItems}
                currentPath={location.pathname}
              />

              <button
                className="sidebar-toggle"
                onClick={() => setSidebarOpen(false)}
              >
                ⬅ Collapse
              </button>
            </motion.aside>
          )}
        </AnimatePresence>

        <main className="dashboard-main">
          <TopBar />
          <motion.header
            className="dashboard-header"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div>
              <h1>Welcome back, {user?.firstName || 'Learner'} 👋</h1>
              <p>Track your learning progress and achievements below.</p>
            </div>

            {!sidebarOpen && (
              <button
                className="sidebar-toggle"
                onClick={() => setSidebarOpen(true)}
              >
                ☰ Menu
              </button>
            )}
          </motion.header>

          <DashboardOverview />
        </main>
      </div>
    </div>
  );
};

export default DashboardPage;
