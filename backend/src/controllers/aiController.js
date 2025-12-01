// AI integration controller for feedback and challenge generation
const aiService = require('../services/aiService');
const Goal = require('../models/Goal');
const challengeService = require('../services/challengeService');
const { AppError } = require('../middleware/errorHandler');
const { schemas } = require('../middleware/validation');
const { z } = require('zod');

const aiController = {
  // Generate AI feedback for submission (manual trigger)
  generateFeedback: async (req, res, next) => {
    try {
      const submissionId = req.body.submission_id || req.body.submissionId || req.params.submissionId;
      if (!submissionId) {
        throw new AppError('submission_id is required in body', 400);
      }

      // Lazy require to avoid circular deps
      const submissionService = require('../services/submissionService');

      // Fetch submission to validate ownership / existence
      const submission = await submissionService.getSubmissionById(submissionId);
      if (!submission) throw new AppError('Submission not found', 404);

      // Permission check: allow owner or admins (role on req.user)
      const requester = req.user || {};
      const isOwner = requester.id && String(requester.id) === String(submission.user_id);
      const isAdmin = requester.role && requester.role === 'admin';
      if (!isOwner && !isAdmin) {
        throw new AppError('You do not have permission to request feedback for this submission', 403);
      }

      // Delegate to submissionService grading flow (which will call aiService.evaluateSubmission)
      const result = await submissionService.gradeSubmission(submissionId);

      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  // Get AI hints for challenge (not implemented)
  getHints: async (req, res, next) => {
    res.status(501).json({ message: 'Not implemented' });
  },

  // POST /api/ai/generate-challenge
  generateChallenge: async (req, res, next) => {
    try {
      const logger = req.app && req.app.get && req.app.get('logger');
      // Validate incoming payload: require goal_id, optional auto_activate and difficulty
      const payloadSchema = z.object({
        goal_id: z.union([z.string(), z.number()]),
        auto_activate: z.boolean().optional(),
        difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
      });

      let payload;
      try {
        payload = payloadSchema.parse(req.body);
      } catch (err) {
        throw new AppError(`Invalid request: ${err.errors?.[0]?.message || err.message}`, 400);
      }

      const goal_id = payload.goal_id;
      const auto_activate = payload.auto_activate ?? false;
      const difficulty = payload.difficulty;

      const goal = await Goal.findById(goal_id);
      if (!goal) throw new AppError('Goal not found', 404);

      // Call aiService to build a challenge object
      logger && logger.debug && logger.debug('AI generateChallenge: calling aiService', { goal_id: goal_id, goal_title: goal.title, user: req.user && req.user.id, difficulty });
      const aiChallenge = await aiService.generateChallenge(goal, { difficulty });
      logger && logger.info && logger.info('AI generateChallenge: aiService returned parsed object', { parsed: aiChallenge });

      // Normalize AI output to match DB expectations (arrays, numbers, booleans)
      const normalizeArray = (v) => {
        if (v === null || v === undefined) return [];
        if (Array.isArray(v)) return v.map((x) => (x === null || x === undefined ? '' : String(x)));
        if (typeof v === 'string') return v.split(',').map((s) => s.trim()).filter(Boolean);
        return [String(v)];
      };

      const normalizeBool = (v) => {
        if (typeof v === 'boolean') return v;
        if (v === null || v === undefined) return false;
        const s = String(v).toLowerCase();
        return s === 'true' || s === '1' || s === 'yes';
      };

      const normalizeInt = (v, fallback) => {
        const n = Number(v);
        return Number.isInteger(n) ? n : fallback;
      };

      const normalized = {
        title: aiChallenge.title ? String(aiChallenge.title).slice(0, 255) : 'AI Generated Challenge',
        description: aiChallenge.description ? String(aiChallenge.description) : '',
        instructions: aiChallenge.instructions ? String(aiChallenge.instructions) : (aiChallenge.description ? String(aiChallenge.description) : ''),
        category: aiChallenge.category ? String(aiChallenge.category).slice(0, 100) : (goal.category || 'general'),
        difficulty_level: aiChallenge.difficulty_level || difficulty || 'medium',
        points_reward: normalizeInt(aiChallenge.points_reward, 10),
        estimated_time_minutes: normalizeInt(aiChallenge.estimated_time_minutes, 15),
        prerequisites: normalizeArray(aiChallenge.prerequisites),
        max_attempts: normalizeInt(aiChallenge.max_attempts, 3),
        requires_peer_review: normalizeBool(aiChallenge.requires_peer_review),
        tags: normalizeArray(aiChallenge.tags),
        learning_objectives: normalizeArray(aiChallenge.learning_objectives),
        ai_generated: true,
      };

      logger && logger.debug && logger.debug('AI generateChallenge: normalized payload', { normalized });

      // Attach required persistence fields
      const toCreate = {
        ...normalized,
        created_by: req.user && req.user.id ? req.user.id : null,
        goal_id: goal.id || goal_id,
        // DB check constraint allows: pending, in_progress, completed, failed
        status: auto_activate ? 'in_progress' : 'pending',
      };

      // Validate against existing challenge schema to ensure DB-compatible shape
      try {
        const validation = schemas.challengeSchema.safeParse({ body: toCreate });
        if (!validation.success) {
          const errors = validation.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`);
          logger && logger.warn && logger.warn('AI generateChallenge: validation failed', { errors });
          throw new AppError(`AI-generated challenge failed validation: ${errors.join('; ')}`, 400, 'AI_VALIDATION_FAILED');
        }
        // use the parsed (and default-applied) body for persistence
        // the parsed data is under validation.data.body
        Object.assign(toCreate, validation.data.body);
        // Ensure we enforce the DB-allowed status (prevent client/AI from overriding)
        toCreate.status = auto_activate ? 'in_progress' : 'pending';
      } catch (err) {
        // Re-throw AppError or pass other errors to error handler
        if (err instanceof AppError) throw err;
        logger && logger.error && logger.error('AI generateChallenge: validation exception', { message: err.message, stack: err.stack });
        throw err;
      }

      let created;
      try {
        created = await challengeService.createChallenge(toCreate);
      } catch (err) {
        logger && logger.error && logger.error('AI generateChallenge: createChallenge failed', { message: err.message, code: err.code, detail: err.detail, stack: err.stack });
        throw err;
      }

      res.status(201).json({ challenge: created });
    } catch (error) {
      next(error);
    }
  },

  // Generate challenge suggestions (not implemented)
  suggestChallenges: async (req, res, next) => {
    res.status(501).json({ message: 'Not implemented' });
  },

  // Analyze learning progress (not implemented)
  analyzeProgress: async (req, res, next) => {
    res.status(501).json({ message: 'Not implemented' });
  },
};

module.exports = aiController;
