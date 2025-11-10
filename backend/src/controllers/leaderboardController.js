const { z } = require('zod');
const leaderboardService = require('../services/leaderboardService');
const { asyncHandler } = require('../utils/helpers');

// -------------------------------
// 🧠 Validation schemas
// -------------------------------
const leaderboardQuerySchema = z.object({
  timeframe: z.enum(['global', 'weekly', 'monthly']).default('global'),
  limit: z
    .string()
    .regex(/^[0-9]+$/, 'Limit must be numeric')
    .transform(Number)
    .default('10'),
});

const categorySchema = z.object({
  category: z.string().min(1, 'Category is required'),
  limit: z
    .string()
    .regex(/^[0-9]+$/, 'Limit must be numeric')
    .transform(Number)
    .default('10'),
});

// -------------------------------
// 🎯 Controller implementation
// -------------------------------
const leaderboardController = {
  /**
   * 🏆 GET /leaderboard
   * Global / Weekly / Monthly leaderboard
   */
  getLeaderboard: asyncHandler(async (req, res) => {
    const { timeframe, limit } = leaderboardQuerySchema.parse(req.query);
    const leaderboard = await leaderboardService.getLeaderboard({
      timeframe,
      limit,
    });
    res.json({ timeframe, count: leaderboard.length, leaderboard });
  }),

  /**
   * 🥇 GET /leaderboard/top
   * Shortcut to get top global performers
   */
  getTopPerformers: asyncHandler(async (req, res) => {
    const limit = Number(req.query.limit) || 10;
    const leaderboard = await leaderboardService.getTopPerformers(limit);
    res.json({ count: leaderboard.length, leaderboard });
  }),

  /**
   * 👤 GET /leaderboard/user/:userId
   * Get a specific user's ranking
   */
  getUserRanking: asyncHandler(async (req, res) => {
    const userId = z.coerce.number().parse(req.params.userId);
    const ranking = await leaderboardService.getUserRanking({ userId });
    if (!ranking)
      return res.status(404).json({ message: 'User ranking not found' });
    res.json({ ranking });
  }),

  /**
   * 🧭 GET /leaderboard/category
   * Get leaderboard for a specific challenge category
   */
  getCategoryLeaderboard: asyncHandler(async (req, res) => {
    const { category, limit } = categorySchema.parse(req.query);
    const leaderboard = await leaderboardService.getCategoryLeaderboard({
      category,
      limit,
    });
    res.json({ category, count: leaderboard.length, leaderboard });
  }),

  /**
   * 🧮 GET /leaderboard/achievement-points
   * Calculate achievement points for preview/testing
   */
  calculateAchievementPoints: asyncHandler(async (req, res) => {
    const schema = z.object({
      title: z.string().optional(),
      difficulty: z
        .enum(['easy', 'medium', 'hard', 'legendary'])
        .default('medium'),
      category: z.string().optional(),
      streakBonus: z.number().optional(),
    });

    const data = schema.parse(req.body);
    const points = leaderboardService.calculateAchievementPoints(data);
    res.json({ ...data, points });
  }),
};

module.exports = leaderboardController;
