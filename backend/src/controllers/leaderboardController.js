// src/controllers/leaderboardController.js
const { z } = require('zod');
const leaderboardService = require('../services/leaderboardService');
const { asyncHandler } = require('../utils/helpers');

// ✅ Validation Schemas
const leaderboardQuerySchema = z.object({
  period: z.enum(['daily', 'weekly', 'monthly', 'alltime']).default('weekly'),
  limit: z
    .string()
    .regex(/^[0-9]+$/, 'Limit must be a number')
    .transform(Number)
    .default('50'),
});

// ✅ Controller Implementation
const leaderboardController = {
  // -------------------------
  // Get global leaderboard
  // -------------------------
  getLeaderboard: asyncHandler(async (req, res) => {
    const { period, limit } = leaderboardQuerySchema.parse(req.query);

    const leaderboard = await leaderboardService.getLeaderboard({ period, limit });
    res.json({ leaderboard });
  }),

  // -------------------------
  // Get user ranking
  // -------------------------
  getUserRanking: asyncHandler(async (req, res) => {
    const userId = z.string().uuid().parse(req.params.userId);

    const ranking = await leaderboardService.getUserRanking({ userId });
    if (!ranking) {
      return res.status(404).json({ message: 'User ranking not found' });
    }

    res.json({ ranking });
  }),

  // -------------------------
  // Get points breakdown for a user
  // -------------------------
  getPointsBreakdown: asyncHandler(async (req, res) => {
    const userId = req.user?.id;

    const breakdown = await leaderboardService.getPointsBreakdown({ userId });
    if (!breakdown) {
      return res.status(404).json({ message: 'No points data available' });
    }

    res.json({ breakdown });
  }),

  // -------------------------
  // Get achievements and badges
  // -------------------------
  getAchievements: asyncHandler(async (req, res) => {
    const userId = req.user?.id;

    const achievements = await leaderboardService.getAchievements({ userId });
    res.json({ achievements });
  }),
};

module.exports = leaderboardController;
