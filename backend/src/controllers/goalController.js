// src/controllers/goalController.js
const { z } = require('zod');
const goalService = require('../services/goalService');
const { asyncHandler } = require('../utils/helpers');

// 🧾 Validation Schemas
const createGoalSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().max(1000).optional(),
  category: z.string().optional(),
  difficulty_level: z.enum(['easy', 'medium', 'hard']).optional(),
  target_date: z.string().optional(), // ✅ use target_date
});

// ✅ Make all fields optional for updates
const updateGoalSchema = createGoalSchema
  .extend({
    progress_percentage: z.number().int().min(0).max(100).optional(),
    is_completed: z.boolean().optional(),
  })
  .partial();

// 🎯 Controller
const goalController = {
  // Get all goals
  getGoals: asyncHandler(async (req, res) => {
    const userId = req.user?.id;
    const { limit = 20, offset = 0 } = req.query;
    const goals = await goalService.getGoals({ userId, limit, offset });
    res.json({ goals });
  }),

  // Get single goal
  getGoalById: asyncHandler(async (req, res) => {
    const userId = req.user?.id;
    const goalId = parseInt(req.params.id, 10);
    const goal = await goalService.getGoalById({ userId, goalId });
    if (!goal) return res.status(404).json({ message: 'Goal not found' });
    res.json({ goal });
  }),

  // Create goal
  createGoal: asyncHandler(async (req, res) => {
    const userId = req.user?.id;
    const payload = createGoalSchema.parse(req.body);
    const goal = await goalService.createGoal({ userId, ...payload });
    res.status(201).json({ message: 'Goal created successfully', goal });
  }),

  // Update goal
  updateGoal: asyncHandler(async (req, res) => {
    const userId = req.user?.id;
    const goalId = parseInt(req.params.id, 10);
    const payload = updateGoalSchema.parse(req.body);
    const goal = await goalService.updateGoal({
      userId,
      goalId,
      data: payload,
    });
    if (!goal) return res.status(404).json({ message: 'Goal not found' });
    res.json({ message: 'Goal updated successfully', goal });
  }),

  // Delete goal
  deleteGoal: asyncHandler(async (req, res) => {
    const userId = req.user?.id;
    const goalId = parseInt(req.params.id, 10);
    const deleted = await goalService.deleteGoal({ userId, goalId });
    if (!deleted) return res.status(404).json({ message: 'Goal not found' });
    res.status(204).end();
  }),
};

module.exports = goalController;
