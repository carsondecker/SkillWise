// TODO: Implement AI routes
const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const auth = require('../middleware/auth');

// TODO: Add POST /feedback route for generating AI feedback
router.post('/feedback', auth, aiController.generateFeedback);

// Generate a new challenge from AI for a given goal
router.post('/generate-challenge', auth, aiController.generateChallenge);

// TODO: Add GET /hints/:challengeId route for getting hints
router.get('/hints/:challengeId', auth, aiController.getHints);

// TODO: Add GET /suggestions route for challenge suggestions
router.get('/suggestions', auth, aiController.suggestChallenges);

// TODO: Add GET /analysis route for progress analysis
router.get('/analysis', auth, aiController.analyzeProgress);

module.exports = router;
