const db = require('../database/connection');

class Progress {
  /**
   * 🔹 Get all events for a user
   */
  static async findByUserId (userId) {
    try {
      const query = `
        SELECT *
        FROM progress_events
        WHERE user_id = $1
        ORDER BY created_at DESC
      `;
      const result = await db.query(query, [userId]);
      return result.rows;
    } catch (error) {
      throw new Error(
        `Error finding progress events for user: ${error.message}`,
      );
    }
  }

  /**
   * 🔹 Find a progress event by user and challenge
   */
  static async findByUserAndChallenge (userId, challengeId) {
    try {
      const query = `
        SELECT *
        FROM progress_events
        WHERE user_id = $1
          AND related_challenge_id = $2
        ORDER BY created_at DESC
        LIMIT 1
      `;
      const result = await db.query(query, [userId, challengeId]);
      return result.rows[0];
    } catch (error) {
      throw new Error(`Error finding progress event: ${error.message}`);
    }
  }

  /**
   * 🔹 Aggregate stats for a user
   */
  static async getUserStats (userId) {
    try {
      const query = `
        SELECT
          COUNT(*) AS total_attempts,
          COUNT(
            CASE WHEN event_type IN ('challenge_completed', 'goal_completed') THEN 1 END
          ) AS completed_challenges,
          SUM(points_earned) AS total_points,
          AVG((event_data->>'score')::NUMERIC) AS average_score
        FROM progress_events
        WHERE user_id = $1
      `;
      const result = await db.query(query, [userId]);
      return result.rows[0];
    } catch (error) {
      throw new Error(`Error getting user stats: ${error.message}`);
    }
  }

  /**
   * 🔹 Create a new progress event
   */
  static async create (progressData) {
    try {
      const {
        user_id,
        event_type,
        points_earned,
        related_goal_id,
        related_challenge_id,
        event_data,
      } = progressData;
      const query = `
        INSERT INTO progress_events
        (user_id, event_type, points_earned, related_goal_id, related_challenge_id, event_data, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, NOW())
          RETURNING *
      `;
      const result = await db.query(query, [
        user_id,
        event_type,
        points_earned,
        related_goal_id,
        related_challenge_id,
        JSON.stringify(event_data || {}),
      ]);
      return result.rows[0];
    } catch (error) {
      throw new Error(`Error creating progress event: ${error.message}`);
    }
  }

  /**
   * 🔹 Generate leaderboard data
   */
  static async getLeaderboardData (limit = 10) {
    try {
      const query = `
        SELECT 
          u.id,
          u.first_name,
          u.last_name,
          SUM(pe.points_earned) AS total_points,
          COUNT(
            CASE WHEN pe.event_type = 'challenge_completed' THEN 1 END
          ) AS challenges_completed
        FROM users u
        LEFT JOIN progress_events pe ON u.id = pe.user_id
        GROUP BY u.id, u.first_name, u.last_name
        ORDER BY total_points DESC, challenges_completed DESC
        LIMIT $1
      `;
      const result = await db.query(query, [limit]);
      return result.rows;
    } catch (error) {
      throw new Error(`Error getting leaderboard data: ${error.message}`);
    }
  }
}

module.exports = Progress;
