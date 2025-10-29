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
  submitSolution: async (submissionData) => {
    try {
      const { user_id, challenge_id, content, attachments, language } = submissionData;

      if (!user_id || !challenge_id || !content) {
        throw new AppError('Missing required fields for submission', 400, 'VALIDATION_ERROR');
      }

      const result = await db.query(
        `
        INSERT INTO submissions (user_id, challenge_id, content, attachments, language, status, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, 'submitted', NOW(), NOW())
        RETURNING *
        `,
        [user_id, challenge_id, content, attachments || null, language || 'text'],
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

      if (!result.rows[0]) throw new AppError('Submission not found', 404, 'NOT_FOUND');
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
        [userId],
      );
      return result.rows;
    } catch (error) {
      throw new AppError(`Error fetching user submissions: ${error.message}`, 500);
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
        [challengeId],
      );
      return result.rows;
    } catch (error) {
      throw new AppError(`Error fetching challenge submissions: ${error.message}`, 500);
    }
  },

  /**
   * 🧠 Grade a submission (manual or AI-assisted)
   */
  gradeSubmission: async (submissionId) => {
    try {
      // Fetch submission
      const result = await db.query('SELECT * FROM submissions WHERE id = $1', [submissionId]);
      const submission = result.rows[0];
      if (!submission) throw new AppError('Submission not found', 404, 'NOT_FOUND');

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
        await leaderboardService.updateUserPoints(submission.user_id, Math.round(score / 10), 'submission_graded');
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
      const allowedStatuses = ['submitted', 'reviewing', 'graded', 'rejected', 'completed'];
      if (!allowedStatuses.includes(status)) {
        throw new AppError(`Invalid submission status: ${status}`, 400, 'INVALID_STATUS');
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

      if (!result.rows[0]) throw new AppError('Submission not found', 404, 'NOT_FOUND');

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
      throw new AppError(`Error updating submission status: ${error.message}`, 500);
    }
  },
};

module.exports = submissionService;
