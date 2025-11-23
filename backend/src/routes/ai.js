const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const auth = require('../middleware/auth');

// ---------------------------------------------
// 🤖 Generate a challenge for a specific goal
// Frontend calls: POST /ai/generate-challenge/:goalId
// ---------------------------------------------
router.post('/generate-challenge/:goalId', auth, aiController.generateChallengeForGoal);

// ---------------------------------------------
// 📝 AI feedback on submission
// POST /ai/feedback
// ---------------------------------------------
router.post('/feedback', auth, aiController.generateFeedback);

// ---------------------------------------------
// 💡 Get hints for a challenge
// GET /ai/hints/:challengeId
// ---------------------------------------------
router.get('/hints/:challengeId', auth, aiController.getHints);

// ---------------------------------------------
// 🧠 Suggest challenges (AI recommendations)
// GET /ai/suggestions
// ---------------------------------------------
router.get('/suggestions', auth, aiController.suggestChallenges);

// ---------------------------------------------
// 📊 Progress analysis
// GET /ai/analysis
// ---------------------------------------------
router.get('/analysis', auth, aiController.analyzeProgress);

module.exports = router;
