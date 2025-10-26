// TODO: Implement authentication business logic
const jwt = require('../utils/jwt');
const bcrypt = require('bcryptjs');
const userService = require('./userService');
const db = require('../database/connection');
const { AppError } = require('../middleware/errorHandler');

const authService = {
  login: async (email, password) => {
    try {
      const user = await userService.getUserByEmail(email);
      const match = await bcrypt.compare(password, user.password_hash);
      if (!match) {
        throw new AppError(`Invalid credentials`, 401);
      }
      const token = jwt.generateToken({ id: user.id, email: user.email });
      const refreshToken = await authService.createRefreshToken(
        user.id,
        user.email,
      );
      return { token, refreshToken };
    } catch (err) {
      if (err instanceof AppError) {
        throw err;
      }
      throw new AppError('Error logging in user: ' + err.message, 500);
    }
  },

  register: async (email, password, firstName, lastName) => {
    try {
      const passwordHash = await bcrypt.hash(password, 10);
      const user = await userService.createUser({
        email,
        passwordHash,
        firstName,
        lastName,
      });
      return user;
    } catch (err) {
      if (err instanceof AppError) {
        throw err;
      }
      throw new AppError('Error registering user: ' + err.message, 500);
    }
  },

  logout: async (userId) => {
    try {
      await db.query(
        `UPDATE refresh_tokens SET is_revoked = TRUE
        WHERE user_id = $1`,
        [userId],
      );
    } catch (err) {
      if (err instanceof AppError) {
        throw err;
      }
      throw new AppError('Error logging out user: ' + err.message, 500);
    }
  },

  revokeRefreshToken: async (token) => {
    try {
      await db.query(
        `UPDATE refresh_tokens SET is_revoked = TRUE
        WHERE token = $1`,
        [token],
      );
    } catch (err) {
      if (err instanceof AppError) {
        throw err;
      }
      throw new AppError('Error revoking refresh token: ' + err.message, 500);
    }
  },

  refreshToken: async (refreshToken, userId, email) => {
    try {
      const { rows } = await db.query(
        `SELECT user_id, is_revoked, expires_at FROM refresh_tokens
        WHERE token = $1 AND expires_at > NOW() AND is_revoked = FALSE AND user_id = $2`,
        [refreshToken, userId],
      );
      if (!rows || rows.length === 0) {
        throw new AppError('Invalid or expired refresh token', 401);
      }
      const token = jwt.generateToken({ id: userId, email: email });
      return token;
    } catch (err) {
      if (err instanceof AppError) {
        throw err;
      }
      throw new AppError('Error refreshing token: ' + err.message, 500);
    }
  },

  createRefreshToken: async (id, email) => {
    try {
      const refreshToken = jwt.generateRefreshToken({ id, email });
      await db.query(
        `INSERT INTO refresh_tokens (token, user_id, expires_at)
        VALUES ($1, $2, NOW() + INTERVAL '7 days')`,
        [refreshToken, id],
      );
      return refreshToken;
    } catch (err) {
      if (err instanceof AppError) {
        throw err;
      }
      throw new AppError('Error creating refresh token: ' + err.message, 500);
    }
  },

  // TODO: Implement password reset
  resetPassword: async (email) => {
    // Implementation needed
    throw new Error('Not implemented');
  },
};

module.exports = authService;
