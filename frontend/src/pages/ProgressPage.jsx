import React, { useState, useEffect } from 'react';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { motion } from 'framer-motion';
import '../styles/ProgressPage.scss';

const ProgressPage = () => {
  const [progressData, setProgressData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('week');

  // Mock Data
  useEffect(() => {
    const mockProgressData = {
      overall: {
        totalPoints: 450,
        level: 5,
        experiencePoints: 1250,
        nextLevelXP: 1500,
        completedGoals: 8,
        completedChallenges: 15,
        currentStreak: 7,
        longestStreak: 12,
      },
      recentActivity: [
        {
          id: 1,
          type: 'challenge_completed',
          title: 'Build a React Component',
          points: 50,
          timestamp: '2025-10-02T10:30:00Z',
        },
        {
          id: 2,
          type: 'goal_progress',
          title: 'Master Frontend Development',
          progress: 75,
          timestamp: '2025-10-02T09:15:00Z',
        },
        {
          id: 3,
          type: 'achievement_earned',
          title: 'First Week Streak',
          points: 25,
          timestamp: '2025-10-01T16:45:00Z',
        },
      ],
      weeklyProgress: [
        { day: 'Mon', points: 30, timeSpent: 45 },
        { day: 'Tue', points: 50, timeSpent: 60 },
        { day: 'Wed', points: 0, timeSpent: 0 },
        { day: 'Thu', points: 75, timeSpent: 90 },
        { day: 'Fri', points: 40, timeSpent: 55 },
        { day: 'Sat', points: 60, timeSpent: 75 },
        { day: 'Sun', points: 35, timeSpent: 40 },
      ],
      skillBreakdown: [
        { skill: 'JavaScript', level: 4, progress: 80 },
        { skill: 'React', level: 3, progress: 65 },
        { skill: 'CSS', level: 5, progress: 90 },
        { skill: 'Node.js', level: 2, progress: 40 },
        { skill: 'Database', level: 3, progress: 55 },
      ],
    };

    setTimeout(() => {
      setProgressData(mockProgressData);
      setLoading(false);
    }, 1000);
  }, [timeframe]);

  if (loading) return <LoadingSpinner message="Loading your progress..." />;

  const fadeIn = (delay = 0) => ({
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6, delay },
  });

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
              value: progressData.overall.totalPoints,
            },
            {
              icon: '⭐',
              label: 'Current Level',
              value: `Level ${progressData.overall.level}`,
            },
            {
              icon: '✅',
              label: 'Goals Completed',
              value: progressData.overall.completedGoals,
            },
            {
              icon: '🚀',
              label: 'Challenges Done',
              value: progressData.overall.completedChallenges,
            },
            {
              icon: '🔥',
              label: 'Day Streak',
              value: progressData.overall.currentStreak,
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
                            (progressData.overall.experiencePoints /
                              progressData.overall.nextLevelXP) *
                            100
                          }%`,
                        }}
                        transition={{ duration: 1, ease: 'easeOut' }}
                      />
                    </div>
                    <small>
                      {progressData.overall.experiencePoints}/
                      {progressData.overall.nextLevelXP} XP
                    </small>
                  </>
                )}
                {stat.label === 'Day Streak' && (
                  <small>
                    Longest: {progressData.overall.longestStreak} days
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
                <option value="month">This Month</option>
                <option value="year">This Year</option>
              </select>
            </div>

            <div className="weekly-chart">
              {progressData.weeklyProgress.map((day, index) => (
                <motion.div
                  key={index}
                  className="day-column"
                  initial={{ opacity: 0, y: 60 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + index * 0.1, duration: 0.6 }}
                >
                  <div className="day-label">{day.day}</div>
                  <motion.div
                    className="day-bar"
                    initial={{ height: 0 }}
                    animate={{ height: `${Math.max(day.points / 2, 5)}px` }}
                    transition={{ delay: 0.3 + index * 0.1, duration: 0.6 }}
                    title={`${day.points} points, ${day.timeSpent} minutes`}
                  />
                  <div className="day-points">{day.points}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div className="recent-activity-section" {...fadeIn(0.3)}>
            <h2>Recent Activity</h2>
            <div className="activity-list">
              {progressData.recentActivity.map((activity, i) => (
                <motion.div
                  key={activity.id}
                  className="activity-item"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.1, duration: 0.4 }}
                >
                  <div className="activity-icon">
                    {activity.type === 'challenge_completed' && '🚀'}
                    {activity.type === 'goal_progress' && '🎯'}
                    {activity.type === 'achievement_earned' && '🏆'}
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

        {/* 🧠 Skill Breakdown */}
        <motion.div className="skills-section" {...fadeIn(0.4)}>
          <h2>Skill Breakdown</h2>
          <div className="skills-grid">
            {progressData.skillBreakdown.map((skill, index) => (
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
