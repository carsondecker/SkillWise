// src/pages/HomePage.jsx
import React, { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import RotatingText from '../components/landingPage/RotatingText';
import '../styles/HomePage.scss';

const HomePage = () => {
  const navigate = useNavigate();
  const featuresRef = useRef(null);

  const handleGetStarted = () => {
    navigate('/signup');
  };

  const handleLearnMore = () => {
    featuresRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="home-page">
      {/* HERO SECTION */}
      <section className="hero">
        <div className="overlay" />
        <div className="hero-content">
          <h1>
            Unlock Your <span className={'rotating-text-span-class'}>
              <RotatingText
                texts={['Potential', 'Brains', 'Mindpower']}
                mainClassName="rotating-text-main"
                splitLevelClassName="rotating-text-split"
                staggerFrom="last"
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '-120%' }}
                staggerDuration={0.025}
                transition={{ type: 'spring', damping: 30, stiffness: 400 }}
                rotationInterval={2000}
              />
            </span> with SkillWise
          </h1>
          <p>
            Master new skills, track your goals, and grow with personalized AI-driven learning.
          </p>
          <div className="hero-actions">
            <button className="btn-primary" onClick={handleGetStarted}>
              🚀 Get Started
            </button>
            <button className="btn-secondary" onClick={handleLearnMore}>
              Learn More ↓
            </button>
          </div>
        </div>
      </section>

      {/* FEATURES SECTION */}
      <section className="features" ref={featuresRef}>
        <div className="container">
          <h2>Why Choose SkillWise?</h2>
          <p className="subtitle">
            Everything you need to achieve your learning goals in one intelligent platform.
          </p>

          <div className="features-grid">
            <div className="feature-card">
              <div className="icon">🤖</div>
              <h3>AI-Powered Feedback</h3>
              <p>Receive instant, intelligent insights to refine your skills.</p>
            </div>

            <div className="feature-card">
              <div className="icon">🎯</div>
              <h3>Goal Tracking</h3>
              <p>Set, manage, and track progress towards your personalized goals.</p>
            </div>

            <div className="feature-card">
              <div className="icon">💬</div>
              <h3>Peer Reviews</h3>
              <p>Collaborate and learn from peers through meaningful feedback.</p>
            </div>

            <div className="feature-card">
              <div className="icon">🏆</div>
              <h3>Leaderboard & Rewards</h3>
              <p>Stay motivated with points, badges, and community recognition.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA SECTION */}
      <section className="cta">
        <div className="cta-content">
          <h2>Ready to Begin Your Journey?</h2>
          <p>Join thousands of learners using SkillWise to grow their skills every day.</p>
          <button className="btn-glow" onClick={handleGetStarted}>
            Start Learning Now
          </button>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="footer">
        <p>© {new Date().getFullYear()} SkillWise. Empowering learners worldwide 🌍</p>
      </footer>
    </div>
  );
};

export default HomePage;
