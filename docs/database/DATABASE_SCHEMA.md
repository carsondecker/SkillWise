# Database Schema Design

## Overview

SkillWise uses PostgreSQL as the primary database. The schema is designed to support user authentication, goal management, challenge tracking, AI feedback, peer reviews, and leaderboard functionality.

## Core Tables

### Users Table

Stores user account information and authentication data.

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  bio TEXT,
  avatar_url VARCHAR(500),
  email_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login_at TIMESTAMP WITH TIME ZONE
);

-- Indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_created_at ON users(created_at);
```

### Refresh Tokens Table

Manages JWT refresh tokens for secure authentication.

```sql
CREATE TABLE refresh_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_revoked BOOLEAN DEFAULT FALSE
);

-- Indexes
CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);
CREATE UNIQUE INDEX idx_refresh_tokens_token_hash ON refresh_tokens(token_hash);
```

### Goals Table

Stores learning goals created by users.

```sql
CREATE TYPE goal_status AS ENUM ('active', 'completed', 'paused', 'cancelled');
CREATE TYPE difficulty_level AS ENUM ('beginner', 'intermediate', 'advanced');

CREATE TABLE goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  difficulty difficulty_level DEFAULT 'intermediate',
  target_date DATE,
  status goal_status DEFAULT 'active',
  progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Indexes
CREATE INDEX idx_goals_user_id ON goals(user_id);
CREATE INDEX idx_goals_status ON goals(status);
CREATE INDEX idx_goals_category ON goals(category);
CREATE INDEX idx_goals_created_at ON goals(created_at);
```

### Challenges Table

Individual challenges within learning goals.

```sql
CREATE TYPE challenge_status AS ENUM ('todo', 'in_progress', 'completed', 'skipped');
CREATE TYPE challenge_source AS ENUM ('user_created', 'ai_generated', 'template');

CREATE TABLE challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id UUID NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  difficulty difficulty_level DEFAULT 'intermediate',
  status challenge_status DEFAULT 'todo',
  source challenge_source DEFAULT 'user_created',
  estimated_time_hours INTEGER,
  order_index INTEGER,
  requirements JSONB,
  resources JSONB,
  prerequisites JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Indexes
CREATE INDEX idx_challenges_goal_id ON challenges(goal_id);
CREATE INDEX idx_challenges_status ON challenges(status);
CREATE INDEX idx_challenges_order_index ON challenges(goal_id, order_index);
CREATE INDEX idx_challenges_created_at ON challenges(created_at);
```

### Submissions Table

User work submissions for challenges.

```sql
CREATE TYPE submission_type AS ENUM ('code', 'text', 'link', 'file');
CREATE TYPE submission_status AS ENUM ('draft', 'submitted', 'reviewed', 'revision_requested');

CREATE TABLE submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id UUID NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type submission_type NOT NULL,
  content TEXT,
  file_url VARCHAR(500),
  explanation TEXT,
  status submission_status DEFAULT 'submitted',
  score INTEGER CHECK (score >= 0 AND score <= 100),
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reviewed_at TIMESTAMP WITH TIME ZONE,

  -- Ensure one submission per user per challenge
  UNIQUE(challenge_id, user_id)
);

-- Indexes
CREATE INDEX idx_submissions_challenge_id ON submissions(challenge_id);
CREATE INDEX idx_submissions_user_id ON submissions(user_id);
CREATE INDEX idx_submissions_status ON submissions(status);
CREATE INDEX idx_submissions_submitted_at ON submissions(submitted_at);
```

### AI Feedback Table

AI-generated feedback for submissions.

```sql
CREATE TABLE ai_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  overall_feedback TEXT,
  score INTEGER CHECK (score >= 0 AND score <= 100),
  positive_points JSONB DEFAULT '[]',
  improvement_areas JSONB DEFAULT '[]',
  suggestions JSONB DEFAULT '[]',
  prompt_used TEXT,
  ai_model VARCHAR(100),
  processing_time_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_ai_feedback_submission_id ON ai_feedback(submission_id);
CREATE INDEX idx_ai_feedback_created_at ON ai_feedback(created_at);
```

### Peer Reviews Table

Peer review system for submissions.

```sql
CREATE TYPE review_status AS ENUM ('assigned', 'in_progress', 'completed', 'skipped');

CREATE TABLE peer_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  positive_feedback TEXT,
  improvement_feedback TEXT,
  specific_feedback TEXT,
  criteria_scores JSONB, -- {meetsRequirements: true, wellCommented: false, ...}
  status review_status DEFAULT 'assigned',
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  deadline_at TIMESTAMP WITH TIME ZONE,

  -- Prevent self-review
  CHECK (reviewer_id != (SELECT user_id FROM submissions WHERE id = submission_id))
);

-- Indexes
CREATE INDEX idx_peer_reviews_submission_id ON peer_reviews(submission_id);
CREATE INDEX idx_peer_reviews_reviewer_id ON peer_reviews(reviewer_id);
CREATE INDEX idx_peer_reviews_status ON peer_reviews(status);
CREATE INDEX idx_peer_reviews_assigned_at ON peer_reviews(assigned_at);
```

### Progress Tracking Table

Detailed progress tracking for users.

```sql
CREATE TABLE progress_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  goal_id UUID REFERENCES goals(id) ON DELETE CASCADE,
  challenge_id UUID REFERENCES challenges(id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL, -- 'goal_created', 'challenge_completed', 'milestone_reached'
  event_data JSONB,
  points_awarded INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_progress_events_user_id ON progress_events(user_id);
CREATE INDEX idx_progress_events_goal_id ON progress_events(goal_id);
CREATE INDEX idx_progress_events_event_type ON progress_events(event_type);
CREATE INDEX idx_progress_events_created_at ON progress_events(created_at);
```

### User Statistics Table

Aggregated user statistics for performance.

```sql
CREATE TABLE user_statistics (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  total_points INTEGER DEFAULT 0,
  challenges_completed INTEGER DEFAULT 0,
  goals_completed INTEGER DEFAULT 0,
  current_streak_days INTEGER DEFAULT 0,
  longest_streak_days INTEGER DEFAULT 0,
  last_activity_date DATE,
  average_score DECIMAL(5,2) DEFAULT 0,
  peer_reviews_given INTEGER DEFAULT 0,
  peer_reviews_received INTEGER DEFAULT 0,
  average_review_rating DECIMAL(3,2),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- This table is updated via triggers and background jobs
```

### Leaderboard Table

Computed leaderboard data for different scopes and timeframes.

```sql
CREATE TYPE leaderboard_scope AS ENUM ('global', 'category', 'friends');
CREATE TYPE leaderboard_timeframe AS ENUM ('all_time', 'monthly', 'weekly', 'daily');

CREATE TABLE leaderboard_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  scope leaderboard_scope NOT NULL,
  category VARCHAR(100), -- NULL for global scope
  timeframe leaderboard_timeframe NOT NULL,
  rank INTEGER NOT NULL,
  points INTEGER NOT NULL,
  challenges_completed INTEGER DEFAULT 0,
  average_score DECIMAL(5,2) DEFAULT 0,
  computed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Unique constraint for scope/category/timeframe/user combination
  UNIQUE(scope, category, timeframe, user_id)
);

-- Indexes
CREATE INDEX idx_leaderboard_scope_timeframe ON leaderboard_entries(scope, timeframe);
CREATE INDEX idx_leaderboard_category ON leaderboard_entries(category);
CREATE INDEX idx_leaderboard_rank ON leaderboard_entries(rank);
CREATE INDEX idx_leaderboard_computed_at ON leaderboard_entries(computed_at);
```

### Achievements Table

User achievement tracking.

```sql
CREATE TABLE achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT NOT NULL,
  icon VARCHAR(50),
  criteria JSONB NOT NULL, -- Conditions for earning the achievement
  points INTEGER DEFAULT 0,
  rarity VARCHAR(20) DEFAULT 'common', -- common, rare, epic, legendary
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  progress_data JSONB, -- For tracking progress toward achievement

  UNIQUE(user_id, achievement_id)
);

-- Indexes
CREATE INDEX idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX idx_user_achievements_earned_at ON user_achievements(earned_at);
```

## Database Functions and Triggers

### Update Progress Function

Automatically update goal progress when challenges are completed.

```sql
CREATE OR REPLACE FUNCTION update_goal_progress()
RETURNS TRIGGER AS $$
BEGIN
  -- Update goal progress when challenge status changes to completed
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    UPDATE goals
    SET progress_percentage = (
      SELECT ROUND(
        (COUNT(*) FILTER (WHERE status = 'completed')::DECIMAL / COUNT(*)) * 100
      )::INTEGER
      FROM challenges
      WHERE goal_id = NEW.goal_id
    ),
    updated_at = NOW()
    WHERE id = NEW.goal_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_goal_progress
  AFTER UPDATE ON challenges
  FOR EACH ROW
  EXECUTE FUNCTION update_goal_progress();
```

### Update User Statistics Function

Maintain user statistics table.

```sql
CREATE OR REPLACE FUNCTION update_user_statistics()
RETURNS TRIGGER AS $$
BEGIN
  -- Update user statistics when challenge is completed
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    INSERT INTO user_statistics (user_id, challenges_completed, last_activity_date)
    VALUES (
      (SELECT user_id FROM goals WHERE id = NEW.goal_id),
      1,
      CURRENT_DATE
    )
    ON CONFLICT (user_id) DO UPDATE SET
      challenges_completed = user_statistics.challenges_completed + 1,
      last_activity_date = CURRENT_DATE,
      updated_at = NOW();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_user_statistics
  AFTER UPDATE ON challenges
  FOR EACH ROW
  EXECUTE FUNCTION update_user_statistics();
```

## Indexes for Performance

### Composite Indexes

```sql
-- For efficient goal filtering by user and status
CREATE INDEX idx_goals_user_status ON goals(user_id, status);

-- For challenge ordering within goals
CREATE INDEX idx_challenges_goal_order ON challenges(goal_id, order_index);

-- For recent submissions lookup
CREATE INDEX idx_submissions_user_recent ON submissions(user_id, submitted_at DESC);

-- For leaderboard queries
CREATE INDEX idx_leaderboard_scope_rank ON leaderboard_entries(scope, timeframe, rank);
```

### Partial Indexes

```sql
-- Index only active goals
CREATE INDEX idx_goals_active ON goals(user_id, created_at) WHERE status = 'active';

-- Index only pending peer reviews
CREATE INDEX idx_peer_reviews_pending ON peer_reviews(reviewer_id, assigned_at)
WHERE status = 'assigned';
```

## Data Relationships

### Entity Relationship Diagram

```
Users (1) ──→ (N) Goals
Goals (1) ──→ (N) Challenges
Challenges (1) ──→ (1) Submissions
Submissions (1) ──→ (1) AI_Feedback
Submissions (1) ──→ (N) Peer_Reviews
Users (1) ──→ (N) Progress_Events
Users (1) ──→ (1) User_Statistics
Users (1) ──→ (N) User_Achievements
```

### Foreign Key Constraints

- All foreign keys use `ON DELETE CASCADE` for dependent data
- Soft deletes implemented where data retention is needed
- Referential integrity maintained at database level

## Sample Data

### Insert Sample Users

```sql
INSERT INTO users (email, password_hash, full_name, bio) VALUES
('john@example.com', '$2b$10$...', 'John Smith', 'Learning JavaScript and loving it!'),
('sarah@example.com', '$2b$10$...', 'Sarah Chen', 'Full-stack developer and mentor'),
('alex@example.com', '$2b$10$...', 'Alex Rodriguez', 'Code ninja and problem solver');
```

### Insert Sample Goals

```sql
INSERT INTO goals (user_id, title, description, category, difficulty, target_date) VALUES
((SELECT id FROM users WHERE email = 'john@example.com'),
 'Learn JavaScript Basics',
 'Master the fundamentals of JavaScript programming',
 'programming',
 'intermediate',
 '2024-04-15');
```

### Insert Sample Achievements

```sql
INSERT INTO achievements (name, description, icon, criteria, points) VALUES
('First Goal', 'Create your first learning goal', '🎯', '{"goals_created": 1}', 50),
('Week Warrior', 'Complete challenges for 7 consecutive days', '🔥', '{"streak_days": 7}', 100),
('JavaScript Master', 'Complete all JavaScript fundamental challenges', '🏆', '{"category": "javascript", "challenges_completed": 10}', 200);
```

## Performance Considerations

### Query Optimization

- Use appropriate indexes for common query patterns
- Implement database connection pooling
- Use prepared statements to prevent SQL injection
- Optimize JOIN operations with proper indexing

### Scaling Strategies

- Implement read replicas for analytics queries
- Use database partitioning for large tables (progress_events, submissions)
- Consider caching layer (Redis) for frequently accessed data
- Archive old data to maintain performance

### Monitoring

- Track slow queries and optimize them
- Monitor index usage and remove unused indexes
- Set up alerts for connection pool exhaustion
- Regular database maintenance (VACUUM, ANALYZE)

This database schema provides a solid foundation for the SkillWise application with proper normalization, indexing, and performance considerations.
