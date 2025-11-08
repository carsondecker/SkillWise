// src/components/challenges/ChallengeCard.jsx
import React from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../hooks/useAuth';
import '../../styles/components/Challenge/ChallengeCard.scss';

const ChallengeCard = ({ challenge, onEdit }) => {
  const { user } = useAuth();
  const {
    title,
    difficulty_level,
    points_reward,
    estimated_time_minutes,
    category,
  } = challenge;

  return (
    <motion.div
      className="challenge-card"
      whileHover={{ y: -6, scale: 1.02 }}
      transition={{ duration: 0.25 }}
    >
      {/* Header */}
      <div className="challenge-header">
        <h3>{title}</h3>
        <span className={`difficulty-badge ${difficulty_level?.toLowerCase()}`}>
          {difficulty_level}
        </span>
      </div>

      {/* Meta info */}
      <div className="challenge-meta">
        {category && <span className="meta-item category">📘 {category}</span>}
        {estimated_time_minutes && (
          <span className="meta-item time">
            ⏱️ {estimated_time_minutes} min
          </span>
        )}
        <span className="meta-item points">🏆 {points_reward} pts</span>
      </div>

      {/* Footer actions */}
      <div className="challenge-footer">
        <motion.button
          className="btn-primary"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Start Challenge
        </motion.button>

        {/* Admin-only Edit button */}
        {user?.role === 'admin' && (
          <motion.button
            className="btn-secondary"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onEdit?.(challenge)}
          >
            ✏️ Edit
          </motion.button>
        )}
      </div>
    </motion.div>
  );
};

export default ChallengeCard;
