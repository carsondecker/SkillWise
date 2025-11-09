// src/services/leaderboardService.js
const Leaderboard = require('../models/Leaderboard');
const db = require('../database/connection');
const { AppError } = require('../middleware/errorHandler');

const leaderboardService = {
  /**
   * 🏆 Calculate user rankings
   * @param {string} timeframe - 'weekly' | 'monthly' | 'all'
   */
  calculateRankings: async (timeframe = 'all') => {
    try {
      switch (timeframe) {
        case 'weekly':
          return await Leaderboard.getWeeklyLeaderboard();
        case 'monthly':
          return await Leaderboard.getMonthlyLeaderboard();
        default:
          return await Leaderboard.getGlobalLeaderboard();
      }
    } catch (error) {
      throw new AppError(`Error calculating rankings: ${error.message}`, 500);
    }
  },

  /**
   * 💎 Update user points and record reason
   * @param {number} userId
   * @param {number} points
   * @param {string} reason - e.g. 'challenge_completed', 'goal_completed', 'peer_review'
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
        // 1️⃣ Insert or update leaderboard total
        await query(
          `
          INSERT INTO leaderboard (user_id, total_points, updated_at)
          VALUES ($1, $2, NOW())
          ON CONFLICT (user_id)
          DO UPDATE SET 
            total_points = leaderboard.total_points + $2,
            updated_at = NOW()
          `,
          [userId, points],
        );

        // 2️⃣ Log reason in user_statistics or audit table (if available)
        await query(
          `
          INSERT INTO user_statistics (user_id, action, points, created_at)
          VALUES ($1, $2, $3, NOW())
          `,
          [userId, reason, points],
        );
      });

      return {
        message: `User ${userId} awarded ${points} points for ${reason}`,
        userId,
        points,
        reason,
      };
    } catch (error) {
      throw new AppError(`Error updating user points: ${error.message}`, 500);
    }
  },

  /**
   * 🥇 Get top performers (global)
   * @param {number} limit
   */
  getTopPerformers: async (limit = 10) => {
    try {
      const leaderboard = await Leaderboard.getGlobalLeaderboard(limit);
      return leaderboard.map((entry, index) => ({
        rank: index + 1,
        userId: entry.id,
        name: `${entry.first_name || ''} ${entry.last_name || ''}`.trim(),
        totalPoints: Number(entry.total_points) || 0,
        challengesCompleted: Number(entry.challenges_completed) || 0,
        averageScore: Number(entry.average_score) || 0,
      }));
    } catch (error) {
      throw new AppError(
        `Error fetching top performers: ${error.message}`,
        500,
      );
    }
  },

  /**
   * 🧮 Calculate achievement point value
   * @param {Object} achievement - { title, difficulty, category, streakBonus? }
   */
  calculateAchievementPoints: (achievement) => {
    try {
      let basePoints = 0;

      // Difficulty multipliers
      const difficultyMap = {
        easy: 10,
        medium: 25,
        hard: 50,
        legendary: 100,
      };

      basePoints += difficultyMap[achievement.difficulty] || 10;

      // Category bonuses
      if (achievement.category === 'streak') basePoints += 15;
      if (achievement.category === 'goal_completion') basePoints += 20;
      if (achievement.category === 'peer_review') basePoints += 10;

      // Streak multiplier
      if (achievement.streakBonus) {
        basePoints += achievement.streakBonus * 2;
      }

      return basePoints;
    } catch (error) {
      console.error('Error calculating achievement points:', error);
      return 0;
    }
  },

  /**
   * Get leaderboard by period and optional category
   * @param {Object} opts - { period: 'daily'|'weekly'|'monthly'|'alltime', limit: number, category?: string }
   */
  getLeaderboard: async (opts = {}) => {
    try {
      const { period = 'alltime', limit = 50, category } = opts;

      // If a category/subject is provided, use subject leaderboard (falls back to global)
      if (category && category !== 'overall') {
        // We assume category maps to subject names in the DB
        const rows = await Leaderboard.getSubjectLeaderboard(category, limit);
        return rows;
      }

      switch (period) {
        case 'daily':
          // For now, daily maps to weekly with a small limit — if a daily implementation exists use it
          if (typeof Leaderboard.getDailyLeaderboard === 'function') {
            return await Leaderboard.getDailyLeaderboard(limit);
          }
          return await Leaderboard.getWeeklyLeaderboard(limit);
        case 'weekly':
          return await Leaderboard.getWeeklyLeaderboard(limit);
        case 'monthly':
          return await Leaderboard.getMonthlyLeaderboard(limit);
        default:
          return await Leaderboard.getGlobalLeaderboard(limit);
      }
    } catch (error) {
      throw new AppError(`Error fetching leaderboard: ${error.message}`, 500);
    }
  },

  /**
   * Get ranking for a specific user id
   * @param {Object} opts - { userId }
   */
  getUserRanking: async (opts = {}) => {
    try {
      const { userId } = opts;
      if (!userId) return null;
      // model exposes getUserRank(userId)
      const row = await Leaderboard.getUserRank(userId);
      return row || null;
    } catch (error) {
      throw new AppError(`Error fetching user ranking: ${error.message}`, 500);
    }
  },

  /**
   * Get points breakdown for the authenticated user
   * @param {Object} opts - { userId }
   */
  getPointsBreakdown: async (opts = {}) => {
    try {
      const { userId } = opts;
      if (!userId) return null;
      const ranking = await Leaderboard.getUserRank(userId);
      return ranking || null;
    } catch (error) {
      throw new AppError(
        `Error fetching points breakdown: ${error.message}`,
        500,
      );
    }
  },

  /**
   * Get achievements for a user (stub — reads from achievements table if available)
   */
  getAchievements: async (opts = {}) => {
    try {
      const { userId } = opts;
      // For now return an empty array if achievements logic isn't present in models
      // If there is an achievements model, call it here (not implemented yet)
      return [];
    } catch (error) {
      throw new AppError(`Error fetching achievements: ${error.message}`, 500);
    }
  },
};

module.exports = leaderboardService;
