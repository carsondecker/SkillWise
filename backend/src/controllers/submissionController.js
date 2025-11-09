// src/controllers/submissionController.js
const { z } = require('zod');
const submissionService = require('../services/submissionService');
const { asyncHandler } = require('../utils/helpers');

// ✅ Validation Schemas
const submitWorkSchema = z.object({
  challengeId: z.string().uuid(),
  content: z.string().min(1, 'Submission content is required'),
  files: z.array(z.string().url()).optional(), // e.g. uploaded file URLs
});

const updateSubmissionSchema = z.object({
  content: z.string().min(1).optional(),
  files: z.array(z.string().url()).optional(),
  status: z.enum(['submitted', 'resubmitted', 'graded']).optional(),
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
const submissionController = {
  // -------------------------
  // Submit work for a challenge
  // -------------------------
  submitWork: asyncHandler(async (req, res) => {
    const userId = req.user?.id;
    const payload = submitWorkSchema.parse(req.body);

    const submission = await submissionService.createSubmission({
      userId,
      ...payload,
    });

    res.status(201).json({
      message: 'Submission created successfully',
      submission,
    });
  }),

  // -------------------------
  // Get a single submission by ID
  // -------------------------
  getSubmission: asyncHandler(async (req, res) => {
    const submissionId = z.string().uuid().parse(req.params.id);
    const userId = req.user?.id;

    const submission = await submissionService.getSubmission({
      userId,
      submissionId,
    });

    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    res.json({ submission });
  }),

  // -------------------------
  // Get all submissions by current user (with pagination)
  // -------------------------
  getUserSubmissions: asyncHandler(async (req, res) => {
    const userId = req.user?.id;
    const { limit, offset } = paginationSchema.parse(req.query);

    const submissions = await submissionService.getUserSubmissions({
      userId,
      limit,
      offset,
    });

    res.json({ submissions });
  }),

  // -------------------------
  // Update an existing submission
  // -------------------------
  updateSubmission: asyncHandler(async (req, res) => {
    const submissionId = z.string().uuid().parse(req.params.id);
    const userId = req.user?.id;
    const payload = updateSubmissionSchema.parse(req.body);

    const updated = await submissionService.updateSubmission({
      userId,
      submissionId,
      data: payload,
    });

    if (!updated) {
      return res
        .status(404)
        .json({ message: 'Submission not found or unauthorized' });
    }

    res.json({
      message: 'Submission updated successfully',
      submission: updated,
    });
  }),

  // -------------------------
  // Mark a challenge complete (no submission content)
  // -------------------------
  completeChallenge: asyncHandler(async (req, res) => {
    const challengeId = z.string().uuid().parse(req.params.challengeId);
    const userId = req.user?.id;

    const submission = await submissionService.completeChallenge({
      userId,
      challengeId,
    });

    res.status(201).json({ message: 'Challenge marked complete', submission });
  }),
};

module.exports = submissionController;
