// src/middleware/auth.js
const jwt = require('jsonwebtoken');
const db = require('../database/connection'); // optional if checking user existence
const { AppError } = require('./errorHandler');

/**
 * Middleware to authenticate requests using JWT
 */
const auth = async (req, res, next) => {
  try {
    // ✅ 1. Extract token from Authorization header or cookies
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken;
    }

    if (!token) {
      return next(
        new AppError('You are not logged in! Please log in to get access.', 401, 'NO_TOKEN'),
      );
    }

    // ✅ 2. Verify token signature and decode payload
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // ✅ 3. (Optional) Validate user existence in DB
    // const result = await db.query('SELECT id, email, role FROM users WHERE id = $1', [decoded.id]);
    // const currentUser = result.rows[0];
    // if (!currentUser) {
    //   return next(new AppError('The user belonging to this token no longer exists.', 401, 'USER_NOT_FOUND'));
    // }

    // ✅ 4. Attach user data to request object
    req.user = decoded; // or { id, email, role } from currentUser if you queried DB

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return next(new AppError('Invalid token. Please log in again.', 401, 'INVALID_TOKEN'));
    } else if (error.name === 'TokenExpiredError') {
      return next(new AppError('Your token has expired! Please log in again.', 401, 'TOKEN_EXPIRED'));
    }
    return next(error);
  }
};

/**
 * Middleware factory to restrict access by user role
 * @param {...string} roles - e.g. restrictTo('admin', 'moderator')
 */
const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission to perform this action.', 403, 'INSUFFICIENT_PERMISSIONS'),
      );
    }
    next();
  };
};

module.exports = auth;
module.exports.restrictTo = restrictTo;
