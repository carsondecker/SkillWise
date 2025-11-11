const express = require('express');
const router = express.Router();

const leaderboardController = require('../controllers/leaderboardController');
const auth = require('../middleware/auth');

// --------------------------------------------------
// 🧭 Leaderboard Routes (Protected)
// --------------------------------------------------

// 🏆 Get global / weekly / monthly leaderboard
// Example: GET /leaderboard?timeframe=weekly&limit=10
router.get('/', auth, leaderboardController.getLeaderboard);

// 🥇 Get top global performers (shortcut)
// Example: GET /leaderboard/top?limit=5
router.get('/top', auth, leaderboardController.getTopPerformers);

// 👤 Get specific user's ranking
// Example: GET /leaderboard/user/:userId
router.get('/user/:userId', auth, leaderboardController.getUserRanking);

// 📚 Get category-specific leaderboard
// Example: GET /leaderboard/category?category=programming&limit=10
router.get('/category', auth, leaderboardController.getCategoryLeaderboard);

// 💎 Preview achievement point calculation
// Example: POST /leaderboard/achievement-points
router.post(
  '/achievement-points',
  auth,
  leaderboardController.calculateAchievementPoints,
);

module.exports = router;
