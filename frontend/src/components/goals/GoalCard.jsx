import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import '../../styles/components/Goal/GoalCard.scss';

const GoalCard = ({ goal }) => {
  const [flipped, setFlipped] = useState(false);
  const {
    title,
    description,
    category,
    difficulty_level,
    progress_percentage,
    target_date,
    created_at,
  } = goal;

  const handleFlip = () => setFlipped((prev) => !prev);

  // 🧮 Compute dynamic progress percentage
  const computedProgress = useMemo(() => {
    if (!target_date || !created_at) return progress_percentage || 0;

    const start = new Date(created_at);
    const end = new Date(target_date);
    const now = new Date();

    // If current date is before start or after target
    if (now <= start) return 0;
    if (now >= end) return 100;

    // Calculate elapsed fraction
    const totalDuration = end - start;
    const elapsed = now - start;
    const percentage = Math.min((elapsed / totalDuration) * 100, 100);

    return Math.round(percentage);
  }, [target_date, created_at, progress_percentage]);

  return (
    <motion.div
      className={`goal-card-container ${flipped ? 'flipped' : ''}`}
      onClick={handleFlip}
      transition={{ duration: 0.3 }}
    >
      <div className="goal-card-inner">
        {/* FRONT SIDE */}
        <div className="goal-card-front">
          <div className="goal-header">
            <h3>{title || 'Goal Title'}</h3>
            <span
              className={`goal-difficulty ${
                difficulty_level?.toLowerCase() || 'medium'
              }`}
            >
              {difficulty_level || 'Medium'}
            </span>
          </div>

          <div className="goal-progress">
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${computedProgress}%` }}
              />
            </div>
            <span className="progress-text">{computedProgress}% Complete</span>
          </div>
        </div>

        {/* BACK SIDE */}
        <div className="goal-card-back">
          <h3>{title}</h3>
          <p className="goal-description">
            {description || 'No description provided.'}
          </p>

          <div className="goal-details">
            <p>
              <strong>Category:</strong> {category || 'General'}
            </p>
            <p>
              <strong>Difficulty:</strong> {difficulty_level || 'Medium'}
            </p>
            {target_date && (
              <p>
                <strong>Target Date:</strong>{' '}
                {new Date(target_date).toLocaleDateString()}
              </p>
            )}
            {created_at && (
              <p>
                <strong>Created:</strong>{' '}
                {new Date(created_at).toLocaleDateString()}
              </p>
            )}
          </div>

          <motion.button
            className="btn-secondary"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Close
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

export default GoalCard;
