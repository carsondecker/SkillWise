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

------------------------------------------
DO $outer$
BEGIN
  -- ✅ Create the trigger function only if it doesn't already exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'update_user_stats_on_goal_completion'
  ) THEN
    EXECUTE $body$
      CREATE OR REPLACE FUNCTION update_user_stats_on_goal_completion()
RETURNS TRIGGER AS $$
BEGIN
  -- Only fire when transitioning to completed
  IF NEW.is_completed = TRUE AND (OLD.is_completed IS DISTINCT FROM TRUE) THEN

UPDATE user_statistics
SET
    total_goals_completed = (
        SELECT COUNT(*)
        FROM goals
        WHERE user_id = NEW.user_id AND is_completed = TRUE
    ),

    total_points = (
        SELECT
            COALESCE(SUM(points_reward), 0)
        FROM challenges
        WHERE created_by = NEW.user_id AND status = 'completed'
    ),

    last_activity_date = NOW(),
    updated_at = NOW()
WHERE user_id = NEW.user_id;

END IF;

RETURN NEW;
END;
$$ LANGUAGE plpgsql;
    $body$;
END IF;
END $outer$;

-- ✅ Create the trigger only if it doesn’t already exist
DO $outer$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'tr_update_user_stats_on_goal_completion'
  ) THEN
CREATE TRIGGER tr_update_user_stats_on_goal_completion
    AFTER UPDATE OF is_completed ON goals
    FOR EACH ROW
    WHEN (NEW.is_completed = TRUE)
    EXECUTE FUNCTION update_user_stats_on_goal_completion();
END IF;
END $outer$;
------------------------------------------
DO $outer$
BEGIN
  -- Create function only if it doesn't already exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'update_user_stats_on_challenge_completion'
  ) THEN
    EXECUTE $body$
      CREATE OR REPLACE FUNCTION update_user_stats_on_challenge_completion()
RETURNS TRIGGER AS $$
BEGIN
  -- Only fire when transitioning into completed
  IF NEW.status = 'completed' AND (OLD.status IS DISTINCT FROM 'completed') THEN

UPDATE user_statistics
SET
    total_challenges_completed = (
        SELECT COUNT(*)
        FROM challenges
        WHERE created_by = NEW.created_by AND status = 'completed'
    ),

    total_points = (
        SELECT COALESCE(SUM(points_reward), 0)
        FROM challenges
        WHERE created_by = NEW.created_by AND status = 'completed'
    ),

    last_activity_date = NOW(),
    updated_at = NOW()
WHERE user_id = NEW.created_by;

END IF;

RETURN NEW;
END;
$$ LANGUAGE plpgsql;
    $body$;
END IF;
END $outer$;
-- ✅ Create trigger only if it doesn’t already exist
DO $outer$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'tr_update_user_stats_on_challenge_completion'
  ) THEN
CREATE TRIGGER tr_update_user_stats_on_challenge_completion
    AFTER UPDATE OF status ON challenges
    FOR EACH ROW
    WHEN (NEW.status = 'completed')
    EXECUTE FUNCTION update_user_stats_on_challenge_completion();
END IF;
END $outer$;

-- ===========================================
-- 🧠 Trigger Function: Update user_statistics from user_progress changes
-- ===========================================
-- ✅ Create function safely
CREATE OR REPLACE FUNCTION update_user_statistics_from_progress()
RETURNS TRIGGER AS $$
DECLARE
v_user_id INT;
BEGIN
  -- Pick correct user_id based on operation
  IF TG_OP = 'DELETE' THEN
      v_user_id := OLD.user_id;
ELSE
      v_user_id := NEW.user_id;
END IF;

  -- Update the user's aggregated statistics
UPDATE user_statistics
SET
    total_challenges_completed = (
        SELECT COALESCE(SUM(completed_challenges), 0)
        FROM user_progress
        WHERE user_id = v_user_id
    ),
    total_goals_completed = (
        SELECT COUNT(*)
        FROM user_progress
        WHERE user_id = v_user_id AND progress_percent = 100
    ),
    last_activity_date = NOW(),
    updated_at = NOW()
WHERE user_id = v_user_id;

RETURN NEW;
END;
$$ LANGUAGE plpgsql;
-- ===========================================
-- 🧩 Triggers: Update user_statistics on user_progress changes
-- ===========================================
-- INSERT trigger
DO $$
BEGIN
  IF NOT EXISTS (
      SELECT 1 FROM pg_trigger
      WHERE tgname = 'tr_user_progress_insert_update_stats'
  ) THEN
CREATE TRIGGER tr_user_progress_insert_update_stats
    AFTER INSERT ON user_progress
    FOR EACH ROW
    EXECUTE FUNCTION update_user_statistics_from_progress();
END IF;
END $$;


-- UPDATE trigger
DO $$
BEGIN
  IF NOT EXISTS (
      SELECT 1 FROM pg_trigger
      WHERE tgname = 'tr_user_progress_update_update_stats'
  ) THEN
CREATE TRIGGER tr_user_progress_update_update_stats
    AFTER UPDATE ON user_progress
    FOR EACH ROW
    EXECUTE FUNCTION update_user_statistics_from_progress();
END IF;
END $$;


-- DELETE trigger
DO $$
BEGIN
  IF NOT EXISTS (
      SELECT 1 FROM pg_trigger
      WHERE tgname = 'tr_user_progress_delete_update_stats'
  ) THEN
CREATE TRIGGER tr_user_progress_delete_update_stats
    AFTER DELETE ON user_progress
    FOR EACH ROW
    EXECUTE FUNCTION update_user_statistics_from_progress();
END IF;
END $$;
