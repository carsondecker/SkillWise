import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../hooks/useAuth';
import '../../styles/components/Common/TopBar.scss';

const Topbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="topbar">
      <div className="topbar-inner">
        {/* Hamburger */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          className={`hamburger ${menuOpen ? 'is-open' : ''}`}
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          <span />
          <span />
          <span />
        </motion.button>

        {/* Center logo */}
        <motion.div className="logo" onClick={() => navigate('/dashboard')}>
          Skillwise
        </motion.div>

        {/* User avatar */}
        {isAuthenticated && (
          <motion.div
            className="user"
            whileHover={{ scale: 1.05 }}
            onClick={() => navigate('/profile')}
          >
            <div className="avatar">
              {user?.profileImage ? (
              <img
                src={process.env.REACT_APP_BACKEND_URL + user.profileImage}
                alt="User Avatar"
              />
            ) : (user?.firstName?.[0] || user?.email?.[0] || 'U').toUpperCase()}
            </div>
            {user?.role === 'admin' && <span className="admin-tag">Admin</span>}
          </motion.div>
        )}
      </div>

      {/* ===== SIDE DRAWER MENU ===== */}
      <AnimatePresence>
        {menuOpen && (
          <>
            {/* Background overlay */}
            <motion.div
              className="overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              onClick={() => setMenuOpen(false)}
            />
            {/* Drawer panel */}
            <motion.nav
              className="side-menu"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 80, damping: 15 }}
            >
              <div className="menu-header">
                <button
                  className="close-btn"
                  onClick={() => setMenuOpen(false)}
                >
                  ✕
                </button>
              </div>
              <div className="menu-links">
                <NavLink to="/dashboard" onClick={() => setMenuOpen(false)}>
                  Dashboard
                </NavLink>
                <NavLink to="/goals" onClick={() => setMenuOpen(false)}>
                  Goals
                </NavLink>
                <NavLink to="/challenges" onClick={() => setMenuOpen(false)}>
                  Challenges
                </NavLink>
                <NavLink to="/progress" onClick={() => setMenuOpen(false)}>
                  Progress
                </NavLink>
                <NavLink to="/leaderboard" onClick={() => setMenuOpen(false)}>
                  Leaderboard
                </NavLink>
                <NavLink to="/peer-review" onClick={() => setMenuOpen(false)}>
                  Peer Review
                </NavLink>
                <NavLink to="/profile" onClick={() => setMenuOpen(false)}>
                  Profile
                </NavLink>
              </div>

              <div className="menu-footer">
                {isAuthenticated ? (
                  <button className="logout-btn" onClick={handleLogout}>
                    Logout
                  </button>
                ) : (
                  <>
                    <NavLink to="/login" onClick={() => setMenuOpen(false)}>
                      Login
                    </NavLink>
                    <NavLink to="/signup" onClick={() => setMenuOpen(false)}>
                      Sign Up
                    </NavLink>
                  </>
                )}
              </div>
            </motion.nav>
          </>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Topbar;
