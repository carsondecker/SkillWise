// src/utils/jwt.js
const jwt = require('jsonwebtoken');
const { AppError } = require('../middleware/errorHandler');

const ACCESS_EXP = process.env.JWT_EXPIRES_IN || '15m';
const REFRESH_EXP = process.env.JWT_REFRESH_EXPIRES_IN || '7d';
const RESET_EXP = process.env.JWT_RESET_EXPIRES_IN || '1h';

const signAccessToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: ACCESS_EXP });
};

const signRefreshToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, { expiresIn: REFRESH_EXP });
};

const signPasswordResetToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_RESET_SECRET, { expiresIn: RESET_EXP });
};

const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    throw new AppError('Invalid access token', 401, 'INVALID_TOKEN');
  }
};

const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
  } catch (err) {
    throw new AppError('Invalid or expired refresh token', 401, 'INVALID_REFRESH');
  }
};

const verifyResetToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_RESET_SECRET);
  } catch (err) {
    throw new AppError('Invalid or expired reset token', 401, 'INVALID_RESET');
  }
};
// 🍪 Auth Cookie Helpers
// src/utils/jwt.js
const setAuthCookies = (res, accessToken, refreshToken) => {
  // Optional: store access token (short-lived)
  res.cookie('accessToken', accessToken, {
    httpOnly: false,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 15 * 60 * 1000,
  });

  // 🔥 Main fix: refresh token cookie setup
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    secure: false,
    path: '/api/auth',
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  });
};

const clearAuthCookies = (res) => {
  res.clearCookie('accessToken');
  res.clearCookie('refreshToken');
};
module.exports = {
  signAccessToken,
  signRefreshToken,
  signPasswordResetToken,
  verifyAccessToken,
  verifyRefreshToken,
  verifyResetToken,
  generateAccessToken: signAccessToken,
  generateRefreshToken: signRefreshToken,
  setAuthCookies,
  clearAuthCookies,
};

