-- ===========================================
-- Migration 007: Create Peer Reviews Table (idempotent)
-- ===========================================

-- ✅ Create table if not exists
CREATE TABLE IF NOT EXISTS peer_reviews (
                                            id SERIAL PRIMARY KEY,
                                            reviewer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reviewee_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    submission_id INTEGER NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
    review_text TEXT NOT NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    criteria_scores JSONB,
    time_spent_minutes INTEGER,
    is_anonymous BOOLEAN DEFAULT true,
    is_completed BOOLEAN DEFAULT false,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                                                                                                  );

-- ✅ Create indexes safely
CREATE INDEX IF NOT EXISTS idx_peer_reviews_reviewer_id ON peer_reviews(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_peer_reviews_reviewee_id ON peer_reviews(reviewee_id);
CREATE INDEX IF NOT EXISTS idx_peer_reviews_submission_id ON peer_reviews(submission_id);
CREATE INDEX IF NOT EXISTS idx_peer_reviews_is_completed ON peer_reviews(is_completed);

-- ✅ Create unique composite index safely
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND tablename = 'peer_reviews'
      AND indexname = 'idx_peer_reviews_unique'
  ) THEN
CREATE UNIQUE INDEX idx_peer_reviews_unique
    ON peer_reviews(reviewer_id, submission_id);
END IF;
END $$;

-- ✅ Create trigger for updated_at only if not already defined
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_peer_reviews_updated_at'
  ) THEN
CREATE TRIGGER update_peer_reviews_updated_at
    BEFORE UPDATE ON peer_reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
END IF;
END $$;
-- ======================================================
-- 🔥 Function: Update challenge status after peer review
-- ======================================================
CREATE OR REPLACE FUNCTION mark_challenge_peer_reviewed_fn()
RETURNS TRIGGER AS $$
DECLARE
challenge_id INT;
  current_status TEXT;
BEGIN
  -- 1️⃣ Get challenge_id from submission
SELECT s.challenge_id INTO challenge_id
FROM submissions s
WHERE s.id = NEW.submission_id;

IF challenge_id IS NULL THEN
    RETURN NEW;
END IF;

  -- 2️⃣ Get current challenge status
SELECT status INTO current_status
FROM challenges
WHERE id = challenge_id;

-- 3️⃣ Only update if the status is 'in_peer_review'
IF current_status = 'in_peer_review' THEN
UPDATE challenges
SET status = 'peer_reviewed',
    updated_at = NOW()
WHERE id = challenge_id;
END IF;

RETURN NEW;
END;
$$ LANGUAGE plpgsql;
-- ======================================================
-- 🔥 Trigger: When a peer review is created, update challenge status
-- ======================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'trigger_mark_challenge_peer_reviewed'
  ) THEN
CREATE TRIGGER trigger_mark_challenge_peer_reviewed
    AFTER INSERT ON peer_reviews
    FOR EACH ROW
    EXECUTE FUNCTION mark_challenge_peer_reviewed_fn();
END IF;
END $$;
