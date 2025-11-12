// src/controllers/progressController.js
const { z } = require('zod');
const progressService = require('../services/progressService');
const { asyncHandler } = require('../utils/helpers');

// ✅ Validation Schemas
const updateProgressSchema = z.object({
  goalId: z.string().uuid(),
  challengeId: z.string().uuid().optional(),
  percent: z.number().min(0).max(100),
  note: z.string().max(1000).optional(),
});

const analyticsQuerySchema = z.object({
  timeframe: z
    .enum(['daily', 'weekly', 'monthly', 'alltime'])
    .default('weekly'),
});

const paginationSchema = z.object({
  limit: z
    .string()
    .regex(/^[0-9]+$/)
    .transform(Number)
    .default('20'),
  offset: z
    .string()
    .regex(/^[0-9]+$/)
    .transform(Number)
    .default('0'),
});

// ✅ Controller Implementation
const progressController = {
  // -------------------------
  // Get overall user progress overview
  // -------------------------
  getProgress: asyncHandler(async (req, res) => {
    const userId = req.user?.id;

    const progressOverview = await progressService.getProgressOverview({
      userId,
    });
    res.json({ progress: progressOverview });
  }),

  // -------------------------
  // Update progress event for a goal/challenge
  // -------------------------
  updateProgress: asyncHandler(async (req, res) => {
    const userId = req.user?.id;
    const payload = updateProgressSchema.parse(req.body);

    const updated = await progressService.updateProgress({
      userId,
      ...payload,
    });

    res.status(201).json({
      message: 'Progress updated successfully',
      progress: updated,
    });
  }),

  // -------------------------
  // Get progress analytics (charts, stats, streaks)
  // -------------------------
  getAnalytics: asyncHandler(async (req, res) => {
    const userId = req.user?.id;
    const { timeframe } = analyticsQuerySchema.parse(req.query);

    const analytics = await progressService.getAnalytics({
      userId,
      timeframe,
    });

    res.json({ analytics });
  }),

  // -------------------------
  // Get completed milestones or key achievements
  // -------------------------
  getMilestones: asyncHandler(async (req, res) => {
    const userId = req.user?.id;
    const { limit, offset } = paginationSchema.parse(req.query);

    const milestones = await progressService.getMilestones({
      userId,
      limit,
      offset,
    });

    res.json({ milestones });
  }),
  getProgressLatest: asyncHandler(async (req, res) => {
    const userId = req.user?.id;

    const latestProgress = await progressService.getProgressLatest({
      userId,
    });

    if (!latestProgress) {
      return res.status(404).json({ message: 'No recent progress found' });
    }

    res.json({ latest: latestProgress });
  }),
};

module.exports = progressController;
