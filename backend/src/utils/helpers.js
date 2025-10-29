// src/utils/helpers.js
const crypto = require('crypto');

/**
 * Generate random unique ID (for temp tokens or short keys)
 */
const generateId = (length = 16) => {
  return crypto.randomBytes(length).toString('hex');
};

/**
 * Format date into human-readable string
 */
const formatDate = (date) => {
  const d = new Date(date);
  return d.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
};

/**
 * Delay (async sleep)
 */
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Wrap async route handlers safely
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Check if a value is empty/null
 */
const isEmpty = (value) => {
  return (
    value === undefined ||
    value === null ||
    (typeof value === 'string' && value.trim() === '') ||
    (Array.isArray(value) && value.length === 0) ||
    (typeof value === 'object' && Object.keys(value).length === 0)
  );
};

module.exports = {
  generateId,
  formatDate,
  delay,
  asyncHandler,
  isEmpty,
};
