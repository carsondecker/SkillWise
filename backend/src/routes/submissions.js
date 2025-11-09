// src/routes/submissions.js
const express = require('express');
const router = express.Router();

const submissionController = require('../controllers/submissionController');
const auth = require('../middleware/auth');

// --------------------------------------------------
// 🔹 Submission Routes (Protected)
// --------------------------------------------------

// 🟢 Get all submissions for a specific user
// Optional query params: ?limit=10&offset=0
router.get('/user/:userId', auth, submissionController.getUserSubmissions);

// 🟡 Get a specific submission by ID
router.get('/:id', auth, submissionController.getSubmission);

// 🔵 Submit new work for a challenge
// Expected body: { challengeId, content, files? }
router.post('/', auth, submissionController.submitWork);

// 🟣 Update an existing submission (e.g., resubmit or edit)
router.put('/:id', auth, submissionController.updateSubmission);

// 🟩 Mark a challenge as complete (no submission body needed)
// POST /submissions/challenge/:challengeId/complete
router.post(
  '/challenge/:challengeId/complete',
  auth,
  submissionController.completeChallenge
);

module.exports = router;
