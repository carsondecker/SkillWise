-- ===========================================
-- Migration 008: Create Progress Events Table + Goal Completion Trigger (idempotent)
-- ===========================================

-- ✅ Create table if not exists
CREATE TABLE IF NOT EXISTS progress_events (
                                               id SERIAL PRIMARY KEY,
                                               user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL,
    event_data JSONB,
    points_earned INTEGER DEFAULT 0,
    related_goal_id INTEGER REFERENCES goals(id) ON DELETE SET NULL,
    related_challenge_id INTEGER REFERENCES challenges(id) ON DELETE SET NULL,
    related_submission_id INTEGER REFERENCES submissions(id) ON DELETE SET NULL,
    session_id VARCHAR(255),
    timestamp_occurred TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );

-- ✅ Create indexes
CREATE INDEX IF NOT EXISTS idx_progress_events_user_id ON progress_events(user_id);
CREATE INDEX IF NOT EXISTS idx_progress_events_type ON progress_events(event_type);
CREATE INDEX IF NOT EXISTS idx_progress_events_goal_id ON progress_events(related_goal_id);
CREATE INDEX IF NOT EXISTS idx_progress_events_challenge_id ON progress_events(related_challenge_id);
CREATE INDEX IF NOT EXISTS idx_progress_events_timestamp ON progress_events(timestamp_occurred);
CREATE INDEX IF NOT EXISTS idx_progress_events_session ON progress_events(session_id);

-- ✅ GIN index for JSONB
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND tablename = 'progress_events'
      AND indexname = 'idx_progress_events_data'
  ) THEN
CREATE INDEX idx_progress_events_data ON progress_events USING GIN(event_data);
END IF;
END $$;

-- ✅ Ensure updated_at column and trigger exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_attribute WHERE attrelid = 'progress_events'::regclass AND attname = 'updated_at'
  ) THEN
ALTER TABLE progress_events ADD COLUMN updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;
END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_progress_events_updated_at'
  ) THEN
CREATE TRIGGER update_progress_events_updated_at
    BEFORE UPDATE ON progress_events
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
END IF;
END $$;

-- -- ===========================================
-- -- 🧩 Trigger Function: log_goal_completion_event (fixed)
-- -- ===========================================
CREATE OR REPLACE FUNCTION log_goal_completion_event()
RETURNS TRIGGER AS $$
DECLARE
existing_event_id INT;
BEGIN
  -- Only fire when goal transitions from incomplete → complete
  IF NEW.is_completed = TRUE AND COALESCE(OLD.is_completed, FALSE) = FALSE THEN

    -- Check if a completion event already exists for this user + goal
SELECT id INTO existing_event_id
FROM progress_events
WHERE event_type = 'goal_completed'
  AND user_id = NEW.user_id
  AND related_goal_id = NEW.id
    LIMIT 1;

IF existing_event_id IS NULL THEN
      -- First-time completion → INSERT
      INSERT INTO progress_events (
        user_id,
        event_type,
        event_data,
        points_earned,
        related_goal_id,
        timestamp_occurred,
        created_at
      )
      VALUES (
        NEW.user_id,
        'goal_completed',
        jsonb_build_object(
          'goal_id', NEW.id,
          'title', NEW.title,
          'category', NEW.category,
          'difficulty_level', NEW.difficulty_level,
          'progress_percentage', NEW.progress_percentage,
          'completed_at', COALESCE(NEW.completion_date, NOW())
        ),
        COALESCE(NEW.points_reward, 0),
        NEW.id,
        NOW(),
        NOW()
      );
ELSE
      -- Goal was completed before → UPDATE existing row
UPDATE progress_events
SET
    event_data = jsonb_build_object(
            'goal_id', NEW.id,
            'title', NEW.title,
            'category', NEW.category,
            'difficulty_level', NEW.difficulty_level,
            'progress_percentage', NEW.progress_percentage,
            'completed_at', COALESCE(NEW.completion_date, NOW())
                 ),
    points_earned = COALESCE(NEW.points_reward, 0),
    timestamp_occurred = NOW(),
    updated_at = NOW()
WHERE id = existing_event_id;
END IF;
END IF;

RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ===========================================
-- 🧩 Trigger: tr_goal_completion_progress_event
-- ===========================================
DROP TRIGGER IF EXISTS tr_goal_completion_progress_event ON goals;

CREATE TRIGGER tr_goal_completion_progress_event
    AFTER UPDATE ON goals
    FOR EACH ROW
    EXECUTE FUNCTION log_goal_completion_event();
-- ------------
-- ===========================================
-- 🧩 Trigger Function: log_submission_created_event
-- ===========================================
DO $outer$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'log_submission_created_event'
  ) THEN
    EXECUTE $inner$
      CREATE OR REPLACE FUNCTION log_submission_created_event()
      RETURNS TRIGGER AS $$
BEGIN
        -- Insert a new progress event whenever a submission is created
INSERT INTO progress_events (
    user_id,
    event_type,
    event_data,
    points_earned,
    related_challenge_id,
    related_submission_id,
    timestamp_occurred,
    created_at
)
VALUES (
           NEW.user_id,
           'submission_created',
           jsonb_build_object(
                   'submission_id', NEW.id,
                   'challenge_id', NEW.challenge_id,
                   'status', NEW.status,
                   'attempt_number', NEW.attempt_number,
                   'submitted_at', COALESCE(NEW.submitted_at, NOW())
           ),
           0, -- default no points on submission creation
           NEW.challenge_id,
           NEW.id,
           NOW(),
           NOW()
       );
RETURN NEW;
END;
      $$ LANGUAGE plpgsql;
    $inner$;
END IF;
END $outer$;

-- ===========================================
-- 🧩 Trigger: tr_submission_created_progress_event
-- ===========================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'tr_submission_created_progress_event'
  ) THEN
CREATE TRIGGER tr_submission_created_progress_event
    AFTER INSERT ON submissions
    FOR EACH ROW
    EXECUTE FUNCTION log_submission_created_event();
END IF;
END $$;
