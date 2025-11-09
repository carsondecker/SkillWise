import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navigation from '../common/Navigation';
import TopBar from '../common/TopBar';
import '../../styles/DashboardPage.scss';
import { Outlet, useLocation } from 'react-router-dom';
import { LayoutProvider, useLayout } from '../../contexts/LayoutContext';

const Sidebar = ({ sidebarOpen, setSidebarOpen, shouldAnimate }) => {
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
    <AnimatePresence>
      {sidebarOpen && (
        <motion.aside
          className="dashboard-sidebar"
          initial={shouldAnimate ? { x: -250, opacity: 0 } : false}
          animate={{ x: 0, opacity: 1 }}
          exit={shouldAnimate ? { x: -250, opacity: 0 } : false}
          transition={{ duration: shouldAnimate ? 0.3 : 0 }}
        >
          <div className="sidebar-header">
            <h2>⚡ SkillWise</h2>
            <p>Welcome!</p>
          </div>

          <Navigation
            items={navigationItems}
            currentPath={window.location.pathname}
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
  );
};

const DashboardLayoutInner = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [shouldAnimate, setShouldAnimate] = useState(() => {
    try {
      // If navigation came from sidebar, we skip entrance animation
      const viaSidebar =
        sessionStorage.getItem('skillwise:navigatedViaSidebar') === 'true';
      // clear the flag so it only applies to the immediate navigation
      if (viaSidebar) {
        sessionStorage.removeItem('skillwise:navigatedViaSidebar');
      }
      return !viaSidebar;
    } catch (e) {
      return true;
    }
  });

  // Header title/subtitle come from LayoutContext
  const { title, subtitle, setTitle, setSubtitle } = useLayout();
  const location = useLocation();

  // If the route changes via sidebar links, ensure we don't animate
  useEffect(() => {
    try {
      const viaSidebar =
        sessionStorage.getItem('skillwise:navigatedViaSidebar') === 'true';
      if (viaSidebar) {
        setShouldAnimate(false);
        sessionStorage.removeItem('skillwise:navigatedViaSidebar');
      }
    } catch (e) {
      // ignore
    }
  }, [location]);

  return (
    <div className="dashboard-page">
      <div className="dashboard-layout">
        <Sidebar
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          shouldAnimate={shouldAnimate}
        />

        <main className="dashboard-main">
          <TopBar />

          <motion.header
            className="dashboard-header"
            initial={shouldAnimate ? { opacity: 0, y: -20 } : false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: shouldAnimate ? 0.45 : 0 }}
          >
            <div>
              <h1>{title || 'Dashboard'}</h1>
              {subtitle && <p>{subtitle}</p>}
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

          <div className="dashboard-content">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

const DashboardLayout = () => (
  <LayoutProvider>
    <DashboardLayoutInner />
  </LayoutProvider>
);

export default DashboardLayout;
