-- ===========================================
-- Migration 010: Create Leaderboard Table (idempotent)
-- ===========================================

-- ✅ Create table safely
CREATE TABLE IF NOT EXISTS leaderboard (
                                           id SERIAL PRIMARY KEY,
                                           user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    timeframe VARCHAR(20) NOT NULL, -- 'daily', 'weekly', 'monthly', 'all-time'
    rank_position INTEGER NOT NULL,
    points INTEGER NOT NULL DEFAULT 0,
    challenges_completed INTEGER DEFAULT 0,
    goals_completed INTEGER DEFAULT 0,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                                                                                             );

-- ✅ Create standard indexes safely
CREATE INDEX IF NOT EXISTS idx_leaderboard_user_timeframe ON leaderboard(user_id, timeframe);
CREATE INDEX IF NOT EXISTS idx_leaderboard_rank ON leaderboard(timeframe, rank_position);
CREATE INDEX IF NOT EXISTS idx_leaderboard_points ON leaderboard(timeframe, points DESC);
CREATE INDEX IF NOT EXISTS idx_leaderboard_period ON leaderboard(period_start, period_end);

-- ✅ Create unique composite index safely
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname = 'public'
      AND tablename = 'leaderboard'
      AND indexname = 'idx_leaderboard_unique_period'
  ) THEN
CREATE UNIQUE INDEX idx_leaderboard_unique_period
    ON leaderboard(user_id, timeframe, period_start);
END IF;
END $$;

-- ✅ Create updated_at trigger safely
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_leaderboard_updated_at'
  ) THEN
CREATE TRIGGER update_leaderboard_updated_at
    BEFORE UPDATE ON leaderboard
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
END IF;
END $$;
