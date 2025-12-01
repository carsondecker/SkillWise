-- ===========================================
-- Migration 013: Replace update_updated_at_column() with safe implementation
-- Ensures trigger function does not assume a specific timestamp column name
-- Idempotent: uses CREATE OR REPLACE so it can be executed on existing DBs
-- ===========================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $func$
DECLARE
  has_updated_at BOOLEAN;
  has_last_updated BOOLEAN;
BEGIN
  -- check whether the table has an updated_at column
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = TG_TABLE_NAME
      AND column_name = 'updated_at'
  ) INTO has_updated_at;

  -- check whether the table has a last_updated column (alternate name)
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = TG_TABLE_NAME
      AND column_name = 'last_updated'
  ) INTO has_last_updated;

  IF has_updated_at THEN
    NEW.updated_at = CURRENT_TIMESTAMP;
  ELSIF has_last_updated THEN
    NEW.last_updated = CURRENT_TIMESTAMP;
  END IF;

  RETURN NEW;
END;
$func$ LANGUAGE plpgsql;

-- Note: This migration intentionally replaces the function to make it safe
-- for existing tables that use a different timestamp column name (e.g. last_updated).
-- ===========================================
-- Migration 013: Replace update_updated_at_column() with safe implementation
-- Ensures trigger function does not assume a specific timestamp column name
-- Idempotent: uses CREATE OR REPLACE so it can be executed on existing DBs
-- ===========================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $func$
DECLARE
  has_updated_at BOOLEAN;
  has_last_updated BOOLEAN;
BEGIN
  -- check whether the table has an updated_at column
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = TG_TABLE_NAME
      AND column_name = 'updated_at'
  ) INTO has_updated_at;

  -- check whether the table has a last_updated column (alternate name)
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = TG_TABLE_NAME
      AND column_name = 'last_updated'
  ) INTO has_last_updated;

  IF has_updated_at THEN
    NEW.updated_at = CURRENT_TIMESTAMP;
  ELSIF has_last_updated THEN
    NEW.last_updated = CURRENT_TIMESTAMP;
  END IF;

  RETURN NEW;
END;
$func$ LANGUAGE plpgsql;

-- Note: This migration intentionally replaces the function to make it safe
-- for existing tables that use a different timestamp column name (e.g. last_updated).
