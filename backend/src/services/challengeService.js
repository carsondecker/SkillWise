const Challenge = require('../models/Challenge');
const { AppError } = require('../middleware/errorHandler');

const challengeService = {
  getChallenges: async (filters = {}, userId) => {
    try {
      const { difficulty, category, limit = 20, offset = 0 } = filters;
      let challenges;

      if (difficulty)
        challenges = await Challenge.findByDifficulty(difficulty);
      else if (category)
        challenges = await Challenge.findByCategory(category);
      else
        challenges = await Challenge.findAll(userId); // ✅ filter by creator

      return challenges.slice(offset, offset + limit);
    } catch (error) {
      throw new AppError(`Error fetching challenges: ${error.message}`, 500);
    }
  },

  getChallengeById: async (id) => {
    try {
      const challenge = await Challenge.findById(id);
      if (!challenge) throw new AppError('Challenge not found', 404);
      return challenge;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(`Error fetching challenge: ${error.message}`, 500);
    }
  },

  createChallenge: async (data) => {
    try {
      return await Challenge.create({
        ...data,
        goal_id: data.goal_id || null,
        ai_generated: data.ai_generated || false,
        status: data.status || 'pending',
      });
    } catch (error) {
      throw new AppError(`Error creating challenge: ${error.message}`, 500);
    }
  },

  updateChallenge: async ({ id, data }) => {
    try {
      console.debug('challengeService.updateChallenge: updating id=', id, 'data=', JSON.stringify(data));
      const updated = await Challenge.update(id, data);
      if (!updated) throw new AppError('Challenge not found', 404);
      return updated;
    } catch (error) {
      // log full error for debugging trigger/DB issues
      try {
        console.error('challengeService.updateChallenge: error updating challenge:', error && error.message || error, { id, data });
      } catch (e) {
        console.error('challengeService.updateChallenge: error while logging error');
      }
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
