const challengeService = require('../services/challengeService');
const { asyncHandler } = require('../utils/helpers');
const { AppError } = require('../middleware/errorHandler');
const goalService = require('../services/goalService');

const challengeController = {
  // 🟢 Get all challenges
  getChallenges: asyncHandler(async (req, res, next) => {
    try {
      const { difficulty, category, limit, offset } = req.query;
      const userId = req.user?.id; // ✅ get logged-in user's ID

      const challenges = await challengeService.getChallenges(
        { difficulty, category, limit, offset },
        userId, // ✅ pass it down to service
      );

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
  // 🆕 Create challenge under a goal (manual or AI)
  // src/controllers/challengeController.js
  createChallengeForGoal: asyncHandler(async (req, res, next) => {
    console.log('🚀 Creating challenge for goal with data:', req.body);

    const goalIdParam = parseInt(req.params.id, 10);
    const userId = req.user?.id;

    if (Number.isNaN(goalIdParam)) {
      throw new AppError('Invalid goalId parameter', 400);
    }

    // ✅ Verify goal belongs to user
    const goal = await goalService.getGoalById({ userId, goalId: goalIdParam });
    console.log('🧩 Goal fetched from DB:', goal);

    if (!goal || goal.user_id !== userId) {
      throw new AppError('Unauthorized: goal not found or not yours', 403);
    }

    // ✅ Extract body with safe defaults
    const {
      title,
      description,
      instructions,
      ai_generated = false,
      category = 'general',
      difficulty_level = 'medium',
      estimated_time_minutes = 30,
      points_reward = 10,
      max_attempts = 3,
      requires_peer_review = false,
      is_active = true,
      prerequisites = [],
      tags = [],
      learning_objectives = [],
    } = req.body;

    // ✅ Build challenge data
    const challengeData = {
      goal_id: goalIdParam,
      created_by: userId,
      title,
      description,
      instructions: instructions || 'Follow goal steps',
      ai_generated,
      category,
      difficulty_level,
      estimated_time_minutes,
      points_reward,
      max_attempts,
      requires_peer_review,
      is_active,
      prerequisites,
      tags,
      learning_objectives,
    };

    console.log('🧱 Final challengeData payload:', challengeData);

    // ✅ Create challenge
    const newChallenge = await challengeService.createChallenge(challengeData);

    res.status(201).json({
      message: ai_generated
        ? 'AI challenge generated successfully'
        : 'Challenge created successfully',
      challenge: newChallenge,
    });
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

  markChallengeComplete: asyncHandler(async (req, res, next) => {
    const challengeId = parseInt(req.params.id, 10);
    const userId = req.user?.id;

    if (Number.isNaN(challengeId)) {
      throw new AppError('Invalid challenge ID', 400);
    }

    // 1️⃣ Fetch challenge and its goal
    const challenge = await challengeService.getChallengeById(challengeId);
    if (!challenge) {
      throw new AppError('Challenge not found', 404);
    }

    // 2️⃣ Ensure user owns the goal tied to this challenge
    if (challenge.goal_id) {
      const goal = await goalService.getGoalById({
        userId,
        goalId: challenge.goal_id,
      });
      if (!goal || goal.user_id !== userId) {
        throw new AppError('Unauthorized: this challenge is not part of your goal', 403);
      }
    }

    // 3️⃣ Mark as completed
    const updated = await challengeService.updateChallenge({
      id: challengeId,
      data: { status: 'completed' },
    });

    res.status(200).json({
      message: 'Challenge marked as complete',
      challenge: updated,
    });
  }),
  submitForPeerReview: asyncHandler(async (req, res, next) => {
    const challengeId = parseInt(req.params.id, 10);
    const userId = req.user?.id;

    if (Number.isNaN(challengeId)) {
      throw new AppError('Invalid challenge ID', 400);
    }

    // 1️⃣ Fetch challenge and its goal
    const challenge = await challengeService.getChallengeById(challengeId);
    if (!challenge) {
      throw new AppError('Challenge not found', 404);
    }

    // 2️⃣ Ensure user owns the goal tied to this challenge
    if (challenge.goal_id) {
      const goal = await goalService.getGoalById({
        userId,
        goalId: challenge.goal_id,
      });
      if (!goal || goal.user_id !== userId) {
        throw new AppError('Unauthorized: this challenge is not part of your goal', 403);
      }
    }

    // 3️⃣ Mark as completed
    const updated = await challengeService.updateChallenge({
      id: challengeId,
      data: { status: 'in_peer_review' },
    });

    res.status(200).json({
      message: 'Challenge marked as complete',
      challenge: updated,
    });
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
