// src/middleware/errorHandler.js
const pino = require('pino');

const logger = pino({
  name: 'skillwise-error-handler',
  level: process.env.LOG_LEVEL || 'info',
});

/**
 * Custom operational error class
 * Used for trusted errors (invalid input, unauthorized, etc.)
 */
class AppError extends Error {
  constructor (message, statusCode, code = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Common error transformers
 */
const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400, 'INVALID_INPUT');
};

const handleDuplicateFieldsDB = (err) => {
  const field = Object.keys(err.keyValue || {})[0] || 'unknown';
  const value = err.keyValue ? err.keyValue[field] : 'N/A';
  const message = `Duplicate field value: ${field} = '${value}'. Please use another value.`;
  return new AppError(message, 400, 'DUPLICATE_FIELD');
};

const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors || {}).map((el) => el.message);
  const message = `Invalid input data. ${errors.join('. ')}`;
  return new AppError(message, 400, 'VALIDATION_ERROR');
};

const handleJWTError = () =>
  new AppError('Invalid token. Please log in again.', 401, 'INVALID_TOKEN');

const handleJWTExpiredError = () =>
  new AppError('Your token has expired. Please log in again.', 401, 'TOKEN_EXPIRED');

/**
 * Development error response
 */
const sendErrorDev = (err, req, res) => {
  logger.error('Development Error:', {
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
  });

  return res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
    error: err,
    stack: err.stack,
    code: err.code,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Production error response
 */
const sendErrorProd = (err, req, res) => {
  if (err.isOperational) {
    logger.warn('Operational Error:', {
      message: err.message,
      code: err.code,
      statusCode: err.statusCode,
      url: req.originalUrl,
      method: req.method,
    });

    return res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
      code: err.code,
      timestamp: new Date().toISOString(),
    });
  }

  // Unknown or programming error
  logger.error('Unknown Error:', {
    error: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
  });

  return res.status(500).json({
    status: 'error',
    message: 'Something went wrong!',
    timestamp: new Date().toISOString(),
  });
};

/**
 * Global error-handling middleware for Express
 */
const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  let error = { ...err };
  error.message = err.message;

  // Transform specific known errors
  if (error.name === 'CastError') error = handleCastErrorDB(error);
  if (error.code === 11000) error = handleDuplicateFieldsDB(error);
  if (error.name === 'ValidationError') error = handleValidationErrorDB(error);
  if (error.name === 'JsonWebTokenError') error = handleJWTError();
  if (error.name === 'TokenExpiredError') error = handleJWTExpiredError();

  // Send environment-appropriate response
  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(error, req, res);
  } else {
    sendErrorProd(error, req, res);
  }
};

module.exports = errorHandler;
module.exports.AppError = AppError;
