// src/controllers/goalController.js
const { z } = require('zod');
const goalService = require('../services/goalService');
const { asyncHandler } = require('../utils/helpers');

const createGoalSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().max(1000, 'Description too long').optional(),
  category: z.string().max(100).optional(),
  difficulty_level: z.enum(['easy', 'medium', 'hard']).default('medium'),

  // Dates
  target_date: z
    .string()
    .datetime({ offset: true })
    .or(
      z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
    )
    .optional(),

  // Numeric / boolean fields
  points_reward: z
    .number({ invalid_type_error: 'Points reward must be a number' })
    .int()
    .min(0, 'Points must be ≥ 0')
    .default(0)
    .optional(),

  is_public: z
    .boolean({ invalid_type_error: 'is_public must be true or false' })
    .default(false),

  progress_percentage: z.number().int().min(0).max(100).default(0).optional(),
});

// ✅ Update Goal Schema (partial)
const updateGoalSchema = createGoalSchema.partial().extend({
  is_completed: z.boolean().optional(),
  completion_date: z.string().optional(),
});

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
    const goalId = parseInt(req.params.id, 10);
    const payload = updateGoalSchema.parse(req.body);
    const goal = await goalService.updateGoal({
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
