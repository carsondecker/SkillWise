const db = require('../database/connection');

class Challenge {
  // If userId is provided, return challenges for that user only.
  static async findAll(userId = null) {
    let query;
    let params = [];
    if (userId) {
      query = `
        SELECT id, title, description, instructions, category, difficulty_level, points_reward,
               estimated_time_minutes, requires_peer_review, is_active, tags, learning_objectives, related_goal_id, created_at
        FROM challenges
        WHERE is_active = true AND (user_id = $1 OR user_id IS NULL)
        ORDER BY difficulty_level, created_at DESC
      `;
      params = [userId];
    } else {
      query = `
        SELECT id, title, description, instructions, category, difficulty_level, points_reward,
               estimated_time_minutes, requires_peer_review, is_active, tags, learning_objectives, related_goal_id, created_at
        FROM challenges
        WHERE is_active = true
        ORDER BY difficulty_level, created_at DESC
      `;
    }
    const result = await db.query(query, params);
    return result.rows;
  }

  // Optionally ensure the challenge belongs to a user by supplying userId
  static async findById(id, userId = null) {
    let query;
    let params = [];
    if (userId) {
      query = `
        SELECT id, title, description, instructions, category, difficulty_level, points_reward,
               estimated_time_minutes, requires_peer_review, is_active, tags, learning_objectives, related_goal_id, created_at
        FROM challenges
        WHERE id = $1 AND (user_id = $2 OR user_id IS NULL)
      `;
      params = [id, userId];
    } else {
      query = `
        SELECT id, title, description, instructions, category, difficulty_level, points_reward,
               estimated_time_minutes, requires_peer_review, is_active, tags, learning_objectives, related_goal_id, created_at
        FROM challenges
        WHERE id = $1
      `;
      params = [id];
    }
    const result = await db.query(query, params);
    return result.rows[0];
  }

  static async findByDifficulty(difficulty, userId = null) {
    let query;
    let params = [];
    if (userId) {
      query = `
        SELECT * FROM challenges
        WHERE difficulty_level = $1 AND is_active = true AND (user_id = $2 OR user_id IS NULL)
        ORDER BY created_at DESC
      `;
      params = [difficulty, userId];
    } else {
      query = `
        SELECT * FROM challenges
        WHERE difficulty_level = $1 AND is_active = true
        ORDER BY created_at DESC
      `;
      params = [difficulty];
    }
    const result = await db.query(query, params);
    return result.rows;
  }

  static async findByCategory(category, userId = null) {
    let query;
    let params = [];
    if (userId) {
      query = `
        SELECT * FROM challenges
        WHERE category = $1 AND is_active = true AND (user_id = $2 OR user_id IS NULL)
        ORDER BY created_at DESC
      `;
      params = [category, userId];
    } else {
      query = `
        SELECT * FROM challenges
        WHERE category = $1 AND is_active = true
        ORDER BY created_at DESC
      `;
      params = [category];
    }
    const result = await db.query(query, params);
    return result.rows;
  }

  static async create(data) {
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
      user_id,
      tags = [],
      learning_objectives = [],
      related_goal_id = null,
    } = data;

    const query = `
      INSERT INTO challenges (
        title, description, instructions, category, difficulty_level,
        points_reward, estimated_time_minutes, requires_peer_review,
        is_active, created_by, user_id, tags, learning_objectives, related_goal_id, created_at, updated_at
      )
  VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,NOW(),NOW())
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
      user_id,
      tags,
      learning_objectives,
      related_goal_id,
    ]);

    return result.rows[0];
  }

  static async update(id, updates) {
    const {
      title,
      description,
      instructions,
      category,
      difficulty_level,
      points_reward,
      is_active,
      related_goal_id,
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
        related_goal_id = COALESCE($9, related_goal_id),
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
      related_goal_id,
    ]);

    return result.rows[0] || null;
  }

  static async delete(id) {
    const result = await db.query(
      'DELETE FROM challenges WHERE id = $1 RETURNING *',
      [id]
    );
    return result.rows[0] || null;
  }
}

module.exports = Challenge;
