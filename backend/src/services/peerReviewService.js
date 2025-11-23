// src/services/peerReviewService.js
const db = require('../database/connection');
const { AppError } = require('../middleware/errorHandler');

const peerReviewService = {
  // ---------------------------------------------------------
  // 🟢 1. Get submissions owned by current user (their own work)
  // ---------------------------------------------------------
  getMySubmissions: async ({ userId, limit, offset }) => {
    const query = `
      SELECT
        s.*,
        c.title AS challenge_title,
        c.difficulty_level AS challenge_difficulty,
        c.status AS challenge_status
      FROM submissions s
             JOIN challenges c ON s.challenge_id = c.id
      WHERE s.user_id = $1
        AND c.requires_peer_review = TRUE
        AND c.status = 'in_peer_review'
      ORDER BY s.created_at DESC
        LIMIT $2 OFFSET $3
    `;

    const result = await db.query(query, [userId, limit, offset]);
    return result.rows;
  },

  // ---------------------------------------------------------
  // 🟡 2. Submit a peer review for a submission
  // ---------------------------------------------------------
  submitReview: async ({ reviewerId, submissionId, rating, feedback }) => {
    // 1️⃣ Fetch submission details
    const submissionRes = await db.query(
      `
        SELECT s.*, c.requires_peer_review, c.status
        FROM submissions s
        JOIN challenges c ON s.challenge_id = c.id
        WHERE s.id = $1
      `,
      [submissionId],
    );

    const submission = submissionRes.rows[0];
    if (!submission) throw new AppError('Submission not found', 404);

    // 2️⃣ Prevent reviewing own work
    if (submission.user_id === reviewerId) {
      throw new AppError('You cannot review your own submission', 400);
    }

    // 3️⃣ Ensure this challenge requires peer review
    if (!submission.requires_peer_review) {
      throw new AppError('This challenge does not require peer review', 400);
    }

    // 4️⃣ Only submissions in peer review stage can be reviewed
    if (submission.status !== 'in_peer_review') {
      throw new AppError('Submission is not currently open for peer review', 400);
    }

    // 5️⃣ Prevent duplicate review (unique index ensures this)
    const duplicateCheck = await db.query(
      `
        SELECT 1 FROM peer_reviews
        WHERE reviewer_id = $1 AND submission_id = $2
      `,
      [reviewerId, submissionId],
    );

    if (duplicateCheck.rowCount > 0) {
      throw new AppError('You already reviewed this submission', 400);
    }

    // 6️⃣ Insert review
    const insertRes = await db.query(
      `
        INSERT INTO peer_reviews (
          reviewer_id,
          reviewee_id,
          submission_id,
          review_text,
          rating,
          created_at,
          updated_at
        )
        VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
        RETURNING *
      `,
      [
        reviewerId,
        submission.user_id,
        submissionId,
        feedback || '',
        rating,
      ],
    );

    return insertRes.rows[0];
  },

  // ---------------------------------------------------------
  // 🔵 3. Get submissions awaiting review (review queue)
  // ---------------------------------------------------------
  getReviewQueue: async ({ reviewerId, limit, offset }) => {
    const query = `
      SELECT
        s.id AS submission_id,
        s.user_id AS reviewee_id,
        u.first_name,
        u.last_name,
        u.profile_image,
        s.created_at AS submission_created_at,
        c.id AS challenge_id,
        c.title AS challenge_title,
        c.category,
        c.difficulty_level AS challenge_difficulty
      FROM submissions s
             JOIN challenges c ON s.challenge_id = c.id
             JOIN users u ON s.user_id = u.id
      WHERE c.status = 'in_peer_review'
        AND c.requires_peer_review = TRUE

    -- Only return the newest submission per challenge
        AND s.id = (
        SELECT s2.id
        FROM submissions s2
        WHERE s2.challenge_id = s.challenge_id
        ORDER BY s2.created_at DESC
        LIMIT 1
        )

    -- Cannot review your own work
        AND s.user_id != $1

    -- Exclude submissions already reviewed by this reviewer
        AND NOT EXISTS (
      SELECT 1
      FROM peer_reviews pr
      WHERE pr.reviewer_id = $1
        AND pr.submission_id = s.id
        )

      ORDER BY s.created_at DESC
        LIMIT $2 OFFSET $3;
    `;

    const result = await db.query(query, [reviewerId, limit, offset]);
    return result.rows;
  },

  // ---------------------------------------------------------
  // 🟣 4. Get details for a single submission for review
  // ---------------------------------------------------------
  getReviewDetails: async ({ reviewerId, submissionId }) => {
    const result = await db.query(
      `
        SELECT s.*, u.first_name, u.last_name, c.title AS challenge_title
        FROM submissions s
        JOIN users u ON s.user_id = u.id
        JOIN challenges c ON s.challenge_id = c.id
        WHERE s.id = $1
      `,
      [submissionId],
    );

    if (!result.rows.length) {
      throw new AppError('Submission not found', 404);
    }

    const submission = result.rows[0];

    // Prevent reviewing own submission
    if (submission.user_id === reviewerId) {
      throw new AppError('You cannot review your own submission', 400);
    }

    return submission;
  },
};

module.exports = peerReviewService;
