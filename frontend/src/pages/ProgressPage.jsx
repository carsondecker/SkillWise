import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { apiService } from '../services/api';
import '../styles/ProgressPage.scss';

const ProgressPage = () => {
  const [progressData, setProgressData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [timeframe, setTimeframe] = useState('week');

  useEffect(() => {
    const fetchProgress = async () => {
      setLoading(true);
      setError('');

      try {
        const { data } = await apiService.progress.getProgress({ timeframe });
        setProgressData(data?.progress || {});
      } catch (err) {
        console.error('Failed to load progress', err);
        setError(
          err?.response?.data?.message ||
            'Unable to load your progress right now. Please try again.'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchProgress();
  }, [timeframe]);

  if (loading) return <LoadingSpinner message="Loading your progress..." />;
  if (error)
    return (
      <div className="progress-page error-state">
        <h2>Could not load progress</h2>
        <p>{error}</p>
      </div>
    );
  if (!progressData) return null;

  const fadeIn = (delay = 0) => ({
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6, delay },
  });

  const overall = progressData.overall || {};
  const weeklyProgress = progressData.weeklyProgress || [];
  const recentActivity = progressData.recentActivity || [];
  const sessionStats = progressData.sessionStats || [];
  const skillBreakdown = progressData.skillBreakdown || [];

  const formatDayLabel = (dateString) =>
    new Date(dateString).toLocaleDateString(undefined, { weekday: 'short' });

  const formatDateTime = (value) =>
    value
      ? new Date(value).toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
      : '';

  return (
    <div className="progress-page">
      <motion.div className="page-header" {...fadeIn(0.1)}>
        <h1>Your Learning Progress</h1>
        <p>Track your journey and celebrate your achievements</p>
      </motion.div>

      {/* 🌟 Overview Cards */}
      <div className="progress-overview">
        <div className="stats-grid">
          {[
            {
              icon: '🎯',
              label: 'Total Points',
              value: overall.totalPoints || 0,
            },
            {
              icon: '⭐',
              label: 'Current Level',
              value: `Level ${overall.level || 1}`,
            },
            {
              icon: '✅',
              label: 'Goals Completed',
              value: overall.completedGoals || 0,
            },
            {
              icon: '🚀',
              label: 'Challenges Done',
              value: overall.completedChallenges || 0,
            },
            {
              icon: '🔥',
              label: 'Day Streak',
              value: overall.currentStreak || 0,
            },
          ].map((stat, i) => (
            <motion.div key={i} className="stat-card" {...fadeIn(i * 0.1)}>
              <div className="stat-icon">{stat.icon}</div>
              <div className="stat-content">
                <h3>{stat.value}</h3>
                <p>{stat.label}</p>
                {stat.label === 'Current Level' && (
                  <>
                    <div className="progress-bar">
                      <motion.div
                        className="progress-fill"
                        initial={{ width: 0 }}
                        animate={{
                          width: `${
                            overall.nextLevelXP
                              ? Math.min(
                                100,
                                ((overall.experiencePoints || 0) / overall.nextLevelXP) * 100
                              )
                              : 0
                          }%`,
                        }}
                        transition={{ duration: 1, ease: 'easeOut' }}
                      />
                    </div>
                    <small>
                      {overall.experiencePoints || 0}/{overall.nextLevelXP || 0} XP
                    </small>
                  </>
                )}
                {stat.label === 'Day Streak' && (
                  <small>
                    Longest: {overall.longestStreak || 0} days
                  </small>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* 📊 Weekly Progress + Activity */}
      <div className="progress-sections">
        <div className="section-row">
          <motion.div className="progress-chart-section" {...fadeIn(0.2)}>
            <div className="section-header">
              <h2>Weekly Activity</h2>
              <select
                value={timeframe}
                onChange={(e) => setTimeframe(e.target.value)}
              >
                <option value="week">This Week</option>
              </select>
            </div>

            <div className="weekly-chart">
              {weeklyProgress.map((day, index) => (
                <motion.div
                  key={index}
                  className="day-column"
                  initial={{ opacity: 0, y: 60 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + index * 0.1, duration: 0.6 }}
                >
                  <div className="day-label">
                    {day.day || formatDayLabel(day.date)}
                  </div>
                  <motion.div
                    className="day-bar"
                    initial={{ height: 0 }}
                    animate={{ height: `${Math.max(day.points / 2, 5)}px` }}
                    transition={{ delay: 0.3 + index * 0.1, duration: 0.6 }}
                    title={`${day.points} points, ${day.timeSpentMinutes || 0} minutes`}
                  />
                  <div className="day-points">{day.points}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div className="recent-activity-section" {...fadeIn(0.3)}>
            <h2>Recent Activity</h2>
            <div className="activity-list">
              {recentActivity.map((activity, i) => (
                <motion.div
                  key={activity.id || i}
                  className="activity-item"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.1, duration: 0.4 }}
                >
                  <div className="activity-icon">
                    {activity.type === 'challenge_completed' && '🚀'}
                    {activity.type === 'goal_progress' && '🎯'}
                    {activity.type === 'achievement_earned' && '🏆'}
                    {!['challenge_completed', 'goal_progress', 'achievement_earned'].includes(
                      activity.type
                    ) && '📌'}
                  </div>
                  <div className="activity-content">
                    <h4>{activity.title}</h4>
                    <p>
                      {activity.points && `+${activity.points} points`}
                      {activity.progress && `${activity.progress}% complete`}
                    </p>
                    <small>
                      {new Date(activity.timestamp).toLocaleDateString()}
                    </small>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        <motion.div className="sessions-section" {...fadeIn(0.35)}>
          <div className="section-header">
            <h2>Sessions</h2>
            <p>Time spent and challenges completed per session</p>
          </div>
          <div className="sessions-grid">
            {sessionStats.length === 0 && (
              <div className="empty-state">No sessions logged yet.</div>
            )}
            {sessionStats.map((session, index) => (
              <motion.div
                key={session.sessionId || index}
                className="session-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 + index * 0.05, duration: 0.5 }}
              >
                <div className="session-meta">
                  <h4>{formatDateTime(session.startedAt)}</h4>
                  <span>{session.sessionId}</span>
                </div>
                <div className="session-stats">
                  <div>
                    <strong>{session.durationMinutes} min</strong>
                    <p>Time spent</p>
                  </div>
                  <div>
                    <strong>{session.challengesCompleted}</strong>
                    <p>Challenges</p>
                  </div>
                  <div>
                    <strong>{session.pointsEarned}</strong>
                    <p>Points</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* 🧠 Skill Breakdown */}
        <motion.div className="skills-section" {...fadeIn(0.4)}>
          <h2>Skill Breakdown</h2>
          <div className="skills-grid">
            {skillBreakdown.map((skill, index) => (
              <motion.div
                key={index}
                className="skill-item"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + index * 0.1, duration: 0.6 }}
              >
                <div className="skill-header">
                  <h4>{skill.skill}</h4>
                  <span className="skill-level">Level {skill.level}</span>
                </div>
                <div className="skill-progress">
                  <div className="progress-bar">
                    <motion.div
                      className="progress-fill"
                      initial={{ width: 0 }}
                      animate={{ width: `${skill.progress}%` }}
                      transition={{ duration: 1, delay: 0.5 + index * 0.1 }}
                    />
                  </div>
                  <span className="progress-text">{skill.progress}%</span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ProgressPage;
