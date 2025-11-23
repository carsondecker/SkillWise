const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const db = require('../database/connection');
const jwt = require('../utils/jwt');
const { AppError } = require('../middleware/errorHandler');

const TOKEN_EXPIRY_DAYS = 30; // refresh tokens last 30 days
const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

const authService = {
  /**
   * 🔐 User Login
   */
  // src/services/authService.js

  login: async (email, password) => {
    const userQuery = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = userQuery.rows[0];
    if (!user) throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');

    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');

    const accessToken = jwt.signAccessToken({ id: user.id, role: user.role });
    const refreshToken = jwt.signRefreshToken({ id: user.id, role: user.role });

    const decoded = jwt.verifyRefreshToken(refreshToken);
    const userId = decoded.id || decoded.user?.id; // 🛠 this ensures it's always defined
    const hashedRefreshToken = hashToken(refreshToken);

    await db.query(
      `INSERT INTO refresh_tokens (user_id, token, expires_at, created_at)
     VALUES ($1, $2, NOW() + INTERVAL '30 days', NOW())
     ON CONFLICT (user_id)
     DO UPDATE SET token = EXCLUDED.token, expires_at = NOW() + INTERVAL '30 days', updated_at = NOW()`,
      [userId, hashedRefreshToken],
    );

    return {
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
      },
      accessToken,
      refreshToken,
    };
  },

  /**
   * 💾 Store Refresh Token in DB
   */
  storeRefreshToken: async (userId, token) => {
    const hashedToken = hashToken(token);
    await db.query(
      `INSERT INTO refresh_tokens (user_id, token, expires_at, created_at)
       VALUES ($1, $2, NOW() + INTERVAL '${TOKEN_EXPIRY_DAYS} days', NOW())
       ON CONFLICT (user_id)
       DO UPDATE SET token = EXCLUDED.token, expires_at = NOW() + INTERVAL '${TOKEN_EXPIRY_DAYS} days', updated_at = NOW()`,
      [userId, hashedToken],
    );
  },

  /**
   * 🔒 Revoke Refresh Token
   */
  revokeRefreshToken: async (token) => {
    await db.query('DELETE FROM refresh_tokens WHERE token = $1', [token]);
  },

  /**
   * 🔍 Verify Refresh Token and return user
   */
  verifyRefreshToken: async (refreshToken) => {
    try {
      const decoded = jwt.verifyRefreshToken(refreshToken);
      const id = decoded.id || decoded.user?.id; // 🛡 fallback for nested payloads
      const hashed = hashToken(refreshToken);

      const result = await db.query('SELECT * FROM refresh_tokens WHERE user_id = $1', [id]);
      const storedToken = result.rows[0];
      const tokenMatches =
        storedToken &&
        (storedToken.token === hashed || storedToken.token === refreshToken);

      // Check token validity and expiry
      if (!storedToken || !tokenMatches) {
        throw new AppError('Invalid or expired refresh token', 401, 'INVALID_REFRESH_TOKEN');
      }
      // If we found a legacy plaintext token, re-hash it for future checks
      if (storedToken.token === refreshToken) {
        await db.query(
          `UPDATE refresh_tokens
           SET token = $1, updated_at = NOW()
           WHERE user_id = $2`,
          [hashed, id],
        );
      }
      if (new Date(storedToken.expires_at) < new Date()) {
        throw new AppError('Refresh token has expired', 401, 'TOKEN_EXPIRED');
      }

      const userResult = await db.query(
        'SELECT id, email, first_name, last_name, role FROM users WHERE id = $1',
        [id],
      );
      return userResult.rows[0];
    } catch (error) {
      throw new AppError(error.message || 'Failed to verify refresh token', 401, 'TOKEN_INVALID');
    }
  },

  /**
   * 🔁 Rotate Refresh Token (invalidate old, insert new)
   */
  rotateRefreshToken: async (oldToken, newToken) => {
    const decoded = jwt.verifyRefreshToken(oldToken);
    const hashed = hashToken(newToken);
    await db.query(
      `UPDATE refresh_tokens 
       SET token = $1, expires_at = NOW() + INTERVAL '${TOKEN_EXPIRY_DAYS} days', updated_at = NOW()
       WHERE user_id = $2`,
      [hashed, decoded.id],
    );
  },

  /**
   * 🧾 Register New User
   */
  register: async (userData) => {
    const { email, password, firstName, lastName } = userData;

    const existing = await db.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0)
      throw new AppError('Email already registered', 400, 'EMAIL_EXISTS');

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await db.query(
      `INSERT INTO users (email, password_hash, first_name, last_name, role, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       RETURNING id, email, first_name, last_name, role`,
      [email, hashedPassword, firstName, lastName, 'student'],
    );

    const newUser = result.rows[0];

    const accessToken = jwt.signAccessToken({ id: newUser.id, role: newUser.role });
    // ✅ Make sure we never accidentally nest user data in the token
    const refreshToken = jwt.signRefreshToken({
      id: newUser.id,
      role: newUser.role,
    });
    console.log('🪪 REFRESH TOKEN PAYLOAD:', jwt.verifyRefreshToken(refreshToken));
    await db.query(
      `INSERT INTO refresh_tokens (user_id, token, expires_at, created_at)
       VALUES ($1, $2, NOW() + INTERVAL '${TOKEN_EXPIRY_DAYS} days', NOW())`,
      [newUser.id, hashToken(refreshToken)],
    );

    return { user: newUser, accessToken, refreshToken };
  },

  /**
   * 🔁 Refresh JWT Access Token
   */
  refreshToken: async (refreshToken) => {
    if (!refreshToken) throw new AppError('No refresh token provided', 401, 'NO_TOKEN');

    const decoded = jwt.verifyRefreshToken(refreshToken);
    const hashed = hashToken(refreshToken);
    const result = await db.query('SELECT token, expires_at FROM refresh_tokens WHERE user_id = $1', [decoded.id]);
    const storedToken = result.rows[0];
    const tokenMatches =
      storedToken &&
      (storedToken.token === hashed || storedToken.token === refreshToken);

    if (!storedToken || !tokenMatches)
      throw new AppError('Invalid or revoked refresh token', 401, 'INVALID_REFRESH_TOKEN');

    if (new Date(storedToken.expires_at) < new Date())
      throw new AppError('Refresh token expired', 401, 'TOKEN_EXPIRED');

    const accessToken = jwt.signAccessToken({ id: decoded.id, role: decoded.role });
    const newRefreshToken = jwt.signRefreshToken({ id: decoded.id });
    const newHashed = hashToken(newRefreshToken);

    await db.query(
      `UPDATE refresh_tokens
       SET token = $1, expires_at = NOW() + INTERVAL '${TOKEN_EXPIRY_DAYS} days', updated_at = NOW()
       WHERE user_id = $2`,
      [newHashed, decoded.id],
    );

    return { accessToken, refreshToken: newRefreshToken };
  },

  /**
   * 🧠 Reset Password (placeholder)
   */
  resetPassword: async (email) => {
    const userQuery = await db.query('SELECT id FROM users WHERE email = $1', [email]);
    const user = userQuery.rows[0];
    if (!user) throw new AppError('User not found', 404, 'USER_NOT_FOUND');

    const resetToken = jwt.signPasswordResetToken({ id: user.id });
    return { email, resetToken, message: 'Password reset token generated' };
  },
};

module.exports = authService;
