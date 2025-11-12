-- ===========================================
-- Migration 005: Create submissions table (idempotent)
-- ===========================================

-- ✅ Create table if not exists
CREATE TABLE IF NOT EXISTS submissions (
                                           id SERIAL PRIMARY KEY,
                                           user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    challenge_id INTEGER NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
    submission_text TEXT NOT NULL,
    submission_files JSONB,
    status VARCHAR(20) DEFAULT 'submitted',
    score INTEGER CHECK (score >= 0 AND score <= 100),
    attempt_number INTEGER DEFAULT 1,
    time_spent_minutes INTEGER,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    graded_at TIMESTAMP WITH TIME ZONE,
                                                                                             graded_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    feedback TEXT,
    is_flagged BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                                                                                             );

-- ✅ Create indexes safely
CREATE INDEX IF NOT EXISTS idx_submissions_user_id ON submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_submissions_challenge_id ON submissions(challenge_id);
CREATE INDEX IF NOT EXISTS idx_submissions_status ON submissions(status);
CREATE INDEX IF NOT EXISTS idx_submissions_submitted_at ON submissions(submitted_at);

-- ✅ Create unique composite index safely
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND tablename = 'submissions'
      AND indexname = 'idx_submissions_user_challenge_attempt'
  ) THEN
CREATE UNIQUE INDEX idx_submissions_user_challenge_attempt
    ON submissions(user_id, challenge_id, attempt_number);
END IF;
END $$;

-- ✅ Create trigger for updated_at only if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_submissions_updated_at'
  ) THEN
CREATE TRIGGER update_submissions_updated_at
    BEFORE UPDATE ON submissions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
END IF;
END $$;
