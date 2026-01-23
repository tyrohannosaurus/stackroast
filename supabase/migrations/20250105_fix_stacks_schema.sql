-- Migration: Fix stacks table schema and RLS policies
-- This migration ensures all required columns exist and RLS policies allow public access

-- Add missing columns to stacks table if they don't exist
ALTER TABLE stacks 
ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS upvote_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS comment_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS roast_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;

-- Update existing stacks to be public by default if is_public is NULL
UPDATE stacks SET is_public = TRUE WHERE is_public IS NULL;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_stacks_is_public_created 
ON stacks(is_public, created_at DESC) 
WHERE is_public = TRUE;

CREATE INDEX IF NOT EXISTS idx_stacks_profile_id 
ON stacks(profile_id) 
WHERE profile_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_stacks_slug 
ON stacks(slug) 
WHERE slug IS NOT NULL;

-- Enable Row Level Security if not already enabled
ALTER TABLE stacks ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Public stacks are viewable by everyone" ON stacks;
DROP POLICY IF EXISTS "Anyone can view public stacks" ON stacks;
DROP POLICY IF EXISTS "Anyone can insert stacks" ON stacks;
DROP POLICY IF EXISTS "Users can insert their own stacks" ON stacks;
DROP POLICY IF EXISTS "Users can view their own stacks" ON stacks;
DROP POLICY IF EXISTS "Users can update their own stacks" ON stacks;
DROP POLICY IF EXISTS "Users can delete their own stacks" ON stacks;

-- Policy: Anyone can view public stacks
CREATE POLICY "Anyone can view public stacks"
ON stacks
FOR SELECT
TO public
USING (is_public = TRUE);

-- Policy: Authenticated users can view their own stacks (even if private)
CREATE POLICY "Users can view their own stacks"
ON stacks
FOR SELECT
TO authenticated
USING (
  is_public = TRUE 
  OR profile_id = auth.uid()
);

-- Policy: Anyone can insert stacks (for anonymous submissions)
CREATE POLICY "Anyone can insert stacks"
ON stacks
FOR INSERT
TO public
WITH CHECK (true);

-- Policy: Users can update their own stacks
CREATE POLICY "Users can update their own stacks"
ON stacks
FOR UPDATE
TO authenticated
USING (profile_id = auth.uid())
WITH CHECK (profile_id = auth.uid());

-- Policy: Users can delete their own stacks
CREATE POLICY "Users can delete their own stacks"
ON stacks
FOR DELETE
TO authenticated
USING (profile_id = auth.uid());

-- Ensure profiles table has required columns
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS karma_points INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Ensure ai_roasts table exists with proper structure
CREATE TABLE IF NOT EXISTS ai_roasts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  stack_id UUID REFERENCES stacks(id) ON DELETE CASCADE NOT NULL,
  roast_text TEXT NOT NULL,
  burn_score INTEGER DEFAULT 0,
  persona TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(stack_id)
);

CREATE INDEX IF NOT EXISTS idx_ai_roasts_stack_id 
ON ai_roasts(stack_id);

-- Enable RLS on ai_roasts
ALTER TABLE ai_roasts ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Anyone can view AI roasts for public stacks" ON ai_roasts;

-- Policy: Anyone can view AI roasts for public stacks
CREATE POLICY "Anyone can view AI roasts for public stacks"
ON ai_roasts
FOR SELECT
TO public
USING (
  EXISTS (
    SELECT 1 FROM stacks 
    WHERE stacks.id = ai_roasts.stack_id 
    AND stacks.is_public = TRUE
  )
);

-- Ensure community_roasts table exists
CREATE TABLE IF NOT EXISTS community_roasts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  stack_id UUID REFERENCES stacks(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  roast_text TEXT NOT NULL,
  upvotes INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_community_roasts_stack_id 
ON community_roasts(stack_id);

CREATE INDEX IF NOT EXISTS idx_community_roasts_user_id 
ON community_roasts(user_id);

-- Enable RLS on community_roasts
ALTER TABLE community_roasts ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view community roasts for public stacks" ON community_roasts;
DROP POLICY IF EXISTS "Authenticated users can insert community roasts" ON community_roasts;

-- Policy: Anyone can view community roasts for public stacks
CREATE POLICY "Anyone can view community roasts for public stacks"
ON community_roasts
FOR SELECT
TO public
USING (
  EXISTS (
    SELECT 1 FROM stacks 
    WHERE stacks.id = community_roasts.stack_id 
    AND stacks.is_public = TRUE
  )
);

-- Policy: Authenticated users can insert community roasts
CREATE POLICY "Authenticated users can insert community roasts"
ON community_roasts
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Ensure stack_items table exists
CREATE TABLE IF NOT EXISTS stack_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  stack_id UUID REFERENCES stacks(id) ON DELETE CASCADE NOT NULL,
  tool_id UUID REFERENCES tools(id) ON DELETE CASCADE NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(stack_id, tool_id)
);

CREATE INDEX IF NOT EXISTS idx_stack_items_stack_id 
ON stack_items(stack_id);

CREATE INDEX IF NOT EXISTS idx_stack_items_tool_id 
ON stack_items(tool_id);

-- Enable RLS on stack_items
ALTER TABLE stack_items ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view stack items for public stacks" ON stack_items;
DROP POLICY IF EXISTS "Anyone can insert stack items" ON stack_items;

-- Policy: Anyone can view stack items for public stacks
CREATE POLICY "Anyone can view stack items for public stacks"
ON stack_items
FOR SELECT
TO public
USING (
  EXISTS (
    SELECT 1 FROM stacks 
    WHERE stacks.id = stack_items.stack_id 
    AND stacks.is_public = TRUE
  )
);

-- Policy: Anyone can insert stack items (for stack creation)
CREATE POLICY "Anyone can insert stack items"
ON stack_items
FOR INSERT
TO public
WITH CHECK (true);

-- Add comments for documentation
COMMENT ON COLUMN stacks.is_public IS 'Whether the stack is visible to the public';
COMMENT ON COLUMN stacks.upvote_count IS 'Total number of upvotes on the stack';
COMMENT ON COLUMN stacks.comment_count IS 'Total number of comments on the stack';
COMMENT ON COLUMN stacks.roast_count IS 'Total number of roasts (AI + community)';
COMMENT ON COLUMN stacks.view_count IS 'Total number of views';
