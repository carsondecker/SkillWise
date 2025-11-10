import { z } from 'zod';

/**
 * 🧩 Submission Validation Schema
 * Mirrors the Postgres `submissions` table.
 * Ensures strong client-side validation before sending data to backend.
 */
export const submissionValidationSchema = z.object({
  // 🧠 Required text content
  submission_text: z
    .string()
    .trim()
    .min(3, { message: 'Submission text must be at least 3 characters long.' })
    .max(10000, {
      message: 'Submission text is too long (max 10,000 characters).',
    }),

  // 🧠 Optional single file upload
  submission_files: z
    .any()
    .optional()
    .refine(
      (file) =>
        !file || (file instanceof File && file.size <= 20 * 1024 * 1024),
      { message: 'File size must be under 20MB.' }
    )
    .refine(
      (file) =>
        !file ||
        [
          'application/pdf',
          'image/png',
          'image/jpeg',
          'text/plain',
          'application/zip',
          'application/x-zip-compressed',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ].includes(file.type),
      { message: 'Only PDF, images, text, DOCX, or ZIP files are allowed.' }
    ),

  // 🧠 Controlled fields
  status: z.enum(['submitted', 'pending', 'graded']).default('submitted'),

  score: z
    .number()
    .int()
    .min(0, { message: 'Score cannot be below 0.' })
    .max(100, { message: 'Score cannot exceed 100.' })
    .optional(),

  attempt_number: z
    .number()
    .int()
    .min(1, { message: 'Attempt number must be at least 1.' })
    .default(1),

  time_spent_minutes: z
    .number()
    .int()
    .min(0, { message: 'Time spent must be 0 or greater.' })
    .optional(),

  is_flagged: z.boolean().optional().default(false),
});

/**
 * 🧠 Helper — Validate data before sending to API
 */
export const validateSubmission = (data) => {
  try {
    // Ensure type conversion for number fields (browser form inputs are strings)
    const parsed = submissionValidationSchema.parse({
      ...data,
      score:
        data.score !== undefined && data.score !== ''
          ? Number(data.score)
          : undefined,
      attempt_number:
        data.attempt_number !== undefined && data.attempt_number !== ''
          ? Number(data.attempt_number)
          : 1,
      time_spent_minutes:
        data.time_spent_minutes !== undefined && data.time_spent_minutes !== ''
          ? Number(data.time_spent_minutes)
          : undefined,
    });

    return { success: true, data: parsed };
  } catch (err) {
    const firstError = err.errors?.[0]?.message || 'Invalid submission data.';
    return { success: false, error: firstError };
  }
};
