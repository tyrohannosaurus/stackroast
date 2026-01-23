-- Migration: Fix existing stacks to be public and ensure they're visible
-- This migration updates all existing stacks to be public and ensures they have required columns

-- First, ensure is_public column exists (in case migration 20250105 wasn't run)
ALTER TABLE stacks 
ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT TRUE;

-- Set all existing stacks to be public (they were created before is_public existed)
UPDATE stacks 
SET is_public = TRUE 
WHERE is_public IS NULL OR is_public = FALSE;

-- Ensure other required columns exist with defaults
ALTER TABLE stacks 
ADD COLUMN IF NOT EXISTS upvote_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS comment_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS roast_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;

-- Update any NULL values to 0
UPDATE stacks 
SET upvote_count = COALESCE(upvote_count, 0),
    comment_count = COALESCE(comment_count, 0),
    roast_count = COALESCE(roast_count, 0),
    view_count = COALESCE(view_count, 0)
WHERE upvote_count IS NULL 
   OR comment_count IS NULL 
   OR roast_count IS NULL 
   OR view_count IS NULL;

-- Verify the update
SELECT 
  COUNT(*) as total_stacks,
  COUNT(CASE WHEN is_public = TRUE THEN 1 END) as public_stacks,
  COUNT(CASE WHEN is_public = FALSE THEN 1 END) as private_stacks
FROM stacks;

-- Show sample of updated stacks
SELECT 
  id,
  name,
  slug,
  is_public,
  created_at,
  view_count,
  upvote_count
FROM stacks
ORDER BY created_at DESC
LIMIT 10;
