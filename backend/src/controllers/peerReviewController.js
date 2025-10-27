// TODO: Implement peer review system controller
const peerReviewService = require('../services/peerReviewService');

const peerReviewController = {
  // TODO: Get reviews to complete
  getReviewAssignments: async (req, res, next) => {
    try {
      const reviewerId = (req.user && req.user.id) || req.query.reviewerId || req.body.reviewerId;
      if (!reviewerId) {
        return res.status(400).json({ success: false, message: 'Missing reviewerId' });
      }

      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 20;
      const challengeId = req.query.challengeId || req.body.challengeId;
      const tags = req.query.tags || req.body.tags;
      const filters = { reviewerId };
      if (challengeId) filters.challengeId = challengeId;
      if (tags) filters.tags = Array.isArray(tags) ? tags : String(tags).split(',').map(t => t.trim()).filter(Boolean);

      const result = await peerReviewService.getReviewAssignments({ page, limit, filters });

      if (Array.isArray(result)) {
        return res.status(200).json({ success: true, data: result, meta: { page, limit } });
      }

      return res.status(200).json({
        success: true,
        data: result.data || result.docs || result,
        meta: result.meta || { page: result.page || page, limit: result.limit || limit, total: result.total }
      });
    } catch (err) {
      return next(err);
    }
  },

  // TODO: Submit peer review
  submitReview: async (req, res, next) => {
    try {
      const reviewerId = req.user && req.user.id;
      if (!reviewerId) {
        return res.status(401).json({ success: false, message: 'Authentication required to submit review' });
      }

      const {
        assignmentId,
        submissionId,
        review, // text/comments
        score,  // numeric rating (optional)
        anonymous, // flag to mark reviewer anonymous
        metadata // optional extra info
      } = req.body || {};

      if (!assignmentId && !submissionId) {
        return res.status(400).json({ success: false, message: 'Missing assignmentId or submissionId' });
      }
      if (!review && typeof score === 'undefined') {
        return res.status(400).json({ success: false, message: 'Missing review content or score' });
      }

      const parsedScore = typeof score !== 'undefined' ? Number(score) : undefined;
      const parsedAnonymous = anonymous === true || anonymous === 'true';

      const submitted = await peerReviewService.submitReview({
        assignmentId,
        submissionId,
        reviewerId,
        review,
        score: parsedScore,
        anonymous: parsedAnonymous,
        metadata
      });

      if (!submitted) {
        return res.status(400).json({ success: false, message: 'Failed to submit review' });
      }

      return res.status(201).json({ success: true, data: submitted });
    } catch (err) {
      return next(err);
    }
  },

  // TODO: Get received reviews
  getReceivedReviews: async (req, res, next) => {
    try {
      const ownerId = req.params.userId || req.query.userId || (req.user && req.user.id) || req.body.userId;
      if (!ownerId) {
        return res.status(400).json({ success: false, message: 'Missing userId' });
      }

      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 20;
      const submissionId = req.query.submissionId || req.body.submissionId;
      const challengeId = req.query.challengeId || req.body.challengeId;

      const options = { page, limit, submissionId, challengeId };

      const result = await peerReviewService.getReceivedReviews(ownerId, options);

      if (Array.isArray(result)) {
        return res.status(200).json({ success: true, data: result, meta: { page, limit } });
      }

      return res.status(200).json({
        success: true,
        data: result.data || result.docs || result,
        meta: result.meta || { page: result.page || page, limit: result.limit || limit, total: result.total }
      });
    } catch (err) {
      return next(err);
    }
  },

  // TODO: Get review history
  getReviewHistory: async (req, res, next) => {
    try {
      // history for a reviewer (default to authenticated) or for a target user
      const reviewerId = (req.user && req.user.id) || req.query.reviewerId || req.body.reviewerId;
      const targetUserId = req.query.userId || req.body.userId; // optional: reviews about a specific user
      if (!reviewerId && !targetUserId) {
        return res.status(400).json({ success: false, message: 'Provide reviewerId (auth) or userId (target) to fetch history' });
      }

      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 20;
      const sort = req.query.sort || '-createdAt';
      const filters = {};
      if (targetUserId) filters.targetUserId = targetUserId;
      if (req.query.challengeId) filters.challengeId = req.query.challengeId;

      const result = await peerReviewService.getReviewHistory(reviewerId, { page, limit, sort, filters });

      if (Array.isArray(result)) {
        return res.status(200).json({ success: true, data: result, meta: { page, limit } });
      }

      return res.status(200).json({
        success: true,
        data: result.data || result.docs || result,
        meta: result.meta || { page: result.page || page, limit: result.limit || limit, total: result.total }
      });
    } catch (err) {
      return next(err);
    }
  }
};

module.exports = peerReviewController;