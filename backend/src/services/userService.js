const { AppError } = require('../middleware/errorHandler');
const db = require('../database/connection');

const userService = {
  // TODO: Get user by ID
  getUserById: async (userId) => {
    const { rows } = await db.query(
      'SELECT id, first_name, last_name, email, created_at, updated_at FROM users WHERE id = $1',
      [userId],
    );
    return rows[0];
  },

  getUserByEmail: async (email) => {
    try {
      const { rows } = await db.query(
        'SELECT id, first_name, last_name, email, password_hash, created_at, updated_at FROM users WHERE email = $1',
        [email],
      );

      if (!rows || rows.length === 0) {
        return null;
      }

      return rows[0];
    } catch (err) {
      if (err instanceof AppError) {
        throw err;
      }
      throw new AppError('Error finding user: ' + err.message, 500);
    }
  },

  createUser: async (userData) => {
    try {
      const { firstName, lastName, email, passwordHash } = userData;
      const { rows } = await db.query(
        `INSERT INTO users (first_name, last_name, email, password_hash) 
        VALUES ($1, $2, $3, $4) 
        RETURNING first_name, last_name, email, created_at, updated_at`,
        [firstName, lastName, email, passwordHash],
      );

      if (!rows || rows.length === 0) {
        throw new AppError('Failed to create user', 500);
      }

      return rows[0];
    } catch (err) {
      if (err instanceof AppError) {
        throw err;
      }
      throw new AppError('Error creating user: ' + err.message, 500);
    }
  },

  // TODO: Update user profile
  updateProfile: async (userId, profileData) => {
    const fields = [];
    const values = [];
    let paramCount = 1;

    if (profileData.first_name) {
      fields.push(`first_name = $${paramCount}`);
      values.push(profileData.first_name);
      paramCount++;
    }

    if (profileData.last_name) {
      fields.push(`last_name = $${paramCount}`);
      values.push(profileData.last_name);
      paramCount++;
    }

    if (fields.length === 0) {
      throw new AppError('No valid fields to update', 400, 'INVALID_INPUT');
    }

    values.push(userId);
    const { rows } = await db.query(
      `UPDATE users SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $${paramCount} 
       RETURNING id, first_name, last_name, email, created_at, updated_at`,
      values,
    );

    return rows[0];
  },

  // TODO: Delete user account
  deleteUser: async (userId) => {
    await db.query('DELETE FROM users WHERE id = $1', [userId]);
  },

  // TODO: Get user statistics
  getUserStats: async (userId) => {
    // This would integrate with user_statistics table
    const { rows } = await db.query(
      'SELECT * FROM user_statistics WHERE user_id = $1',
      [userId],
    );
    return rows[0] || null;
  },
};

module.exports = userService;
