-- =====================================================
-- PERFORMANCE OPTIMIZATION: Fix N+1 query pattern
-- Creates a view with pre-aggregated comment counts
-- =====================================================

-- Drop the view if it exists (needed to rename columns)
DROP VIEW IF EXISTS community_roasts_with_stats CASCADE;

-- Create a materialized view for roasts with comment counts
-- This eliminates the N+1 query pattern when loading roast feeds
CREATE VIEW community_roasts_with_stats AS
SELECT
  cr.id,
  cr.stack_id,
  cr.user_id,
  cr.roast_text AS roast_content,  -- Alias to match expected interface
  cr.created_at,
  NULL::TIMESTAMPTZ AS updated_at,  -- Column doesn't exist in table, return NULL
  COALESCE(comment_counts.comment_count, 0) AS comment_count,
  COALESCE(vote_stats.total_votes, 0) AS total_votes,
  COALESCE(vote_stats.upvotes, 0) AS upvotes,
  COALESCE(vote_stats.downvotes, 0) AS downvotes,
  -- Include user information
  p.username AS author_username,
  p.avatar_url AS author_avatar_url
FROM
  community_roasts cr
LEFT JOIN (
  -- Aggregate comment counts per roast
  SELECT
    roast_id,
    COUNT(*) AS comment_count
  FROM
    roast_comments
  GROUP BY
    roast_id
) comment_counts ON cr.id = comment_counts.roast_id
LEFT JOIN (
  -- Aggregate vote statistics per roast
  SELECT
    roast_id,
    COUNT(*) AS total_votes,
    SUM(CASE WHEN vote_type = 'up' THEN 1 ELSE 0 END) AS upvotes,
    SUM(CASE WHEN vote_type = 'down' THEN 1 ELSE 0 END) AS downvotes
  FROM
    roast_votes
  GROUP BY
    roast_id
) vote_stats ON cr.id = vote_stats.roast_id
LEFT JOIN
  profiles p ON cr.user_id = p.id;

-- Add comment to explain the view
COMMENT ON VIEW community_roasts_with_stats IS
  'Optimized view that pre-aggregates comment counts and vote statistics for community roasts, eliminating N+1 query patterns';

-- =====================================================
-- Create indexes to support the view efficiently
-- =====================================================

-- Index for joining roast_comments (already exists from previous migration)
-- CREATE INDEX IF NOT EXISTS idx_roast_comments_roast_id ON roast_comments(roast_id);

-- Index for joining roast_votes
CREATE INDEX IF NOT EXISTS idx_roast_votes_roast_id
ON roast_votes(roast_id);

-- Index for joining profiles
CREATE INDEX IF NOT EXISTS idx_profiles_id
ON profiles(id);

-- Index for filtering by stack_id (common query pattern)
CREATE INDEX IF NOT EXISTS idx_community_roasts_stack_id
ON community_roasts(stack_id);

-- Index for sorting by created_at
CREATE INDEX IF NOT EXISTS idx_community_roasts_created_at
ON community_roasts(created_at DESC);

-- =====================================================
-- RLS Policies for the view
-- =====================================================

-- Enable RLS on the view (inherits from base table but we can add view-specific policies)
-- Note: Views inherit RLS from underlying tables by default
-- But we can create additional policies if needed

-- Grant select permission on the view
GRANT SELECT ON community_roasts_with_stats TO authenticated, anon;

-- =====================================================
-- Optional: Create a function for paginated roast fetching
-- =====================================================

CREATE OR REPLACE FUNCTION get_roasts_with_stats(
  p_stack_id UUID DEFAULT NULL,
  p_limit INTEGER DEFAULT 20,
  p_offset INTEGER DEFAULT 0,
  p_sort_by TEXT DEFAULT 'newest'
)
RETURNS TABLE (
  id UUID,
  stack_id UUID,
  user_id UUID,
  roast_content TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,  -- Optional, may be NULL
  comment_count BIGINT,
  total_votes BIGINT,
  upvotes BIGINT,
  downvotes BIGINT,
  author_username TEXT,
  author_avatar_url TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF p_sort_by = 'oldest' THEN
    RETURN QUERY
    SELECT
      cr.id,
      cr.stack_id,
      cr.user_id,
      cr.roast_content,
      cr.created_at,
      cr.updated_at,
      cr.comment_count,
      cr.total_votes,
      cr.upvotes,
      cr.downvotes,
      cr.author_username,
      cr.author_avatar_url
    FROM
      community_roasts_with_stats cr
    WHERE
      p_stack_id IS NULL OR cr.stack_id = p_stack_id
    ORDER BY cr.created_at ASC
    LIMIT p_limit
    OFFSET p_offset;
  ELSIF p_sort_by = 'top' THEN
    RETURN QUERY
    SELECT
      cr.id,
      cr.stack_id,
      cr.user_id,
      cr.roast_content,
      cr.created_at,
      cr.updated_at,
      cr.comment_count,
      cr.total_votes,
      cr.upvotes,
      cr.downvotes,
      cr.author_username,
      cr.author_avatar_url
    FROM
      community_roasts_with_stats cr
    WHERE
      p_stack_id IS NULL OR cr.stack_id = p_stack_id
    ORDER BY cr.total_votes DESC
    LIMIT p_limit
    OFFSET p_offset;
  ELSIF p_sort_by = 'controversial' THEN
    RETURN QUERY
    SELECT
      cr.id,
      cr.stack_id,
      cr.user_id,
      cr.roast_content,
      cr.created_at,
      cr.updated_at,
      cr.comment_count,
      cr.total_votes,
      cr.upvotes,
      cr.downvotes,
      cr.author_username,
      cr.author_avatar_url
    FROM
      community_roasts_with_stats cr
    WHERE
      p_stack_id IS NULL OR cr.stack_id = p_stack_id
    ORDER BY
      CASE
        WHEN cr.total_votes > 0 THEN
          ABS(cr.upvotes::FLOAT - cr.downvotes::FLOAT) / cr.total_votes::FLOAT
        ELSE 0
      END ASC
    LIMIT p_limit
    OFFSET p_offset;
  ELSE
    -- Default: newest
    RETURN QUERY
    SELECT
      cr.id,
      cr.stack_id,
      cr.user_id,
      cr.roast_content,
      cr.created_at,
      cr.updated_at,
      cr.comment_count,
      cr.total_votes,
      cr.upvotes,
      cr.downvotes,
      cr.author_username,
      cr.author_avatar_url
    FROM
      community_roasts_with_stats cr
    WHERE
      p_stack_id IS NULL OR cr.stack_id = p_stack_id
    ORDER BY cr.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
  END IF;
END;
$$;

-- Add comment explaining the function
COMMENT ON FUNCTION get_roasts_with_stats IS
  'Fetches roasts with pre-aggregated statistics (comment counts, votes) with pagination and sorting support';

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_roasts_with_stats TO authenticated, anon;

-- =====================================================
-- Performance monitoring helper
-- =====================================================

-- Create a function to analyze query performance
CREATE OR REPLACE FUNCTION analyze_roast_query_performance()
RETURNS TABLE (
  total_roasts BIGINT,
  avg_comments_per_roast NUMERIC,
  avg_votes_per_roast NUMERIC,
  roasts_without_comments BIGINT,
  roasts_without_votes BIGINT
)
LANGUAGE SQL
SECURITY DEFINER
AS $$
  SELECT
    COUNT(*) AS total_roasts,
    AVG(comment_count) AS avg_comments_per_roast,
    AVG(total_votes) AS avg_votes_per_roast,
    SUM(CASE WHEN comment_count = 0 THEN 1 ELSE 0 END) AS roasts_without_comments,
    SUM(CASE WHEN total_votes = 0 THEN 1 ELSE 0 END) AS roasts_without_votes
  FROM
    community_roasts_with_stats;
$$;

GRANT EXECUTE ON FUNCTION analyze_roast_query_performance TO authenticated;
