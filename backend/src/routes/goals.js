// src/routes/goals.js
const express = require('express');
const router = express.Router();

const auth = require('../middleware/auth');
const goalController = require('../controllers/goalController');

// 🔐 Protect all routes
router.use(auth);

// 🟢 Routes
router.get('/', goalController.getGoals);
router.get('/:id', goalController.getGoalById);
router.post('/', goalController.createGoal);
router.put('/:id', goalController.updateGoal);
router.delete('/:id', goalController.deleteGoal);

module.exports = router;
