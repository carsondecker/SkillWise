// src/validation/challengeValidation.js
import { z } from 'zod';

/**
 * ✅ Frontend Challenge Form Validation Schema
 * Matches backend's challengeSchema for consistency
 */
export const challengeValidationSchema = z.object({
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

  // created_by comes from backend (req.user)
  created_by: z.number().int().optional(),
});

/**
 * ✅ Utility function for client-side validation
 */
export const validateChallenge = (formData) => {
  try {
    // Convert form fields before validation
    const parsed = challengeValidationSchema.parse({
      ...formData,
      points_reward: Number(formData.points_reward),
      estimated_time_minutes: Number(formData.estimated_time_minutes),
      max_attempts: Number(formData.max_attempts),
      requires_peer_review: Boolean(formData.requires_peer_review),
      is_active: Boolean(formData.is_active),
      tags: formData.tags
        ? formData.tags
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean)
        : [],
      prerequisites: formData.prerequisites
        ? formData.prerequisites
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean)
        : [],
      learning_objectives: formData.learning_objectives
        ? formData.learning_objectives
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean)
        : [],
    });

    return { success: true, data: parsed };
  } catch (err) {
    const firstError = err.errors?.[0]?.message || 'Invalid input';
    return { success: false, error: firstError };
  }
};
