import React, { useState } from 'react';
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

  // 📊 Mock stats
  const stats = [
    { label: 'Goals Completed', value: 8, color: '#6C63FF' },
    { label: 'Challenges Completed', value: 5, color: '#FF6584' },
    { label: 'Current Streak', value: '12 days', color: '#00C9A7' },
    { label: 'Total Points', value: 640, color: '#F9A826' },
  ];

  // 📈 Mock chart data
  const chartData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        label: 'Learning Progress',
        data: [20, 35, 50, 45, 60, 80, 90],
        borderColor: '#6C63FF',
        tension: 0.3,
        fill: true,
        backgroundColor: 'rgba(108, 99, 255, 0.1)',
        pointBackgroundColor: '#6C63FF',
      },
    ],
  };

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
      {/* 🧠 AI Mentor Header */}
      <div className="ai-top-section">
        <Lottie animationData={aiAnimation} loop className="ai-top-lottie" />
        <h2>Welcome Back, {displayName} 👋</h2>
        <p>
          Your AI Mentor is here to help you stay motivated and track your
          growth.
        </p>
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
            <Line data={chartData} options={chartOptions} />
          </div>
        </motion.div>

        <motion.div
          className="ai-chat-section"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h3>Talk to Your AI Mentor 🤖</h3>
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
    </motion.div>
  );
};

export default DashboardOverview;
