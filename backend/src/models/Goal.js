// src/models/Goal.js
const db = require('../database/connection');

class Goal {
  static async findByUserId (userId, limit = 20, offset = 0) {
    const result = await db.query(
      'SELECT * FROM goals WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3',
      [userId, limit, offset],
    );
    return result.rows;
  }

  static async findById (goalId) {
    const result = await db.query('SELECT * FROM goals WHERE id = $1', [goalId]);
    return result.rows[0];
  }

  static async create ({ user_id, title, description, category, target_completion_date }) {
    const result = await db.query(
      `INSERT INTO goals (user_id, title, description, category, target_completion_date, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
         RETURNING *`,
      [user_id, title, description, category, target_completion_date],
    );
    return result.rows[0];
  }

  static async update (goalId, updateData) {
    try {
      const { title, description, target_date, progress_percentage, status } = updateData;

      const query = `
      UPDATE goals 
      SET 
        title = COALESCE($2, title),
        description = COALESCE($3, description),
        target_completion_date = COALESCE($4, target_completion_date),
        progress_percentage = COALESCE($5, progress_percentage),
        updated_at = NOW()
      WHERE id = $1
      RETURNING *;
    `;

      const result = await db.query(query, [goalId, title, description, target_date, progress_percentage]);

      // ✅ Return null if no rows found
      return result.rows[0] || null;
    } catch (error) {
      throw new Error(`Error updating goal: ${error.message}`);
    }
  }

  static async delete (goalId) {
    const result = await db.query('DELETE FROM goals WHERE id = $1 RETURNING *', [goalId]);
    return result.rows[0];
  }
}

module.exports = Goal;
