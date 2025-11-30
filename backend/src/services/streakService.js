// src/services/streakService.js
const db = require('../database/connection');
const { AppError } = require('../middleware/errorHandler');

const streakService = {
  // ---------------------------------------------------------
  // 🌟 Fetch user streak
  // ---------------------------------------------------------
  getStreak: async ({ userId }) => {
    const query = `
      SELECT
        current_streak,
        longest_streak,
        last_logged_date
      FROM user_streaks
      WHERE user_id = $1
      LIMIT 1;
    `;

    const result = await db.query(query, [userId]);

    if (result.rowCount === 0) {
      // No streak yet -> default response
      return {
        current_streak: 0,
        longest_streak: 0,
        last_logged_date: null,
      };
    }

    return result.rows[0];
  },

  // ---------------------------------------------------------
  // 🔥 Log streak for today
  // ---------------------------------------------------------
  logStreak: async ({ userId }) => {
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

    // 1️⃣ Fetch existing streak
    const existing = await db.query(
      `
      SELECT *
      FROM user_streaks
      WHERE user_id = $1
      LIMIT 1;
      `,
      [userId]
    );

    // 2️⃣ If no row exists yet → create one
    if (existing.rowCount === 0) {
      const insertRes = await db.query(
        `
        INSERT INTO user_streaks (
          user_id,
          current_streak,
          longest_streak,
          last_logged_date,
          updated_at
        )
        VALUES ($1, 1, 1, $2, NOW())
        RETURNING *;
      `,
        [userId, today]
      );

      return {
        message: 'Streak started!',
        data: insertRes.rows[0],
      };
    }

    const streak = existing.rows[0];

    // 3️⃣ Prevent double logging on same day
    if (streak.last_logged_date?.toISOString?.().slice(0, 10) === today) {
      return {
        message: 'Already logged streak for today!',
        data: streak,
      };
    }

    // 4️⃣ Determine increment vs reset
    const yesterday = new Date(Date.now() - 86400000)
      .toISOString()
      .slice(0, 10);

    let newCurrentStreak = 1;

    if (streak.last_logged_date?.toISOString?.().slice(0, 10) === yesterday) {
      newCurrentStreak = streak.current_streak + 1;
    }

    const newLongest = Math.max(newCurrentStreak, streak.longest_streak);

    // 5️⃣ Update row
    const updateRes = await db.query(
      `
      UPDATE user_streaks
      SET
          current_streak = $1,
          longest_streak = $2,
          last_logged_date = $3,
          updated_at = NOW()
      WHERE user_id = $4
      RETURNING *;
      `,
      [newCurrentStreak, newLongest, today, userId]
    );

    return {
      message: 'Daily streak logged!',
      data: updateRes.rows[0],
    };
  },
};

module.exports = streakService;

