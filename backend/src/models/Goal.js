const db = require('../database/connection');

class Goal {
  static async findByUserId(userId, limit = 20, offset = 0) {
    const query = `
      SELECT * FROM goals
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
    `;
    const result = await db.query(query, [userId, limit, offset]);
    return result.rows;
  }

  static async findById(goalId) {
    const result = await db.query('SELECT * FROM goals WHERE id = $1', [
      goalId,
    ]);
    return result.rows[0];
  }

  static async create(data) {
    const {
      user_id,
      title,
      description,
      category,
      difficulty_level,
      target_date,
    } = data;

    const query = `
      INSERT INTO goals (user_id, title, description, category, difficulty_level, target_date, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW())
      RETURNING *
    `;
    const result = await db.query(query, [
      user_id,
      title,
      description,
      category,
      difficulty_level || 'medium',
      target_date,
    ]);

    return result.rows[0];
  }

  static async update(goalId, updates) {
    const {
      title,
      description,
      category,
      difficulty_level,
      target_date,
      progress_percentage,
      is_completed,
    } = updates;

    const query = `
      UPDATE goals
      SET
        title = COALESCE($2, title),
        description = COALESCE($3, description),
        category = COALESCE($4, category),
        difficulty_level = COALESCE($5, difficulty_level),
        target_date = COALESCE($6, target_date),
        progress_percentage = COALESCE($7, progress_percentage),
        is_completed = COALESCE($8, is_completed),
        updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `;
    const result = await db.query(query, [
      goalId,
      title,
      description,
      category,
      difficulty_level,
      target_date,
      progress_percentage,
      is_completed,
    ]);

    return result.rows[0];
  }

  static async delete(goalId) {
    const result = await db.query(
      'DELETE FROM goals WHERE id = $1 RETURNING *',
      [goalId]
    );
    return result.rows[0];
  }
}

module.exports = Goal;
