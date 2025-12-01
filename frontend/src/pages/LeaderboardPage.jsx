import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { useAuth } from '../hooks/useAuth';
import { apiService } from '../services/api';
import '../styles/LearderboradPage.scss';

const LeaderboardPage = () => {
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('global'); // matches backend
  const [category, setCategory] = useState('overall');
  const [userRank, setUserRank] = useState(null);
  const { user } = useAuth();

  // 🧠 Fetch leaderboard data from API
  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setLoading(true);
        let res;

        if (category !== 'overall') {
          // Category-specific leaderboard
          res = await apiService.leaderboard.getByCategory(category, {
            limit: 20,
          });
        } else {
          // Global / weekly / monthly leaderboard
          res = await apiService.leaderboard.get({
            timeframe,
            limit: 20,
          });
        }

        const data = Array.isArray(res.data.leaderboard)
          ? res.data.leaderboard
          : res.data?.leaderboard || [];
        console.log(data);

        // Normalize data to match UI shape
        const formatted = data.map((entry, index) => ({
          id: Number(entry.user_id),
          name:
            [entry.first_name, entry.last_name].filter(Boolean).join(' ') ||
            'Anonymous User',
          rank: Number(entry.rank_position) || index + 1,
          avatar: '👤',
          points: Number(
            entry.total_points ||
              entry.weekly_points ||
              entry.monthly_points ||
              0
          ),
          level: entry.level || 1,
          completedChallenges: Number(entry.total_challenges_completed || 0),
          isCurrentUser: Number(entry.user_id) === Number(user?.id),
        }));

        setLeaderboardData(formatted);
        console.log(formatted);
      } catch (err) {
        console.error('❌ Failed to fetch leaderboard:', err);
        setLeaderboardData([]);
      } finally {
        setLoading(false);
      }
    };

    void fetchLeaderboard();
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

  const currentUserRank =
    // Prefer explicit fetched user rank (server-side) if available, otherwise fall back to the visible list
    userRank?.rank_position || leaderboardData.find((u) => u.isCurrentUser)?.rank || 0;

  // If the current user is not in the returned leaderboard slice, fetch their full rank
  useEffect(() => {
    const fetchUserRank = async () => {
      if (!user || !user.id) return;

      const found = leaderboardData.find((u) => Number(u.id) === Number(user.id));
      if (found) {
        setUserRank(null);
        return;
      }

      try {
        const res = await apiService.leaderboard.getUserRank(user.id);
        // backend returns { ranking }
        if (res?.data?.ranking) {
          setUserRank({
            rank_position: Number(res.data.ranking.rank_position) || null,
            total_points: Number(res.data.ranking.total_points) || 0,
          });
        }
      } catch (err) {
        console.debug('Could not fetch user rank:', err?.message || err);
      }
    };

    void fetchUserRank();
  }, [user, leaderboardData]);

  return (
    <div className="leaderboard-page">
      <div className="page-header">
        <h1>🏆 Leaderboard</h1>
        <p>See how you compare with other learners</p>
      </div>

      {/* Filters */}
      <div className="leaderboard-filters">
        <motion.div
          className="table-row"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="filters-row">
            <div className="filter-group">
              <label htmlFor="timeframe">Timeframe</label>
              <select
                id="timeframe"
                value={timeframe}
                onChange={(e) => setTimeframe(e.target.value)}
              >
                <option value="global">All Time</option>
                <option value="monthly">This Month</option>
                <option value="weekly">This Week</option>
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
                <option value="programming">Programming</option>
                <option value="design">Design</option>
                <option value="business">Business</option>
                <option value="data-science">Data Science</option>
              </select>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Current user summary */}
      {currentUserRank > 0 && (
        <div className="user-rank-summary">
          <div className="rank-card current-user">
            <h3>Your Ranking</h3>
            <div className="rank-info">
              <span className="rank-number">#{currentUserRank}</span>
              <div className="rank-details">
                <p>
                  {currentUserRank > 0 ? (
                    <>
                      Ranked <strong>#{currentUserRank}</strong>
                      {leaderboardData.length > 0 && (
                        <> — top{' '}
                        {Math.round(
                          ((Math.max(leaderboardData.length, currentUserRank) -
                            currentUserRank +
                            1) /
                            Math.max(leaderboardData.length, currentUserRank)) *
                            100
                        )}
                        %
                        </>
                      )}
                    </>
                  ) : (
                    'Your ranking will appear here once available.'
                  )}
                </p>
                <small>Keep learning to climb higher!</small>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Leaderboard content */}
      <div className="leaderboard-content">
        {loading ? (
          <LoadingSpinner message="Loading leaderboard..." />
        ) : leaderboardData.length > 0 ? (
          <>
            {/* Top 3 podium */}
            <motion.div
              className="table-row"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
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
                        <p>{user.points.toLocaleString()} pts</p>
                        <span className="level-badge">Level {user.level}</span>
                      </div>
                      <div className="podium-rank">
                        {getRankIcon(user.rank)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Complete table */}
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

                {leaderboardData.map((u) => (
                  <div
                    key={u.id}
                    className={`table-row ${
                      u.isCurrentUser ? 'current-user' : ''
                    }`}
                  >
                    <div className="col-rank">{getRankIcon(u.rank)}</div>
                    <div className="col-user">
                      <div className="user-info">
                        <span className="user-avatar">{u.avatar}</span>
                        <span className="user-name">
                          {u.name}
                          {u.isCurrentUser && <small> (You)</small>}
                        </span>
                      </div>
                    </div>
                    <div className="col-points">
                      <strong>{u.points.toLocaleString()}</strong>
                    </div>
                    <div className="col-level">
                      <span className="level-badge">Lvl {u.level}</span>
                    </div>
                    <div className="col-challenges">
                      {u.completedChallenges}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <p style={{ textAlign: 'center', color: '#6b7280' }}>
            No leaderboard data available yet.
          </p>
        )}
      </div>
    </div>
  );
};

export default LeaderboardPage;
