import React from "react";
import { motion } from "framer-motion";
import "../../styles/components/PeerReview/PeerReviewCard.scss";

const PeerReviewCard = ({ review, onStartReview }) => {
  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffHrs = (now - date) / (1000 * 60 * 60);

    if (diffHrs < 1) return "Just now";
    if (diffHrs < 24) return `${Math.floor(diffHrs)}h ago`;
    return `${Math.floor(diffHrs / 24)}d ago`;
  };

  // Avatar logic
  const avatar = review.profile_image
    ? <img src={review.profile_image} alt="avatar" className="peer-card__avatar-img" />
    : <div className="peer-card__avatar-fallback">
      {review.first_name?.charAt(0)}
      {review.last_name?.charAt(0)}
    </div>;

  return (
    <motion.div
      className="peer-card"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02, y: -6 }}
      transition={{ duration: 0.25 }}
    >
      {/* HEADER */}
      <div className="peer-card__header">
        <div className="peer-card__author">
          {avatar}

          <div>
            <h4>{review.challenge_title}</h4>
            <p>by {review.first_name} {review.last_name}</p>
          </div>
        </div>

        <div className="peer-card__meta">
          <span
            className={`peer-card__difficulty diff-${review.challenge_difficulty?.toLowerCase()}`}
          >
            {review.challenge_difficulty}
          </span>

          <span className="peer-card__category">
            {review.category}
          </span>
        </div>
      </div>

      {/* FOOTER */}
      <div className="peer-card__footer">
        <div className="peer-card__stats">
          <span>{formatTimeAgo(review.submission_created_at)}</span>
        </div>

        <button
          className="peer-card__btn-primary"
          onClick={() => onStartReview(review)}
        >
          Start Review
        </button>
      </div>
    </motion.div>
  );
};

export default PeerReviewCard;
