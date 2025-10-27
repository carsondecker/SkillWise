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
});

const updateSchema = createSchema.partial();

const challengeController = {
  getChallenges: asyncHandler(async (req, res) => {
    const { difficulty, category, limit, offset } = req.query;
    const challenges = await challengeService.getChallenges({ difficulty, category, limit, offset });
    res.json({ challenges });
  }),

  getChallengeById: asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id, 10);
    const challenge = await challengeService.getChallengeById(id);
    res.json({ challenge });
  }),

  createChallenge: asyncHandler(async (req, res) => {
    const data = createSchema.parse(req.body);
    const challenge = await challengeService.createChallenge(data);
    res.status(201).json({ message: 'Challenge created successfully', challenge });
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
