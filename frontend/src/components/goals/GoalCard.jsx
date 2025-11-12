import React, { useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiService } from '../../services/api';
import ChallengeModal from '../challenges/ChallengeModal';
import '../../styles/components/Goal/GoalCard.scss';

const GoalCard = ({ goal, onUpdated, onDeleted }) => {
  const [flipped, setFlipped] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showChallengeModal, setShowChallengeModal] = useState(false);
  const challengeModalRef = useRef(null);

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
    if (e.target.closest('button')) return; // prevent accidental flips
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

  // 🗑️ Handle delete goal
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

  // 🧩 Handle opening the ChallengeModal
  const handleCreateChallenge = (e) => {
    e.stopPropagation(); // prevent flipping the card
    setShowChallengeModal(true);
  };

  const handleChallengeCreated = (newChallenge) => {
    alert(`🆕 Challenge "${newChallenge.title}" created for goal "${title}"`);
    setShowChallengeModal(false);
  };

  return (
    <>
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
                  style={{ width: `${progress_percentage}%` }}
                />
              </div>
              <span className="progress-text">
                {is_completed
                  ? '✅ Completed'
                  : `${progress_percentage}% Complete`}
              </span>
            </div>

            {is_completed && (
              <div className="completed-badge">🎯 Completed Goal</div>
            )}
          </div>

          {/* BACK SIDE */}
          <div className="goal-card-back" id={`goal-card-${id}`}>
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

            <div className="goal-actions" id={`goal-actions-${id}`}>
              {/* 🆕 Replace Mark Complete with Create Challenge */}
              <motion.button
                id={`goal-create-challenge-btn-${id}`}
                className="btn-primary"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleCreateChallenge}
              >
                ➕ Create Challenge
              </motion.button>

              <motion.button
                id={`goal-delete-btn-${id}`}
                className="btn-delete"
                whileHover={!is_completed ? { scale: 1.05 } : {}}
                whileTap={!is_completed ? { scale: 0.95 } : {}}
                onClick={handleDelete}
                disabled={loading || is_completed}
              >
                🗑️ Delete
              </motion.button>

              <motion.button
                id={`goal-close-btn-${id}`}
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

      {/* 🎯 Challenge Modal */}
      <AnimatePresence>
        {showChallengeModal && (
          <ChallengeModal
            ref={challengeModalRef}
            goalId={id}
            onClose={() => setShowChallengeModal(false)}
            onCreatedOrUpdated={handleChallengeCreated}
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default GoalCard;
