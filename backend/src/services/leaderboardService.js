// src/services/leaderboardService.js
const Leaderboard = require('../models/Leaderboard');
const db = require('../database/connection');
const { AppError } = require('../middleware/errorHandler');

const leaderboardService = {
  /**
   * 🏆 Get leaderboard by timeframe
   * @param {object} opts
   * @param {'global' | 'weekly' | 'monthly'} opts.timeframe
   * @param {number} opts.limit
   */
  getLeaderboard: async ({ timeframe = 'global', limit = 10 }) => {
    try {
      switch (timeframe) {
      case 'weekly':
        return await Leaderboard.getWeeklyLeaderboard(limit);
      case 'monthly':
        return await Leaderboard.getMonthlyLeaderboard(limit);
      default:
        return await Leaderboard.getGlobalLeaderboard(limit);
      }
    } catch (error) {
      throw new AppError(
        `Error fetching ${timeframe} leaderboard: ${error.message}`,
        500,
      );
    }
  },

  /**
   * 👤 Get a specific user's ranking
   * @param {object} opts
   * @param {number} opts.userId
   */
  getUserRanking: async ({ userId }) => {
    try {
      const ranking = await Leaderboard.getUserRank(userId);
      return ranking || null;
    } catch (error) {
      throw new AppError(`Error fetching user ranking: ${error.message}`, 500);
    }
  },

  /**
   * 📚 Get category-specific leaderboard
   * @param {object} opts
   * @param {string} opts.category
   * @param {number} opts.limit
   */
  getCategoryLeaderboard: async ({ category, limit = 10 }) => {
    try {
      return await Leaderboard.getSubjectLeaderboard(category, limit);
    } catch (error) {
      throw new AppError(
        `Error fetching category leaderboard: ${error.message}`,
        500,
      );
    }
  },

  /**
   * 🥇 Get top global performers
   * @param {number} limit
   */
  getTopPerformers: async (limit = 10) => {
    try {
      const leaderboard = await Leaderboard.getGlobalLeaderboard(limit);
      return leaderboard.map((entry, index) => ({
        rank: index + 1,
        userId: entry.user_id,
        firstName: entry.first_name,
        lastName: entry.last_name,
        totalPoints: Number(entry.total_points) || 0,
        challengesCompleted: Number(entry.total_challenges_completed) || 0,
        level: entry.level || 1,
      }));
    } catch (error) {
      throw new AppError(
        `Error fetching top performers: ${error.message}`,
        500,
      );
    }
  },

  /**
   * 💎 Update user points and log reason
   * (Optional utility for gamification)
   */
  updateUserPoints: async (userId, points, reason) => {
    try {
      if (!userId || !points) {
        throw new AppError(
          'Invalid parameters for updating user points',
          400,
          'INVALID_INPUT',
        );
      }

      await db.withTransaction(async (query) => {
        await query(
          `
          UPDATE user_statistics
          SET total_points = total_points + $2,
              updated_at = NOW()
          WHERE user_id = $1
          `,
          [userId, points],
        );

        await query(
          `
          INSERT INTO progress_events (user_id, event_type, points_earned, event_data)
          VALUES ($1, 'points_awarded', $2, jsonb_build_object('reason', $3))
          `,
          [userId, points, reason],
        );
      });

      return {
        message: `User ${userId} awarded ${points} points for ${reason}`,
      };
    } catch (error) {
      throw new AppError(`Error updating user points: ${error.message}`, 500);
    }
  },

  /**
   * 🧮 Calculate achievement point value
   */
  calculateAchievementPoints: (achievement) => {
    try {
      let basePoints = 0;
      const difficultyMap = {
        easy: 10,
        medium: 25,
        hard: 50,
        legendary: 100,
      };

      basePoints += difficultyMap[achievement.difficulty] || 10;

      if (achievement.category === 'streak') basePoints += 15;
      if (achievement.category === 'goal_completion') basePoints += 20;
      if (achievement.category === 'peer_review') basePoints += 10;

      if (achievement.streakBonus) {
        basePoints += achievement.streakBonus * 2;
      }

      return basePoints;
    } catch (error) {
      console.error('Error calculating achievement points:', error);
      return 0;
    }
  },
};

module.exports = leaderboardService;
