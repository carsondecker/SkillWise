// src/services/progressService.js
const Progress = require('../models/Progress');
const db = require('../database/connection');
const { AppError } = require('../middleware/errorHandler');
const notificationService = require('./notificationService');
const leaderboardService = require('./leaderboardService');

const progressService = {
  /**
   * 📊 Calculate overall progress summary for a user
   */
  calculateOverallProgress: async (userId) => {
    try {
      const stats = await Progress.getUserStats(userId);

      return {
        userId,
        totalAttempts: Number(stats.total_attempts || 0),
        completedChallenges: Number(stats.completed_challenges || 0),
        totalPoints: Number(stats.total_points || 0),
        averageScore: Number(stats.average_score || 0),
        completionRate: stats.total_attempts
          ? Math.round(
            (stats.completed_challenges / stats.total_attempts) * 100,
          )
          : 0,
      };
    } catch (error) {
      throw new AppError(
        `Error calculating overall progress: ${error.message}`,
        500,
      );
    }
  },

  /**
   * 🧠 Track learning-related event (e.g., challenge_completed, goal_updated)
   */
  trackEvent: async (userId, eventType, eventData = {}) => {
    try {
      // Record in progress_events table
      await db.query(
        `
        INSERT INTO progress_events (user_id, event_type, event_data, created_at)
        VALUES ($1, $2, $3, NOW())
        `,
        [userId, eventType, JSON.stringify(eventData)],
      );

      // If user completed a challenge, award points
      if (eventType === 'challenge_completed') {
        const points = eventData.points_earned || 10;
        await leaderboardService.updateUserPoints(userId, points, eventType);

        await notificationService.sendNotification(
          userId,
          'challenge_completed',
          `You earned ${points} points for completing a challenge!`,
          { challengeId: eventData.challenge_id },
        );
      }

      // If user completed a goal, send milestone notification
      if (eventType === 'goal_completed') {
        await notificationService.sendNotification(
          userId,
          'goal_completed',
          '🎉 Congratulations on completing your goal!',
          { goalId: eventData.goal_id },
        );
      }

      return {
        message: `Event '${eventType}' tracked successfully`,
        userId,
        eventType,
      };
    } catch (error) {
      throw new AppError(
        `Error tracking progress event: ${error.message}`,
        500,
      );
    }
  },
  getProgressLatest: async ({ userId }) => {
    try {
      if (!userId) {
        throw new AppError('User ID is required', 400, 'INVALID_INPUT');
      }

      const query = `
        SELECT
          p.id,
          p.user_id,
          p.related_goal_id AS goal_id,
          p.related_challenge_id AS challenge_id,
          p.event_type,
          p.created_at,
          p.updated_at,
          g.title AS goal_title,
          g.category AS goal_category,
          c.title AS challenge_title,
          c.difficulty_level AS challenge_difficulty
        FROM progress_events p
               LEFT JOIN goals g ON p.related_goal_id = g.id
               LEFT JOIN challenges c ON p.related_challenge_id = c.id
        WHERE p.user_id = $1
        ORDER BY p.updated_at DESC
          LIMIT 3
      `;

      const { rows } = await db.query(query, [userId]);

      // Normalize for consistent frontend format
      return rows.map((row) => ({
        id: row.id,
        userId: row.user_id,
        eventType: row.event_type,
        activityType: row.activity_type, // "goal" | "challenge" | "other"
        title: row.activity_title,
        category: row.activity_category,
        goalId: row.goal_id,
        challengeId: row.challenge_id,
        goalTitle: row.goal_title,
        challengeTitle: row.challenge_title,
        challengeDifficulty: row.challenge_difficulty,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }));
    } catch (error) {
      throw new AppError(
        `Error fetching latest progress: ${error.message}`,
        500,
      );
    }
  },

  /**
   * 📈 Generate progress analytics over time
   * @param {number} userId
   * @param {string} timeframe - 'weekly' | 'monthly' | 'all'
   */
  generateAnalytics: async (userId, timeframe = 'weekly') => {
    try {
      let dateFilter = '';
      if (timeframe === 'weekly')
        dateFilter = 'AND p.created_at >= NOW() - INTERVAL \'7 days\'';
      else if (timeframe === 'monthly')
        dateFilter = 'AND p.created_at >= NOW() - INTERVAL \'30 days\'';

      const result = await db.query(
        `
        SELECT
          DATE_TRUNC('day', p.created_at) AS date,
          COUNT(*) AS activities,
          SUM(p.points_earned) AS total_points,
          AVG(p.score) AS avg_score
        FROM progress p
        WHERE p.user_id = $1
        ${dateFilter}
        GROUP BY DATE_TRUNC('day', p.created_at)
        ORDER BY date ASC
        `,
        [userId],
      );

      return {
        userId,
        timeframe,
        data: result.rows.map((r) => ({
          date: r.date,
          activities: Number(r.activities),
          points: Number(r.total_points),
          averageScore: Number(r.avg_score),
        })),
      };
    } catch (error) {
      throw new AppError(`Error generating analytics: ${error.message}`, 500);
    }
  },

  /**
   * 🏅 Check milestone achievements for user
   */
  checkMilestones: async (userId) => {
    try {
      const stats = await Progress.getUserStats(userId);
      const achievements = [];

      if (Number(stats.completed_challenges) >= 10) {
        achievements.push({
          title: '10 Challenges Completed',
          description: 'You’ve completed 10 challenges!',
          difficulty: 'medium',
          category: 'milestone',
        });
      }

      if (Number(stats.total_points) >= 500) {
        achievements.push({
          title: '500 Points Earned',
          description: 'You’ve earned over 500 points!',
          difficulty: 'hard',
          category: 'streak',
        });
      }

      if (Number(stats.average_score) >= 90) {
        achievements.push({
          title: 'High Performer',
          description: 'You maintain an average score of 90%+.',
          difficulty: 'hard',
          category: 'performance',
        });
      }

      // Award points + notifications for new milestones
      for (const achievement of achievements) {
        const points =
          leaderboardService.calculateAchievementPoints(achievement);
        await leaderboardService.updateUserPoints(userId, points, 'milestone');
        await notificationService.sendNotification(
          userId,
          'achievement',
          `🏆 ${achievement.title} — ${achievement.description}`,
          achievement,
        );
      }

      return {
        userId,
        newAchievements: achievements,
        totalUnlocked: achievements.length,
      };
    } catch (error) {
      throw new AppError(`Error checking milestones: ${error.message}`, 500);
    }
  },
};
/**
 * 🧾 Get user progress overview (used in /progress/stats)
 */
const getProgressOverview = async ({ userId }) => {
  const stats = await progressService.calculateOverallProgress(userId);

  return {
    userId,
    level: Math.floor(stats.totalPoints / 100) + 1,
    total_points: stats.totalPoints,
    completed_challenges: stats.completedChallenges,
    average_score: stats.averageScore,
    completion_rate: stats.completionRate,
    goals_achieved: 0,
    current_streak: 0,
    longest_streak: 0,
    badges: [],
    skills: [],
    recent_activity: [],
  };
};

progressService.getProgressOverview = getProgressOverview;

module.exports = progressService;
