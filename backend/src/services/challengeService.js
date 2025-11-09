const Challenge = require('../models/Challenge');
const { AppError } = require('../middleware/errorHandler');

const challengeService = {
  getChallenges: async (filters = {}) => {
    try {
      const { difficulty, category, limit = 20, offset = 0 } = filters;

      // Normalize possible user id values. The caller may pass `userId` (number)
      // or a string (from query params) or `user_id`. Coerce to integer or null.
      let userId = null;
      if (filters.userId !== undefined && filters.userId !== null) {
        const parsed = Number.parseInt(filters.userId, 10);
        userId =
          Number.isFinite(parsed) && !Number.isNaN(parsed) ? parsed : null;
      } else if (filters.user_id !== undefined && filters.user_id !== null) {
        const parsed = Number.parseInt(filters.user_id, 10);
        userId =
          Number.isFinite(parsed) && !Number.isNaN(parsed) ? parsed : null;
      }

      let challenges;

      if (difficulty) {
        challenges = await Challenge.findByDifficulty(difficulty, userId);
      } else if (category) {
        challenges = await Challenge.findByCategory(category, userId);
      } else {
        challenges = await Challenge.findAll(userId);
      }

      return challenges.slice(offset, offset + limit);
    } catch (error) {
      throw new AppError(`Error fetching challenges: ${error.message}`, 500);
    }
  },

  getChallengeById: async (id, userId = null) => {
    try {
      const challenge = await Challenge.findById(id, userId);
      if (!challenge) throw new AppError('Challenge not found', 404);
      return challenge;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(`Error fetching challenge: ${error.message}`, 500);
    }
  },

  createChallenge: async (data) => {
    try {
      const challenge = await Challenge.create(data);
      return challenge;
    } catch (error) {
      throw new AppError(`Error creating challenge: ${error.message}`, 500);
    }
  },

  updateChallenge: async ({ id, data }) => {
    try {
      const updated = await Challenge.update(id, data);
      if (!updated) throw new AppError('Challenge not found', 404);
      return updated;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(`Error updating challenge: ${error.message}`, 500);
    }
  },

  deleteChallenge: async ({ id }) => {
    try {
      const deleted = await Challenge.delete(id);
      if (!deleted) throw new AppError('Challenge not found', 404);
      return deleted;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(`Error deleting challenge: ${error.message}`, 500);
    }
  },
};

module.exports = challengeService;
