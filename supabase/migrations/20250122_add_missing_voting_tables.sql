-- Migration: Add missing voting and comment tables
-- This creates all tables needed for voting and commenting features

-- ============================================
-- 1. ROAST_VOTES TABLE (for community roasts)
-- ============================================
CREATE TABLE IF NOT EXISTS roast_votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  roast_id UUID REFERENCES community_roasts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  vote_type TEXT NOT NULL CHECK (vote_type IN ('up', 'down')),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(roast_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_roast_votes_roast_id ON roast_votes(roast_id);
CREATE INDEX IF NOT EXISTS idx_roast_votes_user_id ON roast_votes(user_id);

ALTER TABLE roast_votes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view roast votes" ON roast_votes;
CREATE POLICY "Anyone can view roast votes"
ON roast_votes FOR SELECT TO public
USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert their own votes" ON roast_votes;
CREATE POLICY "Authenticated users can insert their own votes"
ON roast_votes FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own votes" ON roast_votes;
CREATE POLICY "Users can update their own votes"
ON roast_votes FOR UPDATE TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete their own votes" ON roast_votes;
CREATE POLICY "Users can delete their own votes"
ON roast_votes FOR DELETE TO authenticated
USING (user_id = auth.uid());

-- ============================================
-- 2. ROAST_COMMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS roast_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  roast_id UUID REFERENCES community_roasts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  comment_text TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_roast_comments_roast_id ON roast_comments(roast_id);
CREATE INDEX IF NOT EXISTS idx_roast_comments_user_id ON roast_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_roast_comments_created_at ON roast_comments(created_at DESC);

ALTER TABLE roast_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view roast comments" ON roast_comments;
CREATE POLICY "Anyone can view roast comments"
ON roast_comments FOR SELECT TO public
USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert comments" ON roast_comments;
CREATE POLICY "Authenticated users can insert comments"
ON roast_comments FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own comments" ON roast_comments;
CREATE POLICY "Users can update their own comments"
ON roast_comments FOR UPDATE TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete their own comments" ON roast_comments;
CREATE POLICY "Users can delete their own comments"
ON roast_comments FOR DELETE TO authenticated
USING (user_id = auth.uid());

-- ============================================
-- 3. DISCUSSION_VOTES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS discussion_votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  discussion_id UUID REFERENCES discussions(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  vote_type TEXT NOT NULL CHECK (vote_type IN ('up', 'down')),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(discussion_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_discussion_votes_discussion_id ON discussion_votes(discussion_id);
CREATE INDEX IF NOT EXISTS idx_discussion_votes_user_id ON discussion_votes(user_id);

ALTER TABLE discussion_votes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view discussion votes" ON discussion_votes;
CREATE POLICY "Anyone can view discussion votes"
ON discussion_votes FOR SELECT TO public
USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert their own votes" ON discussion_votes;
CREATE POLICY "Authenticated users can insert their own votes"
ON discussion_votes FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own votes" ON discussion_votes;
CREATE POLICY "Users can update their own votes"
ON discussion_votes FOR UPDATE TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete their own votes" ON discussion_votes;
CREATE POLICY "Users can delete their own votes"
ON discussion_votes FOR DELETE TO authenticated
USING (user_id = auth.uid());

-- ============================================
-- 4. UPDATE handle_roast_vote FUNCTION
-- ============================================
-- Drop old function first (if it exists with different parameter names)
-- Old signature: handle_roast_vote(roast_id UUID, user_uuid UUID, vote_type TEXT)
-- New signature: handle_roast_vote(p_roast_id UUID, p_user_id UUID, p_vote_type TEXT)
DROP FUNCTION IF EXISTS handle_roast_vote(UUID, UUID, TEXT) CASCADE;

-- Create the function with correct parameter names matching code calls
-- Note: Function signature matches existing code calls (p_roast_id, p_user_id, p_vote_type)
CREATE OR REPLACE FUNCTION handle_roast_vote(
  p_roast_id UUID,
  p_user_id UUID,
  p_vote_type TEXT
)
RETURNS void AS $$
DECLARE
  v_existing_vote TEXT;
  v_current_upvotes INTEGER;
  v_current_downvotes INTEGER;
  v_roast_user_id UUID;
  normalized_vote TEXT;
BEGIN
  -- Normalize vote_type (handle both 'up'/'down' and 'upvote'/'downvote')
  normalized_vote := CASE 
    WHEN p_vote_type IN ('up', 'upvote') THEN 'up'
    WHEN p_vote_type IN ('down', 'downvote') THEN 'down'
    ELSE p_vote_type
  END;

  -- Get existing vote if any
  SELECT vote_type INTO v_existing_vote
  FROM roast_votes
  WHERE roast_id = p_roast_id AND user_id = p_user_id;

  -- Get current vote counts and roast owner
  SELECT upvotes, downvotes, user_id INTO v_current_upvotes, v_current_downvotes, v_roast_user_id
  FROM community_roasts
  WHERE id = p_roast_id;

  -- If user is changing their vote or removing it
  IF v_existing_vote IS NOT NULL THEN
    IF v_existing_vote = normalized_vote THEN
      -- User is clicking the same vote again, remove it
      DELETE FROM roast_votes
      WHERE roast_id = p_roast_id AND user_id = p_user_id;
      
      -- Update vote counts
      IF v_existing_vote = 'up' THEN
        v_current_upvotes := GREATEST(0, v_current_upvotes - 1);
      ELSE
        v_current_downvotes := GREATEST(0, v_current_downvotes - 1);
      END IF;
    ELSE
      -- User is changing their vote
      UPDATE roast_votes
      SET vote_type = normalized_vote
      WHERE roast_id = p_roast_id AND user_id = p_user_id;
      
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
    INSERT INTO roast_votes (roast_id, user_id, vote_type)
    VALUES (p_roast_id, p_user_id, normalized_vote);
    
    -- Update vote counts
    IF normalized_vote = 'up' THEN
      v_current_upvotes := v_current_upvotes + 1;
    ELSE
      v_current_downvotes := v_current_downvotes + 1;
    END IF;
  END IF;

  -- Update community_roasts with new vote counts
  UPDATE community_roasts
  SET 
    upvotes = v_current_upvotes,
    downvotes = v_current_downvotes
  WHERE id = p_roast_id;
  
  -- Award karma to roast author if upvoted (only for new upvotes)
  IF normalized_vote = 'up' AND v_existing_vote IS NULL AND v_roast_user_id IS NOT NULL THEN
    UPDATE profiles
    SET karma_points = karma_points + 1
    WHERE id = v_roast_user_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 5. UPDATE handle_discussion_vote FUNCTION
-- ============================================
-- Drop old function first (if it exists with different parameter names)
-- Old signature: handle_discussion_vote(discussion_id UUID, user_uuid UUID, vote_type TEXT)
-- New signature: handle_discussion_vote(p_discussion_id UUID, p_user_id UUID, p_vote_type TEXT)
DROP FUNCTION IF EXISTS handle_discussion_vote(UUID, UUID, TEXT) CASCADE;

-- Create the function with correct parameter names matching code calls
-- Note: Function signature matches existing code calls (p_discussion_id, p_user_id, p_vote_type)
CREATE OR REPLACE FUNCTION handle_discussion_vote(
  p_discussion_id UUID,
  p_user_id UUID,
  p_vote_type TEXT
)
RETURNS void AS $$
DECLARE
  v_existing_vote TEXT;
  v_current_upvotes INTEGER;
  v_discussion_user_id UUID;
  normalized_vote TEXT;
BEGIN
  -- Normalize vote_type (handle both 'up'/'down' and 'upvote'/'downvote')
  normalized_vote := CASE 
    WHEN p_vote_type IN ('up', 'upvote') THEN 'up'
    WHEN p_vote_type IN ('down', 'downvote') THEN 'down'
    ELSE p_vote_type
  END;

  -- Get existing vote if any
  SELECT vote_type INTO v_existing_vote
  FROM discussion_votes
  WHERE discussion_id = p_discussion_id AND user_id = p_user_id;

  -- Get current upvotes and discussion owner
  SELECT upvotes, user_id INTO v_current_upvotes, v_discussion_user_id
  FROM discussions
  WHERE id = p_discussion_id;
  
  -- If user is changing their vote or removing it
  IF v_existing_vote IS NOT NULL THEN
    IF v_existing_vote = normalized_vote THEN
      -- User is clicking the same vote again, remove it
      DELETE FROM discussion_votes
      WHERE discussion_id = p_discussion_id AND user_id = p_user_id;
      
      -- Update vote counts
      IF v_existing_vote = 'up' THEN
        v_current_upvotes := GREATEST(0, v_current_upvotes - 1);
      END IF;
    ELSE
      -- User is changing their vote
      UPDATE discussion_votes
      SET vote_type = normalized_vote
      WHERE discussion_id = p_discussion_id AND user_id = p_user_id;
      
      -- Update vote counts
      IF v_existing_vote = 'up' THEN
        v_current_upvotes := GREATEST(0, v_current_upvotes - 1);
      ELSE
        v_current_upvotes := v_current_upvotes + 1;
      END IF;
    END IF;
  ELSE
    -- New vote
    INSERT INTO discussion_votes (discussion_id, user_id, vote_type)
    VALUES (p_discussion_id, p_user_id, normalized_vote);
    
    -- Update vote counts
    IF normalized_vote = 'up' THEN
      v_current_upvotes := v_current_upvotes + 1;
    END IF;
  END IF;

  -- Update discussions with new upvote count
  UPDATE discussions
  SET upvotes = v_current_upvotes
  WHERE id = p_discussion_id;
  
  -- Award karma to discussion author if upvoted (only for new upvotes)
  IF normalized_vote = 'up' AND v_existing_vote IS NULL AND v_discussion_user_id IS NOT NULL THEN
    UPDATE profiles
    SET karma_points = karma_points + 1
    WHERE id = v_discussion_user_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION handle_roast_vote TO authenticated, anon;
GRANT EXECUTE ON FUNCTION handle_discussion_vote TO authenticated, anon;

-- ============================================
-- 6. ADD downvotes column to community_roasts if missing
-- ============================================
ALTER TABLE community_roasts
ADD COLUMN IF NOT EXISTS downvotes INTEGER DEFAULT 0;

-- ============================================
-- 7. FIX discussions table column name
-- ============================================
-- The code uses 'message' but REBUILD_SCHEMA uses 'content'
-- Add 'message' column and migrate data if needed
ALTER TABLE discussions
ADD COLUMN IF NOT EXISTS message TEXT;

-- If content column exists, copy to message and then we can drop content later
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'discussions' AND column_name = 'content')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'discussions' AND column_name = 'message') THEN
    -- Both exist, copy content to message where message is null
    UPDATE discussions SET message = content WHERE message IS NULL OR message = '';
  ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'discussions' AND column_name = 'content')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'discussions' AND column_name = 'message') THEN
    -- Only content exists, rename it
    ALTER TABLE discussions RENAME COLUMN content TO message;
  END IF;
END $$;

-- ============================================
-- 8. VERIFY TABLES EXIST
-- ============================================
-- Run these queries to verify:
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('roast_votes', 'roast_comments', 'discussion_votes', 'ai_roast_votes');
