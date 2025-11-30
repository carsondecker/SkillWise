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

    console.error('peerReviewController.getReviewAssignments called for', { userId, limit, offset });

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

    const result = await peerReviewService.submitReview({
      reviewerId,
      ...payload,
    });

    // Include counts if provided by service
    const responsePayload = {
      message: 'Review submitted successfully',
      review: result.review || result,
    };

    if (typeof result.peer_reviews_count !== 'undefined') responsePayload.peer_reviews_count = result.peer_reviews_count;
    if (typeof result.ai_feedback_count !== 'undefined') responsePayload.ai_feedback_count = result.ai_feedback_count;

    res.status(201).json(responsePayload);
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
