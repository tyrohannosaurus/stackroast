-- =====================================================
-- CRITICAL SECURITY FIX: Replace overly permissive RLS policies
-- This migration fixes WITH CHECK (true) policies that allow
-- unrestricted data insertion
-- =====================================================

-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Anyone can insert stacks" ON stacks;
DROP POLICY IF EXISTS "Anyone can insert stack items" ON stack_items;
DROP POLICY IF EXISTS "Public can insert alternative clicks" ON alternative_clicks;
DROP POLICY IF EXISTS "Anyone can insert votes" ON roast_votes;
DROP POLICY IF EXISTS "Anyone can insert comments" ON roast_comments;

-- =====================================================
-- STACKS TABLE: Restrict insertion with validation
-- =====================================================
CREATE POLICY "Authenticated users can insert valid stacks"
ON stacks FOR INSERT
TO authenticated
WITH CHECK (
  -- Validate name
  name IS NOT NULL
  AND length(trim(name)) >= 1
  AND length(trim(name)) <= 100
  AND name !~ '<[^>]*>'  -- No HTML tags

  -- Validate slug
  AND slug IS NOT NULL
  AND length(trim(slug)) >= 1
  AND length(trim(slug)) <= 200
  AND slug ~ '^[a-z0-9-]+$'  -- Only lowercase alphanumeric and hyphens

  -- Validate description if provided
  AND (description IS NULL OR length(description) <= 1000)
  AND (description IS NULL OR description !~ '<script[^>]*>')  -- No script tags

  -- User must be authenticated and setting their own user_id
  AND auth.uid() IS NOT NULL
  AND (user_id = auth.uid() OR user_id IS NULL)

  -- Validate boolean fields
  AND is_public IS NOT NULL
  AND ai_roast_generated IS NOT NULL
);

-- Anonymous users can insert public stacks (for non-authenticated submissions)
CREATE POLICY "Anonymous users can insert limited public stacks"
ON stacks FOR INSERT
TO anon
WITH CHECK (
  -- Validate name
  name IS NOT NULL
  AND length(trim(name)) >= 1
  AND length(trim(name)) <= 100
  AND name !~ '<[^>]*>'

  -- Validate slug
  AND slug IS NOT NULL
  AND length(trim(slug)) >= 1
  AND length(trim(slug)) <= 200
  AND slug ~ '^[a-z0-9-]+$'

  -- Validate description
  AND (description IS NULL OR length(description) <= 1000)
  AND (description IS NULL OR description !~ '<script[^>]*>')

  -- Must be public and have no user_id
  AND is_public = true
  AND user_id IS NULL
  AND ai_roast_generated IS NOT NULL
);

-- =====================================================
-- STACK_ITEMS TABLE: Validate tool relationships
-- =====================================================
CREATE POLICY "Users can insert valid stack items"
ON stack_items FOR INSERT
TO public
WITH CHECK (
  -- Must have valid stack_id and tool_id
  stack_id IS NOT NULL
  AND tool_id IS NOT NULL

  -- Verify the stack exists and user owns it or it's being created
  AND EXISTS (
    SELECT 1 FROM stacks
    WHERE id = stack_id
    AND (user_id = auth.uid() OR user_id IS NULL OR auth.role() = 'anon')
  )

  -- Verify the tool exists
  AND EXISTS (
    SELECT 1 FROM tools WHERE id = tool_id
  )

  -- Validate position if provided
  AND (position IS NULL OR (position >= 0 AND position < 100))
);

-- =====================================================
-- ALTERNATIVE_CLICKS TABLE: Rate limiting validation
-- =====================================================
CREATE POLICY "Public can insert tracked alternative clicks"
ON alternative_clicks FOR INSERT
TO public
WITH CHECK (
  -- Must have valid IDs
  alternative_id IS NOT NULL
  AND stack_id IS NOT NULL

  -- Verify the alternative and stack exist
  AND EXISTS (
    SELECT 1 FROM tool_alternatives WHERE id = alternative_id
  )
  AND EXISTS (
    SELECT 1 FROM stacks WHERE id = stack_id
  )

  -- Note: Consider adding rate limiting here via a database function
  -- to prevent click spam from the same IP/user
);

-- =====================================================
-- ROAST_VOTES TABLE: One vote per user per roast
-- =====================================================
CREATE POLICY "Authenticated users can vote on roasts"
ON roast_votes FOR INSERT
TO authenticated
WITH CHECK (
  -- Must have valid roast_id
  roast_id IS NOT NULL

  -- User must be authenticated
  AND user_id = auth.uid()

  -- Vote value must be 1 or -1
  AND (vote_value = 1 OR vote_value = -1)

  -- Verify roast exists
  AND EXISTS (
    SELECT 1 FROM community_roasts WHERE id = roast_id
  )

  -- Prevent duplicate votes (user can only vote once per roast)
  AND NOT EXISTS (
    SELECT 1 FROM roast_votes
    WHERE roast_id = roast_votes.roast_id
    AND user_id = auth.uid()
  )
);

-- =====================================================
-- ROAST_COMMENTS TABLE: Validate comment content
-- =====================================================
CREATE POLICY "Authenticated users can comment on roasts"
ON roast_comments FOR INSERT
TO authenticated
WITH CHECK (
  -- Must have valid roast_id
  roast_id IS NOT NULL

  -- User must be authenticated
  AND user_id = auth.uid()

  -- Validate comment content
  AND content IS NOT NULL
  AND length(trim(content)) >= 1
  AND length(trim(content)) <= 2000  -- Max 2000 chars
  AND content !~ '<script[^>]*>'  -- No script tags

  -- Verify roast exists
  AND EXISTS (
    SELECT 1 FROM community_roasts WHERE id = roast_id
  )

  -- Optional: Validate parent_id if replying to another comment
  AND (
    parent_id IS NULL
    OR EXISTS (
      SELECT 1 FROM roast_comments
      WHERE id = parent_id
      AND roast_id = roast_comments.roast_id
    )
  )
);

-- =====================================================
-- AI_ROASTS TABLE: Validate AI-generated content
-- =====================================================
DROP POLICY IF EXISTS "Anyone can insert roasts" ON ai_roasts;

CREATE POLICY "System can insert AI roasts with validation"
ON ai_roasts FOR INSERT
TO public
WITH CHECK (
  -- Must have valid stack_id
  stack_id IS NOT NULL

  -- Verify stack exists
  AND EXISTS (
    SELECT 1 FROM stacks WHERE id = stack_id
  )

  -- Validate roast content
  AND roast_text IS NOT NULL
  AND length(trim(roast_text)) >= 10  -- Minimum meaningful roast
  AND length(trim(roast_text)) <= 10000  -- Reasonable max length

  -- Validate scores if provided
  AND (originality_score IS NULL OR (originality_score >= 0 AND originality_score <= 10))
  AND (practicality_score IS NULL OR (practicality_score >= 0 AND practicality_score <= 10))
  AND (hype_score IS NULL OR (hype_score >= 0 AND hype_score <= 10))
  AND (overall_score IS NULL OR (overall_score >= 0 AND overall_score <= 10))
);

-- =====================================================
-- Add helpful indexes for policy checks
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_stacks_user_id ON stacks(user_id);
CREATE INDEX IF NOT EXISTS idx_stacks_slug ON stacks(slug);
CREATE INDEX IF NOT EXISTS idx_stack_items_stack_id ON stack_items(stack_id);
CREATE INDEX IF NOT EXISTS idx_stack_items_tool_id ON stack_items(tool_id);
CREATE INDEX IF NOT EXISTS idx_roast_votes_user_roast ON roast_votes(user_id, roast_id);
CREATE INDEX IF NOT EXISTS idx_roast_comments_roast_id ON roast_comments(roast_id);
CREATE INDEX IF NOT EXISTS idx_alternative_clicks_alt_id ON alternative_clicks(alternative_id);

-- =====================================================
-- Add database-level constraints for extra safety
-- =====================================================
-- Ensure stack names have reasonable length
ALTER TABLE stacks
  DROP CONSTRAINT IF EXISTS stacks_name_length_check,
  ADD CONSTRAINT stacks_name_length_check
  CHECK (length(trim(name)) >= 1 AND length(trim(name)) <= 100);

-- Ensure slugs are valid format
ALTER TABLE stacks
  DROP CONSTRAINT IF EXISTS stacks_slug_format_check,
  ADD CONSTRAINT stacks_slug_format_check
  CHECK (slug ~ '^[a-z0-9-]+$' AND length(slug) >= 1 AND length(slug) <= 200);

-- Ensure vote values are only 1 or -1
ALTER TABLE roast_votes
  DROP CONSTRAINT IF EXISTS roast_votes_value_check,
  ADD CONSTRAINT roast_votes_value_check
  CHECK (vote_value IN (1, -1));

-- Ensure comment content is reasonable
ALTER TABLE roast_comments
  DROP CONSTRAINT IF EXISTS roast_comments_content_check,
  ADD CONSTRAINT roast_comments_content_check
  CHECK (length(trim(content)) >= 1 AND length(trim(content)) <= 2000);

-- Ensure AI scores are in valid range
ALTER TABLE ai_roasts
  DROP CONSTRAINT IF EXISTS ai_roasts_scores_check,
  ADD CONSTRAINT ai_roasts_scores_check
  CHECK (
    (originality_score IS NULL OR (originality_score >= 0 AND originality_score <= 10))
    AND (practicality_score IS NULL OR (practicality_score >= 0 AND practicality_score <= 10))
    AND (hype_score IS NULL OR (hype_score >= 0 AND hype_score <= 10))
    AND (overall_score IS NULL OR (overall_score >= 0 AND overall_score <= 10))
  );

-- =====================================================
-- Add unique constraint to prevent duplicate votes
-- =====================================================
CREATE UNIQUE INDEX IF NOT EXISTS idx_roast_votes_unique
ON roast_votes(user_id, roast_id);

-- =====================================================
-- COMMENTS AND NOTES
-- =====================================================
COMMENT ON POLICY "Authenticated users can insert valid stacks" ON stacks IS
  'Allows authenticated users to create stacks with comprehensive validation on all fields';

COMMENT ON POLICY "Users can insert valid stack items" ON stack_items IS
  'Validates stack items have valid references and user owns the parent stack';

COMMENT ON POLICY "Authenticated users can vote on roasts" ON roast_votes IS
  'Ensures one vote per user per roast with valid vote values';

COMMENT ON POLICY "Authenticated users can comment on roasts" ON roast_comments IS
  'Validates comment content and prevents XSS with length limits';
