-- Migration 014: add related_goal_id to challenges so challenges can be linked to goals
ALTER TABLE challenges
ADD COLUMN IF NOT EXISTS related_goal_id INTEGER REFERENCES goals(id);

-- Add an index to speed up goal -> challenges queries
CREATE INDEX IF NOT EXISTS idx_challenges_related_goal_id ON challenges(related_goal_id);
