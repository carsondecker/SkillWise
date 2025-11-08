-- ===========================================
-- Migration 011: Create Achievements & User_Achievements Tables (idempotent)
-- ===========================================

-- ✅ Create main achievements table
CREATE TABLE IF NOT EXISTS achievements (
                                            id SERIAL PRIMARY KEY,
                                            name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(100) NOT NULL,
    badge_icon VARCHAR(255),
    points_reward INTEGER DEFAULT 0,
    criteria JSONB NOT NULL,
    is_active BOOLEAN DEFAULT true,
    rarity VARCHAR(20) DEFAULT 'common', -- common, rare, epic, legendary
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                             );

-- ✅ Create user_achievements junction table
CREATE TABLE IF NOT EXISTS user_achievements (
                                                 id SERIAL PRIMARY KEY,
                                                 user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    achievement_id INTEGER NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
    earned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                                                                                                   progress_data JSONB,
                                                                                                   is_displayed BOOLEAN DEFAULT true
                                                                                                   );

-- ✅ Create indexes for achievements (safe re-run)
CREATE INDEX IF NOT EXISTS idx_achievements_category ON achievements(category);
CREATE INDEX IF NOT EXISTS idx_achievements_rarity ON achievements(rarity);
CREATE INDEX IF NOT EXISTS idx_achievements_is_active ON achievements(is_active);

-- ✅ Create indexes for user_achievements (safe re-run)
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_achievement_id ON user_achievements(achievement_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_earned_at ON user_achievements(earned_at);

-- ✅ Create unique composite index safely
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname = 'public'
      AND tablename = 'user_achievements'
      AND indexname = 'idx_user_achievements_unique'
  ) THEN
CREATE UNIQUE INDEX idx_user_achievements_unique
    ON user_achievements(user_id, achievement_id);
END IF;
END $$;

-- ✅ Create updated_at trigger safely for achievements
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_achievements_updated_at'
  ) THEN
CREATE TRIGGER update_achievements_updated_at
    BEFORE UPDATE ON achievements
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
END IF;
END $$;
