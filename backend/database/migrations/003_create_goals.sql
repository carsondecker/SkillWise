-- ===========================================
-- Migration 003: Create goals table (idempotent)
-- ===========================================

-- ✅ Create table if not exists
CREATE TABLE IF NOT EXISTS goals (
                                     id SERIAL PRIMARY KEY,
                                     user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    difficulty_level VARCHAR(20) DEFAULT 'medium',
    target_completion_date DATE,
    is_completed BOOLEAN DEFAULT false,
    completion_date TIMESTAMP WITH TIME ZONE,
                                                                                       progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
    points_reward INTEGER DEFAULT 0,
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                                                                                       );

-- ✅ Create indexes safely
CREATE INDEX IF NOT EXISTS idx_goals_user_id ON goals(user_id);
CREATE INDEX IF NOT EXISTS idx_goals_category ON goals(category);
CREATE INDEX IF NOT EXISTS idx_goals_difficulty ON goals(difficulty_level);
CREATE INDEX IF NOT EXISTS idx_goals_is_completed ON goals(is_completed);
CREATE INDEX IF NOT EXISTS idx_goals_completion_date ON goals(completion_date);

-- ✅ Safely handle schema evolution
DO $$
BEGIN
  -- Add target_date column only if missing
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'goals'
      AND column_name = 'target_date'
  ) THEN
ALTER TABLE goals ADD COLUMN target_date TIMESTAMPTZ;
END IF;

  -- Drop legacy column if it still exists
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'goals'
      AND column_name = 'target_completion_date'
  ) THEN
ALTER TABLE goals DROP COLUMN target_completion_date;
END IF;
END $$;

-- ✅ Create updated_at trigger only if it doesn’t already exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_goals_updated_at'
  ) THEN
CREATE TRIGGER update_goals_updated_at
    BEFORE UPDATE ON goals
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
END IF;
END $$;
