// TODO: Implement main navigation header component
import React from 'react';
import { Link } from 'react-router-dom';

const Header = () => {
  // TODO: Add navigation menu, user profile dropdown, notifications
  return (
    <header className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link
              to="/"
              className="text-2xl font-bold text-indigo-600 hover:text-indigo-700 transition-colors"
            >
              SkillWise
            </Link>
          </div>
          <nav className="hidden md:flex space-x-8">
            {/* TODO: Add navigation items */}
          </nav>
          <div className="flex items-center space-x-4">
            <Link
              to="/"
              className="text-gray-700 hover:text-indigo-600 px-3 py-2 text-sm font-medium transition-colors"
            >
              Home
            </Link>
            <Link
              to="/dashboard"
              className="text-gray-700 hover:text-indigo-600 px-3 py-2 text-sm font-medium transition-colors"
            >
              Dashboard
            </Link>
            {/* TODO: Add user profile, notifications */}
            <Link
              to="/login"
              className="text-gray-700 hover:text-indigo-600 px-4 py-2 text-sm font-medium transition-colors"
            >
              Login
            </Link>
            <Link
              to="/signup"
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
            >
              Sign Up
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
