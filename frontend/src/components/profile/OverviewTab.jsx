import React from 'react';
import '../../styles/components/Profile/OverviewTab.scss';

const OverviewTab = ({ profile, recentActivity }) => {
  const getIcon = (type) => ({
    challenge: '🏆',
    goal: '🎯',
    progress: '📝',
  }[type] || '📝');

  const formatAgo = (date) => {
    const d = new Date(date);
    const diff = (Date.now() - d) / 3600000;
    if (diff < 1) return 'Just now';
    if (diff < 24) return `${Math.floor(diff)}h ago`;
    return `${Math.floor(diff / 24)}d ago`;
  };

  return (
    <div className="overview-tab">
      <div className="overview-grid">
        <div className="glass-card highlight">
          <div className="card-meta">
            <span className="eyebrow">Snapshot</span>
            <h3>Performance overview</h3>
          </div>
          <div className="mini-stats">
            <div>
              <p className="label">Total Points</p>
              <p className="value">{profile.totalPoints}</p>
            </div>
            <div>
              <p className="label">Challenges</p>
              <p className="value">{profile.completedChallenges}</p>
            </div>
            <div>
              <p className="label">Goals</p>
              <p className="value">{profile.goalsAchieved}</p>
            </div>
            <div>
              <p className="label">Longest Streak</p>
              <p className="value">{profile.longestStreak}d</p>
            </div>
          </div>
          <div className="subtext">
            Keep the momentum. A small win today continues your streak.
          </div>
        </div>

        <div className="glass-card">
          <div className="card-meta">
            <span className="eyebrow">Recent</span>
            <h3>Activity feed</h3>
          </div>
          {recentActivity.length === 0 ? (
            <p className="empty">No activity yet.</p>
          ) : (
            <div className="activity-list">
              {recentActivity.map((a) => (
                <div className="activity-item" key={a.id}>
                  <div className="icon">{getIcon(a.type)}</div>
                  <div className="info">
                    <h4>{a.title}</h4>
                    <span>{formatAgo(a.date)}</span>
                  </div>
                  <span className="pill">+{a.points} pts</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="glass-card">
          <div className="card-meta">
            <span className="eyebrow">Achievements</span>
            <h3>Milestones</h3>
          </div>
          <div className="achievements">
            <div className="achievement">
              <div className="icon">🎯</div>
              <div>
                <p className="label">Goals completed</p>
                <p className="value">{profile.goalsAchieved}</p>
              </div>
            </div>
            <div className="achievement">
              <div className="icon">🔥</div>
              <div>
                <p className="label">Longest streak</p>
                <p className="value">{profile.longestStreak} days</p>
              </div>
            </div>
            <div className="achievement">
              <div className="icon">🏅</div>
              <div>
                <p className="label">Badges earned</p>
                <p className="value">{profile.badges.filter((b) => b.earned).length}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OverviewTab;
