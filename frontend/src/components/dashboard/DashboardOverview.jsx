// src/components/dashboard/DashboardOverview.jsx
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Lottie from 'lottie-react';
import progressAnimation from '../../assets/animations/progress.json';
import '../../styles/components/dashboard/DashboardOverview.scss';
import { apiService } from '../../services/api';

const DashboardOverview = () => {
  const [stats, setStats] = useState([
    { label: 'Goals Completed', value: 0, color: '#6C63FF' },
    { label: 'Challenges Completed', value: 0, color: '#FF6584' },
    { label: 'Current Streak', value: '0 days', color: '#00C9A7' },
  ]);

  useEffect(() => {
    let mounted = true;

    const loadStats = async () => {
      try {
        const res = await apiService.progress.getStats();
        const data = res.data || {};

        // Expect shape: { goalsCompleted, challengesCompleted, currentStreak }
        const updated = [
          {
            label: 'Goals Completed',
            value: data.goalsCompleted ?? data.completedGoals ?? 0,
            color: '#6C63FF',
          },
          {
            label: 'Challenges Completed',
            value: data.challengesCompleted ?? data.completedChallenges ?? 0,
            color: '#FF6584',
          },
          {
            label: 'Current Streak',
            value: `${data.currentStreak ?? 0} days`,
            color: '#00C9A7',
          },
        ];

        if (mounted) setStats(updated);
      } catch (error) {
        console.error('Failed to load dashboard stats:', error);
        // keep defaults if failed
      }
    };

    loadStats();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <motion.div
      className="dashboard-overview"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      <motion.div
        className="overview-header"
        initial={{ y: -20 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h2>Your Learning Snapshot</h2>
        <Lottie
          animationData={progressAnimation}
          loop
          className="overview-lottie"
        />
      </motion.div>

      <div className="stats-grid">
        {stats.map((stat, index) => (
          <motion.div
            key={index}
            className="stat-card"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 * index, duration: 0.5 }}
            style={{ borderTop: `4px solid ${stat.color}` }}
          >
            <h3>{stat.label}</h3>
            <p className="stat-number">{stat.value}</p>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default DashboardOverview;
