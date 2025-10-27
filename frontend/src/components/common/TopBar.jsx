// src/components/common/TopBar.jsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Bell, LogOut, User } from 'lucide-react';
import '../../styles/components/dashboard/TopBar.scss';

const TopBar = () => {
  const { user, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifications] = useState(3); // later fetch from API
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <motion.header
      className="topbar"
      initial={{ y: -40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <h2 className="topbar-logo">⚡ SkillWise</h2>

      <div className="topbar-actions">
        {/* 🔔 Notifications */}
        <motion.div
          className="notification-icon"
          whileHover={{ scale: 1.2 }}
          whileTap={{ scale: 0.9 }}
        >
          <Bell size={22} />
          {notifications > 0 && <span className="notification-badge">{notifications}</span>}
        </motion.div>

        {/* 👤 Avatar + Dropdown */}
        <div className="avatar-wrapper" onClick={() => setDropdownOpen(!dropdownOpen)}>
          <motion.img
            src={`https://ui-avatars.com/api/?name=${user?.firstName || 'U'}+${
              user?.lastName || ''
            }&background=6C63FF&color=fff`}
            alt="User Avatar"
            className="user-avatar"
            whileHover={{ scale: 1.05 }}
          />
          <AnimatePresence>
            {dropdownOpen && (
              <motion.div
                className="dropdown-menu"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <div className="dropdown-item" onClick={() => navigate('/profile')}>
                  <User size={16} /> Profile
                </div>
                <div className="dropdown-item logout" onClick={handleLogout}>
                  <LogOut size={16} /> Logout
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.header>
  );
};

export default TopBar;
