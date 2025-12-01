import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
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
import { useAuth } from '../../hooks/useAuth'; // 👈 import your auth hook
import '../../styles/components/dashboard/DashboardOverview.scss';
import { apiService } from '../../services/api';

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState([
    { label: 'Goals Completed', value: 0, color: '#6C63FF' },
    { label: 'Challenges Completed', value: 0, color: '#FF6584' },
    { label: 'Current Streak', value: '0 days', color: '#00C9A7' },
    { label: 'Total Points', value: 0, color: '#F9A826' },
  ]);

  const [chartData, setChartData] = useState({
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        label: 'Learning Progress',
        data: [0, 0, 0, 0, 0, 0, 0],
        borderColor: '#6C63FF',
        tension: 0.3,
        fill: true,
        backgroundColor: 'rgba(108, 99, 255, 0.1)',
        pointBackgroundColor: '#6C63FF',
      },
    ],
  });

  // Fetch dashboard data from API and map to UI-friendly shape
  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setLoading(true);
      try {
        // Try multiple progress endpoints if available
        const [overviewRes, statsRes] = await Promise.allSettled([
          apiService.progress.getOverview(),
          apiService.progress.getStats(),
        ]);

        if (!mounted) return;

        // Map overview -> chart activity if present
        if (overviewRes.status === 'fulfilled' && overviewRes.value?.data) {
          const overview = overviewRes.value.data;

          // Look for weekly activity array (flexible mapping)
          const activity =
            overview.weekly || overview.activity || overview.series || null;

          if (Array.isArray(activity) && activity.length >= 1) {
            const labels = activity.map((a) => (a.label ? a.label : a.day || ''));
            const values = activity.map((a) => (typeof a.value !== 'undefined' ? Number(a.value) : 0));

            setChartData((prev) => ({
              ...prev,
              labels: labels.length ? labels : prev.labels,
              datasets: [{ ...prev.datasets[0], data: values }],
            }));
          }

          // Map overview counts into stats if available
          setStats((prev) => {
            try {
              return [
                { label: 'Goals Completed', value: overview.goals_completed ?? prev[0].value, color: prev[0].color },
                { label: 'Challenges Completed', value: overview.challenges_completed ?? prev[1].value, color: prev[1].color },
                { label: 'Current Streak', value: overview.current_streak ? `${overview.current_streak} days` : prev[2].value, color: prev[2].color },
                { label: 'Total Points', value: overview.total_points ?? prev[3].value, color: prev[3].color },
              ];
            } catch (e) {
              return prev;
            }
          });
        }

        // If there's a dedicated stats endpoint, prefer its data
        if (statsRes.status === 'fulfilled' && statsRes.value?.data) {
          const s = statsRes.value.data;
          setStats((prev) => [
            { label: 'Goals Completed', value: s.goals_completed ?? prev[0].value, color: prev[0].color },
            { label: 'Challenges Completed', value: s.challenges_completed ?? prev[1].value, color: prev[1].color },
            { label: 'Current Streak', value: s.current_streak ? `${s.current_streak} days` : prev[2].value, color: prev[2].color },
            { label: 'Total Points', value: s.total_points ?? prev[3].value, color: prev[3].color },
          ]);
        }

        setError(null);
      } catch (err) {
        console.error('Dashboard load failed', err);
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    load();

    return () => {
      mounted = false;
    };
  }, []);

  const chartOptions = {
    responsive: true,
    plugins: { legend: { display: false } },
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

  return (
    <motion.div
      className="dashboard-overview"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      {/* Header */}
      <div className="ai-top-section">
        <h2>Welcome Back, {displayName} 👋</h2>
        <p>Here’s a snapshot of your recent progress and activity.</p>
      </div>

      {/* 📊 Stats Section */}
      <div className="stats-grid">
        {stats.map((stat, i) => (
          <motion.div
            key={i}
            className="stat-card"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * i, duration: 0.4 }}
            style={{ borderTop: `4px solid ${stat.color}` }}
          >
            <h3>{stat.label}</h3>
            <p className="stat-number" style={{ color: stat.color }}>
              {stat.value}
            </p>
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
          <h3>Your Weekly Progress</h3>
          <div className="chart-container">
            {loading ? (
              <p>Loading chart...</p>
            ) : error ? (
              <p className="error">{error}</p>
            ) : (
              <Line data={chartData} options={chartOptions} />
            )}
          </div>
        </motion.div>
        <motion.div
          className="ai-chat-section"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h3>Recent Activity</h3>
          {loading ? (
            <p>Loading activity...</p>
          ) : error ? (
            <p className="error">{error}</p>
          ) : (
            <div className="activity-insights">
              <p>Quick stats and recent progress are shown on the left.</p>
              <ul>
                <li>Last sync: {new Date().toLocaleString()}</li>
                <li>Tip: Complete challenges to earn points and climb the leaderboard.</li>
              </ul>
            </div>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
};

export default DashboardOverview;
