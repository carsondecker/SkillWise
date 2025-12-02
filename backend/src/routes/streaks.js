// src/routes/streaks.js
const express = require('express');
const router = express.Router();

const streakController = require('../controllers/streakController');
const auth = require('../middleware/auth');

// --------------------------------------------------
// ⭐ Streak Routes (Protected)
// --------------------------------------------------

// 🔥 1. Log today's streak
router.post('/log', auth, streakController.logStreak);

// 🌟 2. Get the user’s current streak info
router.get('/', auth, streakController.getStreak);

module.exports = router;
