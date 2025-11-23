// src/middleware/validation.js
const { z } = require('zod');
const { AppError } = require('./errorHandler');

/**
 * 🔹 Common Zod schemas for reusable validation
 */

// ✅ Auth Schemas
const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(1, 'Password is required'),
  }),
});

const registerSchema = z.object({
  body: z
    .object({
      email: z.string().email('Invalid email format'),
      password: z
        .string()
        .min(8, 'Password must be at least 8 characters')
        .regex(
          /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
          'Password must contain at least one lowercase letter, one uppercase letter, and one number',
        ),
      firstName: z
        .string()
        .min(1, 'First name is required')
        .max(50, 'First name too long'),
      lastName: z
        .string()
        .min(1, 'Last name is required')
        .max(50, 'Last name too long'),
      confirmPassword: z.string(),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: 'Passwords do not match',
      path: ['confirmPassword'],
    }),
});

// ✅ Goal Schema
const goalSchema = z.object({
  body: z.object({
    title: z
      .string()
      .min(1, 'Goal title is required')
      .max(255, 'Title too long'),
    description: z.string().max(1000, 'Description too long').optional(),
    category: z.string().max(100, 'Category too long').optional(),
    difficulty: z.enum(['easy', 'medium', 'hard']).default('medium'),
    targetCompletionDate: z.string().datetime().optional(),
  }),
});

// ✅ Challenge Schema
const challengeSchema = z.object({
  body: z.object({
    title: z
      .string()
      .min(1, 'Challenge title is required')
      .max(255, 'Title too long'),

    description: z
      .string()
      .min(1, 'Description is required')
      .max(5000, 'Description too long'),

    instructions: z
      .string()
      .min(1, 'Instructions are required')
      .max(5000, 'Instructions too long'),

    category: z
      .string()
      .min(1, 'Category is required')
      .max(100, 'Category too long'),

    difficulty_level: z.enum(['easy', 'medium', 'hard']).default('medium'),

    estimated_time_minutes: z
      .number()
      .int()
      .positive()
      .max(600, 'Estimated time too large (max 600 min)')
      .optional(),

    points_reward: z.number().int().positive().default(10),

    max_attempts: z.number().int().positive().default(3),

    requires_peer_review: z.boolean().default(false),

    is_active: z.boolean().default(true),
    prerequisites: z.array(z.string().min(1)).default([]),
    tags: z.array(z.string().min(1)).default([]),

    learning_objectives: z.array(z.string().min(1)).default([]),
    ai_generated: z.boolean().default(false),

    // created_by comes from backend (req.user)
    created_by: z.number().int().optional(),
  }),
});
// ✅ Challenge Update Schema (all fields optional)
const challengeUpdateSchema = z.object({
  body: z.object({
    title: z.string().min(1).max(255).optional(),
    description: z.string().max(5000).optional(),
    instructions: z.string().max(5000).optional(),
    category: z.string().max(100).optional(),
    difficulty_level: z.enum(['easy', 'medium', 'hard']).optional(),
    estimated_time_minutes: z.number().int().positive().max(600).optional(),
    points_reward: z.number().int().positive().optional(),
    max_attempts: z.number().int().positive().optional(),
    requires_peer_review: z.boolean().optional(),
    is_active: z.boolean().optional(),
    prerequisites: z.array(z.string().min(1)).optional(),
    tags: z.array(z.string().min(1)).optional(),
    learning_objectives: z.array(z.string().min(1)).optional(),
  }),
});
// =======================================================
// 🤖 AI-generated Challenge Schema (strict validation)
// =======================================================
const aiGeneratedChallengeSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().min(1).max(5000),
  instructions: z.string().min(1).max(5000),
  category: z.string().min(1).max(100),
  difficulty_level: z.enum(['easy', 'medium', 'hard']),
  points_reward: z.number().int().min(0).max(100),
  estimated_time_minutes: z.number().int().min(30).max(180),
  max_attempts: z.number().int().min(1).max(5),
  requires_peer_review: z.boolean(),
  is_active: z.boolean(),
  tags: z.array(z.string()).default([]),
  prerequisites: z.array(z.string()).default([]),
  learning_objectives: z.array(z.string()).default([]),
});
/**
 * 🔹 Generic validation middleware factory
 */
const validate = (schema) => {
  return (req, res, next) => {
    try {
      const validationData = {
        body: req.body,
        query: req.query,
        params: req.params,
      };

      const result = schema.safeParse(validationData);

      if (!result.success) {
        const errors = result.error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));

        return next(
          new AppError(
            `Validation failed: ${errors.map((e) => e.message).join(', ')}`,
            400,
            'VALIDATION_ERROR',
          ),
        );
      }

      // Attach validated result for controllers/services
      req.validated = result.data;
      next();
    } catch (error) {
      next(
        new AppError('Unexpected validation error', 400, 'VALIDATION_ERROR'),
      );
    }
  };
};

/**
 * 🔹 Prebuilt middleware for common routes
 */
const loginValidation = validate(loginSchema);
const registerValidation = validate(registerSchema);
const goalValidation = validate(goalSchema);
const challengeValidation = validate(challengeSchema);
const challengeUpdateValidation = validate(challengeUpdateSchema);

module.exports = {
  validate,
  loginValidation,
  registerValidation,
  goalValidation,
  challengeValidation,
  challengeUpdateValidation,
  schemas: {
    loginSchema,
    registerSchema,
    goalSchema,
    challengeSchema,
    challengeUpdateSchema,
    aiGeneratedChallengeSchema,
  },
};
