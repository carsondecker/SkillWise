// TODO: Implement progress tracking controller
const progressService = require('../services/progressService');

const progressController = {
  // TODO: Get user progress overview
  getProgress: async (req, res, next) => {
    try {
      const userId = req.params.userId || req.query.userId || (req.user && req.user.id) || req.body.userId;
      if (!userId) {
        return res.status(400).json({ success: false, message: 'Missing userId' });
      }

      const range = req.query.range || req.body.range || '30d';
      const includeDetailed = req.query.detailed === 'true' || req.body.detailed === true;
      const challengeId = req.query.challengeId || req.body.challengeId;
      const goalId = req.query.goalId || req.body.goalId;

      const options = { range, includeDetailed, challengeId, goalId };

      const result = await progressService.getProgress(userId, options);

      if (Array.isArray(result)) {
        return res.status(200).json({ success: true, data: result, meta: { range } });
      }

      return res.status(200).json({
        success: true,
        data: result.data || result,
        meta: result.meta || { range }
      });
    } catch (err) {
      return next(err);
    }
  },

  // TODO: Update progress event
  updateProgress: async (req, res, next) => {
    try {
      const payload = req.body || {};
      const userId = (req.user && req.user.id) || payload.userId;
      if (!userId) {
        return res.status(401).json({ success: false, message: 'Authentication required' });
      }

      // basic validation: at least an eventType or progress data must be provided
      const { eventId, eventType, targetId, data } = payload;
      if (!eventId && !eventType && !data) {
        return res.status(400).json({ success: false, message: 'Missing eventId, eventType or data to update progress' });
      }

      const updated = await progressService.updateProgress(userId, { eventId, eventType, targetId, data, metadata: payload.metadata });

      if (!updated) {
        return res.status(400).json({ success: false, message: 'Failed to update progress' });
      }

      // If client did not provide eventId assume a creation happened -> 201
      const statusCode = eventId ? 200 : 201;
      return res.status(statusCode).json({ success: true, data: updated });
    } catch (err) {
      return next(err);
    }
  },

  // TODO: Get progress analytics
  getAnalytics: async (req, res, next) => {
    try {
      const userId = req.params.userId || req.query.userId || (req.user && req.user.id) || req.body.userId;
      if (!userId) {
        return res.status(400).json({ success: false, message: 'Missing userId' });
      }

      const range = req.query.range || req.body.range || '90d';
      const metrics = req.query.metrics || req.body.metrics; // optional array or comma list
      const includeComparison = req.query.compare === 'true' || req.body.compare === true;

      const parsedMetrics = metrics
        ? (Array.isArray(metrics) ? metrics : String(metrics).split(',').map(m => m.trim()).filter(Boolean))
        : undefined;

      const analytics = await progressService.getAnalytics(userId, { range, metrics: parsedMetrics, includeComparison });

      if (!analytics) {
        return res.status(404).json({ success: false, message: 'Analytics not available' });
      }

      return res.status(200).json({ success: true, data: analytics });
    } catch (err) {
      return next(err);
    }
  },

  // TODO: Get milestones
  getMilestones: async (req, res, next) => {
    try {
      const ownerId = req.params.userId || req.query.userId || (req.user && req.user.id) || req.body.userId;
      if (!ownerId) {
        return res.status(400).json({ success: false, message: 'Missing userId' });
      }

      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 20;
      const status = req.query.status || req.body.status; // e.g. 'open','completed'
      const goalId = req.query.goalId || req.body.goalId;
      const filters = { ownerId };
      if (status) filters.status = status;
      if (goalId) filters.goalId = goalId;

      const result = await progressService.getMilestones({ page, limit, filters });

      if (Array.isArray(result)) {
        return res.status(200).json({ success: true, data: result, meta: { page, limit } });
      }

      return res.status(200).json({
        success: true,
        data: result.data || result.docs || result,
        meta: result.meta || { page: result.page || page, limit: result.limit || limit, total: result.total }
      });
    } catch (err) {
      return next(err);
    }
  }
};

module.exports = progressController;