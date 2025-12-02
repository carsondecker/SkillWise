-- ===========================================
-- Migration 015: Progress events for graded submissions & peer-reviewed challenges
-- ===========================================

-- 🔔 Trigger function: log submission graded events
CREATE OR REPLACE FUNCTION log_submission_graded_event()
RETURNS TRIGGER AS $$
DECLARE
  challenge_title TEXT;
  existing_event_id INT;
BEGIN
  IF NEW.status = 'graded' AND COALESCE(OLD.status, '') <> 'graded' THEN
    SELECT title
    INTO challenge_title
    FROM challenges
    WHERE id = NEW.challenge_id;

    SELECT id
    INTO existing_event_id
    FROM progress_events
    WHERE user_id = NEW.user_id
      AND event_type = 'submission_graded'
      AND related_submission_id = NEW.id
    LIMIT 1;

    IF existing_event_id IS NULL THEN
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
        'submission_graded',
        jsonb_build_object(
          'submission_id', NEW.id,
          'challenge_id', NEW.challenge_id,
          'challenge_title', COALESCE(challenge_title, 'Submission graded'),
          'status', NEW.status,
          'score', NEW.score,
          'points_earned', 0,
          'graded_at', COALESCE(NEW.updated_at, NOW())
        ),
        0,
        NEW.challenge_id,
        NEW.id,
        NOW(),
        NOW()
      );
    ELSE
      UPDATE progress_events
      SET event_data = jsonb_build_object(
            'submission_id', NEW.id,
            'challenge_id', NEW.challenge_id,
            'challenge_title', COALESCE(challenge_title, 'Submission graded'),
            'status', NEW.status,
            'score', NEW.score,
            'points_earned', 0,
            'graded_at', COALESCE(NEW.updated_at, NOW())
          ),
          points_earned = 0,
          related_challenge_id = NEW.challenge_id,
          timestamp_occurred = NOW(),
          updated_at = NOW()
      WHERE id = existing_event_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'tr_submission_graded_progress_event'
  ) THEN
    CREATE TRIGGER tr_submission_graded_progress_event
      AFTER UPDATE OF status ON submissions
      FOR EACH ROW
      WHEN (NEW.status = 'graded' AND OLD.status IS DISTINCT FROM NEW.status)
      EXECUTE FUNCTION log_submission_graded_event();
  END IF;
END $$;

-- 🔔 Trigger function: log peer-reviewed challenges
CREATE OR REPLACE FUNCTION log_challenge_peer_reviewed_event()
RETURNS TRIGGER AS $$
DECLARE
  target_user_id INT;
  latest_submission_id INT;
  existing_event_id INT;
BEGIN
  IF NEW.status = 'peer_reviewed' AND COALESCE(OLD.status, '') <> 'peer_reviewed' THEN
    -- Prefer the latest submission's author; fall back to challenge creator
    SELECT s.user_id, s.id
    INTO target_user_id, latest_submission_id
    FROM submissions s
    WHERE s.challenge_id = NEW.id
    ORDER BY s.submitted_at DESC
    LIMIT 1;

    target_user_id := COALESCE(target_user_id, NEW.created_by);

    IF target_user_id IS NOT NULL THEN
      SELECT id
      INTO existing_event_id
      FROM progress_events
      WHERE user_id = target_user_id
        AND event_type = 'challenge_peer_reviewed'
        AND related_challenge_id = NEW.id
      LIMIT 1;

      IF existing_event_id IS NULL THEN
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
          target_user_id,
          'challenge_peer_reviewed',
          jsonb_build_object(
            'challenge_id', NEW.id,
            'challenge_title', COALESCE(NEW.title, 'Challenge peer reviewed'),
            'status', NEW.status,
            'submission_id', latest_submission_id,
            'points_earned', 0,
            'reviewed_at', COALESCE(NEW.updated_at, NOW())
          ),
          0,
          NEW.id,
          latest_submission_id,
          NOW(),
          NOW()
        );
      ELSE
        UPDATE progress_events
        SET event_data = jsonb_build_object(
              'challenge_id', NEW.id,
              'challenge_title', COALESCE(NEW.title, 'Challenge peer reviewed'),
              'status', NEW.status,
              'submission_id', latest_submission_id,
              'points_earned', 0,
              'reviewed_at', COALESCE(NEW.updated_at, NOW())
            ),
            points_earned = 0,
            related_submission_id = latest_submission_id,
            timestamp_occurred = NOW(),
            updated_at = NOW()
        WHERE id = existing_event_id;
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'tr_challenge_peer_reviewed_progress_event'
  ) THEN
    CREATE TRIGGER tr_challenge_peer_reviewed_progress_event
      AFTER UPDATE OF status ON challenges
      FOR EACH ROW
      WHEN (NEW.status = 'peer_reviewed' AND OLD.status IS DISTINCT FROM NEW.status)
      EXECUTE FUNCTION log_challenge_peer_reviewed_event();
  END IF;
END $$;

-- 🔔 Trigger function: log challenge completed events
CREATE OR REPLACE FUNCTION log_challenge_completed_event()
RETURNS TRIGGER AS $$
DECLARE
  target_user_id INT;
  latest_submission_id INT;
  challenge_points INT;
  existing_event_id INT;
BEGIN
  IF NEW.status = 'completed' AND COALESCE(OLD.status, '') <> 'completed' THEN
    SELECT s.user_id, s.id
    INTO target_user_id, latest_submission_id
    FROM submissions s
    WHERE s.challenge_id = NEW.id
    ORDER BY s.submitted_at DESC
    LIMIT 1;

    target_user_id := COALESCE(target_user_id, NEW.created_by);

    SELECT points_reward INTO challenge_points FROM challenges WHERE id = NEW.id;

    IF target_user_id IS NOT NULL THEN
      SELECT id
      INTO existing_event_id
      FROM progress_events
      WHERE user_id = target_user_id
        AND event_type = 'challenge_completed'
        AND related_challenge_id = NEW.id
      LIMIT 1;

      IF existing_event_id IS NULL THEN
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
          target_user_id,
          'challenge_completed',
          jsonb_build_object(
            'challenge_id', NEW.id,
            'challenge_title', COALESCE(NEW.title, 'Challenge completed'),
            'status', NEW.status,
            'submission_id', latest_submission_id,
            'points_earned', COALESCE(challenge_points, 0),
            'completed_at', COALESCE(NEW.updated_at, NOW())
          ),
          COALESCE(challenge_points, 0),
          NEW.id,
          latest_submission_id,
          NOW(),
          NOW()
        );
      ELSE
        UPDATE progress_events
        SET event_data = jsonb_build_object(
              'challenge_id', NEW.id,
              'challenge_title', COALESCE(NEW.title, 'Challenge completed'),
              'status', NEW.status,
              'submission_id', latest_submission_id,
              'points_earned', COALESCE(challenge_points, 0),
              'completed_at', COALESCE(NEW.updated_at, NOW())
            ),
            points_earned = COALESCE(challenge_points, 0),
            related_submission_id = latest_submission_id,
            timestamp_occurred = NOW(),
            updated_at = NOW()
        WHERE id = existing_event_id;
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'tr_challenge_completed_progress_event'
  ) THEN
    CREATE TRIGGER tr_challenge_completed_progress_event
      AFTER UPDATE OF status ON challenges
      FOR EACH ROW
      WHEN (NEW.status = 'completed' AND OLD.status IS DISTINCT FROM NEW.status)
      EXECUTE FUNCTION log_challenge_completed_event();
  END IF;
END $$;
