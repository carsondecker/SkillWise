// src/controllers/streakController.js
const { asyncHandler } = require('../utils/helpers');
const streakService = require('../services/streakService');

const streakController = {
  // ---------------------------------------------------
  // 🔥 1. Log today's streak
  // ---------------------------------------------------
  logStreak: asyncHandler(async (req, res) => {
    const userId = req.user?.id;

    const result = await streakService.logStreak({ userId });

    res.status(200).json({
      message: result.message,
      data: result.data,
    });
  }),

  // ---------------------------------------------------
  // 🌟 2. Get current streak info
  // ---------------------------------------------------
  getStreak: asyncHandler(async (req, res) => {
    const userId = req.user?.id;

    const streak = await streakService.getStreak({ userId });

    res.status(200).json({ streak });
  }),
};

module.exports = streakController;
