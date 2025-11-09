// src/routes/challenges.js
const express = require('express');
const router = express.Router();

const challengeController = require('../controllers/challengeController');
const auth = require('../middleware/auth');
const { restrictTo } = require('../middleware/auth');
const { challengeValidation } = require('../middleware/validation');

// --------------------------------------------------
// 🔹 Challenge Routes
// --------------------------------------------------

// 🟢 Get all challenges
// Optional query params: ?difficulty=medium&limit=10
router.get('/', auth, challengeController.getChallenges);

// 🟢 Get single challenge by ID
router.get('/:id', auth, challengeController.getChallengeById);

// 🟡 Create new challenge (Admin only)
router.post(
  '/',
  auth,
  challengeValidation,
  challengeController.createChallenge
); // restrictTo('admin')

// 🔵 Update challenge (Admin only)
router.put(
  '/:id',
  auth,
  challengeValidation,
  challengeController.updateChallenge
); // restrictTo('admin')

// 🔴 Delete challenge (Admin only)
router.delete('/:id', auth, challengeController.deleteChallenge); // restrictTo('admin')

module.exports = router;
