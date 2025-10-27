// TODO: Implement challenges CRUD operations controller
const challengeService = require('../services/challengeService');

const challengeController = {
  // TODO: Get all challenges
  getChallenges: async (req, res, next) => {
    try {
      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 20;
      const sort = req.query.sort || '-createdAt';
      const search = req.query.search || req.body.search;
      const difficulty = req.query.difficulty || req.body.difficulty;
      const tags = req.query.tags || req.body.tags;
      const authorId = req.query.authorId || req.body.authorId;

      const filters = {};
      if (search) filters.$text = { $search: search };
      if (difficulty) filters.difficulty = difficulty;
      if (tags) filters.tags = Array.isArray(tags) ? tags : String(tags).split(',').map(t => t.trim()).filter(Boolean);
      if (authorId) filters.authorId = authorId;

      const result = await challengeService.getChallenges({ page, limit, filters, sort });

      // Normalize response: service can return an array or a paginated object
      if (Array.isArray(result)) {
        return res.status(200).json({ success: true, data: result, meta: { page, limit } });
      }

      return res.status(200).json({ success: true, data: result.data || result.docs || result, meta: result.meta || { page: result.page || page, limit: result.limit || limit, total: result.total } });
    } catch (err) {
      return next(err);
    }
  },

  // TODO: Get challenge by ID
  getChallengeById: async (req, res, next) => {
    try {
      const id = req.params.id || req.query.id || req.body.id;
      if (!id) {
        return res.status(400).json({ success: false, message: 'Missing challenge id' });
      }

      const challenge = await challengeService.getChallengeById(id);
      if (!challenge) {
        return res.status(404).json({ success: false, message: 'Challenge not found' });
      }

      return res.status(200).json({ success: true, data: challenge });
    } catch (err) {
      return next(err);
    }
  },

  // TODO: Create new challenge
  createChallenge: async (req, res, next) => {
    try {
      const payload = req.body || {};
      const authorId = (req.user && req.user.id) || payload.authorId;
      // basic required fields
      const { title, description } = payload;
      if (!title || !description) {
        return res.status(400).json({ success: false, message: 'Missing required fields: title or description' });
      }

      const newChallenge = await challengeService.createChallenge({ ...payload, authorId });
      return res.status(201).json({ success: true, data: newChallenge });
    } catch (err) {
      return next(err);
    }
  },

  // TODO: Update challenge
  updateChallenge: async (req, res, next) => {
    try {
      const id = req.params.id || req.body.id;
      if (!id) {
        return res.status(400).json({ success: false, message: 'Missing challenge id' });
      }

      const updates = req.body || {};
      const userId = req.user && req.user.id;

      const updated = await challengeService.updateChallenge(id, updates, { userId });
      if (!updated) {
        return res.status(404).json({ success: false, message: 'Challenge not found or not updated' });
      }

      return res.status(200).json({ success: true, data: updated });
    } catch (err) {
      return next(err);
    }
  },

  // TODO: Delete challenge
  deleteChallenge: async (req, res, next) => {
    try {
      const id = req.params.id || req.body.id;
      if (!id) {
        return res.status(400).json({ success: false, message: 'Missing challenge id' });
      }

      const userId = req.user && req.user.id;
      const deleted = await challengeService.deleteChallenge(id, { userId });

      if (!deleted) {
        return res.status(404).json({ success: false, message: 'Challenge not found or deletion not allowed' });
      }

      return res.status(200).json({ success: true, message: 'Challenge deleted' });
    } catch (err) {
      return next(err);
    }
  }
};

module.exports = challengeController;