// TODO: Implement AI integration controller for feedback and hints
const aiService = require('../services/aiService');

const aiController = {
  // Generate AI feedback for submission
  generateFeedback: async (req, res, next) => {
    try {
      const { submission, challengeId } = req.body;
      if (!submission || !challengeId) {
        return res.status(400).json({ success: false, message: 'Missing submission or challengeId' });
      }

      const userId = req.user && req.user.id;
      const feedback = await aiService.generateFeedback({ submission, challengeId, userId });

      return res.status(200).json({ success: true, data: feedback });
    } catch (err) {
      return next(err);
    }
  },

  // Get AI hints for challenge
  getHints: async (req, res, next) => {
    try {
      const challengeId = req.params.challengeId || req.query.challengeId || req.body.challengeId;
      if (!challengeId) {
        return res.status(400).json({ success: false, message: 'Missing challengeId' });
      }

      const level = req.query.level || req.body.level; // optional hint difficulty/verbosity
      const context = req.body.context || {};
      const hints = await aiService.getHints(challengeId, { level, context });

      return res.status(200).json({ success: true, data: hints });
    } catch (err) {
      return next(err);
    }
  },

  // Generate challenge suggestions
  suggestChallenges: async (req, res, next) => {
    try {
      // Accept either explicit profile payload or authenticated user
      const profile = req.body.profile || req.user || req.query.profile;
      if (!profile) {
        return res.status(400).json({ success: false, message: 'Missing user profile or identification for suggestions' });
      }

      const options = {
        maxResults: parseInt(req.query.maxResults, 10) || 10,
        tags: req.body.tags || req.query.tags
      };

      const suggestions = await aiService.suggestChallenges(profile, options);
      return res.status(200).json({ success: true, data: suggestions });
    } catch (err) {
      return next(err);
    }
  },

  // Analyze learning progress
  analyzeProgress: async (req, res, next) => {
    try {
      const userId = req.params.userId || (req.user && req.user.id);
      if (!userId) {
        return res.status(400).json({ success: false, message: 'Missing userId' });
      }

      const range = req.query.range || req.body.range || '30d'; 
      const analysis = await aiService.analyzeProgress(userId, { range });

      return res.status(200).json({ success: true, data: analysis });
    } catch (err) {
      return next(err);
    }
  }
};

module.exports = aiController;