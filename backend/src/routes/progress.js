// src/routes/progress.js
const express = require('express');
const router = express.Router();

const progressController = require('../controllers/progressController');
const auth = require('../middleware/auth');

// --------------------------------------------------
// 🔹 Progress & Analytics Routes (Protected)
// --------------------------------------------------

// 🟢 Get overall progress for the logged-in user
// Returns overview stats across all goals/challenges
router.get('/', auth, progressController.getProgress);
router.get('/latest', auth, progressController.getProgressLatest);

// 🟡 Record or update a progress event (e.g., completing a challenge)
// Expected body: { goalId, challengeId?, percent, note? }
router.post('/event', auth, progressController.updateProgress);

// 🔵 Get analytics data for dashboard charts
// Optional query params: ?timeframe=weekly|monthly|alltime
router.get('/analytics', auth, progressController.getAnalytics);

// 🟣 Get user milestones or achievements timeline
// Optional query params: ?limit=10&offset=0
router.get('/milestones', auth, progressController.getMilestones);

module.exports = router;
