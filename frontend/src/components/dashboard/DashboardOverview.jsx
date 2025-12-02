import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Lottie from 'lottie-react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from 'chart.js';
import aiAnimation from '../../assets/animations/ai-chat.json';
import { useAuth } from '../../hooks/useAuth'; // 👈 import your auth hook
import { apiService } from '../../services/api';
import LoadingSpinner from '../common/LoadingSpinner';
import '../../styles/components/dashboard/DashboardOverview.scss';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend
);

const DashboardOverview = () => {
  const { user } = useAuth(); // 👈 get user info (firstName, lastName)
  const [aiInput, setAiInput] = useState('');
  const [messages, setMessages] = useState([
    {
      sender: 'ai',
      text: 'Hello! I’m your AI Mentor 👋 How are you feeling today?',
    },
  ]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState(null);
  const [progress, setProgress] = useState(null);
  const [streak, setStreak] = useState(null);
  const [timeframe, setTimeframe] = useState('week');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError('');

        const [statsRes, progressRes, streakRes] = await Promise.all([
          apiService.user.getStatistics(),
          apiService.progress.getProgress({ timeframe }),
          apiService.streaks.getStreak(),
        ]);

        setStats(statsRes.data.statistics || statsRes.data || {});
        setProgress(progressRes.data.progress || progressRes.data || {});
        console.log(progressRes.data.progress);
        setStreak(streakRes.data.streak || streakRes.data || {});
      } catch (err) {
        console.error('❌ Dashboard fetch failed', err);
        setError('Unable to load your dashboard data right now.');
      } finally {
        setLoading(false);
      }
    };

    void fetchData();
  }, [timeframe]);

  const weeklyProgress = progress?.weeklyProgress || [];
  const recentActivity = progress?.recentActivity || [];
  const overall = progress?.overall || {};

  const chartData = useMemo(() => {
    const labels =
      weeklyProgress.length > 0
        ? weeklyProgress.map((d) =>
          new Date(d.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        )
        : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    const points =
      weeklyProgress.length > 0
        ? weeklyProgress.map((d) => d.points || 0)
        : [10, 12, 14, 10, 16, 20, 22];

    const challenges =
      weeklyProgress.length > 0
        ? weeklyProgress.map((d) => d.challengesCompleted || 0)
        : [0, 1, 1, 0, 2, 1, 2];

    return {
      labels,
      datasets: [
        {
          label: 'Points',
          data: points,
          borderColor: '#6C63FF',
          tension: 0.35,
          fill: true,
          backgroundColor: 'rgba(108, 99, 255, 0.12)',
          pointBackgroundColor: '#6C63FF',
        },
        {
          label: 'Challenges',
          data: challenges,
          borderColor: '#22c55e',
          tension: 0.35,
          fill: false,
          borderDash: [6, 4],
          pointBackgroundColor: '#22c55e',
        },
      ],
    };
  }, [weeklyProgress]);

  const chartOptions = {
    responsive: true,
    plugins: { legend: { display: true, position: 'bottom' } },
    scales: {
      y: { beginAtZero: true, grid: { color: '#e5e7eb' } },
      x: { grid: { display: false } },
    },
  };

  // 💬 AI Chat (mock)
  const handleAiAsk = (e) => {
    e.preventDefault();
    if (!aiInput.trim()) return;

    const newMessages = [...messages, { sender: 'user', text: aiInput }];
    setMessages(newMessages);
    setAiInput('');

    setTimeout(() => {
      const responses = [
        'Try reviewing your notes from yesterday.',
        'Focus on one topic and master it today!',
        'Consistency builds excellence 💪',
        'Your progress looks strong — keep the streak alive 🔥',
      ];
      const random = responses[Math.floor(Math.random() * responses.length)];
      setMessages((prev) => [...prev, { sender: 'ai', text: random }]);
    }, 1000);
  };

  // 🧩 Format full name
  const displayName =
    user?.firstName || user?.lastName
      ? `${user.firstName || ''} ${user.lastName || ''}`.trim()
      : 'Learner';

  if (loading) {
    return <LoadingSpinner message="Loading your dashboard..." />;
  }

  return (
    <motion.div
      className="dashboard-overview"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      <div className="hero-card">
        <div>
          <p className="eyebrow">Dashboard</p>
          <h2>Welcome back, {displayName} 👋</h2>
          <p className="lede">
            Track your momentum, celebrate wins, and let the AI mentor keep you moving forward.
          </p>
          <div className="hero-meta">
            <span>Level {stats?.level || 1}</span>
            <span>{stats?.current_streak_days || streak?.current_streak || 0} day streak</span>
            <span>{stats?.total_points || overall.totalPoints || 0} pts</span>
          </div>
        </div>
        <Lottie animationData={aiAnimation} loop className="ai-top-lottie" />
      </div>

      {error && (
        <div className="error-banner">
          <p>{error}</p>
        </div>
      )}

      {/* 📊 Stats Section */}
      <div className="stats-grid">
        {[
          {
            label: 'Total Points',
            value: stats?.total_points || overall.totalPoints || 0,
            accent: '#7c3aed',
            sub: 'Earned across all work',
          },
          {
            label: 'Challenges Completed',
            value: stats?.total_challenges_completed || overall.completedChallenges || 0,
            accent: '#22c55e',
            sub: 'Finished & graded',
          },
          {
            label: 'Goals Achieved',
            value: stats?.total_goals_completed || 0,
            accent: '#f97316',
            sub: 'Milestones hit',
          },
          {
            label: 'Average Score',
            value: `${Math.round(stats?.average_score || overall.averageScore || 0)}%`,
            accent: '#0ea5e9',
            sub: 'Across graded work',
          },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            className="stat-card"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 * i, duration: 0.4 }}
          >
            <div className="stat-accent" style={{ background: stat.accent }} />
            <div>
              <p className="stat-label">{stat.label}</p>
              <p className="stat-value">{stat.value}</p>
              <p className="stat-sub">{stat.sub}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* 📈 Chart + 💬 AI Chat Section */}
      <div className="dashboard-grid">
        <motion.div
          className="progress-chart"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="section-heading">
            <div>
              <p className="eyebrow">Progress</p>
              <h3>Weekly momentum</h3>
            </div>
            <div className="timeframe-toggle">
              {['week', 'month', 'year'].map((tf) => (
                <button
                  key={tf}
                  className={timeframe === tf ? 'active' : ''}
                  onClick={() => setTimeframe(tf)}
                >
                  {tf}
                </button>
              ))}
            </div>
          </div>
          <div className="chart-container">
            <Line data={chartData} options={chartOptions} />
          </div>
        </motion.div>

        <motion.div
          className="ai-chat-section"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="section-heading">
            <div>
              <p className="eyebrow">Coach</p>
              <h3>Ask your AI mentor</h3>
            </div>
            <span className="pill success">
              {stats?.current_streak_days || streak?.current_streak || 0} day streak
            </span>
          </div>
          <div className="chat-box">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`chat-bubble ${msg.sender === 'ai' ? 'ai' : 'user'}`}
              >
                {msg.text}
              </div>
            ))}
          </div>

          <form onSubmit={handleAiAsk} className="chat-input">
            <input
              type="text"
              placeholder={`Ask something, ${displayName.split(' ')[0]}...`}
              value={aiInput}
              onChange={(e) => setAiInput(e.target.value)}
            />
            <button type="submit">Send</button>
          </form>
        </motion.div>
      </div>

      {/* Activity + sessions */}
      <div className="activity-grid">
        <motion.div
          className="activity-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="section-heading">
            <div>
              <p className="eyebrow">Recent</p>
              <h3>Latest activity</h3>
            </div>
          </div>
          <ul className="activity-list">
            {recentActivity.length === 0 && <li className="empty">No recent activity yet.</li>}
            {recentActivity.map((item) => (
              <li key={item.id}>
                <div>
                  <p className="activity-title">{item.title || 'Progress update'}</p>
                  <p className="activity-meta">
                    {new Date(item.timestamp || item.createdAt || Date.now()).toLocaleString()}
                  </p>
                </div>
                <span className="pill">
                  {item.points ? `+${item.points} pts` : item.type || 'activity'}
                </span>
              </li>
            ))}
          </ul>
        </motion.div>

        <motion.div
          className="session-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55 }}
        >
          <div className="section-heading">
            <div>
              <p className="eyebrow">Energy</p>
              <h3>Focus snapshot</h3>
            </div>
          </div>
          <div className="focus-metrics">
            <div>
              <p className="stat-label">Current streak</p>
              <p className="stat-value">
                {stats?.current_streak_days || streak?.current_streak || 0} days
              </p>
            </div>
            <div>
              <p className="stat-label">Longest streak</p>
              <p className="stat-value">
                {stats?.longest_streak_days || streak?.longest_streak || 0} days
              </p>
            </div>
            <div>
              <p className="stat-label">XP</p>
              <p className="stat-value">
                {stats?.experience_points || overall.experiencePoints || 0}
              </p>
            </div>
          </div>
          <div className="session-note">
            Keep your streak alive with a quick win today. A 10-minute review still counts!
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default DashboardOverview;
