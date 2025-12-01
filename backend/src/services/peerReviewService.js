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

      // Enforce rating presence and range (1-5)
      if (rating === undefined || rating === null) {
        throw new AppError('Rating is required for peer reviews', 400, 'VALIDATION_ERROR');
      }
      const parsedRating = Number(rating);
      if (!Number.isInteger(parsedRating) || parsedRating < 1 || parsedRating > 5) {
        throw new AppError('Rating must be an integer between 1 and 5', 400, 'INVALID_RATING');
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
          parsedRating,
          criteria_scores ? JSON.stringify(criteria_scores) : null,
          time_spent_minutes || null,
          is_anonymous,
        ],
      );

      // Compute current reviews count for this submission so callers can update UI without a refetch
      try {
        const cnt = await db.query(
          `SELECT (
             (SELECT COUNT(*) FROM peer_reviews pr WHERE pr.submission_id = $1)::int
           ) AS peer_count,
           (
             SELECT COUNT(*) FROM ai_feedback af WHERE af.submission_id = $1
           )::int AS ai_count`,
          [submission_id],
        );

        const peer_count = cnt.rows[0] ? cnt.rows[0].peer_count : 0;
        const ai_count = cnt.rows[0] ? cnt.rows[0].ai_count : 0;

        return {
          message: 'Peer review created successfully',
          review: result.rows[0],
          peer_reviews_count: peer_count,
          ai_feedback_count: ai_count,
        };
      } catch (countErr) {
        console.error('Failed to compute reviews_count after insert:', countErr);
        return {
          message: 'Peer review created successfully',
          review: result.rows[0],
        };
      }
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
        SELECT pr.*, substring(s.submission_text from 1 for 200) as submission_preview, u.first_name as reviewee_name
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
      const query = `
        SELECT pr.*, substring(s.submission_text from 1 for 200) AS submission_preview, u.first_name AS reviewee_name, s.challenge_id AS challenge_id
        FROM peer_reviews pr
        LEFT JOIN submissions s ON pr.submission_id = s.id
        LEFT JOIN users u ON pr.reviewee_id = u.id
        WHERE pr.reviewer_id = $1 AND pr.is_completed = FALSE
        ORDER BY pr.created_at ASC
      `;

      console.error('peerReviewService.getPendingReviews running query:', query);
      const result = await db.query(query, [userId]);
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

  /**
   * Controller-friendly wrapper: Get assignments (pending reviews) with pagination
   * @param {Object} opts { reviewerId, limit, offset }
   */
  getAssignments: async ({ reviewerId, limit = 20, offset = 0 }) => {
    try {
      console.error('peerReviewService.getAssignments called for reviewerId=', reviewerId);
      const rows = await peerReviewService.getPendingReviews(reviewerId);
      console.error('peerReviewService.getAssignments: pending count=', rows?.length || 0);

      // If there are pre-assigned pending peer_review rows for this reviewer, return those.
      if (rows && rows.length > 0) return rows.slice(offset, offset + limit);

      // Otherwise, fall back to selecting candidate submissions that this reviewer
      // has not reviewed yet. This includes submissions that may already have AI
      // feedback (ai_feedback entries) but lack peer reviews, so they appear in
      // the review queue rather than leaving it empty.
      const maxPeerReviewsPerSubmission = 3; // threshold for how many peer reviews we want
      const candidateQuery = `
        SELECT
          NULL::int AS id,
          s.id AS submission_id,
          s.user_id AS reviewee_id,
          substring(s.submission_text from 1 for 200) AS submission_preview,
          c.id AS challenge_id,
          c.title AS challenge_title,
          c.goal_id AS goal_id,
          u.first_name AS reviewee_name,
          s.created_at AS submitted_at,
          (SELECT COUNT(*) FROM peer_reviews pr WHERE pr.submission_id = s.id)::int AS peer_reviews_count,
          (SELECT COUNT(*) FROM ai_feedback af WHERE af.submission_id = s.id)::int AS ai_feedback_count,
          s.status
        FROM submissions s
        LEFT JOIN users u ON s.user_id = u.id
        LEFT JOIN challenges c ON s.challenge_id = c.id
        WHERE s.user_id != $1
          AND NOT EXISTS (
            SELECT 1 FROM peer_reviews pr WHERE pr.submission_id = s.id AND pr.reviewer_id = $1
          )
          AND (SELECT COUNT(*) FROM peer_reviews pr WHERE pr.submission_id = s.id) < $2
          AND s.status IN ('submitted', 'graded')
        ORDER BY peer_reviews_count ASC, s.created_at ASC
        LIMIT $3 OFFSET $4
      `;

      const candidates = await db.query(candidateQuery, [reviewerId, maxPeerReviewsPerSubmission, limit, offset]);
      console.error('peerReviewService.getAssignments: candidate count=', candidates.rows.length || 0);
      return candidates.rows;
    } catch (error) {
      console.error('peerReviewService.getAssignments error:', error && error.stack ? error.stack : error);
      throw new AppError(`Error fetching assignments: ${error.message}`, 500);
    }
  },

  /**
   * Controller-friendly wrapper: submit a review payload coming from controller
   * Expected shape: { reviewerId, submissionId, rating, feedback }
   */
  submitReview: async ({ reviewerId, submissionId, rating, feedback }) => {
    try {
      // Lookup submission to find the reviewee (owner)
      const res = await db.query('SELECT user_id FROM submissions WHERE id = $1', [submissionId]);
      if (!res.rows[0]) throw new AppError('Submission not found', 404);
      const reviewee_id = res.rows[0].user_id;

      const payload = {
        reviewer_id: reviewerId,
        reviewee_id,
        submission_id: submissionId,
        review_text: feedback || 'No comment provided',
        rating: rating || null,
      };

      return await peerReviewService.createReview(payload);
    } catch (error) {
      throw new AppError(`Error submitting review: ${error.message}`, 500);
    }
  },

  /**
   * Get reviews received by a user (reviews written about the user's submissions)
   * @param {Object} opts { userId, limit, offset }
   */
  getReceivedReviews: async ({ userId, limit = 20, offset = 0 }) => {
    try {
      const result = await db.query(
        `
        SELECT pr.*, u.first_name, u.last_name
        FROM peer_reviews pr
        LEFT JOIN users u ON pr.reviewer_id = u.id
        WHERE pr.reviewee_id = $1
        ORDER BY pr.created_at DESC
        LIMIT $2 OFFSET $3
        `,
        [userId, limit, offset],
      );

      return result.rows;
    } catch (error) {
      throw new AppError(`Error fetching received reviews: ${error.message}`, 500);
    }
  },

  /**
   * Get review history (reviews written by the user) with pagination
   */
  getReviewHistory: async ({ reviewerId, limit = 20, offset = 0 }) => {
    try {
      const rows = await peerReviewService.getReviewsByReviewer(reviewerId);
      return rows.slice(offset, offset + limit);
    } catch (error) {
      throw new AppError(`Error fetching review history: ${error.message}`, 500);
    }
  },
};

module.exports = peerReviewService;
