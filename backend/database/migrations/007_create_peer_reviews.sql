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
