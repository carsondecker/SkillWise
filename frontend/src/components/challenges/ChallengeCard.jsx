// src/components/challenges/ChallengeCard.jsx
import React from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import '../../styles/components/Challenge/ChallengeCard.scss';

const ChallengeCard = ({ challenge, onEdit }) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const {
    title,
    difficulty_level,
    points_reward,
    estimated_time_minutes,
    category,
    status,
  } = challenge;
  const isCompleted = status === "completed";
  const isInPeerReview = status === "in_peer_review";
  const isPeerReviewed = status === "peer_reviewed";

  return (
    <motion.div
      className={`challenge-card ${isCompleted ? "completed" : ""}`}
      whileHover={!isCompleted ? { y: -6, scale: 1.02 } : {}}
      transition={{ duration: 0.25 }}
    >
      {/* Header */}
      <div className="challenge-header">
        <h3>{title}</h3>
        <span className={`difficulty-badge ${difficulty_level?.toLowerCase()}`}>
          {difficulty_level}
        </span>

        {isCompleted && (
          <span className="completed-tag">✓ Completed</span>
        )}
        {isInPeerReview && (
          <span className="in-peer-review-tag">⏳ In Peer Review</span>
        )}
        {isPeerReviewed && (
          <span className="peer-reviewed-tag"> 🏷️︎Peer Reviewed</span>
        )}

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
          className={`btn-primary ${isCompleted ? "disabled" : isInPeerReview ? "in-peer-review": isPeerReviewed?"peer-reviewed" : ""}`}
          disabled={isCompleted}
          whileHover={!isCompleted ? { scale: 1.05 } : {}}
          whileTap={!isCompleted ? { scale: 0.95 } : {}}
          onClick={() =>
            !isCompleted && !isPeerReviewed? navigate(`/challenges/${challenge.id}/submit`): isPeerReviewed ? navigate(`/challenges/${challenge.id}/submit?mode=peer-review-view`) : null

          }
        >
          {isCompleted ? "🔒 Completed" : isInPeerReview ? " Challenge in Peer Review" : isPeerReviewed?"Challenge has been reviewed": "Start Challenge"}
        </motion.button>

        {user?.role === "admin" && (
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
