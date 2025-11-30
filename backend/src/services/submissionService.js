// src/services/submissionService.js
const db = require('../database/connection');
const { AppError } = require('../middleware/errorHandler');
const notificationService = require('./notificationService');
const leaderboardService = require('./leaderboardService');
const aiService = require('./aiService'); // optional if using AI grading

const submissionService = {
  /**
   * 🧾 Submit a new challenge solution
   * @param {Object} submissionData - { user_id, challenge_id, content, attachments?, language? }
   */
  createSubmission: async ({
    userId,
    challengeId,
    submission_text,
    submission_files,
  }) => {
    try {
      // Step 1️⃣ — Get max_attempts from the challenge
      const { rows: challengeRows } = await db.query(
        'SELECT max_attempts FROM challenges WHERE id = $1',
        [challengeId],
      );
      if (!challengeRows.length) {
        throw new AppError('Challenge not found', 404, 'NOT_FOUND');
      }
      const maxAttempts = challengeRows[0].max_attempts || 3;

      // Step 2️⃣ — Get the current highest attempt for this user/challenge
      const { rows: existing } = await db.query(
        `
      SELECT COALESCE(MAX(attempt_number), 0) AS last_attempt
      FROM submissions
      WHERE user_id = $1 AND challenge_id = $2
      `,
        [userId, challengeId],
      );

      const lastAttempt = existing[0]?.last_attempt || 0;

      // Step 3️⃣ — Prevent exceeding the max_attempts
      if (lastAttempt >= maxAttempts) {
        throw new AppError(
          `You have reached the maximum number of ${maxAttempts} submissions for this challenge.`,
          403,
          'MAX_ATTEMPTS_REACHED',
        );
      }

      const nextAttempt = lastAttempt + 1;

      // Step 4️⃣ — Insert new submission safely
      const result = await db.query(
        `
      INSERT INTO submissions (
        user_id,
        challenge_id,
        submission_text,
        submission_files,
        attempt_number,
        status,
        created_at,
        updated_at
      )
      VALUES ($1, $2, $3, $4, $5, 'submitted', NOW(), NOW())
      RETURNING *
      `,
        [
          userId,
          challengeId,
          submission_text,
          submission_files || null,
          nextAttempt,
        ],
      );

      return result.rows[0];
    } catch (err) {
      throw new AppError(`Error creating submission: ${err.message}`, 500);
    }
  },
  submitSolution: async (submissionData) => {
    try {
      const { user_id, challenge_id, content, attachments, language } =
        submissionData;

      if (!user_id || !challenge_id || !content) {
        throw new AppError(
          'Missing required fields for submission',
          400,
          'VALIDATION_ERROR',
        );
      }

      const result = await db.query(
        `
        INSERT INTO submissions (user_id, challenge_id, content, attachments, language, status, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, 'submitted', NOW(), NOW())
        RETURNING *
        `,
        [
          user_id,
          challenge_id,
          content,
          attachments || null,
          language || 'text',
        ],
      );

      const submission = result.rows[0];

      // Notify user
      await notificationService.sendNotification(
        user_id,
        'submission_received',
        'Your challenge submission has been received and is under review.',
        { challenge_id },
      );

      return {
        message: 'Submission created successfully',
        submission,
      };
    } catch (error) {
      throw new AppError(`Error creating submission: ${error.message}`, 500);
    }
  },

  /**
   * 🔍 Get a submission by its ID
   */
  getSubmissionById: async (submissionId) => {
    try {
      const result = await db.query(
        `
         SELECT s.*, u.first_name, u.last_name, c.title AS challenge_title,
           (SELECT COUNT(*) FROM peer_reviews pr WHERE pr.submission_id = s.id) AS peer_reviews_count,
           (SELECT COUNT(*) FROM ai_feedback af WHERE af.submission_id = s.id) AS ai_feedback_count,
           (SELECT af.feedback_text FROM ai_feedback af WHERE af.submission_id = s.id ORDER BY af.created_at DESC LIMIT 1) AS latest_ai_feedback
        FROM submissions s
        LEFT JOIN users u ON s.user_id = u.id
        LEFT JOIN challenges c ON s.challenge_id = c.id
        WHERE s.id = $1
        `,
        [submissionId],
      );

      if (!result.rows[0])
        throw new AppError('Submission not found', 404, 'NOT_FOUND');
      return result.rows[0];
    } catch (error) {
      throw new AppError(`Error fetching submission: ${error.message}`, 500);
    }
  },

  /**
   * 👤 Get all submissions by a user
   */
  async getUserSubmissions ({ userId, limit = 20, offset = 0 }) {
    try {
      const result = await db.query(
        `
         SELECT s.*, c.title AS challenge_title,
           (SELECT COUNT(*) FROM peer_reviews pr WHERE pr.submission_id = s.id) AS peer_reviews_count,
           (SELECT COUNT(*) FROM ai_feedback af WHERE af.submission_id = s.id) AS ai_feedback_count,
           (SELECT af.feedback_text FROM ai_feedback af WHERE af.submission_id = s.id ORDER BY af.created_at DESC LIMIT 1) AS latest_ai_feedback
        FROM submissions s
        LEFT JOIN challenges c ON s.challenge_id = c.id
        WHERE s.user_id = $1
        ORDER BY s.submitted_at DESC
        LIMIT $2 OFFSET $3
        `,
        [userId, Number(limit), Number(offset)],
      );
      return result.rows;
    } catch (error) {
      throw new AppError(
        `Error fetching user submissions: ${error.message}`,
        500,
      );
    }
  },

  /**
   * 🎯 Get all submissions for a specific challenge
   */
  getChallengeSubmissions: async (userId, challengeId) => {
    try {
      const result = await db.query(
        `
          SELECT *
          FROM submissions
          WHERE user_id = $1 AND challenge_id = $2
          ORDER BY submitted_at DESC
        `,
        [userId, challengeId],
      );
      return result.rows;
    } catch (error) {
      throw new AppError(
        `Error fetching challenge submissions: ${error.message}`,
        500,
      );
    }
  },

  /**
   * 🧠 Grade a submission (manual or AI-assisted)
   */
  gradeSubmission: async (submissionId) => {
    try {
      // Fetch submission
      const result = await db.query('SELECT * FROM submissions WHERE id = $1', [
        submissionId,
      ]);
      const submission = result.rows[0];
      if (!submission)
        throw new AppError('Submission not found', 404, 'NOT_FOUND');

      // Call AI service or manual grading logic
      let feedback = 'Auto-graded placeholder: requires manual review.';
      let score = 0;

      let aiResult = null;
      if (aiService && aiService.evaluateSubmission) {
        const submissionPayload = submission.submission_text || submission.content || '';
        aiResult = await aiService.evaluateSubmission(submissionPayload);
        feedback = aiResult?.feedback || feedback;
        score = aiResult?.score || 0;
      }

      // Update submission with grade
      const updated = await db.query(
        `
        UPDATE submissions
        SET score = $2,
            feedback = $3,
            status = 'graded',
            graded_at = NOW(),
            updated_at = NOW()
        WHERE id = $1
        RETURNING *
        `,
        [submissionId, score, feedback],
      );


      const graded = updated.rows[0];

      // Persist structured AI feedback to ai_feedback table if available
      if (aiResult) {
        try {
          await db.query(
            `INSERT INTO ai_feedback (submission_id, feedback_text, confidence_score, suggestions, strengths, improvements, ai_model, processing_time_ms, created_at, updated_at)
             VALUES ($1,$2,$3,$4,$5,$6,$7, $8, NOW(), NOW()) RETURNING *`,
            [
              submissionId,
              aiResult.feedback || feedback,
              typeof aiResult.confidence_score === 'number' ? aiResult.confidence_score : null,
              aiResult.suggestions && aiResult.suggestions.length ? aiResult.suggestions : null,
              aiResult.strengths && aiResult.strengths.length ? aiResult.strengths : null,
              aiResult.improvements && aiResult.improvements.length ? aiResult.improvements : null,
              process.env.OPENAI_MODEL || null,
              null,
            ],
          );
        } catch (err) {
          console.error('Failed to persist AI feedback:', err);
        }
      }

      // Attach combined reviews_count (peer reviews + AI feedback) so frontend can display unified counts
      try {
        const cnt = await db.query(
          `SELECT (
             (SELECT COUNT(*) FROM peer_reviews pr WHERE pr.submission_id = $1)::int
           + (SELECT COUNT(*) FROM ai_feedback af WHERE af.submission_id = $1)::int
           ) AS reviews_count`,
          [submissionId],
        );
        if (cnt.rows[0]) {
          graded.reviews_count = cnt.rows[0].reviews_count ?? cnt.rows[0].cnt ?? Number(cnt.rows[0].cnt || 0);
        }
      } catch (cntErr) {
        console.error('Failed to compute combined reviews_count after grading:', cntErr);
      }

      // Award points if score passes threshold
      if (score >= 70) {
        await leaderboardService.updateUserPoints(
          submission.user_id,
          Math.round(score / 10),
          'submission_graded',
        );
        await notificationService.sendNotification(
          submission.user_id,
          'submission_graded',
          `Your submission has been graded: ${score}% (${feedback})`,
          { submission_id: submissionId },
        );
      }

      return {
        message: 'Submission graded successfully',
        submission: graded,
      };
    } catch (error) {
      throw new AppError(`Error grading submission: ${error.message}`, 500);
    }
  },

  /**
   * 🔄 Update submission status
   */
  updateSubmissionStatus: async (submissionId, status) => {
    try {
      const allowedStatuses = [
        'submitted',
        'reviewing',
        'graded',
        'rejected',
        'completed',
      ];
      if (!allowedStatuses.includes(status)) {
        throw new AppError(
          `Invalid submission status: ${status}`,
          400,
          'INVALID_STATUS',
        );
      }

      const result = await db.query(
        `
        UPDATE submissions
        SET status = $2, updated_at = NOW()
        WHERE id = $1
        RETURNING *
        `,
        [submissionId, status],
      );

      if (!result.rows[0])
        throw new AppError('Submission not found', 404, 'NOT_FOUND');

      await notificationService.sendNotification(
        result.rows[0].user_id,
        'submission_status',
        `Your submission status was updated to '${status}'.`,
        { submission_id: submissionId },
      );

      return {
        message: 'Submission status updated successfully',
        submission: result.rows[0],
      };
    } catch (error) {
      throw new AppError(
        `Error updating submission status: ${error.message}`,
        500,
      );
    }
  },
};

module.exports = submissionService;
