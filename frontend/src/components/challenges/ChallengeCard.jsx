// src/components/challenges/ChallengeCard.jsx
import React from 'react';
import { motion } from 'framer-motion';
import '../../styles/components/Challenge/ChallengeCard.scss';

const ChallengeCard = ({ challenge }) => {
  const {
    title,
    description,
    difficulty,
    points,
    estimatedTime,
    tags,
    category,
  } = challenge;

  return (
    <motion.div
      className="challenge-card"
      whileHover={{ y: -5, boxShadow: '0 10px 30px rgba(0,0,0,0.15)' }}
      transition={{ duration: 0.25 }}
    >
      <div className="challenge-header">
        <h3>{title}</h3>
        <div className="meta">
          <span className={`difficulty ${difficulty?.toLowerCase()}`}>
            {difficulty}
          </span>
          <span className="points">+{points} pts</span>
        </div>
      </div>

      <p className="challenge-description">{description}</p>

      <div className="challenge-info">
        {category && <span className="category">{category}</span>}
        {estimatedTime && <span>⏱️ {estimatedTime} min</span>}
      </div>

      {tags && (
        <div className="tags">
          {tags.map((tag, i) => (
            <span key={i} className="tag">
              {tag}
            </span>
          ))}
        </div>
      )}

      <div className="challenge-footer">
        <motion.button
          className="btn-primary"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Start Challenge
        </motion.button>
      </div>
    </motion.div>
  );
};

export default ChallengeCard;
