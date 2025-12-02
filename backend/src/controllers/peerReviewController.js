// src/controllers/peerReviewController.js
const { z } = require('zod');
const peerReviewService = require('../services/peerReviewService');
const { peerReviewSchema } = require('../middleware/validation');
const { asyncHandler } = require('../utils/helpers');

// ----------------------------
// Validation Schemas
// ----------------------------
const paginationSchema = z.object({
  limit: z
    .string()
    .regex(/^[0-9]+$/)
    .transform(Number)
    .default('20'),
  offset: z
    .string()
    .regex(/^[0-9]+$/)
    .transform(Number)
    .default('0'),
});


// ----------------------------
// Controller
// ----------------------------
const peerReviewController = {
  // ---------------------------------------------------
  // 🟢 1. Get all submissions that belong to the user
  // ---------------------------------------------------
  getMySubmissions: asyncHandler(async (req, res) => {
    const userId = req.user?.id;
    const { limit, offset } = paginationSchema.parse(req.query);

    const submissions = await peerReviewService.getMySubmissions({
      userId,
      limit,
      offset,
    });

    res.json({ submissions });
  }),
  getSubmissionById: asyncHandler(async (req, res) => {
    const reviewerId = req.user?.id;
    const submissionId = req.params.id;

    const submission = await peerReviewService.getSubmissionForReviewById({
      reviewerId,
      submissionId,
    });

    res.json({ submission });
  }),

  // ---------------------------------------------------
  // 🟡 2. Submit a peer review
  // ---------------------------------------------------
  submitReview: asyncHandler(async (req, res) => {
    const reviewerId = req.user?.id;
    const submissionId = req.params.id;

    const payload = req.validated.body;

    const review = await peerReviewService.submitReview({
      reviewerId,
      submissionId,
      ...payload,
    });

    res.status(201).json({
      message: 'Review submitted successfully',
      review,
    });
  }),

  // ---------------------------------------------------
  // 🔵 3. Get queue of submissions awaiting review
  // ---------------------------------------------------
  getReviewQueue: asyncHandler(async (req, res) => {
    const reviewerId = req.user?.id;
    const { limit, offset } = paginationSchema.parse(req.query);

    const queue = await peerReviewService.getReviewQueue({
      reviewerId,
      limit,
      offset,
    });

    res.json({ queue });
  }),

  // ---------------------------------------------------
  // 🟣 4. Get details for one submission needing review
  // ---------------------------------------------------
  getReviewDetails: asyncHandler(async (req, res) => {
    const reviewerId = req.user?.id;
    const submissionId = req.params.id;

    const details = await peerReviewService.getReviewDetails({
      reviewerId,
      submissionId,
    });

    res.json({ details });
  }),
  // ---------------------------------------------------
  // 🟠 5. Get all peer reviews for a specific submission
  // ---------------------------------------------------
  getReviewsForSubmission: asyncHandler(async (req, res) => {
    const userId = req.user?.id;
    const submissionId = req.params.id;

    const reviews = await peerReviewService.getReviewsForSubmission({
      userId,
      submissionId,
    });

    res.json({ reviews });
  }),
};

module.exports = peerReviewController;
