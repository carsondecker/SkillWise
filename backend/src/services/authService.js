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
      if (!bcrypt.compare(password, user.password_hash)) {
        throw new AppError(`Invalid credentials, ${passwordHash}, ${user.password_hash}`, 401);
      }
      const token = jwt.generateToken({ id: user.id, email: user.email });
      const refreshToken = await authService.createRefreshToken(user.id, user.email);
      return { token, refreshToken };
    }
    catch (err) {
      if (err instanceof AppError) {
        throw err;
      }
      throw new AppError('Error logging in user: ' + err.message, 500);
    }
  },

  register: async (email, password, firstName, lastName) => {
    try {
      const passwordHash = await bcrypt.hash(password, 10);
      const user = userService.createUser({
        email,
        passwordHash,
        firstName,
        lastName,
      });
      return user;
    }
    catch (err) {
      if (err instanceof AppError) {
        throw err;
      }
      throw new AppError('Error registering user: ' + err.message, 500);
    }
  },

  // TODO: Implement token refresh
  refreshToken: async (token) => {
    // Implementation needed
    throw new Error('Not implemented');
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
    }
    catch (err) {
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
