import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { apiService } from "../services/api";
import LoadingSpinner from "../components/common/LoadingSpinner";
import "../styles/PeerReviewDetailsPage.scss";

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
};

const PeerReviewDetailPage = () => {
  const { submissionId } = useParams();
  const navigate = useNavigate();

  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(true);

  // Review Form fields
  const [reviewText, setReviewText] = useState("");
  const [rating, setRating] = useState(0);
  const [criteriaScores, setCriteriaScores] = useState({
    clarity: 3,
    correctness: 3,
    creativity: 3,
    completeness: 3
  });
  const [anonymous, setAnonymous] = useState(true);
  const [timeSpent, setTimeSpent] = useState(0);

  // Timer tracking
  useEffect(() => {
    const interval = setInterval(() => setTimeSpent(t => t + 1), 60000);
    return () => clearInterval(interval);
  }, []);

  // Fetch submission
  useEffect(() => {
    const loadSubmission = async () => {
      try {
        const res = await apiService.peerReview.getSubmissionById(submissionId);
        setSubmission(res.data.submission || res.data);
        console.log(res);
      } catch (err) {
        console.error("Failed to load submission", err);
      } finally {
        setLoading(false);
      }
    };
    void loadSubmission();
  }, [submissionId]);

  const handleCriteriaChange = (name, value) => {
    setCriteriaScores(prev => ({
      ...prev,
      [name]: Number(value)
    }));
  };

  const handleSubmitReview = async () => {
    if (rating === 0) {
      alert("Please select a rating before submitting.");
      return;
    }

    const trimmedText = reviewText.trim();
    if (trimmedText.length < 10) {
      alert("Please provide at least 10 characters of constructive feedback.");
      return;
    }

    try {
      const payload = {
        reviewee_id: submission.author_id,
        review_text: trimmedText,
        rating,
        criteria_scores: criteriaScores,
        time_spent_minutes: timeSpent,
        is_anonymous: anonymous,
        is_completed: true,
        completed_at: new Date().toISOString()
      };
      console.log("Review submitted:", payload);
      await apiService.peerReview.submitReview(submissionId,payload);

      alert("✅ Review submitted successfully!");
      navigate("/peer-review");
    } catch (err) {
      console.error("Review submission failed", err);
      const message = err.response?.data?.message || "❌ Something went wrong while submitting your review.";
      alert(message);
    }
  };

  if (loading) return <LoadingSpinner message="Loading submission..." />;

  return (
    <motion.div
      className="peer-review-detail-page"
      initial="hidden"
      animate="visible"
      variants={fadeIn}
    >
      {/* HEADER */}
      <div className="header">
        <button className="back-btn" onClick={() => navigate("/peer-review")}>
          ← Back
        </button>
        <h1>Peer Review</h1>
        <p>Help your peer improve by leaving constructive feedback!</p>
      </div>

      {/* SUBMISSION PREVIEW */}
      {/* GOAL INFO */}
      <motion.div className="goal-box" variants={fadeIn}>
        <h2>🎯 Goal: {submission.goal_title}</h2>
        <p className="goal-meta">{submission.goal_category}</p>
        <p className="goal-desc">{submission.goal_description}</p>
      </motion.div>

      {/* CHALLENGE INFO */}
      <motion.div className="challenge-box" variants={fadeIn}>
        <h2>🧩 Challenge: {submission.challenge_title}</h2>

        <div className="challenge-tags">
    <span className={`difficulty diff-${submission.challenge_difficulty?.toLowerCase()}`}>
      {submission.challenge_difficulty}
    </span>
          <span className="category">{submission.challenge_category}</span>
          <span className="points">🏆 {submission.challenge_points} pts</span>
        </div>

        <p className="challenge-desc">{submission.challenge_description}</p>

        {submission.challenge_instructions && (
          <div className="instructions-preview">
            <h4>📘 Instructions</h4>
            <p>{submission.challenge_instructions}</p>
          </div>
        )}
      </motion.div>
      <motion.div className="submission-preview" variants={fadeIn}>
        <h2>{submission.title}</h2>
        <p className="meta">
          Submitted by <strong>{submission.author_first_name + " "+submission.author_last_name || "Unknown"}</strong> ·{" "}
          {new Date(submission.submitted_at).toLocaleString()}
        </p>

        <div className="preview-box">
          <h3>📄 Submission Content</h3>
          <p>{submission.submission_text || "No text provided."}</p>

          {submission.submission_files && submission.submission_files.url && (
            <a
              className="file-link"
              target="_blank"
              rel="noopener noreferrer"
              href={
                (process.env.REACT_APP_BACKEND_URL || "http://localhost:3001") +
                submission.submission_files.url
              }
            >
              📎 View Attached File
            </a>
          )}
        </div>
      </motion.div>

      {/* REVIEW FORM */}
      <motion.div className="review-card" variants={fadeIn}>
        <h2>📝 Write Your Review</h2>

        {/* Rating */}
        <div className="rating-section">
          <h3>Overall Rating</h3>
          <div className="star-row">
            {[1, 2, 3, 4, 5].map(num => (
              <motion.span
                key={num}
                className={`star ${rating >= num ? "active" : ""}`}
                onClick={() => setRating(num)}
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.9 }}
              >
                ★
              </motion.span>
            ))}
          </div>
        </div>

        {/* Criteria sliders */}
        <div className="criteria-section">
          <h3>Detailed Criteria</h3>

          {Object.entries(criteriaScores).map(([key, value]) => (
            <div className="criteria-row" key={key}>
              <label>{key.charAt(0).toUpperCase() + key.slice(1)}</label>
              <input
                type="range"
                min="1"
                max="5"
                value={value}
                onChange={(e) => handleCriteriaChange(key, e.target.value)}
              />
              <span>{value}/5</span>
            </div>
          ))}
        </div>

        {/* Written Feedback */}
        <div className="form-group">
          <label>Feedback</label>
          <textarea
            placeholder="Write constructive comments..."
            rows="5"
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
          />
        </div>

        {/* Anonymous toggle */}
        <div className="form-toggle">
          <label>Submit as anonymous?</label>
          <input
            type="checkbox"
            checked={anonymous}
            onChange={(e) => setAnonymous(e.target.checked)}
          />
        </div>

        {/* Timer */}
        <p className="time-tracker">
          ⏱️ Time spent reviewing: <strong>{timeSpent}</strong> min
        </p>

        {/* Submit button */}
        <motion.button
          className="btn-submit"
          onClick={handleSubmitReview}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Submit Review
        </motion.button>
      </motion.div>
    </motion.div>
  );
};

export default PeerReviewDetailPage;
