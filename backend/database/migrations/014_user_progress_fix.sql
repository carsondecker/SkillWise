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
