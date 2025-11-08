-- ===========================================
-- Migration 008: Create Progress Events Table (idempotent)
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
    timestamp_occurred TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                                                                                                 );

-- ✅ Create standard indexes safely
CREATE INDEX IF NOT EXISTS idx_progress_events_user_id ON progress_events(user_id);
CREATE INDEX IF NOT EXISTS idx_progress_events_type ON progress_events(event_type);
CREATE INDEX IF NOT EXISTS idx_progress_events_goal_id ON progress_events(related_goal_id);
CREATE INDEX IF NOT EXISTS idx_progress_events_challenge_id ON progress_events(related_challenge_id);
CREATE INDEX IF NOT EXISTS idx_progress_events_timestamp ON progress_events(timestamp_occurred);
CREATE INDEX IF NOT EXISTS idx_progress_events_session ON progress_events(session_id);

-- ✅ Create GIN index for event_data JSONB safely
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

-- ✅ Optional: Add a trigger for updated_at consistency (if needed)
-- (Not all events are updated, so this is optional — but safe to include)
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
