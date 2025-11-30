-- ===========================================
-- Migration 012: Establish Goal → Challenge → Progress Hierarchy (Fixed)
-- ===========================================


-- ===========================================
-- 1️⃣ Create user_progress table
-- ===========================================
CREATE TABLE IF NOT EXISTS user_progress (
                                             id SERIAL PRIMARY KEY,
                                             user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    goal_id INTEGER NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
    total_challenges INTEGER DEFAULT 0,
    completed_challenges INTEGER DEFAULT 0,
    progress_percent INTEGER DEFAULT 0 CHECK (progress_percent BETWEEN 0 AND 100),
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, goal_id)
    );

CREATE INDEX IF NOT EXISTS idx_user_progress_user_goal ON user_progress(user_id, goal_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_percent ON user_progress(progress_percent);

-- timestamp trigger
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_user_progress_timestamp'
  ) THEN
CREATE TRIGGER update_user_progress_timestamp
    BEFORE UPDATE ON user_progress
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
END IF;
END $$;


-- ===========================================
-- 2️⃣ DEFINE ALL FUNCTIONS FIRST
-- ===========================================

-- ----------------------------
-- Progress calculation function
-- ----------------------------
CREATE OR REPLACE FUNCTION sync_goal_progress(p_goal_id INT, p_user_id INT)
RETURNS VOID AS $$
DECLARE
total_ch INT;
  completed_ch INT;
  percent INT;
BEGIN
SELECT COUNT(*) INTO total_ch
FROM challenges
WHERE goal_id = p_goal_id AND created_by = p_user_id;

SELECT COUNT(*) INTO completed_ch
FROM challenges
WHERE goal_id = p_goal_id AND created_by = p_user_id AND status = 'completed';

IF total_ch > 0 THEN
    percent := ROUND((completed_ch::DECIMAL / total_ch::DECIMAL) * 100);
ELSE
    percent := 0;
END IF;

INSERT INTO user_progress (user_id, goal_id, total_challenges, completed_challenges, progress_percent)
VALUES (p_user_id, p_goal_id, total_ch, completed_ch, percent)
    ON CONFLICT (user_id, goal_id)
  DO UPDATE SET
    total_challenges = EXCLUDED.total_challenges,
             completed_challenges = EXCLUDED.completed_challenges,
             progress_percent = EXCLUDED.progress_percent,
             updated_at = CURRENT_TIMESTAMP;

UPDATE goals
SET progress_percentage = percent,
    is_completed = (percent = 100),
    updated_at = NOW()
WHERE id = p_goal_id;
END;
$$ LANGUAGE plpgsql;


-- Trigger wrapper for UPDATE/INSERT events
CREATE OR REPLACE FUNCTION trigger_sync_goal_progress_fn()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM sync_goal_progress(NEW.goal_id, NEW.created_by);
RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- Trigger wrapper for DELETE
CREATE OR REPLACE FUNCTION trigger_sync_goal_progress_delete_fn()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM sync_goal_progress(OLD.goal_id, OLD.created_by);
RETURN OLD;
END;
$$ LANGUAGE plpgsql;


-- ===========================================
-- 3️⃣ NOW CREATE TRIGGERS SAFELY
-- ===========================================

-- on UPDATE status
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_sync_goal_progress'
  ) THEN
CREATE TRIGGER trigger_sync_goal_progress
    AFTER UPDATE OF status ON challenges
    FOR EACH ROW
    WHEN (OLD.status IS DISTINCT FROM NEW.status)
      EXECUTE FUNCTION trigger_sync_goal_progress_fn();
END IF;
END $$;

-- on INSERT challenge
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_sync_goal_progress_insert'
  ) THEN
CREATE TRIGGER trigger_sync_goal_progress_insert
    AFTER INSERT ON challenges
    FOR EACH ROW
    EXECUTE FUNCTION trigger_sync_goal_progress_fn();
END IF;
END $$;

-- on DELETE challenge
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_sync_goal_progress_delete'
  ) THEN
CREATE TRIGGER trigger_sync_goal_progress_delete
    AFTER DELETE ON challenges
    FOR EACH ROW
    EXECUTE FUNCTION trigger_sync_goal_progress_delete_fn();
END IF;
END $$;



-- ===========================================
-- 4️⃣ POINTS SYNC (same ordering rules)
-- ===========================================

-- Main points function
CREATE OR REPLACE FUNCTION sync_goal_points(p_goal_id INT)
RETURNS VOID AS $$
DECLARE
total_points INT;
BEGIN
SELECT COALESCE(SUM(points_reward), 0)
INTO total_points
FROM challenges
WHERE goal_id = p_goal_id;

UPDATE goals
SET points_reward = total_points,
    updated_at = NOW()
WHERE id = p_goal_id;
END;
$$ LANGUAGE plpgsql;


-- Wrapper: insert
CREATE OR REPLACE FUNCTION trigger_sync_goal_points_insert_fn()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM sync_goal_points(NEW.goal_id);
RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Wrapper: update
CREATE OR REPLACE FUNCTION trigger_sync_goal_points_update_fn()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.points_reward IS DISTINCT FROM OLD.points_reward
      OR NEW.goal_id IS DISTINCT FROM OLD.goal_id THEN
      PERFORM sync_goal_points(NEW.goal_id);
END IF;
RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Wrapper: delete
CREATE OR REPLACE FUNCTION trigger_sync_goal_points_delete_fn()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM sync_goal_points(OLD.goal_id);
RETURN OLD;
END;
$$ LANGUAGE plpgsql;


-- Now add triggers

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_sync_goal_points_insert'
  ) THEN
CREATE TRIGGER trigger_sync_goal_points_insert
    AFTER INSERT ON challenges
    FOR EACH ROW
    EXECUTE FUNCTION trigger_sync_goal_points_insert_fn();
END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_sync_goal_points_update'
  ) THEN
CREATE TRIGGER trigger_sync_goal_points_update
    AFTER UPDATE ON challenges
    FOR EACH ROW
    EXECUTE FUNCTION trigger_sync_goal_points_update_fn();
END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_sync_goal_points_delete'
  ) THEN
CREATE TRIGGER trigger_sync_goal_points_delete
    AFTER DELETE ON challenges
    FOR EACH ROW
    EXECUTE FUNCTION trigger_sync_goal_points_delete_fn();
END IF;
END $$;

-- ===========================================
-- ✅ Migration Complete
-- ===========================================
