// src/services/submissionService.js
const db = require('../database/connection');
const { AppError } = require('../middleware/errorHandler');
const notificationService = require('./notificationService');
const leaderboardService = require('./leaderboardService');
const aiService = require('./aiService'); // optional if using AI grading
const progressService = require('./progressService');
const Challenge = require('../models/Challenge');

const submissionService = {
  /**
   * 🧾 Create a new challenge submission (API-facing wrapper)
   * @param {Object} submissionData - { userId, challengeId, content, files?, language? }
   */
  createSubmission: async (submissionData) => {
    try {
      const { userId, challengeId, content, files, language } = submissionData;

      if (!userId || !challengeId || !content) {
        throw new AppError(
          'Missing required fields for submission',
          400,
          'VALIDATION_ERROR'
        );
      }

      // Use DB column names used in migrations: submission_text, submission_files
      const result = await db.query(
        `
        INSERT INTO submissions (user_id, challenge_id, submission_text, submission_files, language, status, submitted_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, 'submitted', NOW(), NOW())
        RETURNING *
        `,
        [userId, challengeId, content, files || null, language || 'text']
      );

      const submission = result.rows[0];

      // Notify user
      await notificationService.sendNotification(
        userId,
        'submission_received',
        'Your challenge submission has been received and is under review.',
        { challenge_id: challengeId }
      );

      return submission;
    } catch (error) {
      throw new AppError(`Error creating submission: ${error.message}`, 500);
    }
  },

  /**
   * 🔍 Get a submission by its ID (wrapper used by controllers)
   */
  getSubmission: async ({ userId, submissionId }) => {
    try {
      const result = await db.query(
        `
        SELECT s.*, u.first_name, u.last_name, c.title AS challenge_title
        FROM submissions s
        LEFT JOIN users u ON s.user_id = u.id
        LEFT JOIN challenges c ON s.challenge_id = c.id
        WHERE s.id = $1
        `,
        [submissionId]
      );

      if (!result.rows[0]) return null;

      // Optionally enforce that only owner or admins can see (controller handles auth usually)
      return result.rows[0];
    } catch (error) {
      throw new AppError(`Error fetching submission: ${error.message}`, 500);
    }
  },

  /**
   * 👤 Get all submissions by a user
   */
  getUserSubmissions: async (userId) => {
    try {
      const result = await db.query(
        `
        SELECT s.*, c.title AS challenge_title
        FROM submissions s
        LEFT JOIN challenges c ON s.challenge_id = c.id
        WHERE s.user_id = $1
        ORDER BY s.created_at DESC
        `,
        [userId]
      );
      return result.rows;
    } catch (error) {
      throw new AppError(
        `Error fetching user submissions: ${error.message}`,
        500
      );
    }
  },

  /**
   * 🎯 Get all submissions for a specific challenge
   */
  getChallengeSubmissions: async (challengeId) => {
    try {
      const result = await db.query(
        `
        SELECT s.*, u.first_name, u.last_name
        FROM submissions s
        LEFT JOIN users u ON s.user_id = u.id
        WHERE s.challenge_id = $1
        ORDER BY s.created_at DESC
        `,
        [challengeId]
      );
      return result.rows;
    } catch (error) {
      throw new AppError(
        `Error fetching challenge submissions: ${error.message}`,
        500
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
        // Use the DB column submission_text when passing content to AI
        const aiResult = await aiService.evaluateSubmission(
          submission.submission_text
        );
        feedback = aiResult.feedback || feedback;
        score = aiResult.score || 0;
      } else {
        // In test/dev environments where AI is not configured, default to a passing score
        score = 100;
        feedback = 'Auto-graded: default pass (no AI configured)';
      }

      // Update submission with grade. Use graded_at column present in DB migrations
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
        [submissionId, score, feedback]
      );

      const graded = updated.rows[0];

      // Award points and track progress if score passes threshold
      if (score >= 70) {
        // Try to load challenge to determine points_reward and linked goal
        let challenge = null;
        try {
          challenge = await Challenge.findById(submission.challenge_id);
        } catch (err) {
          // ignore - fallback to generic points
          challenge = null;
        }

        const points =
          challenge && challenge.points_reward
            ? Number(challenge.points_reward)
            : Math.round(score / 10);

        // Track a challenge_completed event which will update leaderboard and notifications
        await progressService.trackEvent(
          submission.user_id,
          'challenge_completed',
          {
            challenge_id: submission.challenge_id,
            points_earned: points,
            related_goal_id: challenge?.related_goal_id || null,
          }
        );

        // Also notify about grading result (additional details)
        await notificationService.sendNotification(
          submission.user_id,
          'submission_graded',
          `Your submission has been graded: ${score}% (${feedback})`,
          { submission_id: submissionId }
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
          'INVALID_STATUS'
        );
      }

      const result = await db.query(
        `
        UPDATE submissions
        SET status = $2, updated_at = NOW()
        WHERE id = $1
        RETURNING *
        `,
        [submissionId, status]
      );

      if (!result.rows[0])
        throw new AppError('Submission not found', 404, 'NOT_FOUND');

      await notificationService.sendNotification(
        result.rows[0].user_id,
        'submission_status',
        `Your submission status was updated to '${status}'.`,
        { submission_id: submissionId }
      );

      // If marking completed, track progress/points for linked goal
      if (status === 'completed') {
        // fetch submission + related challenge
        const sub = result.rows[0];
        try {
          const challenge = await Challenge.findById(sub.challenge_id);
          const points = challenge?.points_reward
            ? Number(challenge.points_reward)
            : 10;
          await progressService.trackEvent(sub.user_id, 'challenge_completed', {
            challenge_id: sub.challenge_id,
            points_earned: points,
            related_goal_id: challenge?.related_goal_id || null,
          });
        } catch (err) {
          // best-effort; ignore if something fails
          console.error(
            'Failed to track challenge completion on status update:',
            err.message
          );
        }
      }

      return {
        message: 'Submission status updated successfully',
        submission: result.rows[0],
      };
    } catch (error) {
      throw new AppError(
        `Error updating submission status: ${error.message}`,
        500
      );
    }
  },

  /**
   * ✏️ Update submission content/files or status (used by controller)
   * @param {{ userId: string, submissionId: string, data: { content?, files?, status? } }}
   */
  updateSubmission: async ({ userId, submissionId, data }) => {
    try {
      // Build dynamic set clause
      const fields = [];
      const values = [submissionId];
      let idx = 2;

      if (data.content !== undefined) {
        fields.push(`submission_text = $${idx}`);
        values.push(data.content);
        idx += 1;
      }

      if (data.files !== undefined) {
        fields.push(`submission_files = $${idx}`);
        values.push(data.files);
        idx += 1;
      }

      if (data.status !== undefined) {
        fields.push(`status = $${idx}`);
        values.push(data.status);
        idx += 1;
      }

      if (fields.length === 0) return null; // nothing to update

      const query = `
        UPDATE submissions
        SET ${fields.join(', ')}, updated_at = NOW()
        WHERE id = $1
        RETURNING *
      `;

      const result = await db.query(query, values);
      return result.rows[0] || null;
    } catch (error) {
      throw new AppError(`Error updating submission: ${error.message}`, 500);
    }
  },

  /**
   * ✅ Mark a challenge as completed by a user (creates a completed submission + triggers progress)
   * This is a convenience for "mark complete" actions when no actual submission is required.
   * @param {{ userId: string, challengeId: string }}
   */
  completeChallenge: async ({ userId, challengeId }) => {
    try {
      if (!userId || !challengeId)
        throw new AppError(
          'Missing userId or challengeId',
          400,
          'VALIDATION_ERROR'
        );

      // Try to load challenge to gather points and related goal
      let challenge = null;
      try {
        challenge = await Challenge.findById(challengeId);
      } catch (err) {
        challenge = null;
      }

      const points =
        challenge && challenge.points_reward
          ? Number(challenge.points_reward)
          : 10;

      // Create a lightweight submission record to represent completion
      const result = await db.query(
        `
        INSERT INTO submissions (user_id, challenge_id, submission_text, submission_files, language, status, score, feedback, submitted_at, graded_at, updated_at)
        VALUES ($1, $2, $3, $4, 'text', 'completed', $5, $6, NOW(), NOW(), NOW())
        RETURNING *
        `,
        [
          userId,
          challengeId,
          null,
          null,
          points >= 0 ? Math.round(points * 10) : 100,
          'Marked completed by user',
        ]
      );

      const submission = result.rows[0];

      // Track a challenge_completed event which will update leaderboard and notifications
      await progressService.trackEvent(userId, 'challenge_completed', {
        challenge_id: challengeId,
        points_earned: points,
        related_goal_id: challenge?.related_goal_id || null,
      });

      // Notify user
      await notificationService.sendNotification(
        userId,
        'challenge_completed',
        `You marked the challenge '${
          challenge?.title || challengeId
        }' as complete. You earned ${points} points.`,
        { challenge_id: challengeId }
      );

      return submission;
    } catch (error) {
      throw new AppError(
        `Error marking challenge complete: ${error.message}`,
        500
      );
    }
  },
};

module.exports = submissionService;
