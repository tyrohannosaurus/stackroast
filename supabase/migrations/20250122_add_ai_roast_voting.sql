-- Migration: Add voting functionality for AI roasts
-- This allows users to vote on AI roasts and updates burn_score based on votes

-- Add voting columns to ai_roasts table
ALTER TABLE ai_roasts
ADD COLUMN IF NOT EXISTS upvotes INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS downvotes INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS ai_burn_score INTEGER; -- Store original AI-generated score

-- Update existing rows to set ai_burn_score = burn_score
UPDATE ai_roasts
SET ai_burn_score = burn_score
WHERE ai_burn_score IS NULL;

-- Create ai_roast_votes table to track individual votes
CREATE TABLE IF NOT EXISTS ai_roast_votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ai_roast_id UUID REFERENCES ai_roasts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  vote_type TEXT NOT NULL CHECK (vote_type IN ('up', 'down')),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(ai_roast_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_ai_roast_votes_ai_roast_id ON ai_roast_votes(ai_roast_id);
CREATE INDEX IF NOT EXISTS idx_ai_roast_votes_user_id ON ai_roast_votes(user_id);

ALTER TABLE ai_roast_votes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ai_roast_votes
DROP POLICY IF EXISTS "Anyone can view AI roast votes" ON ai_roast_votes;
CREATE POLICY "Anyone can view AI roast votes"
ON ai_roast_votes FOR SELECT TO public
USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert their own votes" ON ai_roast_votes;
CREATE POLICY "Authenticated users can insert their own votes"
ON ai_roast_votes FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own votes" ON ai_roast_votes;
CREATE POLICY "Users can update their own votes"
ON ai_roast_votes FOR UPDATE TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete their own votes" ON ai_roast_votes;
CREATE POLICY "Users can delete their own votes"
ON ai_roast_votes FOR DELETE TO authenticated
USING (user_id = auth.uid());

-- Function to handle AI roast votes and update burn_score
CREATE OR REPLACE FUNCTION handle_ai_roast_vote(
  p_ai_roast_id UUID,
  p_user_uuid UUID,
  p_vote_type TEXT
)
RETURNS void AS $$
DECLARE
  v_existing_vote TEXT;
  v_ai_burn_score INTEGER;
  v_current_upvotes INTEGER;
  v_current_downvotes INTEGER;
  v_new_burn_score INTEGER;
BEGIN
  -- Get existing vote if any
  SELECT vote_type INTO v_existing_vote
  FROM ai_roast_votes
  WHERE ai_roast_id = p_ai_roast_id AND user_id = p_user_uuid;

  -- Get current vote counts and AI score
  SELECT upvotes, downvotes, ai_burn_score INTO v_current_upvotes, v_current_downvotes, v_ai_burn_score
  FROM ai_roasts
  WHERE id = p_ai_roast_id;

  -- If user is changing their vote or removing it
  IF v_existing_vote IS NOT NULL THEN
    IF v_existing_vote = p_vote_type THEN
      -- User is clicking the same vote again, remove it
      DELETE FROM ai_roast_votes
      WHERE ai_roast_id = p_ai_roast_id AND user_id = p_user_uuid;
      
      -- Update vote counts
      IF v_existing_vote = 'up' THEN
        v_current_upvotes := GREATEST(0, v_current_upvotes - 1);
      ELSE
        v_current_downvotes := GREATEST(0, v_current_downvotes - 1);
      END IF;
    ELSE
      -- User is changing their vote
      UPDATE ai_roast_votes
      SET vote_type = p_vote_type
      WHERE ai_roast_id = p_ai_roast_id AND user_id = p_user_uuid;
      
      -- Update vote counts
      IF v_existing_vote = 'up' THEN
        v_current_upvotes := GREATEST(0, v_current_upvotes - 1);
        v_current_downvotes := v_current_downvotes + 1;
      ELSE
        v_current_downvotes := GREATEST(0, v_current_downvotes - 1);
        v_current_upvotes := v_current_upvotes + 1;
      END IF;
    END IF;
  ELSE
    -- New vote
    INSERT INTO ai_roast_votes (ai_roast_id, user_id, vote_type)
    VALUES (p_ai_roast_id, p_user_uuid, p_vote_type);
    
    -- Update vote counts
    IF p_vote_type = 'up' THEN
      v_current_upvotes := v_current_upvotes + 1;
    ELSE
      v_current_downvotes := v_current_downvotes + 1;
    END IF;
  END IF;

  -- Calculate new burn_score: AI score (70%) + User votes (30%)
  -- User votes contribute: +2 per upvote, -2 per downvote, max ±20 points
  v_new_burn_score := COALESCE(v_ai_burn_score, 50) + 
    LEAST(20, GREATEST(-20, (v_current_upvotes - v_current_downvotes) * 2));
  
  -- Ensure burn_score stays within 0-100 range
  v_new_burn_score := GREATEST(0, LEAST(100, v_new_burn_score));

  -- Update ai_roasts with new vote counts and burn_score
  UPDATE ai_roasts
  SET 
    upvotes = v_current_upvotes,
    downvotes = v_current_downvotes,
    burn_score = v_new_burn_score
  WHERE id = p_ai_roast_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION handle_ai_roast_vote TO authenticated, anon;
