// TODO: Implement leaderboard and rankings page
import React, { useState, useEffect } from 'react';
import LoadingSpinner from '../components/common/LoadingSpinner';
import '../styles/components/dashboard/LeaderboardPage.scss';
import { useAuth } from '../hooks/useAuth';
import { apiService } from '../services/api';
import { useLayout } from '../contexts/LayoutContext';

const LeaderboardPage = () => {
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('all-time');
  const [category, setCategory] = useState('overall');
  const { user } = useAuth();
  const { setTitle, setSubtitle } = useLayout();

  // Load leaderboard from backend
  useEffect(() => {
    setTitle('Leaderboard');
    setSubtitle('See how you compare with other learners');
    let mounted = true;

    const load = async () => {
      setLoading(true);
      try {
        // Map UI timeframe values to API 'period' param accepted by backend
        const timeframeMap = {
          'all-time': 'alltime',
          'this-month': 'monthly',
          'this-week': 'weekly',
          today: 'daily',
        };

        const params = {
          period: timeframeMap[timeframe] || 'alltime',
          category,
          limit: 100,
        };

        const res = await apiService.leaderboard.getGlobal(params);
        const rows = res.data?.leaderboard || res.data || [];

        // Normalize backend rows to UI-friendly shape
        const list = (rows || []).map((row, idx) => {
          const first = row.first_name || '';
          const last = row.last_name || '';
          const username = row.username || `${first} ${last}`.trim();

          const points = Number(
            row.total_points ??
              row.weekly_points ??
              row.monthly_points ??
              row.subject_points ??
              0,
          );

          const completedChallenges = Number(
            row.challenges_completed ??
              row.weekly_completions ??
              row.monthly_completions ??
              row.subject_completions ??
              0,
          );

          const name = username || `${first} ${last}`.trim() || 'Unknown';

          const initials =
            (first[0] || name[0] || '').toUpperCase() +
            (last[0] || '').toUpperCase();

          return {
            id: row.id,
            name,
            points,
            completedChallenges,
            averageScore: Number(row.average_score ?? 0),
            level: Math.max(1, Math.floor(points / 100)),
            avatar: initials,
            rank: idx + 1,
            isCurrentUser: String(row.id) === String(user?.id),
          };
        });
        if (!mounted) return;
        setLeaderboardData(list);
      } catch (error) {
        console.error('Failed to load leaderboard:', error);
        if (!mounted) return;
        setLeaderboardData([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();

    return () => {
      mounted = false;
    };
  }, [timeframe, category, user]);

  const getRankIcon = (rank) => {
    switch (rank) {
      case 1:
        return '🥇';
      case 2:
        return '🥈';
      case 3:
        return '🥉';
      default:
        return `#${rank}`;
    }
  };

  const [currentUserRank, setCurrentUserRank] = useState(0);
  const [achievements, setAchievements] = useState([]);

  // derive current user rank from loaded leaderboard or fallback to API
  useEffect(() => {
    let mounted = true;
    const findRank = async () => {
      const found = leaderboardData.find((u) => u.isCurrentUser);
      if (found) {
        if (mounted) setCurrentUserRank(found.rank || 0);
        return;
      }

      // not in current list (outside top-N). Try to fetch points/rank for current user
      if (!user) {
        if (mounted) setCurrentUserRank(0);
        return;
      }

      try {
        // Prefer the /ranking endpoint that returns the user's rank and points
        const rankResp = await apiService.leaderboard.getUserRank();
        const rankData = rankResp.data?.ranking || rankResp.data || {};
        const rankValue = rankData?.rank ?? rankData?.ranking?.rank ?? 0;
        if (mounted) setCurrentUserRank(rankValue || 0);

        // Also load achievements for the user (optional)
        try {
          const ach = await apiService.leaderboard.getAchievements();
          const list = ach.data?.achievements || ach.data || [];
          if (mounted) setAchievements(list);
        } catch (achErr) {
          // ignore achievements failure
          if (mounted) setAchievements([]);
        }
      } catch (err) {
        // fallback to points breakdown if ranking endpoint isn't available
        try {
          const res = await apiService.leaderboard.getPointsBreakdown();
          const data = res.data || {};
          const breakdown = data.breakdown || data.ranking || data;
          const fallbackRank = breakdown?.rank ?? breakdown?.ranking?.rank ?? 0;
          if (mounted) setCurrentUserRank(fallbackRank || 0);
        } catch (err2) {
          if (mounted) setCurrentUserRank(0);
        }
      }
    };

    findRank();
    return () => {
      mounted = false;
    };
  }, [leaderboardData, user]);

  return (
    <div className="leaderboard-page">
      <div className="leaderboard-filters">
        <div className="filters-row">
          <div className="filter-group">
            <label htmlFor="timeframe">Timeframe</label>
            <select
              id="timeframe"
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value)}
            >
              <option value="all-time">All Time</option>
              <option value="this-month">This Month</option>
              <option value="this-week">This Week</option>
              <option value="today">Today</option>
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="category">Category</label>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="overall">Overall Points</option>
              <option value="challenges">Challenges Completed</option>
              <option value="goals">Goals Achieved</option>
              <option value="streak">Learning Streak</option>
            </select>
          </div>
        </div>
      </div>

      {currentUserRank > 0 && (
        <div className="user-rank-summary">
          <div className="rank-card current-user">
            <h3>Your Ranking</h3>
            <div className="rank-info">
              <span className="rank-number">#{currentUserRank}</span>
              <div className="rank-details">
                <p>
                  You're in the top{' '}
                  {Math.round((currentUserRank / leaderboardData.length) * 100)}
                  % of learners!
                </p>
                <small>Keep learning to climb higher!</small>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="leaderboard-content">
        {loading ? (
          <LoadingSpinner message="Loading leaderboard..." />
        ) : (
          <>
            <div className="podium-section">
              <h2>Top Performers</h2>
              <div className="podium">
                {leaderboardData.slice(0, 3).map((user, index) => (
                  <div
                    key={user.id}
                    className={`podium-position position-${index + 1}`}
                  >
                    <div className="podium-user">
                      <div className="user-avatar">{user.avatar}</div>
                      <h4>{user.name}</h4>
                      <p>{user.points} points</p>
                      <span className="level-badge">Level {user.level}</span>
                    </div>
                    <div className="podium-rank">{getRankIcon(user.rank)}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="full-rankings">
              <h2>Complete Rankings</h2>
              <div className="rankings-table">
                <div className="table-header">
                  <div className="col-rank">Rank</div>
                  <div className="col-user">User</div>
                  <div className="col-points">Points</div>
                  <div className="col-level">Level</div>
                  <div className="col-challenges">Challenges</div>
                </div>

                {leaderboardData.map((user) => (
                  <div
                    key={user.id}
                    className={`table-row ${
                      user.isCurrentUser ? 'current-user' : ''
                    }`}
                  >
                    <div className="col-rank">
                      <span className="rank-icon">
                        {getRankIcon(user.rank)}
                      </span>
                    </div>
                    <div className="col-user">
                      <div className="user-info">
                        <span className="user-avatar">{user.avatar}</span>
                        <span className="user-name">
                          {user.name}
                          {user.isCurrentUser && <small> (You)</small>}
                        </span>
                      </div>
                    </div>
                    <div className="col-points">
                      <strong>{user.points.toLocaleString()}</strong>
                    </div>
                    <div className="col-level">
                      <span className="level-badge">Level {user.level}</span>
                    </div>
                    <div className="col-challenges">
                      {user.completedChallenges}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Achievements will be populated from backend in a follow-up change. Removed static placeholders. */}
            {achievements.length > 0 && (
              <div className="achievements-section">
                <h2>Your Achievements</h2>
                <div className="achievements-grid">
                  {achievements.map((a) => (
                    <div className="achievement-card" key={a.id || a.name}>
                      <div className="achievement-icon">
                        {a.badge_icon || '🏅'}
                      </div>
                      <h4>{a.name}</h4>
                      <p>{a.description}</p>
                      <small>{a.category}</small>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default LeaderboardPage;
