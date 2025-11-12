-- ===========================================
-- Migration 012: Establish Goal → Challenge → Progress Hierarchy (Fixed)
-- ===========================================

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
        CHECK (status IN ('pending','in_progress','completed','failed'));
END IF;
END $$;


-- ✅ Create user_progress table (idempotent)
CREATE TABLE IF NOT EXISTS user_progress (
                                             id SERIAL PRIMARY KEY,
                                             user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    goal_id INTEGER NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
    total_challenges INTEGER DEFAULT 0,
    completed_challenges INTEGER DEFAULT 0,
    progress_percent INTEGER DEFAULT 0 CHECK (progress_percent BETWEEN 0 AND 100),
    last_updated TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, goal_id)
    );

CREATE INDEX IF NOT EXISTS idx_user_progress_user_goal ON user_progress(user_id, goal_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_percent ON user_progress(progress_percent);


-- ✅ Ensure timestamp trigger on user_progress
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
-- ⚙️ Progress Sync Logic
-- ===========================================

-- ✅ Function: Recalculate goal progress
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
             last_updated = CURRENT_TIMESTAMP;

UPDATE goals
SET progress_percentage = percent,
    is_completed = (percent = 100),
    completion_date = CASE WHEN percent = 100 THEN NOW() ELSE NULL END
WHERE id = p_goal_id;
END;
$$ LANGUAGE plpgsql;


-- ✅ Create trigger wrapper function (this is what the trigger calls)
CREATE OR REPLACE FUNCTION trigger_sync_goal_progress_fn()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM sync_goal_progress(NEW.goal_id, NEW.created_by);
RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- ✅ Create trigger safely
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

-- ===========================================
-- ✅ Migration Complete
-- ===========================================
