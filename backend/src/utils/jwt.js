const jwt = require('jsonwebtoken');
const { AppError } = require('../middleware/errorHandler');

const ACCESS_EXP = process.env.JWT_EXPIRES_IN || '15m';
const REFRESH_EXP = process.env.JWT_REFRESH_EXPIRES_IN || '30d';
const RESET_EXP = process.env.JWT_RESET_EXPIRES_IN || '1h';

// ===============================
// 🔹 Token Signers
// ===============================
const signAccessToken = (payload) =>
  jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: ACCESS_EXP });
const signRefreshToken = (payload) =>
  jwt.sign(payload, process.env.JWT_REFRESH_SECRET, { expiresIn: REFRESH_EXP });
const signPasswordResetToken = (payload) =>
  jwt.sign(payload, process.env.JWT_RESET_SECRET, { expiresIn: RESET_EXP });

// ===============================
// 🔹 Token Verifiers
// ===============================
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
    throw new AppError(
      'Invalid or expired refresh token',
      401,
      'INVALID_REFRESH'
    );
  }
};

const verifyResetToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_RESET_SECRET);
  } catch (err) {
    throw new AppError('Invalid or expired reset token', 401, 'INVALID_RESET');
  }
};

// ===============================
// 🍪 Cookie Helpers
// ===============================
const setAuthCookies = (res, accessToken, refreshToken) => {
  res.cookie('accessToken', accessToken, {
    httpOnly: false, // used by frontend JS if needed
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 15 * 60 * 1000, // 15 min
  });

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/', // ✅ FIX: must match clearAuthCookies
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  });
};

const clearAuthCookies = (res) => {
  res.clearCookie('accessToken', {
    httpOnly: false,
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
  });
  res.clearCookie('refreshToken', {
    httpOnly: true,
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/', // ✅ Must match cookie creation path
  });
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
