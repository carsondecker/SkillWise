// src/routes/reviews.js
const express = require('express');
const router = express.Router();

const peerReviewController = require('../controllers/peerReviewController');
const auth = require('../middleware/auth');
const { peerReviewValidation } = require('../middleware/validation');

// --------------------------------------------------
// 🔹 Peer Review Routes (Protected)
// --------------------------------------------------

// 🟢 1. All submissions YOU need to review
router.get('/queue', auth, peerReviewController.getReviewQueue);

// 🟣 2. All submissions YOU have made (to show in My Submissions)
router.get('/my-submissions', auth, peerReviewController.getMySubmissions);

// 🟡 3. USED WHEN STARTING A REVIEW
// Return: submission + challenge + author basic info
router.get('/submissions/:id', auth, peerReviewController.getSubmissionById);

// 🔵 4. SUBMIT PEER REVIEW
router.post(
  '/submissions/:id/review',
  auth,
  peerReviewValidation,
  peerReviewController.submitReview,
);

// 🟣 5. VIEW MODE — full details for owner viewing peer review page
// Return: submission + challenge + goal
router.get(
  '/submissions/:id/details',
  auth,
  peerReviewController.getReviewDetails,
);

// 🟠 6. GET ALL REVIEWS RECEIVED FOR A SUBMISSION
router.get(
  '/submissions/:id/reviews',
  auth,
  peerReviewController.getReviewsForSubmission,
);

module.exports = router;
