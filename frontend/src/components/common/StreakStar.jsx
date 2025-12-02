// src/components/streaks/StreakStar.jsx
import React, { useEffect, useState } from 'react';
import { apiService } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import Lottie from "lottie-react";
import fireAnimation from "../../assets/animations/fire.json";
import '../../styles/components/Common/StreakStar.scss';

const StreakStar = () => {
  const { user } = useAuth();
  const [currentStreak, setCurrentStreak] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [hasLoggedToday, setHasLoggedToday] = useState(false);
  const [showRipple, setShowRipple] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [hideOnScroll, setHideOnScroll] = useState(false);
  const [tooltipVisible, setTooltipVisible] = useState(true);
  const [tooltipFullyHidden, setTooltipFullyHidden] = useState(false);
  const [burstSpin, setBurstSpin] = useState(false);
  const [burstScale, setBurstScale] = useState(1);
  const [showFire, setShowFire] = useState(false);
  const [showLottieFire, setShowLottieFire] = useState(false);
  // Don’t show if not logged in
  if (!user) return null;

  const fetchStreak = async () => {
    try {
      const res = await apiService.streaks.getStreak();
      const data = res.data?.streak || res.data;

      if (data) {
        setCurrentStreak(data.current_streak || 0);
        setLongestStreak(data.longest_streak || 0);

        const lastLogged = data.last_logged_date;
        if (lastLogged) {
          const today = new Date().toISOString().slice(0, 10);
          if (lastLogged.slice(0, 10) === today) {
            setHasLoggedToday(true);
          }
        }
      }
    } catch (err) {
      console.error('Failed to fetch streak:', err);
    }
  };

  // Fetch streak on mount
  useEffect(() => {
    void fetchStreak();
  }, []);

  // 🔥 Auto-hide tooltip after 5 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setTooltipVisible(false);
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  // 🔥 Hide star when scrolling
  useEffect(() => {
    const handleScroll = () => {
      setHideOnScroll(true);

      // Optional: reappear if user stops scrolling for a moment
      clearTimeout(window.__streakScrollTimeout);
      window.__streakScrollTimeout = setTimeout(() => {
        setHideOnScroll(false);
      }, 450); // adjust if needed
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogStreak = async () => {
    if (isLoading || hasLoggedToday) return;

    setIsLoading(true);
    setStatusMessage('');

    try {
      const res = await apiService.streaks.log();
      const data = res.data?.data || res.data;

      if (data) {
        const newStreak = data.current_streak || 0;

        // Set scale based on streak (200% to 500%)
        const scale = Math.min(2 + newStreak * 0.1, 5);
        setBurstScale(scale);

        // trigger animations
        setBurstSpin(true);
        setShowFire(true);
        setShowLottieFire(true);

        // stop spin after 1s
        setTimeout(() => setBurstSpin(false), 1000);

        // stop fire after 3s
        setTimeout(() => setShowFire(false), 3000);
        setTimeout(() => setShowLottieFire(false), 3000);

        setCurrentStreak(newStreak);
        setLongestStreak(data.longest_streak || 0);

        const today = new Date().toISOString().slice(0, 10);
        const lastLogged = data.last_logged_date;

        if (lastLogged?.slice(0, 10) === today) {
          setHasLoggedToday(true);
        }
      }

      const msg = res.data?.message || 'Daily streak logged!';
      setStatusMessage(msg);

      // Fire ripple animation
      setShowRipple(true);
      setTimeout(() => setShowRipple(false), 400);
    } catch (err) {
      console.error('Error logging streak:', err);
      setStatusMessage('Something went wrong. Try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`streak-star ${hideOnScroll ? 'streak-star--hidden' : ''}`}>
      <button
        className={`streak-star__button 
    ${burstSpin ? 'streak-star__button--burst-spin' : ''} 
    ${showFire ? 'streak-star__button--fire' : ''} 
    ${hasLoggedToday ? 'streak-star__button--logged' : ''}`
        }
        style={{
          transform: burstSpin
            ? `scale(${burstScale})`
            : undefined
        }}
        onClick={handleLogStreak}
        disabled={isLoading || hasLoggedToday}
        aria-label="Log daily streak"
      >
        {showLottieFire && (
          <div className="streak-star__lottie-fire">
            <Lottie
              animationData={fireAnimation}
              loop={true}
              autoplay={true}
              style={{ width: 140, height: 140 }}
            />
          </div>
        )}
        <div className="streak-star__glow" />
        <div className="streak-star__star-content">
          <span className="streak-star__icon">⭐</span>
        </div>

        <div className="streak-star__streak-badge">
          <span className="streak-star__streak-number">{currentStreak}</span>
          <span className="streak-star__streak-label">day streak</span>
        </div>

        {showRipple && <span className="streak-star__ripple" />}
        {showFire && <div className="streak-star__fire"></div>}

      </button>


      <div
        className={`streak-star__tooltip ${
          !tooltipVisible ? 'hidden' : ''
        } ${tooltipFullyHidden ? 'none' : ''}`}
        onTransitionEnd={() => {
          if (!tooltipVisible) {
            setTooltipFullyHidden(true);
          }
        }}
      >
        {hasLoggedToday ? 'Streak logged for today 🔥' : 'Tap to log today’s streak'}
      </div>

      {statusMessage && (
        <div className="streak-star__status">{statusMessage}</div>
      )}

      <div className="streak-star__longest">
        Longest streak: <strong>{longestStreak}</strong>
      </div>
    </div>
  );
};

export default StreakStar;
