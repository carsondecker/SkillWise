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
        SELECT s.*, u.first_name, u.last_name, c.title AS challenge_title
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
        SELECT s.*, c.title AS challenge_title
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
          SELECT
            s.*,
            COALESCE(
              json_agg(
                json_build_object(
                  'id', af.id,
                  'feedback_text', af.feedback_text,
                  'feedback_type', af.feedback_type,
                  'confidence_score', af.confidence_score,
                  'suggestions', af.suggestions,
                  'strengths', af.strengths,
                  'improvements', af.improvements,
                  'ai_model', af.ai_model,
                  'processing_time_ms', af.processing_time_ms,
                  'created_at', af.created_at
                )
                ORDER BY af.created_at DESC
              ) FILTER (WHERE af.id IS NOT NULL),
              '[]'::json
            ) AS ai_feedback,
            COUNT(af.id) FILTER (WHERE af.feedback_type = 'grading') AS ai_feedback_count
          FROM submissions s
          LEFT JOIN ai_feedback af ON af.submission_id = s.id
          WHERE s.user_id = $1 AND s.challenge_id = $2
          GROUP BY s.id
          ORDER BY s.submitted_at DESC
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

      if (aiService && aiService.evaluateSubmission) {
        const aiResult = await aiService.evaluateSubmission(submission.content);
        feedback = aiResult.feedback || feedback;
        score = aiResult.score || 0;
      }

      // Update submission with grade
      const updated = await db.query(
        `
        UPDATE submissions
        SET score = $2,
            feedback = $3,
            status = 'graded',
            reviewed_at = NOW(),
            updated_at = NOW()
        WHERE id = $1
        RETURNING *
        `,
        [submissionId, score, feedback],
      );

      const graded = updated.rows[0];

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
        'peer_reviewed',
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

      // Log milestone events to progress_events for recent activity
      if (['completed', 'peer_reviewed'].includes(status)) {
        try {
          const submission = result.rows[0];
          const { rows: challengeRows } = await db.query(
            'SELECT title, points_reward FROM challenges WHERE id = $1',
            [submission.challenge_id],
          );
          const challenge = challengeRows[0] || {};
          const pointsPotential = Number(challenge.points_reward || 0);
          const pointsEarned = status === 'completed' ? pointsPotential : 0;
          const eventType =
            status === 'completed' ? 'challenge_completed' : 'submission_peer_reviewed';

          const payload = {
            submission_id: submissionId,
            challenge_id: submission.challenge_id,
            challenge_title: challenge.title,
            status,
            points_earned: pointsEarned,
            points_reward: pointsPotential,
            title:
              status === 'completed'
                ? challenge.title || 'Challenge completed'
                : challenge.title || 'Submission peer reviewed',
          };

          const { rows: existingEvents } = await db.query(
            `
            SELECT id
            FROM progress_events
            WHERE user_id = $1
              AND event_type = $2
              AND related_submission_id = $3
            LIMIT 1
            `,
            [submission.user_id, eventType, submissionId],
          );

          if (existingEvents.length) {
            await db.query(
              `
              UPDATE progress_events
              SET event_data = $1::jsonb,
                  points_earned = $2,
                  related_challenge_id = $3,
                  timestamp_occurred = NOW(),
                  updated_at = NOW()
              WHERE id = $4
              `,
              [
                JSON.stringify(payload),
                pointsEarned,
                submission.challenge_id,
                existingEvents[0].id,
              ],
            );
          } else {
            await db.query(
              `
              INSERT INTO progress_events (
                user_id,
                event_type,
                event_data,
                points_earned,
                related_challenge_id,
                related_submission_id,
                timestamp_occurred,
                created_at
              )
              VALUES ($1, $2, $3::jsonb, $4, $5, $6, NOW(), NOW())
              `,
              [
                submission.user_id,
                eventType,
                JSON.stringify(payload),
                pointsEarned,
                submission.challenge_id,
                submissionId,
              ],
            );
          }
        } catch (eventErr) {
          console.error('⚠️ Failed to log submission progress event', eventErr);
        }
      }

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
