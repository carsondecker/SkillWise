// TODO: Implement progress tracking and analytics page
import React, { useState, useEffect } from 'react';
import LoadingSpinner from '../components/common/LoadingSpinner';
import api from '../services/api';
import useAuth from '../hooks/useAuth';

const ProgressPage = () => {
  const { user } = useAuth() || {};
  const [progressData, setProgressData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('week');
  const [error, setError] = useState(null);

  const normalize = (payload) => {
    if (!payload) return null;
    const body = payload.data ?? payload;
    // prefer top-level shapes used across app
    return {
      overall: body.overall ?? body.summary ?? body,
      recentActivity: body.recentActivity ?? body.activities ?? body.recent ?? [],
      weeklyProgress: body.weeklyProgress ?? body.activity ?? [],
      skillBreakdown: body.skillBreakdown ?? body.skills ?? [],
      ...body,
    };
  };

  const loadProgress = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { timeframe };
      if (user?.id) params.userId = user.id;

      const res = await api.get('/progress', { params });
      let data = normalize(res?.data ?? res);

      // fallback: try user-scoped endpoint if /progress returned nothing useful
      if (!data || !data.overall) {
        if (user?.id) {
          try {
            const alt = await api.get(`/users/${user.id}/progress`, { params: { timeframe } });
            data = normalize(alt?.data ?? alt);
          } catch (altErr) {
            // swallow, will surface below if still empty
          }
        }
      }

      if (!data || !data.overall) {
        throw new Error('No progress data returned from server');
      }

      setProgressData(data);
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Failed to load progress');
      setProgressData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProgress();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeframe, user?.id]);

  if (loading) {
    return <LoadingSpinner message="Loading your progress..." />;
  }

  if (error) {
    return (
      <div className="progress-page">
        <div className="page-header">
          <h1>Your Learning Progress</h1>
          <p>Track your journey and celebrate your achievements</p>
        </div>
        <div style={{ padding: 20 }}>
          <p style={{ color: '#e11d48' }}>{error}</p>
          <button className="btn-secondary" onClick={loadProgress}>Retry</button>
        </div>
      </div>
    );
  }

  const pd = progressData || {};

  return (
    <div className="progress-page">
      <div className="page-header">
        <h1>Your Learning Progress</h1>
        <p>Track your journey and celebrate your achievements</p>
      </div>

      <div className="progress-overview">
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">🎯</div>
            <div className="stat-content">
              <h3>{pd.overall?.totalPoints ?? pd.totalPoints ?? 0}</h3>
              <p>Total Points</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">⭐</div>
            <div className="stat-content">
              <h3>Level {pd.overall?.level ?? pd.level ?? 0}</h3>
              <p>Current Level</p>
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{
                    width: `${((pd.overall?.experiencePoints ?? pd.experiencePoints ?? 0) / (pd.overall?.nextLevelXP ?? pd.nextLevelXP ?? 1)) * 100}%`,
                  }}
                ></div>
              </div>
              <small>{pd.overall?.experiencePoints ?? pd.experiencePoints ?? 0}/{pd.overall?.nextLevelXP ?? pd.nextLevelXP ?? 0} XP</small>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">✅</div>
            <div className="stat-content">
              <h3>{pd.overall?.completedGoals ?? pd.completedGoals ?? 0}</h3>
              <p>Goals Completed</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">🚀</div>
            <div className="stat-content">
              <h3>{pd.overall?.completedChallenges ?? pd.completedChallenges ?? 0}</h3>
              <p>Challenges Done</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">🔥</div>
            <div className="stat-content">
              <h3>{pd.overall?.currentStreak ?? pd.currentStreak ?? 0}</h3>
              <p>Day Streak</p>
              <small>Longest: {pd.overall?.longestStreak ?? pd.longestStreak ?? 0} days</small>
            </div>
          </div>
        </div>
      </div>

      <div className="progress-sections">
        <div className="section-row">
          <div className="progress-chart-section">
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
              {(pd.weeklyProgress ?? []).map((day, index) => (
                <div key={index} className="day-column">
                  <div className="day-label">{day.day ?? day.label ?? `Day ${index + 1}`}</div>
                  <div
                    className="day-bar"
                    style={{ height: `${Math.max((day.points ?? day.value ?? 0) / 2, 5)}px` }}
                    title={`${day.points ?? day.value ?? 0} points, ${day.timeSpent ?? day.minutes ?? 0} minutes`}
                  ></div>
                  <div className="day-points">{day.points ?? day.value ?? 0}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="recent-activity-section">
            <h2>Recent Activity</h2>
            <div className="activity-list">
              {(pd.recentActivity ?? []).map((activity) => (
                <div key={activity.id ?? activity._id} className="activity-item">
                  <div className="activity-icon">
                    {activity.type === 'challenge_completed' && '🚀'}
                    {activity.type === 'goal_progress' && '🎯'}
                    {activity.type === 'achievement_earned' && '🏆'}
                  </div>
                  <div className="activity-content">
                    <h4>{activity.title}</h4>
                    <p>
                      {activity.points ? `+${activity.points} points` : ''}
                      {activity.progress ? ` ${activity.progress}% complete` : ''}
                    </p>
                    <small>{activity.timestamp ? new Date(activity.timestamp).toLocaleDateString() : (activity.date ? new Date(activity.date).toLocaleDateString() : '')}</small>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="skills-section">
          <h2>Skill Breakdown</h2>
          <div className="skills-grid">
            {(pd.skillBreakdown ?? []).map((skill, index) => (
              <div key={index} className="skill-item">
                <div className="skill-header">
                  <h4>{skill.skill ?? skill.name ?? `Skill ${index + 1}`}</h4>
                  <span className="skill-level">Level {skill.level ?? skill.levelNum ?? '-'}</span>
                </div>
                <div className="skill-progress">
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{ width: `${skill.progress ?? 0}%` }}
                    ></div>
                  </div>
                  <span className="progress-text">{skill.progress ?? 0}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProgressPage;
