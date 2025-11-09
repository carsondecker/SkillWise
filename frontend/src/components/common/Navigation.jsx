// src/components/common/Navigation.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const Navigation = ({ items, currentPath }) => {
  return (
    <nav className="sidebar-navigation">
      <ul>
        {items.map((item) => (
          <motion.li
            key={item.path}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Link
              to={item.path}
              className={`nav-link ${
                currentPath === item.path ? 'active' : ''
              }`}
              onClick={() => {
                try {
                  // mark that this navigation originated from the sidebar
                  sessionStorage.setItem(
                    'skillwise:navigatedViaSidebar',
                    'true',
                  );
                } catch (e) {
                  /* ignore */
                }
              }}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </Link>
          </motion.li>
        ))}
      </ul>
    </nav>
  );
};

export default Navigation;
