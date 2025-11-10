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
          'Password must contain at least one lowercase letter, one uppercase letter, and one number'
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
    description: z.string().min(1, 'Description is required'),
    instructions: z.string().min(1, 'Instructions are required'),
    category: z.string().min(1, 'Category is required'),
    difficulty: z.enum(['easy', 'medium', 'hard']).default('medium'),
    estimatedTimeMinutes: z.number().int().positive().optional(),
    pointsReward: z.number().int().positive().default(10),
    maxAttempts: z.number().int().positive().default(3),
    // Link to a goal (camelCase). Controller will map to DB snake_case field.
    relatedGoalId: z.number().int().optional(),
  }),
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
            'VALIDATION_ERROR'
          )
        );
      }

      // Attach validated result for controllers/services
      req.validated = result.data;
      next();
    } catch (error) {
      next(
        new AppError('Unexpected validation error', 400, 'VALIDATION_ERROR')
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

module.exports = {
  validate,
  loginValidation,
  registerValidation,
  goalValidation,
  challengeValidation,
  schemas: {
    loginSchema,
    registerSchema,
    goalSchema,
    challengeSchema,
  },
};
