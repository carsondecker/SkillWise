// TODO: Implement user management controller for profile, settings, statistics
const userService = require('../services/userService');

const userController = {
  // TODO: Get user profile
  getProfile: async (req, res, next) => {
    try {
      const userId = req.params.userId || req.query.userId || (req.user && req.user.id) || req.body.userId;
      if (!userId) {
        return res.status(400).json({ success: false, message: 'Missing userId' });
      }

      const include = req.query.include || req.body.include; // e.g. 'settings,statistics'
      const profile = await userService.getProfile(userId, { include });

      if (!profile) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      return res.status(200).json({ success: true, data: profile });
    } catch (err) {
      return next(err);
    }
  },

  // TODO: Update user profile
  updateProfile: async (req, res, next) => {
    try {
      const payload = req.body || {};
      const userId = (req.user && req.user.id) || payload.userId;
      if (!userId) {
        return res.status(401).json({ success: false, message: 'Authentication required' });
      }

      // Prevent accidental elevation via body; service should enforce permissions
      const updates = { ...payload };
      delete updates.userId; // don't allow changing target via body

      const updated = await userService.updateProfile(userId, updates, { actorId: req.user && req.user.id });

      if (!updated) {
        return res.status(404).json({ success: false, message: 'User not found or update not allowed' });
      }

      return res.status(200).json({ success: true, data: updated });
    } catch (err) {
      return next(err);
    }
  },

  // TODO: Get user statistics
  getStatistics: async (req, res, next) => {
    try {
      const userId = req.params.userId || req.query.userId || (req.user && req.user.id) || req.body.userId;
      if (!userId) {
        return res.status(400).json({ success: false, message: 'Missing userId' });
      }

      const range = req.query.range || req.body.range || '30d';
      const stats = await userService.getStatistics(userId, { range });

      if (!stats) {
        return res.status(404).json({ success: false, message: 'Statistics not available' });
      }

      return res.status(200).json({ success: true, data: stats });
    } catch (err) {
      return next(err);
    }
  },

  // TODO: Delete user account
  deleteAccount: async (req, res, next) => {
    try {
      const targetUserId = req.params.userId || req.body.userId || req.query.userId || (req.user && req.user.id);
      const actorId = req.user && req.user.id;
      if (!actorId) {
        return res.status(401).json({ success: false, message: 'Authentication required' });
      }
      if (!targetUserId) {
        return res.status(400).json({ success: false, message: 'Missing userId' });
      }

      const deleted = await userService.deleteAccount(targetUserId, { actorId });

      if (!deleted) {
        return res.status(404).json({ success: false, message: 'User not found or deletion not allowed' });
      }

      // If user deleted their own account, clear refresh cookie
      if (actorId === targetUserId) {
        res.clearCookie && res.clearCookie('refreshToken');
      }

      return res.status(200).json({ success: true, message: 'User account deleted' });
    } catch (err) {
      return next(err);
    }
  }
};

module.exports = userController;