const db = require('../database/connection');

class Leaderboard {
  // 🏆 Get global leaderboard (from view + join users for names)
  static async getGlobalLeaderboard(limit = 10) {
    try {
      const query = `
        SELECT
          v.user_id,
          u.first_name,
          u.last_name,
          v.total_points,
          v.total_challenges_completed,
          v.total_goals_completed,
          v.average_score,
          v.level,
          v.experience_points,
          v.current_streak_days,
          v.longest_streak_days,
          v.rank_position
        FROM v_leaderboard v
               LEFT JOIN users u ON u.id = v.user_id
        ORDER BY v.total_points DESC, v.level DESC
          LIMIT $1
      `;
      const result = await db.query(query, [limit]);
      return result.rows;
    } catch (error) {
      throw new Error(`Error getting global leaderboard: ${error.message}`);
    }
  }

  // 📅 Get weekly leaderboard (computed dynamically)
  static async getWeeklyLeaderboard(limit = 10) {
    try {
      const query = `
        SELECT
          u.id AS user_id,
          u.first_name,
          u.last_name,
          COALESCE(SUM(pe.points_earned), 0) AS weekly_points,
          COUNT(CASE WHEN pe.event_type = 'submission_created' THEN 1 END) AS weekly_submissions,
          COUNT(CASE WHEN pe.event_type = 'goal_completed' THEN 1 END) AS weekly_goals,
          RANK() OVER (ORDER BY COALESCE(SUM(pe.points_earned), 0) DESC) AS rank_position
        FROM users u
               LEFT JOIN progress_events pe ON pe.user_id = u.id
          AND pe.timestamp_occurred >= date_trunc('week', NOW())
        GROUP BY u.id, u.username, u.first_name, u.last_name
        ORDER BY weekly_points DESC
          LIMIT $1
      `;
      const result = await db.query(query, [limit]);
      return result.rows;
    } catch (error) {
      throw new Error(`Error getting weekly leaderboard: ${error.message}`);
    }
  }

  // 📆 Get monthly leaderboard (computed dynamically)
  static async getMonthlyLeaderboard(limit = 10) {
    try {
      const query = `
        SELECT
          u.id AS user_id,
          u.first_name,
          u.last_name,
          COALESCE(SUM(pe.points_earned), 0) AS monthly_points,
          COUNT(CASE WHEN pe.event_type = 'submission_created' THEN 1 END) AS monthly_submissions,
          COUNT(CASE WHEN pe.event_type = 'goal_completed' THEN 1 END) AS monthly_goals,
          RANK() OVER (ORDER BY COALESCE(SUM(pe.points_earned), 0) DESC) AS rank_position
        FROM users u
               LEFT JOIN progress_events pe ON pe.user_id = u.id
          AND pe.timestamp_occurred >= date_trunc('month', NOW())
        GROUP BY u.id, u.username, u.first_name, u.last_name
        ORDER BY monthly_points DESC
          LIMIT $1
      `;
      const result = await db.query(query, [limit]);
      return result.rows;
    } catch (error) {
      throw new Error(`Error getting monthly leaderboard: ${error.message}`);
    }
  }

  // 👤 Get single user's rank from view (with user info)
  static async getUserRank(userId) {
    try {
      const query = `
        SELECT
          v.user_id,
          u.first_name,
          u.last_name,
          v.total_points,
          v.level,
          v.rank_position
        FROM v_leaderboard v
               LEFT JOIN users u ON u.id = v.user_id
        WHERE v.user_id = $1
      `;
      const result = await db.query(query, [userId]);
      return result.rows[0] || null;
    } catch (error) {
      throw new Error(`Error getting user rank: ${error.message}`);
    }
  }

  // 📚 Get subject/category-specific leaderboard
  static async getSubjectLeaderboard(category, limit = 10) {
    try {
      const query = `
        SELECT
          u.id AS user_id,
          u.first_name,
          u.last_name,
          COALESCE(SUM(pe.points_earned), 0) AS subject_points,
          COUNT(pe.id) AS activity_count,
          RANK() OVER (ORDER BY COALESCE(SUM(pe.points_earned), 0) DESC) AS rank_position
        FROM users u
               JOIN progress_events pe ON pe.user_id = u.id
               JOIN challenges c ON pe.related_challenge_id = c.id
        WHERE c.category = $1
        GROUP BY u.id, u.username, u.first_name, u.last_name
        ORDER BY subject_points DESC
          LIMIT $2
      `;
      const result = await db.query(query, [category, limit]);
      return result.rows;
    } catch (error) {
      throw new Error(`Error getting subject leaderboard: ${error.message}`);
    }
  }
}

module.exports = Leaderboard;
