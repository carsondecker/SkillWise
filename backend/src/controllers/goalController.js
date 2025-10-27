// TODO: Implement goals CRUD operations controller
const goalService = require('../services/goalService');

const goalController = {
  // TODO: Get all goals for user
  getGoals: async (req, res, next) => {
    try {
      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 20;
      const sort = req.query.sort || '-createdAt';

      const ownerId = (req.user && req.user.id) || req.query.userId || req.body.userId;
      if (!ownerId) {
        return res.status(400).json({ success: false, message: 'Missing userId' });
      }

      const status = req.query.status || req.body.status;
      const tags = req.query.tags || req.body.tags;
      const filters = { ownerId };

      if (status) filters.status = status;
      if (tags) {
        filters.tags = Array.isArray(tags) ? tags : String(tags).split(',').map(t => t.trim()).filter(Boolean);
      }

      const result = await goalService.getGoals({ page, limit, filters, sort });

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
  },

  // TODO: Get single goal by ID
  getGoalById: async (req, res, next) => {
    try {
      const id = req.params.id || req.query.id || req.body.id;
      if (!id) {
        return res.status(400).json({ success: false, message: 'Missing goal id' });
      }

      const goal = await goalService.getGoalById(id);
      if (!goal) {
        return res.status(404).json({ success: false, message: 'Goal not found' });
      }

      return res.status(200).json({ success: true, data: goal });
    } catch (err) {
      return next(err);
    }
  },

  // TODO: Create new goal
  createGoal: async (req, res, next) => {
    try {
      const payload = req.body || {};
      const ownerId = (req.user && req.user.id) || payload.ownerId || payload.userId;

      const { title } = payload;
      if (!title) {
        return res.status(400).json({ success: false, message: 'Missing required field: title' });
      }
      if (!ownerId) {
        return res.status(400).json({ success: false, message: 'Missing ownerId' });
      }

      const newGoal = await goalService.createGoal({ ...payload, ownerId });
      return res.status(201).json({ success: true, data: newGoal });
    } catch (err) {
      return next(err);
    }
  },

  // TODO: Update existing goal
  updateGoal: async (req, res, next) => {
    try {
      const id = req.params.id || req.body.id;
      if (!id) {
        return res.status(400).json({ success: false, message: 'Missing goal id' });
      }

      const updates = req.body || {};
      const userId = req.user && req.user.id;

      const updated = await goalService.updateGoal(id, updates, { userId });
      if (!updated) {
        return res.status(404).json({ success: false, message: 'Goal not found or not updated' });
      }

      return res.status(200).json({ success: true, data: updated });
    } catch (err) {
      return next(err);
    }
  },

  // TODO: Delete goal
  deleteGoal: async (req, res, next) => {
    try {
      const id = req.params.id || req.body.id;
      if (!id) {
        return res.status(400).json({ success: false, message: 'Missing goal id' });
      }

      const userId = req.user && req.user.id;
      const deleted = await goalService.deleteGoal(id, { userId });

      if (!deleted) {
        return res.status(404).json({ success: false, message: 'Goal not found or deletion not allowed' });
      }

      return res.status(200).json({ success: true, message: 'Goal deleted' });
    } catch (err) {
      return next(err);
    }
  }
};

module.exports = goalController;