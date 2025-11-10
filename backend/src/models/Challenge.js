const db = require('../database/connection');

class Challenge {
  static async findAll () {
    const query = `
      SELECT id, title, description, instructions, category, difficulty_level, points_reward,
             estimated_time_minutes, requires_peer_review, is_active, tags, learning_objectives, created_at
      FROM challenges
      WHERE is_active = true
      ORDER BY difficulty_level, created_at DESC
    `;
    const result = await db.query(query);
    return result.rows;
  }

  static async findById (id) {
    const query = `
      SELECT id, title, description, instructions, category, difficulty_level, points_reward,
             estimated_time_minutes, requires_peer_review, is_active, tags, learning_objectives, created_at
      FROM challenges
      WHERE id = $1
    `;
    const result = await db.query(query, [id]);
    return result.rows[0];
  }

  static async findByDifficulty (difficulty) {
    const query = `
      SELECT * FROM challenges
      WHERE difficulty_level = $1 AND is_active = true
      ORDER BY created_at DESC
    `;
    const result = await db.query(query, [difficulty]);
    return result.rows;
  }

  static async findByCategory (category) {
    const query = `
      SELECT * FROM challenges
      WHERE category = $1 AND is_active = true
      ORDER BY created_at DESC
    `;
    const result = await db.query(query, [category]);
    return result.rows;
  }

  static async create (data) {
    const {
      title,
      description,
      instructions,
      category,
      difficulty_level = 'medium',
      points_reward = 10,
      estimated_time_minutes,
      requires_peer_review = false,
      is_active = true,
      created_by,
      tags = [],
      learning_objectives = [],
    } = data;

    const query = `
      INSERT INTO challenges (
        title, description, instructions, category, difficulty_level,
        points_reward, estimated_time_minutes, requires_peer_review,
        is_active, created_by, tags, learning_objectives, created_at, updated_at
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,NOW(),NOW())
      RETURNING *
    `;

    const result = await db.query(query, [
      title,
      description,
      instructions,
      category,
      difficulty_level,
      points_reward,
      estimated_time_minutes,
      requires_peer_review,
      is_active,
      created_by,
      tags,
      learning_objectives,
    ]);

    return result.rows[0];
  }

  static async update (id, updates) {
    const {
      title,
      description,
      instructions,
      category,
      difficulty_level,
      points_reward,
      is_active,
    } = updates;

    const query = `
      UPDATE challenges
      SET
        title = COALESCE($2, title),
        description = COALESCE($3, description),
        instructions = COALESCE($4, instructions),
        category = COALESCE($5, category),
        difficulty_level = COALESCE($6, difficulty_level),
        points_reward = COALESCE($7, points_reward),
        is_active = COALESCE($8, is_active),
        updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `;
    const result = await db.query(query, [
      id,
      title,
      description,
      instructions,
      category,
      difficulty_level,
      points_reward,
      is_active,
    ]);

    return result.rows[0] || null;
  }

  static async delete (id) {
    const result = await db.query('DELETE FROM challenges WHERE id = $1 RETURNING *', [id]);
    return result.rows[0] || null;
  }
}

module.exports = Challenge;
