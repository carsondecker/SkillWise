// src/routes/challenges.js
const express = require('express');
const router = express.Router();

const challengeController = require('../controllers/challengeController');
const auth = require('../middleware/auth');
const { restrictTo } = require('../middleware/auth');
const {
  challengeValidation,
  challengeUpdateValidation,
} = require('../middleware/validation');

// --------------------------------------------------
// 🔹 Challenge Routes
// --------------------------------------------------

// 🟢 Get all challenges
// Optional query params: ?difficulty=medium&limit=10
router.get('/', auth, challengeController.getChallenges);

// 🟢 Get single challenge by ID
router.get('/:id', auth, challengeController.getChallengeById);

// 🔵 Get latest submissions for a challenge
router.get(
  '/:id/latest-submissions',
  auth,
  challengeController.getLatestSubmissionsForChallenge,
);

// 🟡 Create new challenge (Admin only)
router.post(
  '/',
  auth,
  restrictTo('admin'),
  challengeValidation,
  challengeController.createChallenge,
);

// 🔵 Update challenge (Admin only)
router.put(
  '/:id',
  auth,
  restrictTo('admin'),
  challengeUpdateValidation,
  challengeController.updateChallenge,
);

// 🔴 Delete challenge (Admin or owner)
router.delete('/:id', auth, challengeController.deleteChallenge);


// 🟢 Mark a challenge as complete (User)
router.patch('/:id/complete', auth, challengeController.markChallengeComplete);
router.patch('/:id/submitForPeerReview', auth, challengeController.submitForPeerReview);

module.exports = router;
