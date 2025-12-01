-- ===========================================
-- Migration 013: Ensure `updated_at` + trigger on `challenges` (idempotent)
-- ===========================================

-- Add the `updated_at` column if it doesn't exist (safe to run multiple times)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'challenges'
      AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE challenges
      ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
  END IF;
END $$;

-- Ensure the update_updated_at_column() function exists (created by migration 001)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column'
  ) THEN
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $func$
BEGIN
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
      EXCEPTION WHEN undefined_column THEN
        -- If the column doesn't exist, swallow the error so the trigger is resilient.
        NULL;
      END;
      RETURN NEW;
END;
    $func$ LANGUAGE plpgsql;
  END IF;
END $$ LANGUAGE plpgsql;

-- Create the trigger for challenges if it doesn't already exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_challenges_updated_at'
  ) THEN
    CREATE TRIGGER update_challenges_updated_at
      BEFORE UPDATE ON challenges
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;
