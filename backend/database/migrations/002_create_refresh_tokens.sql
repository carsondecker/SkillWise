-- ===========================================
-- Migration 002: Create refresh_tokens table (idempotent)
-- ===========================================

-- ✅ Create table if not exists
CREATE TABLE IF NOT EXISTS refresh_tokens (
                                              id SERIAL PRIMARY KEY,
                                              token TEXT UNIQUE NOT NULL,
                                              user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_revoked BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                                                                                                );

-- ✅ Ensure column type is TEXT (if it was previously VARCHAR)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'refresh_tokens'
      AND column_name = 'token'
      AND data_type <> 'text'
  ) THEN
ALTER TABLE refresh_tokens
ALTER COLUMN token TYPE TEXT;
END IF;
END $$;

-- ✅ Create indexes safely
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token ON refresh_tokens(token);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);

-- ✅ Add unique constraint on user_id (safe check)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'unique_user_token'
  ) THEN
ALTER TABLE refresh_tokens ADD CONSTRAINT unique_user_token UNIQUE (user_id);
END IF;
END $$;

-- ✅ Create trigger for updated_at only if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_refresh_tokens_updated_at'
  ) THEN
CREATE TRIGGER update_refresh_tokens_updated_at
    BEFORE UPDATE ON refresh_tokens
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
END IF;
END $$;
