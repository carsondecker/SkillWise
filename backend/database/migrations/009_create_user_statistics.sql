-- ===========================================
-- Migration 009: Create User Statistics Table (idempotent)
-- ===========================================

-- ✅ Create table safely
CREATE TABLE IF NOT EXISTS user_statistics (
                                               id SERIAL PRIMARY KEY,
                                               user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    total_points INTEGER DEFAULT 0,
    total_challenges_completed INTEGER DEFAULT 0,
    total_goals_completed INTEGER DEFAULT 0,
    total_peer_reviews_given INTEGER DEFAULT 0,
    total_peer_reviews_received INTEGER DEFAULT 0,
    average_score DECIMAL(5,2) DEFAULT 0,
    current_streak_days INTEGER DEFAULT 0,
    longest_streak_days INTEGER DEFAULT 0,
    total_time_spent_minutes INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    experience_points INTEGER DEFAULT 0,
    rank_position INTEGER,
    last_activity_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                                                                                                        );

-- ✅ Create indexes safely
CREATE INDEX IF NOT EXISTS idx_user_stats_total_points ON user_statistics(total_points DESC);
CREATE INDEX IF NOT EXISTS idx_user_stats_level ON user_statistics(level DESC);
CREATE INDEX IF NOT EXISTS idx_user_stats_rank ON user_statistics(rank_position);
CREATE INDEX IF NOT EXISTS idx_user_stats_activity ON user_statistics(last_activity_date);

-- ✅ Add trigger for updated_at safely
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_user_statistics_updated_at'
  ) THEN
CREATE TRIGGER update_user_statistics_updated_at
    BEFORE UPDATE ON user_statistics
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
END IF;
END $$ LANGUAGE plpgsql;

-- ===========================================
-- 🧠 Trigger: Auto-create user_statistics on user insert
-- ===========================================

-- ✅ Create trigger function safely
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'create_user_statistics'
  ) THEN
    CREATE OR REPLACE FUNCTION create_user_statistics()
    RETURNS TRIGGER AS $func$
BEGIN
INSERT INTO user_statistics (user_id)
VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
RETURN NEW;
END;
    $func$ LANGUAGE plpgsql;
END IF;
END $$ LANGUAGE plpgsql;

-- ✅ Attach trigger to users table safely
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'after_user_insert_create_stats'
  ) THEN
CREATE TRIGGER after_user_insert_create_stats
    AFTER INSERT ON users
    FOR EACH ROW
    EXECUTE FUNCTION create_user_statistics();
END IF;
END $$ LANGUAGE plpgsql;
