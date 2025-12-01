// src/routes/reviews.js
const express = require('express');
const router = express.Router();

const peerReviewController = require('../controllers/peerReviewController');
const auth = require('../middleware/auth');

// --------------------------------------------------
// 🔹 Peer Review Routes (Protected)
// --------------------------------------------------

// 🟢 Get review assignments for the logged-in user
// Optional query params: ?limit=10&offset=0
router.get('/assignments', auth, peerReviewController.getReviewAssignments);

// 🟡 Submit a new peer review
// Expected body: { submissionId, rating, feedback }
router.post('/', auth, peerReviewController.submitReview);

// 🔵 Get reviews received on user's own submissions
// Optional query params: ?limit=10&offset=0
router.get('/received', auth, peerReviewController.getReceivedReviews);

// Get reviews for a specific submission
router.get('/submission/:id', auth, peerReviewController.getReviewsForSubmission);

// 🟣 Get review history (reviews written by the user)
// Optional query params: ?limit=10&offset=0
router.get('/history', auth, peerReviewController.getReviewHistory);

module.exports = router;

