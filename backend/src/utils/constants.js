// src/utils/constants.js

// User Roles
const USER_ROLES = {
  ADMIN: 'admin',
  USER: 'user',
  PREMIUM: 'premium',
};

// Challenge Difficulty Levels
const DIFFICULTY = {
  EASY: 'easy',
  MEDIUM: 'medium',
  HARD: 'hard',
  LEGENDARY: 'legendary',
};

// Submission Status
const SUBMISSION_STATUS = {
  SUBMITTED: 'submitted',
  REVIEWING: 'reviewing',
  GRADED: 'graded',
  COMPLETED: 'completed',
  REJECTED: 'rejected',
};

// Notification Types
const NOTIFICATION_TYPES = {
  GOAL_COMPLETED: 'goal_completed',
  CHALLENGE_COMPLETED: 'challenge_completed',
  SUBMISSION_GRADED: 'submission_graded',
  ACHIEVEMENT_UNLOCKED: 'achievement',
};

module.exports = {
  USER_ROLES,
  DIFFICULTY,
  SUBMISSION_STATUS,
  NOTIFICATION_TYPES,
};
