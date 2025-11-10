// src/utils/errors.js
const { AppError } = require('../middleware/errorHandler');

/**
 * Map PostgreSQL or custom error codes to readable messages.
 */
const handleDatabaseError = (err) => {
  if (err.code === '23505') {
    return new AppError('Duplicate entry detected', 400, 'DUPLICATE_ENTRY');
  }
  if (err.code === '23503') {
    return new AppError('Invalid reference (foreign key constraint)', 400, 'INVALID_REFERENCE');
  }
  if (err.code === '22P02') {
    return new AppError('Invalid data format', 400, 'INVALID_FORMAT');
  }
  return new AppError(err.message || 'Database operation failed', 500, 'DB_ERROR');
};

/**
 * Wraps async service logic with graceful DB error conversion.
 */
const safeExecute = async (fn) => {
  try {
    return await fn();
  } catch (err) {
    if (err.code && err.code.startsWith('23')) {
      throw handleDatabaseError(err);
    }
    throw err;
  }
};

module.exports = {
  handleDatabaseError,
  safeExecute,
};
