const { z } = require('zod');
const submissionService = require('../services/submissionService');
const { asyncHandler } = require('../utils/helpers');

// Validation Schema (only for text fields — files handled by multer)
const submitWorkSchema = z.object({
  challengeId: z.string().or(z.number()),
  submission_text: z.string().min(1, 'Submission text is required'),
});
const updateSubmissionSchema = z.object({
  content: z.string().min(1).optional(),
  files: z.array(z.string().url()).optional(),
  status: z.enum(['submitted', 'resubmitted', 'graded']).optional(),
});
const idNum = z.coerce.number().int().positive();

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

const submissionController = {
  // --------------------------------------------------
  // 🟢 Create new submission (text + optional file)
  // --------------------------------------------------
  submitWork: asyncHandler(async (req, res) => {
    const userId = req.user?.id;

    // Parse and validate text fields manually (multer doesn't JSON-parse)
    const challengeId = Number(req.body.challengeId || req.body.challenge_id);
    const submission_text = req.body.submission_text?.trim() || '';

    if (!challengeId || !submission_text) {
      return res.status(400).json({
        status: 'fail',
        message: 'Missing required fields: challengeId or submission_text',
      });
    }

    // Optional Zod re-validation (safer for text-only)
    try {
      submitWorkSchema.parse({ challengeId, submission_text });
    } catch (err) {
      return res.status(400).json({
        status: 'fail',
        message: err.errors?.[0]?.message || 'Invalid submission data',
      });
    }

    // Extract uploaded file info if present
    let fileMeta = null;
    if (req.file) {
      fileMeta = {
        original_name: req.file.originalname,
        stored_name: req.file.filename,
        mimetype: req.file.mimetype,
        size: req.file.size,
        url: `/uploads/submissions/${req.file.filename}`,
      };
    }

    // Store in DB
    const submission = await submissionService.createSubmission({
      userId,
      challengeId,
      submission_text,
      submission_files: fileMeta ? JSON.stringify(fileMeta) : null,
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

    const submission = await submissionService.getSubmissionById({
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
  getUserChallengeSubmissions: asyncHandler(async (req, res) => {
    const userId = req.user?.id;
    const challengeId = Number(req.params.challengeId);

    if (!userId || !challengeId) {
      return res.status(400).json({ message: 'Missing userId or challengeId' });
    }

    const submissions = await submissionService.getChallengeSubmissions(
      userId,
      challengeId
    );

    res.json({ submissions });
  }),

  // -------------------------
  // Update an existing submission
  // -------------------------
  updateSubmission: asyncHandler(async (req, res) => {
    const submissionId = z.string().uuid().parse(req.params.id);
    const userId = req.user?.id;
    const payload = updateSubmissionSchema.parse(req.body);

    const updated = await submissionService.updateSubmissionStatus({
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
};

module.exports = submissionController;
