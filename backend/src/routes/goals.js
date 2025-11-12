// src/routes/goals.js
const express = require('express');
const router = express.Router();

const auth = require('../middleware/auth');
const goalController = require('../controllers/goalController');
const challengeController = require('../controllers/challengeController');

// 🔐 Protect all routes
router.use(auth);

router.post('/:id/challenges', challengeController.createChallengeForGoal);
// 🟢 Routes
router.get('/', goalController.getGoals);
router.get('/:id', goalController.getGoalById);
router.post('/', goalController.createGoal);
router.put('/:id', goalController.updateGoal);
router.delete('/:id', goalController.deleteGoal);

module.exports = router;
