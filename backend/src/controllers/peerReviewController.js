// src/controllers/peerReviewController.js
const { z } = require('zod');
const peerReviewService = require('../services/peerReviewService');
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

const submitReviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  feedback: z.string().max(2000).optional(),
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

  // ---------------------------------------------------
  // 🟡 2. Submit a peer review
  // ---------------------------------------------------
  submitReview: asyncHandler(async (req, res) => {
    const reviewerId = req.user?.id;
    const submissionId = req.params.id;

    const payload = submitReviewSchema.parse(req.body);

    const review = await peerReviewService.submitReview({
      reviewerId,
      submissionId,
      rating: payload.rating,
      feedback: payload.feedback,
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
};

module.exports = peerReviewController;
