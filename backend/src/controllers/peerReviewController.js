// src/controllers/peerReviewController.js
const { z } = require('zod');
const peerReviewService = require('../services/peerReviewService');
const { asyncHandler } = require('../utils/helpers');

// ✅ Validation Schemas
const submitReviewSchema = z.object({
  submissionId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  feedback: z.string().max(2000).optional(),
});

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

// ✅ Controller Implementation
const peerReviewController = {
  // -------------------------
  // Get reviews assigned to the current user
  // -------------------------
  getReviewAssignments: asyncHandler(async (req, res) => {
    const userId = req.user?.id;
    const { limit, offset } = paginationSchema.parse(req.query);

    const assignments = await peerReviewService.getAssignments({
      reviewerId: userId,
      limit,
      offset,
    });

    res.json({ assignments });
  }),

  // -------------------------
  // Submit a peer review for a submission
  // -------------------------
  submitReview: asyncHandler(async (req, res) => {
    const reviewerId = req.user?.id;
    const payload = submitReviewSchema.parse(req.body);

    const review = await peerReviewService.submitReview({
      reviewerId,
      ...payload,
    });

    res.status(201).json({
      message: 'Review submitted successfully',
      review,
    });
  }),

  // -------------------------
  // Get reviews the current user has received on their submissions
  // -------------------------
  getReceivedReviews: asyncHandler(async (req, res) => {
    const userId = req.user?.id;
    const { limit, offset } = paginationSchema.parse(req.query);

    const received = await peerReviewService.getReceivedReviews({
      userId,
      limit,
      offset,
    });

    res.json({ received });
  }),

  // -------------------------
  // Get review history (reviews the user has submitted)
  // -------------------------
  getReviewHistory: asyncHandler(async (req, res) => {
    const reviewerId = req.user?.id;
    const { limit, offset } = paginationSchema.parse(req.query);

    const history = await peerReviewService.getReviewHistory({
      reviewerId,
      limit,
      offset,
    });

    res.json({ history });
  }),
};

module.exports = peerReviewController;
