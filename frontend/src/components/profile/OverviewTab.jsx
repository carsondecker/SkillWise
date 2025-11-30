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
      <div className="recent-activity-box">
        <h3>Recent Activity</h3>
        {recentActivity.length === 0 ? (
          <p>No activity yet.</p>
        ) : (
          <div className="activity-list">
            {recentActivity.map((a) => (
              <div className="activity-item" key={a.id}>
                <div className="icon">{getIcon(a.type)}</div>
                <div className="info">
                  <h4>{a.title}</h4>
                  <span>{formatAgo(a.date)}</span>
                  <span className="points">+{a.points} pts</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="achievement-box">
        <h3>Achievements</h3>
        <div className="achievements">
          <div><strong>{profile.goalsAchieved}</strong> Goals</div>
          <div><strong>{profile.longestStreak}</strong> Longest Streak</div>
          <div><strong>{profile.badges.filter(b => b.earned).length}</strong> Badges</div>
        </div>
      </div>
    </div>
  );
};

export default OverviewTab;
