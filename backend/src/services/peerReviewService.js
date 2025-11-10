// src/services/peerReviewService.js
const db = require('../database/connection');
const { AppError } = require('../middleware/errorHandler');

const peerReviewService = {
  /**
   * 📝 Create a new peer review
   * @param {Object} reviewData
   * reviewer_id, reviewee_id, submission_id, review_text, rating?, criteria_scores?, time_spent_minutes?
   */
  createReview: async (reviewData) => {
    try {
      const {
        reviewer_id,
        reviewee_id,
        submission_id,
        review_text,
        rating,
        criteria_scores,
        time_spent_minutes,
        is_anonymous = true,
      } = reviewData;

      if (!reviewer_id || !reviewee_id || !submission_id || !review_text) {
        throw new AppError('Missing required fields for review creation', 400, 'VALIDATION_ERROR');
      }

      const result = await db.query(
        `
        INSERT INTO peer_reviews (
          reviewer_id,
          reviewee_id,
          submission_id,
          review_text,
          rating,
          criteria_scores,
          time_spent_minutes,
          is_anonymous,
          created_at,
          updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
        RETURNING *
        `,
        [
          reviewer_id,
          reviewee_id,
          submission_id,
          review_text,
          rating || null,
          criteria_scores ? JSON.stringify(criteria_scores) : null,
          time_spent_minutes || null,
          is_anonymous,
        ],
      );

      return {
        message: 'Peer review created successfully',
        review: result.rows[0],
      };
    } catch (error) {
      throw new AppError(`Error creating peer review: ${error.message}`, 500);
    }
  },

  /**
   * 📄 Get all reviews for a given submission
   * @param {number} submissionId
   */
  getReviewsForSubmission: async (submissionId) => {
    try {
      const result = await db.query(
        `
        SELECT pr.*, u.first_name, u.last_name
        FROM peer_reviews pr
        LEFT JOIN users u ON pr.reviewer_id = u.id
        WHERE pr.submission_id = $1
        ORDER BY pr.created_at DESC
        `,
        [submissionId],
      );

      return result.rows;
    } catch (error) {
      throw new AppError(`Error fetching reviews for submission: ${error.message}`, 500);
    }
  },

  /**
   * 🧑‍⚖️ Get all reviews written by a reviewer
   * @param {number} reviewerId
   */
  getReviewsByReviewer: async (reviewerId) => {
    try {
      const result = await db.query(
        `
        SELECT pr.*, s.title as submission_title, u.first_name as reviewee_name
        FROM peer_reviews pr
        LEFT JOIN submissions s ON pr.submission_id = s.id
        LEFT JOIN users u ON pr.reviewee_id = u.id
        WHERE pr.reviewer_id = $1
        ORDER BY pr.created_at DESC
        `,
        [reviewerId],
      );

      return result.rows;
    } catch (error) {
      throw new AppError(`Error fetching reviewer history: ${error.message}`, 500);
    }
  },

  /**
   * 🔄 Update a review (review_text, rating, etc.)
   * @param {number} reviewId
   * @param {Object} updateData
   */
  updateReview: async (reviewId, updateData) => {
    try {
      const {
        review_text,
        rating,
        criteria_scores,
        time_spent_minutes,
        is_completed,
      } = updateData;

      const result = await db.query(
        `
        UPDATE peer_reviews
        SET
          review_text = COALESCE($2, review_text),
          rating = COALESCE($3, rating),
          criteria_scores = COALESCE($4, criteria_scores),
          time_spent_minutes = COALESCE($5, time_spent_minutes),
          is_completed = COALESCE($6, is_completed),
          completed_at = CASE WHEN $6 = TRUE THEN NOW() ELSE completed_at END,
          updated_at = NOW()
        WHERE id = $1
        RETURNING *
        `,
        [
          reviewId,
          review_text || null,
          rating || null,
          criteria_scores ? JSON.stringify(criteria_scores) : null,
          time_spent_minutes || null,
          is_completed || null,
        ],
      );

      if (!result.rows[0]) throw new AppError('Review not found', 404, 'NOT_FOUND');

      return {
        message: 'Peer review updated successfully',
        review: result.rows[0],
      };
    } catch (error) {
      throw new AppError(`Error updating peer review: ${error.message}`, 500);
    }
  },

  /**
   * ❌ Delete a peer review
   * @param {number} reviewId
   */
  deleteReview: async (reviewId) => {
    try {
      const result = await db.query(
        'DELETE FROM peer_reviews WHERE id = $1 RETURNING *',
        [reviewId],
      );

      if (!result.rows[0]) throw new AppError('Review not found', 404, 'NOT_FOUND');

      return { message: 'Peer review deleted successfully' };
    } catch (error) {
      throw new AppError(`Error deleting peer review: ${error.message}`, 500);
    }
  },

  /**
   * 🕐 Get pending (incomplete) reviews for a user
   * @param {number} userId
   */
  getPendingReviews: async (userId) => {
    try {
      const result = await db.query(
        `
        SELECT pr.*, s.title AS submission_title, u.first_name AS reviewee_name
        FROM peer_reviews pr
        LEFT JOIN submissions s ON pr.submission_id = s.id
        LEFT JOIN users u ON pr.reviewee_id = u.id
        WHERE pr.reviewer_id = $1 AND pr.is_completed = FALSE
        ORDER BY pr.created_at ASC
        `,
        [userId],
      );

      return result.rows;
    } catch (error) {
      throw new AppError(`Error fetching pending reviews: ${error.message}`, 500);
    }
  },

  /**
   * ⭐ Submit rating for a review (e.g., after evaluation)
   * @param {number} reviewId
   * @param {number} rating - 1–5 stars
   */
  submitRating: async (reviewId, rating) => {
    try {
      if (rating < 1 || rating > 5) {
        throw new AppError('Rating must be between 1 and 5', 400, 'INVALID_RATING');
      }

      const result = await db.query(
        `
        UPDATE peer_reviews
        SET rating = $2, is_completed = TRUE, completed_at = NOW(), updated_at = NOW()
        WHERE id = $1
        RETURNING *
        `,
        [reviewId, rating],
      );

      if (!result.rows[0]) throw new AppError('Review not found', 404, 'NOT_FOUND');

      return {
        message: 'Rating submitted successfully',
        review: result.rows[0],
      };
    } catch (error) {
      throw new AppError(`Error submitting rating: ${error.message}`, 500);
    }
  },
};

module.exports = peerReviewService;
