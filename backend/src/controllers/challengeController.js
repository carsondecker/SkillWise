const challengeService = require('../services/challengeService');
const { asyncHandler } = require('../utils/helpers');
const { AppError } = require('../middleware/errorHandler');

const challengeController = {
  // 🟢 Get all challenges
  getChallenges: asyncHandler(async (req, res, next) => {
    try {
      const { difficulty, category, limit, offset } = req.query;
      const challenges = await challengeService.getChallenges({
        difficulty,
        category,
        limit,
        offset,
      });
      res.json({ challenges });
    } catch (error) {
      next(error);
    }
  }),

  // 🟢 Get single challenge by ID
  getChallengeById: asyncHandler(async (req, res, next) => {
    try {
      const id = parseInt(req.params.id, 10);
      const challenge = await challengeService.getChallengeById(id);
      if (!challenge)
        throw new AppError('Challenge not found', 404, 'NOT_FOUND');
      res.json({ challenge });
    } catch (error) {
      next(error);
    }
  }),

  // 🟡 Create new challenge (Admin only)
  createChallenge: asyncHandler(async (req, res, next) => {
    try {
      const data = req.validated.body; // ✅ comes from challengeValidation middleware
      const challenge = await challengeService.createChallenge({
        ...data,
        created_by: req.user?.id || null, // logged-in admin
      });
      res
        .status(201)
        .json({ message: 'Challenge created successfully', challenge });
    } catch (error) {
      next(error);
    }
  }),

  // 🔵 Update challenge (Admin only)
  updateChallenge: asyncHandler(async (req, res, next) => {
    try {
      const id = parseInt(req.params.id, 10);
      const data = req.validated.body; // ✅ validated fields only
      const updated = await challengeService.updateChallenge({ id, data });
      res.json({
        message: 'Challenge updated successfully',
        challenge: updated,
      });
    } catch (error) {
      next(error);
    }
  }),

  // 🔴 Delete challenge (Admin only)
  deleteChallenge: asyncHandler(async (req, res, next) => {
    try {
      const id = parseInt(req.params.id, 10);
      await challengeService.deleteChallenge({ id });
      res.status(204).end();
    } catch (error) {
      next(error);
    }
  }),
};

module.exports = challengeController;
