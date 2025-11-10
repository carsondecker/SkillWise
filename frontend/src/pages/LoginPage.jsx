import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import LoginForm from '../components/auth/LoginForm';
import LoadingSpinner from '../components/common/LoadingSpinner';
import '../styles/LoginPage.scss';

const LoginPage = () => {
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/dashboard';

  const handleLogin = async (formData) => {
    try {
      setIsLoading(true);
      setError('');

      const result = await login({
        email: formData.email,
        password: formData.password,
      });

      if (result.success) navigate(from, { replace: true });
      else setError(result.error || 'Login failed. Please try again.');
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page">
      {/* Animated gradient background */}
      <div className="animated-bg">
        <div className="gradient"></div>
      </div>

      {/* Main Auth Section */}
      <motion.div
        className="auth-card"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="auth-header">
          <Link to="/" className="auth-logo">
            <motion.h1 whileHover={{ scale: 1.05 }}>SkillWise</motion.h1>
          </Link>
          <h2>Welcome Back 👋</h2>
          <p>Continue your personalized learning journey</p>
        </div>

        {error && (
          <motion.div
            className="error-message"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <p>{error}</p>
          </motion.div>
        )}

        {isLoading ? (
          <LoadingSpinner message="Signing you in..." />
        ) : (
          <LoginForm onSubmit={handleLogin} />
        )}

        <div className="auth-footer">
          <p>
            Don’t have an account?{' '}
            <Link to="/signup" className="auth-link">
              Sign up here
            </Link>
          </p>
          <p>
            <Link to="/forgot-password" className="auth-link subtle">
              Forgot password?
            </Link>
          </p>
        </div>
      </motion.div>

      {/* Right-Side Testimonial Section */}
      <motion.div
        className="auth-side"
        initial={{ opacity: 0, x: 80 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 1 }}
      >
        <div className="testimonial">
          <blockquote>
            “SkillWise revolutionized my learning routine. The AI feedback feels
            like a real mentor!”
          </blockquote>
          <cite>— Sarah K., Software Engineer</cite>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginPage;
