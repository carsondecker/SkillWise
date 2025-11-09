// TODO: Implement progress tracking and analytics page
import React, { useState, useEffect } from 'react';
import LoadingSpinner from '../components/common/LoadingSpinner';
import '../styles/components/dashboard/ProgressPage.scss';
import { apiService } from '../services/api';
import { useLayout } from '../contexts/LayoutContext';

const ProgressPage = () => {
  const [progressData, setProgressData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('week');

  const { setTitle, setSubtitle } = useLayout();

  // Load progress data from backend
  useEffect(() => {
    setTitle('Progress');
    setSubtitle('Track your journey and celebrate your achievements');
    let mounted = true;

    const load = async () => {
      setLoading(true);
      try {
        const res = await apiService.progress.getOverview({ timeframe });
        const data = res.data || {};
        if (!mounted) return;
        setProgressData(data);
      } catch (error) {
        console.error('Failed to load progress data:', error);
        if (!mounted) return;
        setProgressData({
          overall: {
            totalPoints: 0,
            level: 1,
            experiencePoints: 0,
            nextLevelXP: 100,
            completedGoals: 0,
            completedChallenges: 0,
            currentStreak: 0,
            longestStreak: 0,
          },
          recentActivity: [],
          weeklyProgress: [],
          skillBreakdown: [],
        });
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();

    return () => {
      mounted = false;
    };
  }, [timeframe]);

  return (
    <div className="progress-page">
      {loading ? (
        <div className="page-loading">
          <LoadingSpinner message="Loading your progress..." />
        </div>
      ) : (
        <>
          <div className="progress-overview">
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon">🎯</div>
                <div className="stat-content">
                  <h3>{progressData.overall.totalPoints}</h3>
                  <p>Total Points</p>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">⭐</div>
                <div className="stat-content">
                  <h3>Level {progressData.overall.level}</h3>
                  <p>Current Level</p>
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{
                        width: `${
                          (progressData.overall.experiencePoints /
                            progressData.overall.nextLevelXP) *
                          100
                        }%`,
                      }}
                    ></div>
                  </div>
                  <small>
                    {progressData.overall.experiencePoints}/
                    {progressData.overall.nextLevelXP} XP
                  </small>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">✅</div>
                <div className="stat-content">
                  <h3>{progressData.overall.completedGoals}</h3>
                  <p>Goals Completed</p>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">🚀</div>
                <div className="stat-content">
                  <h3>{progressData.overall.completedChallenges}</h3>
                  <p>Challenges Done</p>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">🔥</div>
                <div className="stat-content">
                  <h3>{progressData.overall.currentStreak}</h3>
                  <p>Day Streak</p>
                  <small>
                    Longest: {progressData.overall.longestStreak} days
                  </small>
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
                  {progressData.weeklyProgress.map((day, index) => (
                    <div key={index} className="day-column">
                      <div className="day-label">{day.day}</div>
                      <div
                        className="day-bar"
                        style={{ height: `${Math.max(day.points / 2, 5)}px` }}
                        title={`${day.points} points, ${day.timeSpent} minutes`}
                      ></div>
                      <div className="day-points">{day.points}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="recent-activity-section">
                <h2>Recent Activity</h2>
                <div className="activity-list">
                  {progressData.recentActivity.map((activity) => (
                    <div key={activity.id} className="activity-item">
                      <div className="activity-icon">
                        {activity.type === 'challenge_completed' && '🚀'}
                        {activity.type === 'goal_progress' && '🎯'}
                        {activity.type === 'achievement_earned' && '🏆'}
                      </div>
                      <div className="activity-content">
                        <h4>{activity.title}</h4>
                        <p>
                          {activity.points && `+${activity.points} points`}
                          {activity.progress &&
                            `${activity.progress}% complete`}
                        </p>
                        <small>
                          {new Date(activity.timestamp).toLocaleDateString()}
                        </small>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="skills-section">
              <h2>Skill Breakdown</h2>
              <div className="skills-grid">
                {progressData.skillBreakdown.map((skill, index) => (
                  <div key={index} className="skill-item">
                    <div className="skill-header">
                      <h4>{skill.skill}</h4>
                      <span className="skill-level">Level {skill.level}</span>
                    </div>
                    <div className="skill-progress">
                      <div className="progress-bar">
                        <div
                          className="progress-fill"
                          style={{ width: `${skill.progress}%` }}
                        ></div>
                      </div>
                      <span className="progress-text">{skill.progress}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ProgressPage;
