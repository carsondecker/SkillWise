// TODO: Implement leaderboard controller for rankings and points
const leaderboardService = require('../services/leaderboardService');

const leaderboardController = {
  // TODO: Get global leaderboard
  getLeaderboard: async (req, res, next) => {
    try {
      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 50;
      const sort = req.query.sort || '-points';
      const timeframe = req.query.timeframe || req.body.timeframe || 'all'; // e.g. 'daily','weekly','monthly','all'
      const region = req.query.region || req.body.region;
      const tags = req.query.tags || req.body.tags;

      const filters = {};
      if (region) filters.region = region;
      if (tags) filters.tags = Array.isArray(tags) ? tags : String(tags).split(',').map(t => t.trim()).filter(Boolean);

      const result = await leaderboardService.getLeaderboard({ page, limit, sort, timeframe, filters });

      if (Array.isArray(result)) {
        return res.status(200).json({ success: true, data: result, meta: { page, limit, timeframe } });
      }

      return res.status(200).json({
        success: true,
        data: result.data || result.docs || result,
        meta: result.meta || { page: result.page || page, limit: result.limit || limit, total: result.total, timeframe }
      });
    } catch (err) {
      return next(err);
    }
  },

  // TODO: Get user ranking
  getUserRanking: async (req, res, next) => {
    try {
      const userId = req.params.userId || req.query.userId || (req.user && req.user.id) || req.body.userId;
      if (!userId) {
        return res.status(400).json({ success: false, message: 'Missing userId' });
      }

      const timeframe = req.query.timeframe || req.body.timeframe || 'all';
      const ranking = await leaderboardService.getUserRanking(userId, { timeframe });

      if (ranking == null) {
        return res.status(404).json({ success: false, message: 'Ranking not found for user' });
      }

      return res.status(200).json({ success: true, data: ranking });
    } catch (err) {
      return next(err);
    }
  },

  // TODO: Get points breakdown
  getPointsBreakdown: async (req, res, next) => {
    try {
      const userId = req.params.userId || req.query.userId || (req.user && req.user.id) || req.body.userId;
      if (!userId) {
        return res.status(400).json({ success: false, message: 'Missing userId' });
      }

      const period = req.query.period || req.body.period || '30d'; // e.g. '7d','30d','90d','all'
      const breakdown = await leaderboardService.getPointsBreakdown(userId, { period });

      if (!breakdown) {
        return res.status(404).json({ success: false, message: 'Points breakdown not available' });
      }

      return res.status(200).json({ success: true, data: breakdown });
    } catch (err) {
      return next(err);
    }
  },

  // TODO: Get achievements
  getAchievements: async (req, res, next) => {
    try {
      // If userId provided return user's achievements, otherwise return global achievement definitions
      const userId = req.params.userId || req.query.userId || (req.user && req.user.id) || req.body.userId;
      const category = req.query.category || req.body.category;
      const unlockedOnly = req.query.unlockedOnly === 'true' || req.body.unlockedOnly === true;

      const achievements = await leaderboardService.getAchievements({ userId, category, unlockedOnly });

      if (!achievements) {
        return res.status(404).json({ success: false, message: 'No achievements found' });
      }

      return res.status(200).json({ success: true, data: achievements });
    } catch (err) {
      return next(err);
    }
  }
};

module.exports = leaderboardController;