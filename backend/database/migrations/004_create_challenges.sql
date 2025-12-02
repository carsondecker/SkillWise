-- ===========================================
-- Migration 004: Create challenges table (idempotent)
-- ===========================================

-- ✅ Create table if not exists
CREATE TABLE IF NOT EXISTS challenges (
                                          id SERIAL PRIMARY KEY,
                                          title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    instructions TEXT NOT NULL,
    category VARCHAR(100) NOT NULL,
    difficulty_level VARCHAR(20) DEFAULT 'medium',
    estimated_time_minutes INTEGER,
    points_reward INTEGER DEFAULT 10,
    max_attempts INTEGER DEFAULT 3,
    requires_peer_review BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    tags TEXT[],
    prerequisites TEXT[],
    learning_objectives TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                                                );

-- ✅ Add goal_id and ai_generated to challenges (if missing)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'challenges' AND column_name = 'goal_id'
  ) THEN
ALTER TABLE challenges
    ADD COLUMN goal_id INTEGER REFERENCES goals(id) ON DELETE CASCADE;
END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'challenges' AND column_name = 'ai_generated'
  ) THEN
ALTER TABLE challenges
    ADD COLUMN ai_generated BOOLEAN DEFAULT false;
END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'challenges' AND column_name = 'status'
  ) THEN
ALTER TABLE challenges
    ADD COLUMN status VARCHAR(20)
        DEFAULT 'pending'
        CHECK (status IN ('pending','in_progress','in_peer_review','peer_reviewed','completed','failed'));
END IF;
END $$;

-- ✅ Create indexes safely
CREATE INDEX IF NOT EXISTS idx_challenges_category ON challenges(category);
CREATE INDEX IF NOT EXISTS idx_challenges_difficulty ON challenges(difficulty_level);
CREATE INDEX IF NOT EXISTS idx_challenges_is_active ON challenges(is_active);
CREATE INDEX IF NOT EXISTS idx_challenges_created_by ON challenges(created_by);

-- ✅ Ensure GIN index for tags exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND tablename = 'challenges'
      AND indexname = 'idx_challenges_tags'
  ) THEN
CREATE INDEX idx_challenges_tags ON challenges USING GIN(tags);
END IF;
END $$;

-- ✅ Create trigger for updated_at only if not already present
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_challenges_updated_at'
  ) THEN
CREATE TRIGGER update_challenges_updated_at
    BEFORE UPDATE ON challenges
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
END IF;
END $$;
