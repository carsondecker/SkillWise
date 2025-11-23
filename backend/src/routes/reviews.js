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
router.get('/my-submissions', auth, peerReviewController.getMySubmissions);

// 🟡 Submit a new peer review
// Expected body: { submissionId, rating, feedback }
router.post('/submissions/:id/review', auth, peerReviewController.submitReview);

// 🔵 Get reviews queues. Fetched all the submissions needing reviews
// Optional query params: ?limit=10&offset=0
router.get('/queue', auth, peerReviewController.getReviewQueue);

// 🟣 Get review details by id
router.get('/submissions/:id', auth, peerReviewController.getReviewDetails);

module.exports = router;

