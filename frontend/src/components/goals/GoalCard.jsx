import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { apiService } from '../../services/api';
import '../../styles/components/Goal/GoalCard.scss';

const GoalCard = ({ goal, onUpdated, onDeleted }) => {
  const [flipped, setFlipped] = useState(false);
  const [loading, setLoading] = useState(false);

  const {
    id,
    title,
    description,
    category,
    difficulty_level,
    progress_percentage,
    target_date,
    created_at,
    is_public,
    points_reward,
    is_completed,
  } = goal;

  const handleFlip = (e) => {
    // prevent accidental flips when clicking buttons
    if (e.target.closest('button')) return;
    setFlipped((prev) => !prev);
  };

  // 🧮 Compute dynamic progress
  const computedProgress = useMemo(() => {
    if (!target_date || !created_at) return progress_percentage || 0;
    const start = new Date(created_at);
    const end = new Date(target_date);
    const now = new Date();

    if (now <= start) return 0;
    if (now >= end) return 100;

    const totalDuration = end - start;
    const elapsed = now - start;
    const percent = Math.min((elapsed / totalDuration) * 100, 100);
    return Math.round(percent);
  }, [target_date, created_at, progress_percentage]);

  // ✅ Handle mark complete
  const handleMarkComplete = async () => {
    try {
      setLoading(true);
      const res = await apiService.goals.update(id, {
        is_completed: true,
        completion_date: new Date().toISOString(),
        progress_percentage: 100,
      });
      const updated = res.data.goal || res.data;
      alert('🎉 Goal marked as completed!');
      onUpdated?.(updated); // ✅ refresh parent list
    } catch (err) {
      console.error('Failed to mark goal complete:', err);
      alert('❌ Failed to mark goal complete.');
    } finally {
      setLoading(false);
    }
  };

  // 🗑️ Handle delete
  const handleDelete = async () => {
    if (is_completed) {
      alert('✅ Completed goals cannot be deleted!');
      return;
    }
    if (!window.confirm('Are you sure you want to delete this goal?')) return;
    try {
      setLoading(true);
      await apiService.goals.delete(id);
      onDeleted?.(id);
      alert('🗑️ Goal deleted successfully.');
    } catch (err) {
      console.error('Failed to delete goal:', err);
      alert('❌ Could not delete goal.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      className={`goal-card-container ${flipped ? 'flipped' : ''} ${
        is_completed ? 'completed' : ''
      }`}
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

          {/* Public & Points info */}
          <div className="goal-tags">
            {is_public && <span className="tag-public">🌍 Public</span>}
            {points_reward > 0 && (
              <span className="tag-points">🏆 {points_reward} pts</span>
            )}
          </div>

          <div className="goal-progress">
            <div className="progress-bar">
              <div
                className={`progress-fill ${is_completed ? 'done' : ''}`}
                style={{ width: `${computedProgress}%` }}
              />
            </div>
            <span className="progress-text">
              {is_completed ? '✅ Completed' : `${computedProgress}% Complete`}
            </span>
          </div>

          {is_completed && (
            <div className="completed-badge">🎯 Completed Goal</div>
          )}
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

          <div className="goal-actions">
            {!is_completed && (
              <motion.button
                className="btn-complete"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleMarkComplete}
                disabled={loading}
              >
                ✅ Mark Complete
              </motion.button>
            )}

            <motion.button
              className="btn-delete"
              whileHover={!is_completed ? { scale: 1.05 } : {}}
              whileTap={!is_completed ? { scale: 0.95 } : {}}
              onClick={handleDelete}
              disabled={loading || is_completed}
            >
              🗑️ Delete
            </motion.button>

            <motion.button
              className="btn-secondary"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setFlipped(false)}
            >
              Close
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default GoalCard;
