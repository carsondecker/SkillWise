// src/routes/submissions.js
const express = require('express');
const router = express.Router();

const submissionController = require('../controllers/submissionController');
const auth = require('../middleware/auth');
const { single } = require('../middleware/upload');

// --------------------------------------------------
// 🔹 Submission Routes (Protected)
// --------------------------------------------------

// 🟢 Get all submissions for a specific user
// Optional query params: ?limit=10&offset=0
router.get('/user/:userId', auth, submissionController.getUserSubmissions);

// 🟡 Get a specific submission by ID
router.get('/:id', auth, submissionController.getSubmission);

router.get(
  '/challenge/:challengeId',
  auth,
  submissionController.getUserChallengeSubmissions,
);
// 🔵 Submit new work for a challenge
// Expected body: { challengeId, content, files? }
router.post('/', auth, single('file'), submissionController.submitWork);

// 🟣 Update an existing submission (e.g., resubmit or edit)
router.put('/:id', auth, submissionController.updateSubmission);

module.exports = router;
