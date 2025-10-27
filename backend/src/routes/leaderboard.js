// src/routes/leaderboard.js
const express = require('express');
const router = express.Router();

const leaderboardController = require('../controllers/leaderboardController');
const auth = require('../middleware/auth');

// --------------------------------------------------
// 🔹 Leaderboard Routes (Protected)
// --------------------------------------------------

// 🟢 Get global leaderboard
// Optional query params: ?period=weekly|monthly|alltime&limit=10
router.get('/', auth, leaderboardController.getLeaderboard);

// 🟢 Get current user's ranking and total points
router.get('/ranking', auth, leaderboardController.getUserRanking);

// 🟡 Get detailed points breakdown for the logged-in user
router.get('/points', auth, leaderboardController.getPointsBreakdown);

// 🟣 Get user achievements and badges
router.get('/achievements', auth, leaderboardController.getAchievements);

module.exports = router;
