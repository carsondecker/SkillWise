-- Migration 014: Add user_id to challenges and backfill from created_by

ALTER TABLE challenges ADD COLUMN IF NOT EXISTS user_id INTEGER;

-- Backfill user_id from created_by when available
UPDATE challenges SET user_id = created_by WHERE created_by IS NOT NULL;

-- Enforce foreign key constraint and not-null if all rows have values
ALTER TABLE challenges
  ADD CONSTRAINT fk_challenges_user
  FOREIGN KEY (user_id) REFERENCES users(id);

-- If appropriate, make user_id NOT NULL. This will fail if any NULLs remain.
-- ALTER TABLE challenges ALTER COLUMN user_id SET NOT NULL;

-- Index for lookups per-user
CREATE INDEX IF NOT EXISTS idx_challenges_user_id ON challenges(user_id);
