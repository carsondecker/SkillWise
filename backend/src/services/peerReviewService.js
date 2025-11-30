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
             LEFT JOIN challenges c ON s.challenge_id = c.id
      WHERE s.user_id = $1
        AND c.requires_peer_review = TRUE
        AND c.status IN ('in_peer_review', 'peer_reviewed')
      ORDER BY s.created_at DESC
        LIMIT $2 OFFSET $3;
    `;

    const result = await db.query(query, [userId, limit, offset]);
    return result.rows;
  },
  getSubmissionForReviewById: async ({ reviewerId, submissionId }) => {
    const result = await db.query(
      `
        SELECT
          -- Submission
          s.*,

          -- Challenge fields
          c.id AS challenge_id,
          c.title AS challenge_title,
          c.description AS challenge_description,
          c.instructions AS challenge_instructions,
          c.category AS challenge_category,
          c.difficulty_level AS challenge_difficulty,
          c.points_reward AS challenge_points,
          c.estimated_time_minutes,

          -- Goal fields
          g.id AS goal_id,
          g.title AS goal_title,
          g.description AS goal_description,
          g.category AS goal_category,
          g.points_reward AS goal_points,

          -- Author fields
          u.id AS author_id,
          u.first_name AS author_first_name,
          u.last_name AS author_last_name,
          u.profile_image AS author_profile_image

        FROM submissions s
               LEFT JOIN challenges c ON s.challenge_id = c.id
               LEFT JOIN goals g ON c.goal_id = g.id
               LEFT JOIN users u ON s.user_id = u.id
        WHERE s.id = $1
          LIMIT 1
      `,
      [submissionId],
    );

    if (!result.rows.length) {
      throw new AppError('Submission not found', 404);
    }

    const submission = result.rows[0];

    // Prevent reviewing your own submission
    if (submission.author_id === reviewerId) {
      throw new AppError('You cannot review your own submission', 403);
    }

    return submission;
  },

  submitReview: async ({
    reviewerId,
    submissionId,
    reviewee_id,
    review_text,
    rating,
    criteria_scores,
    time_spent_minutes,
    is_anonymous,
    is_completed,
    completed_at,
  }) => {
    console.log('🔥 submitReview START');
    console.log('📌 Input Params:', {
      reviewerId,
      submissionId,
      reviewee_id,
      rating,
      is_completed,
      completed_at,
    });

    // 1️⃣ Ensure submission exists
    console.log('🔍 Step 1: Checking submission exists...');
    let submissionRes;
    try {
      submissionRes = await db.query(
        `
        SELECT
          s.*,
          c.requires_peer_review,
          c.id AS challenge_id_fk
        FROM submissions s
          LEFT JOIN challenges c ON c.id = s.challenge_id
        WHERE s.id = $1
      `,
        [submissionId],
      );
    } catch (err) {
      console.log('❌ ERROR at Step 1 (submission lookup):', err);
      throw err;
    }

    console.log('✅ Step 1 result:', submissionRes.rows);

    const submission = submissionRes.rows[0];
    if (!submission) {
      console.log('❌ Submission not found');
      throw new AppError('Submission not found', 404);
    }

    // 2️⃣ Prevent reviewing own work
    console.log('🔍 Step 2: Checking if user is reviewing own work...');
    if (submission.user_id === reviewerId) {
      console.log('❌ User attempted to review own submission');
      throw new AppError('You cannot review your own submission', 400);
    }
    console.log('✅ Step 2 passed');

    // 3️⃣ Ensure the challenge requires peer review
    console.log('🔍 Step 3: Checking challenge requires peer review...');
    console.log('   requires_peer_review =', submission.requires_peer_review);
    if (!submission.requires_peer_review) {
      console.log('❌ Challenge does NOT require peer review!');
      throw new AppError('This challenge does not require peer review', 400);
    }
    console.log('✅ Step 3 passed');

    // 4️⃣ Prevent duplicate reviews
    console.log('🔍 Step 4: Checking for duplicate review...');
    let duplicateCheck;
    try {
      duplicateCheck = await db.query(
        `
        SELECT 1 FROM peer_reviews
        WHERE reviewer_id = $1 AND submission_id = $2
      `,
        [reviewerId, submissionId],
      );
    } catch (err) {
      console.log('❌ ERROR at Step 4 (duplicate check):', err);
      throw err;
    }

    console.log('   Duplicate rowCount =', duplicateCheck.rowCount);
    if (duplicateCheck.rowCount > 0) {
      console.log('❌ Duplicate review detected');
      throw new AppError('You already reviewed this submission', 400);
    }
    console.log('✅ Step 4 passed');

    // 5️⃣ Insert review
    console.log('📝 Step 5: Inserting review into peer_reviews...');
    let insertRes;

    try {
      insertRes = await db.query(
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
          is_completed,
          completed_at,
          created_at,
          updated_at
        )
        VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW()
        )
        RETURNING *
      `,
        [
          reviewerId,
          reviewee_id,
          submissionId,
          review_text,
          rating,
          criteria_scores,
          time_spent_minutes,
          is_anonymous,
          is_completed,
          completed_at,
        ],
      );
    } catch (err) {
      console.log('❌ ERROR at Step 5 (insert review):', err);
      throw err;
    }

    console.log('✅ Step 5 SUCCESS: Review inserted:', insertRes.rows[0]);
    console.log('🔥 submitReview END');

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
  // ---------------------------------------------------------
  // 🟠 5. Get all reviews for a specific submission (review view)
  // ---------------------------------------------------------
  getReviewsForSubmission: async ({ userId, submissionId }) => {
    // 1️⃣ Validate submission exists AND belongs to the requesting user
    const submissionCheck = await db.query(
      `
      SELECT s.id, s.user_id
      FROM submissions s
      WHERE s.id = $1
      LIMIT 1
    `,
      [submissionId],
    );

    if (submissionCheck.rowCount === 0) {
      throw new AppError('Submission not found', 404);
    }

    const submission = submissionCheck.rows[0];

    // 2️⃣ Prevent other users from viewing review details
    if (submission.user_id !== userId) {
      throw new AppError(
        'You do not have permission to view reviews for this submission',
        403,
      );
    }

    // 3️⃣ Fetch all reviews for this submission
    const reviewsRes = await db.query(
      `
      SELECT
        pr.id,
        pr.review_text,
        pr.rating,
        pr.criteria_scores,
        pr.time_spent_minutes,
        pr.is_anonymous,
        pr.completed_at,
        pr.created_at,

        -- Reviewer details (hidden if anonymous)
        CASE WHEN pr.is_anonymous = true 
            THEN NULL 
            ELSE r.first_name || ' ' || r.last_name 
        END AS reviewer_name,

        CASE WHEN pr.is_anonymous = true
            THEN NULL
            ELSE r.profile_image
        END AS reviewer_profile_image

      FROM peer_reviews pr
      LEFT JOIN users r ON r.id = pr.reviewer_id
      WHERE pr.submission_id = $1
      ORDER BY pr.created_at DESC
    `,
      [submissionId],
    );

    return reviewsRes.rows;
  },
};

module.exports = peerReviewService;
