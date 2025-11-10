// src/controllers/submissionController.js
const { z } = require('zod');
const submissionService = require('../services/submissionService');
const { asyncHandler } = require('../utils/helpers');

// ✅ Validation Schemas
// Accept either a numeric id (string or number) or a uuid for challengeId
const idOrUuid = z.preprocess((val) => {
  // If it's a numeric string, coerce to number
  if (typeof val === 'string' && /^[0-9]+$/.test(val)) return Number(val);
  return val;
}, z.union([z.number().int().positive(), z.string().uuid()]));

const submitWorkSchema = z.object({
  challengeId: idOrUuid,
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
    // submissions use integer IDs in the DB; accept numeric ids or uuids
    const submissionIdRaw = z
      .preprocess((val) => {
        if (typeof val === 'string' && /^[0-9]+$/.test(val)) return Number(val);
        return val;
      }, z.union([z.number().int().positive(), z.string().uuid()]))
      .parse(req.params.id);
    const submissionId = submissionIdRaw;
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
    const submissionIdRaw = z
      .preprocess((val) => {
        if (typeof val === 'string' && /^[0-9]+$/.test(val)) return Number(val);
        return val;
      }, z.union([z.number().int().positive(), z.string().uuid()]))
      .parse(req.params.id);
    const submissionId = submissionIdRaw;
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
    // Accept numeric challenge IDs (most DBs use serial ints) or uuids
    const challengeIdRaw = z
      .preprocess((val) => {
        if (typeof val === 'string' && /^[0-9]+$/.test(val)) return Number(val);
        return val;
      }, z.union([z.number().int().positive(), z.string().uuid()]))
      .parse(req.params.challengeId);
    const challengeId = challengeIdRaw;
    const userId = req.user?.id;

    const submission = await submissionService.completeChallenge({
      userId,
      challengeId,
    });

    res.status(201).json({ message: 'Challenge marked complete', submission });
  }),
};

module.exports = submissionController;
