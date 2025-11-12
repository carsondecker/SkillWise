-- ===========================================
-- Migration 010: Create Leaderboard View (based on user_statistics)
-- ===========================================


-- 🧩 Create or replace dynamic leaderboard view
CREATE OR REPLACE VIEW v_leaderboard AS
SELECT
    u.id AS user_id,
    u.email,
    us.total_points,
    us.total_challenges_completed,
    us.total_goals_completed,
    us.average_score,
    us.level,
    us.experience_points,
    us.current_streak_days,
    us.longest_streak_days,
    us.total_time_spent_minutes,
    RANK() OVER (ORDER BY us.total_points DESC, us.level DESC) AS rank_position,
    DENSE_RANK() OVER (ORDER BY us.total_points DESC) AS dense_rank,
    NOW() AS generated_at
FROM users u
         JOIN user_statistics us ON us.user_id = u.id
ORDER BY us.total_points DESC, us.level DESC;

-- ✅ Optional index for faster ORDER BY (materialized view alternative)
-- (Only if you want to later convert it into a materialized view)
CREATE INDEX IF NOT EXISTS idx_v_leaderboard_points ON user_statistics(total_points DESC);
