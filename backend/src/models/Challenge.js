const db = require('../database/connection');

class Challenge {
  static async findAll (userId) {
    let query;
    let params;

    if (userId) {
      query = `
      SELECT id, title, description, instructions, category, difficulty_level,
             points_reward, max_attempts, estimated_time_minutes,
             requires_peer_review, is_active, tags, learning_objectives,
             prerequisites, created_at, status, goal_id
      FROM challenges
      WHERE is_active = true AND created_by = $1
      ORDER BY created_at DESC
    `;
      params = [userId];
    } else {
      // fallback for admin or system calls
      query = `
      SELECT id, title, description, instructions, category, difficulty_level,
             points_reward, max_attempts, estimated_time_minutes,
             requires_peer_review, is_active, tags, learning_objectives,
             prerequisites, created_at, status, goal_id
      FROM challenges
      WHERE is_active = true
      ORDER BY created_at DESC
    `;
      params = [];
    }

    const result = await db.query(query, params);
    return result.rows;
  }

  static async findById (id) {
    const query = `
      SELECT id, title, description, instructions, category, difficulty_level, points_reward,max_attempts,
             estimated_time_minutes, requires_peer_review, is_active, tags, learning_objectives,prerequisites, created_at, status
      FROM challenges
      WHERE id = $1
    `;
    const result = await db.query(query, [id]);
    return result.rows[0];
  }

  static async findLatestSubmissions (challengeId) {
    const query = `
      SELECT *
      FROM submissions
      WHERE challenge_id = $1
      ORDER BY created_at DESC
      LIMIT 1
    `;
    const result = await db.query(query, [challengeId]);
    return result.rows;
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
      prerequisites = [],
      max_attempts = 3,
      requires_peer_review = false,
      is_active = true,
      created_by,
      tags = [],
      learning_objectives = [],
      goal_id = null,
      ai_generated = false,
      status = 'pending',
    } = data;

    const query = `
      INSERT INTO challenges (
        title, description, instructions, category, difficulty_level,
        points_reward, estimated_time_minutes, requires_peer_review, max_attempts,
        is_active, created_by, tags, learning_objectives, prerequisites,
        goal_id, ai_generated, status, created_at, updated_at
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,NOW(),NOW())
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
      max_attempts,
      is_active,
      created_by,
      tags,
      learning_objectives,
      prerequisites,
      goal_id,
      ai_generated,
      status,
    ]);

    return result.rows[0];
  }

  static async update (id, data) {
    const {
      title,
      description,
      instructions,
      category,
      difficulty_level,
      points_reward ,
      estimated_time_minutes,
      prerequisites,
      max_attempts ,
      requires_peer_review,
      is_active = true,
      tags,
      learning_objectives ,
      status,
    } = data;

    const query = `
      UPDATE challenges
      SET
        title = COALESCE($2, title),
        description = COALESCE($3, description),
        instructions = COALESCE($4, instructions),
        category = COALESCE($5, category),
        difficulty_level = COALESCE($6, difficulty_level),
        points_reward = COALESCE($7, points_reward),
        estimated_time_minutes = COALESCE($8, estimated_time_minutes),
        requires_peer_review = COALESCE($9, requires_peer_review),
        is_active = COALESCE($10, is_active),
        tags = COALESCE($11, tags),
        learning_objectives = COALESCE($12, learning_objectives),
        prerequisites = COALESCE($13, prerequisites),
        max_attempts = COALESCE($14, max_attempts),
        status = COALESCE($15, status),
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
      estimated_time_minutes,
      requires_peer_review,
      is_active,
      tags,
      learning_objectives,
      prerequisites,
      max_attempts,
      status,
    ]);

    return result.rows[0] || null;
  }

  static async delete (id) {
    const result = await db.query(
      'DELETE FROM challenges WHERE id = $1 RETURNING *',
      [id],
    );
    return result.rows[0] || null;
  }
}

module.exports = Challenge;
