-- 013_create_user_streaks.sql
-- Creates the user_streaks table and sync trigger to user_statistics.
-- Fully idempotent migration.

-- =======================================
-- Create Main Table
-- =======================================
CREATE TABLE IF NOT EXISTS user_streaks (
                                            id SERIAL PRIMARY KEY,
                                            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    current_streak INTEGER NOT NULL DEFAULT 0,
    longest_streak INTEGER NOT NULL DEFAULT 0,
    last_logged_date DATE,
    updated_at TIMESTAMP DEFAULT NOW()
    );

-- =======================================
-- Ensure Columns Exist (Reusable / Idempotent)
-- =======================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='user_streaks' AND column_name='current_streak'
    ) THEN
ALTER TABLE user_streaks ADD COLUMN current_streak INTEGER NOT NULL DEFAULT 0;
END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='user_streaks' AND column_name='longest_streak'
    ) THEN
ALTER TABLE user_streaks ADD COLUMN longest_streak INTEGER NOT NULL DEFAULT 0;
END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='user_streaks' AND column_name='last_logged_date'
    ) THEN
ALTER TABLE user_streaks ADD COLUMN last_logged_date DATE;
END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='user_streaks' AND column_name='updated_at'
    ) THEN
ALTER TABLE user_streaks ADD COLUMN updated_at TIMESTAMP DEFAULT NOW();
END IF;
END $$;

-- =======================================
-- Index
-- =======================================
CREATE INDEX IF NOT EXISTS idx_user_streaks_user_id
    ON user_streaks(user_id);

-- =======================================
-- Trigger Function (NO nested DO blocks)
-- =======================================
CREATE OR REPLACE FUNCTION sync_user_stats_from_streaks()
RETURNS TRIGGER AS $$
BEGIN
UPDATE user_statistics
SET
    current_streak_days = NEW.current_streak,
    longest_streak_days = NEW.longest_streak,
    last_activity_date = NOW(),
    updated_at = NOW()
WHERE user_id = NEW.user_id;

RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =======================================
-- Trigger Creation (idempotent)
-- =======================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'tr_sync_user_stats_from_streaks'
    ) THEN
CREATE TRIGGER tr_sync_user_stats_from_streaks
    AFTER INSERT OR UPDATE ON user_streaks
                        FOR EACH ROW
                        EXECUTE FUNCTION sync_user_stats_from_streaks();
END IF;
END $$;
