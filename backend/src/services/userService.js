const db = require('../database/connection');
const { AppError } = require('../middleware/errorHandler');

const userService = {
  /**
   * 👤 Get user profile by ID
   */
  getProfile: async (userId) => {
    try {
      const { rows } = await db.query(
        `
          SELECT
            id, email, first_name, last_name, profile_image, bio,
            is_active, is_verified, role, created_at, updated_at, last_login
          FROM users
          WHERE id = $1
        `,
        [userId],
      );

      if (!rows[0]) {
        throw new AppError('User not found', 404, 'USER_NOT_FOUND');
      }

      return rows[0];
    } catch (error) {
      throw new AppError(`Error fetching user profile: ${error.message}`, 500);
    }
  },

  updateAvatar: async (userId, fileUrl) => {
    try {
      const { rows } = await db.query(
        `
        UPDATE users
        SET profile_image = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
        RETURNING id, first_name, last_name, email, role, bio, profile_image
      `,
        [fileUrl, userId],
      );

      if (!rows[0]) throw new AppError('User not found', 404);

      return rows[0];
    } catch (err) {
      throw new AppError(`Error updating avatar: ${err.message}`, 500);
    }
  },
  /**
   * ✏️ Update user profile
   */
  updateProfile: async (userId, data) => {
    try {
      const fields = [];
      const values = [];
      let i = 1;

      if (typeof data.first_name === 'string' && data.first_name.trim()) {
        fields.push(`first_name = $${i++}`);
        values.push(data.first_name.trim());
      }
      if (typeof data.last_name === 'string' && data.last_name.trim()) {
        fields.push(`last_name = $${i++}`);
        values.push(data.last_name.trim());
      }
      if (typeof data.bio === 'string') {
        fields.push(`bio = $${i++}`);
        values.push(data.bio.trim());
      }
      if (typeof data.avatar_url === 'string') {
        fields.push(`profile_image = $${i++}`);
        values.push(data.avatar_url);
      }

      if (fields.length === 0) throw new AppError('No valid fields to update', 400);

      values.push(userId);

      const { rows } = await db.query(`
        UPDATE users
        SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
        WHERE id = $${i}
          RETURNING id, first_name, last_name, email, role, bio, profile_image, updated_at
      `, values);

      if (!rows[0]) throw new AppError('User not found', 404);
      return rows[0];
    } catch (err) {
      throw new AppError(`Error updating user profile: ${err.message}`, 500);
    }
  },

  /**
   * ❌ Delete user account (and cascade related data)
   */
  deleteAccount: async (userId) => {
    try {
      await db.withTransaction(async (query) => {
        // Tables that always exist
        await query('DELETE FROM refresh_tokens WHERE user_id = $1', [userId]).catch(() => {});
        await query('DELETE FROM user_statistics WHERE user_id = $1', [userId]).catch(() => {});

        // Optional tables (may not exist in test)
        await query('DELETE FROM leaderboard WHERE user_id = $1', [userId]).catch(() => {});

        const deleted = await query('DELETE FROM users WHERE id = $1 RETURNING id', [userId]);
        if (deleted.rowCount === 0) throw new AppError('User not found', 404);
      });

      return { message: `User ${userId} deleted successfully` };
    } catch (err) {
      throw new AppError(`Error deleting user: ${err.message}`, 500);
    }
  },

  /**
   * 📊 Get user statistics
   */
  getStatistics: async (userId) => {
    try {
      let { rows } = await db.query(
        'SELECT * FROM user_statistics WHERE user_id = $1',
        [userId],
      );

      // 🚀 If not found, create a default entry
      if (!rows[0]) {
        const insert = await db.query(
          `INSERT INTO user_statistics (user_id)
         VALUES ($1)
         RETURNING *`,
          [userId],
        );
        rows = insert.rows;
      }

      return rows[0];
    } catch (error) {
      throw new AppError(`Error fetching user statistics: ${error.message}`, 500);
    }
  },
};

module.exports = userService;
