// TODO: JWT authentication middleware
const jwt = require('jsonwebtoken');
const { AppError } = require('./errorHandler');

const auth = async (req, res, next) => {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next(
        new AppError(
          'You are not logged in! Please log in to get access.',
          401,
          'NO_TOKEN'
        )
      );
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return next(
        new AppError(
          'Invalid token. Please log in again.',
          401,
          'INVALID_TOKEN'
        )
      );
    } else if (error.name === 'TokenExpiredError') {
      return next(
        new AppError(
          'Your token has expired! Please log in again.',
          401,
          'TOKEN_EXPIRED'
        )
      );
    }
    return next(error);
  }
};

const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError(
          'You do not have permission to perform this action',
          403,
          'INSUFFICIENT_PERMISSIONS'
        )
      );
    }
    next();
  };
};

module.exports = auth;
module.exports.restrictTo = restrictTo;
