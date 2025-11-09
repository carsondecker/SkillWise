const { z } = require('zod');
const challengeService = require('../services/challengeService');
const { asyncHandler } = require('../utils/helpers');

const createSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  instructions: z.string().min(1),
  category: z.string().min(1),
  difficulty_level: z.enum(['easy', 'medium', 'hard']).default('medium'),
  points_reward: z.number().int().optional(),
  relatedGoalId: z.number().int().optional(),
});

const updateSchema = createSchema.partial();

const challengeController = {
  getChallenges: asyncHandler(async (req, res) => {
    const { difficulty, category, limit, offset } = req.query;
    const userId = req.user?.id;
    const challenges = await challengeService.getChallenges({
      difficulty,
      category,
      limit,
      offset,
      userId,
    });
    res.json({ challenges });
  }),

  getChallengeById: asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id, 10);
    const userId = req.user?.id;
    const challenge = await challengeService.getChallengeById(id, userId);
    res.json({ challenge });
  }),

  createChallenge: asyncHandler(async (req, res) => {
    // Ensure user is authenticated
    if (!req.user || !req.user.id) {
      return res
        .status(401)
        .json({ message: 'Authentication required to create challenges' });
    }

    // Parse and validate request body
    const data = createSchema.parse(req.body);
    // Map camelCase API field to snake_case DB field expected by model
    if (data.relatedGoalId) {
      data.related_goal_id = data.relatedGoalId;
      delete data.relatedGoalId;
    }
    // Attach creator id so backend can set ownership (use created_by column)
    data.created_by = req.user.id;
    const challenge = await challengeService.createChallenge(data);
    res
      .status(201)
      .json({ message: 'Challenge created successfully', challenge });
  }),

  updateChallenge: asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id, 10);
    const data = updateSchema.parse(req.body);
    const updated = await challengeService.updateChallenge({ id, data });
    res.json({ message: 'Challenge updated successfully', challenge: updated });
  }),

  deleteChallenge: asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id, 10);
    await challengeService.deleteChallenge({ id });
    res.status(204).end();
  }),
};

module.exports = challengeController;
