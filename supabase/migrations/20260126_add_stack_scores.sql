-- Add score columns to stacks table
-- This migration adds stack health scoring functionality

-- Add score columns
ALTER TABLE stacks 
  ADD COLUMN IF NOT EXISTS score_overall INTEGER,
  ADD COLUMN IF NOT EXISTS score_breakdown JSONB,
  ADD COLUMN IF NOT EXISTS score_badge TEXT,
  ADD COLUMN IF NOT EXISTS score_percentile INTEGER,
  ADD COLUMN IF NOT EXISTS score_calculated_at TIMESTAMP;

-- Create index for leaderboard queries
CREATE INDEX IF NOT EXISTS idx_stacks_score 
  ON stacks(score_overall DESC) 
  WHERE score_overall IS NOT NULL;

-- Create scores history table for tracking improvements
CREATE TABLE IF NOT EXISTS stack_score_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  stack_id UUID REFERENCES stacks(id) ON DELETE CASCADE,
  score_overall INTEGER NOT NULL,
  score_breakdown JSONB,
  calculated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_score_history_stack 
  ON stack_score_history(stack_id, calculated_at DESC);

-- Add comment for documentation
COMMENT ON COLUMN stacks.score_overall IS 'Stack health score (0-100)';
COMMENT ON COLUMN stacks.score_breakdown IS 'JSON breakdown of good choices, issues, and optimizations';
COMMENT ON COLUMN stacks.score_badge IS 'Score badge: needs-work, below-average, good, great, excellent, perfect';
COMMENT ON COLUMN stacks.score_percentile IS 'Percentile rank compared to all stacks (0-100)';
COMMENT ON COLUMN stacks.score_calculated_at IS 'When the score was last calculated';
