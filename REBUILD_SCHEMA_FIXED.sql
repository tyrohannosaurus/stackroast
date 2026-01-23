-- ============================================
-- StackRoast Complete Database Schema (FIXED)
-- Run this in Supabase SQL Editor to rebuild from scratch
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. PROFILES TABLE (extends Supabase Auth)
-- ============================================
-- Create profiles table if it doesn't exist
-- Supabase Auth may create this, but we'll ensure it exists with our columns
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  username TEXT,
  karma_points INTEGER DEFAULT 0,
  avatar_url TEXT,
  bio TEXT,
  github_url TEXT,
  twitter_handle TEXT
);

-- Add columns if table already existed
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS username TEXT,
ADD COLUMN IF NOT EXISTS karma_points INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS github_url TEXT,
ADD COLUMN IF NOT EXISTS twitter_handle TEXT;

-- Add foreign key to auth.users if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'profiles_id_fkey'
  ) THEN
    ALTER TABLE profiles 
    ADD CONSTRAINT profiles_id_fkey 
    FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add unique constraint on username if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'profiles_username_key'
  ) THEN
    ALTER TABLE profiles ADD CONSTRAINT profiles_username_key UNIQUE (username);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_karma ON profiles(karma_points DESC);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
CREATE POLICY "Public profiles are viewable by everyone"
ON profiles FOR SELECT TO public
USING (true);

DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
CREATE POLICY "Users can update their own profile"
ON profiles FOR UPDATE TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- ============================================
-- 2. STACKS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS stacks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  github_url TEXT,
  is_public BOOLEAN DEFAULT TRUE,
  upvote_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  roast_count INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  ai_alternatives JSONB,
  alternatives_generated_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stacks_is_public_created ON stacks(is_public, created_at DESC) WHERE is_public = TRUE;
CREATE INDEX IF NOT EXISTS idx_stacks_profile_id ON stacks(profile_id) WHERE profile_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_stacks_slug ON stacks(slug) WHERE slug IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_stacks_upvote_count ON stacks(upvote_count DESC) WHERE is_public = TRUE;

ALTER TABLE stacks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view public stacks" ON stacks;
CREATE POLICY "Anyone can view public stacks"
ON stacks FOR SELECT TO public
USING (is_public = TRUE);

DROP POLICY IF EXISTS "Users can view their own stacks" ON stacks;
CREATE POLICY "Users can view their own stacks"
ON stacks FOR SELECT TO authenticated
USING (is_public = TRUE OR profile_id = auth.uid());

DROP POLICY IF EXISTS "Anyone can insert stacks" ON stacks;
CREATE POLICY "Anyone can insert stacks"
ON stacks FOR INSERT TO public
WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update their own stacks" ON stacks;
CREATE POLICY "Users can update their own stacks"
ON stacks FOR UPDATE TO authenticated
USING (profile_id = auth.uid())
WITH CHECK (profile_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete their own stacks" ON stacks;
CREATE POLICY "Users can delete their own stacks"
ON stacks FOR DELETE TO authenticated
USING (profile_id = auth.uid());

-- ============================================
-- 3. TOOLS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS tools (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  category TEXT,
  base_price NUMERIC(10, 2) DEFAULT 0,
  affiliate_link TEXT,
  website_url TEXT,
  priority_score NUMERIC(5, 2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tools_category ON tools(category);
CREATE INDEX IF NOT EXISTS idx_tools_slug ON tools(slug);
CREATE INDEX IF NOT EXISTS idx_tools_name ON tools(name);

ALTER TABLE tools ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view tools" ON tools;
CREATE POLICY "Anyone can view tools"
ON tools FOR SELECT TO public
USING (true);

-- ============================================
-- 4. STACK_ITEMS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS stack_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  stack_id UUID REFERENCES stacks(id) ON DELETE CASCADE NOT NULL,
  tool_id UUID REFERENCES tools(id) ON DELETE CASCADE NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(stack_id, tool_id)
);

CREATE INDEX IF NOT EXISTS idx_stack_items_stack_id ON stack_items(stack_id);
CREATE INDEX IF NOT EXISTS idx_stack_items_tool_id ON stack_items(tool_id);

ALTER TABLE stack_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view stack items for public stacks" ON stack_items;
CREATE POLICY "Anyone can view stack items for public stacks"
ON stack_items FOR SELECT TO public
USING (
  EXISTS (
    SELECT 1 FROM stacks 
    WHERE stacks.id = stack_items.stack_id 
    AND stacks.is_public = TRUE
  )
);

DROP POLICY IF EXISTS "Anyone can insert stack items" ON stack_items;
CREATE POLICY "Anyone can insert stack items"
ON stack_items FOR INSERT TO public
WITH CHECK (true);

-- ============================================
-- 5. AI_ROASTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS ai_roasts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  stack_id UUID REFERENCES stacks(id) ON DELETE CASCADE NOT NULL,
  roast_text TEXT NOT NULL,
  burn_score INTEGER DEFAULT 0,
  persona TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(stack_id)
);

CREATE INDEX IF NOT EXISTS idx_ai_roasts_stack_id ON ai_roasts(stack_id);
CREATE INDEX IF NOT EXISTS idx_ai_roasts_burn_score ON ai_roasts(burn_score DESC);

ALTER TABLE ai_roasts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view AI roasts for public stacks" ON ai_roasts;
CREATE POLICY "Anyone can view AI roasts for public stacks"
ON ai_roasts FOR SELECT TO public
USING (
  EXISTS (
    SELECT 1 FROM stacks 
    WHERE stacks.id = ai_roasts.stack_id 
    AND stacks.is_public = TRUE
  )
);

DROP POLICY IF EXISTS "Authenticated users can insert AI roasts" ON ai_roasts;
CREATE POLICY "Authenticated users can insert AI roasts"
ON ai_roasts FOR INSERT TO authenticated
WITH CHECK (true);

-- ============================================
-- 6. COMMUNITY_ROASTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS community_roasts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  stack_id UUID REFERENCES stacks(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  roast_text TEXT NOT NULL,
  upvotes INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_community_roasts_stack_id ON community_roasts(stack_id);
CREATE INDEX IF NOT EXISTS idx_community_roasts_user_id ON community_roasts(user_id);
CREATE INDEX IF NOT EXISTS idx_community_roasts_upvotes ON community_roasts(upvotes DESC);

ALTER TABLE community_roasts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view community roasts for public stacks" ON community_roasts;
CREATE POLICY "Anyone can view community roasts for public stacks"
ON community_roasts FOR SELECT TO public
USING (
  EXISTS (
    SELECT 1 FROM stacks 
    WHERE stacks.id = community_roasts.stack_id 
    AND stacks.is_public = TRUE
  )
);

DROP POLICY IF EXISTS "Authenticated users can insert community roasts" ON community_roasts;
CREATE POLICY "Authenticated users can insert community roasts"
ON community_roasts FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

-- ============================================
-- 7. SAVED_STACKS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS saved_stacks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  stack_id UUID REFERENCES stacks(id) ON DELETE CASCADE,
  stack_kit_id TEXT,
  custom_name TEXT,
  notes TEXT,
  saved_at TIMESTAMP DEFAULT NOW(),
  last_viewed_at TIMESTAMP,
  reminder_sent BOOLEAN DEFAULT FALSE,
  reminder_scheduled_for TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, stack_id)
);

CREATE INDEX IF NOT EXISTS idx_saved_stacks_user ON saved_stacks(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_stacks_stack ON saved_stacks(stack_id);
CREATE INDEX IF NOT EXISTS idx_saved_stacks_reminder ON saved_stacks(reminder_scheduled_for) 
  WHERE NOT reminder_sent AND reminder_scheduled_for IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_saved_stacks_saved_at ON saved_stacks(saved_at DESC);

ALTER TABLE saved_stacks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own saved stacks" ON saved_stacks;
CREATE POLICY "Users can view their own saved stacks"
ON saved_stacks FOR SELECT TO authenticated
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert their own saved stacks" ON saved_stacks;
CREATE POLICY "Users can insert their own saved stacks"
ON saved_stacks FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own saved stacks" ON saved_stacks;
CREATE POLICY "Users can update their own saved stacks"
ON saved_stacks FOR UPDATE TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete their own saved stacks" ON saved_stacks;
CREATE POLICY "Users can delete their own saved stacks"
ON saved_stacks FOR DELETE TO authenticated
USING (user_id = auth.uid());

-- ============================================
-- 8. FEATURED_STACKS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS featured_stacks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  stack_id UUID REFERENCES stacks(id) ON DELETE CASCADE NOT NULL,
  sponsor_name TEXT,
  sponsor_logo_url TEXT,
  cta_text TEXT,
  priority INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT TRUE,
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_featured_stacks_active ON featured_stacks(active, priority DESC) WHERE active = TRUE;
CREATE INDEX IF NOT EXISTS idx_featured_stacks_dates ON featured_stacks(start_date, end_date);

ALTER TABLE featured_stacks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view active featured stacks" ON featured_stacks;
CREATE POLICY "Anyone can view active featured stacks"
ON featured_stacks FOR SELECT TO public
USING (active = TRUE);

-- ============================================
-- 9. DISCUSSIONS TABLE (if used)
-- ============================================
CREATE TABLE IF NOT EXISTS discussions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  stack_id UUID REFERENCES stacks(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  upvotes INTEGER DEFAULT 0,
  parent_id UUID REFERENCES discussions(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_discussions_stack_id ON discussions(stack_id);
CREATE INDEX IF NOT EXISTS idx_discussions_user_id ON discussions(user_id);
CREATE INDEX IF NOT EXISTS idx_discussions_parent_id ON discussions(parent_id) WHERE parent_id IS NOT NULL;

ALTER TABLE discussions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view discussions for public stacks" ON discussions;
CREATE POLICY "Anyone can view discussions for public stacks"
ON discussions FOR SELECT TO public
USING (
  EXISTS (
    SELECT 1 FROM stacks 
    WHERE stacks.id = discussions.stack_id 
    AND stacks.is_public = TRUE
  )
);

DROP POLICY IF EXISTS "Authenticated users can insert discussions" ON discussions;
CREATE POLICY "Authenticated users can insert discussions"
ON discussions FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

-- ============================================
-- RPC FUNCTIONS
-- ============================================

-- Increment stack views
CREATE OR REPLACE FUNCTION increment_stack_views(stack_uuid UUID)
RETURNS void AS $$
BEGIN
  UPDATE stacks
  SET view_count = view_count + 1
  WHERE id = stack_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Award karma points
CREATE OR REPLACE FUNCTION award_karma(user_uuid UUID, points INTEGER)
RETURNS void AS $$
BEGIN
  UPDATE profiles
  SET karma_points = karma_points + points
  WHERE id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Handle roast votes
CREATE OR REPLACE FUNCTION handle_roast_vote(
  roast_id UUID,
  user_uuid UUID,
  vote_type TEXT
)
RETURNS void AS $$
DECLARE
  current_upvotes INTEGER;
  roast_user_id UUID;
BEGIN
  SELECT upvotes, user_id INTO current_upvotes, roast_user_id
  FROM community_roasts
  WHERE id = roast_id;
  
  IF vote_type = 'upvote' THEN
    UPDATE community_roasts
    SET upvotes = upvotes + 1
    WHERE id = roast_id;
    
    IF roast_user_id IS NOT NULL THEN
      UPDATE profiles
      SET karma_points = karma_points + 1
      WHERE id = roast_user_id;
    END IF;
  ELSIF vote_type = 'downvote' AND current_upvotes > 0 THEN
    UPDATE community_roasts
    SET upvotes = upvotes - 1
    WHERE id = roast_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Handle discussion votes
CREATE OR REPLACE FUNCTION handle_discussion_vote(
  discussion_id UUID,
  user_uuid UUID,
  vote_type TEXT
)
RETURNS void AS $$
DECLARE
  discussion_user_id UUID;
BEGIN
  SELECT user_id INTO discussion_user_id
  FROM discussions
  WHERE id = discussion_id;
  
  IF vote_type = 'upvote' THEN
    UPDATE discussions
    SET upvotes = upvotes + 1
    WHERE id = discussion_id;
    
    IF discussion_user_id IS NOT NULL THEN
      UPDATE profiles
      SET karma_points = karma_points + 1
      WHERE id = discussion_user_id;
    END IF;
  ELSIF vote_type = 'downvote' THEN
    UPDATE discussions
    SET upvotes = GREATEST(0, upvotes - 1)
    WHERE id = discussion_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- TRIGGERS
-- ============================================

-- Update updated_at on saved_stacks
CREATE OR REPLACE FUNCTION update_saved_stacks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_saved_stacks_updated_at ON saved_stacks;
CREATE TRIGGER update_saved_stacks_updated_at
BEFORE UPDATE ON saved_stacks
FOR EACH ROW
EXECUTE FUNCTION update_saved_stacks_updated_at();

-- ============================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================
COMMENT ON TABLE stacks IS 'Main table storing tech stacks submitted by users';
COMMENT ON COLUMN stacks.is_public IS 'Whether the stack is visible to the public';
COMMENT ON COLUMN stacks.upvote_count IS 'Total number of upvotes on the stack';
COMMENT ON COLUMN stacks.comment_count IS 'Total number of comments on the stack';
COMMENT ON COLUMN stacks.roast_count IS 'Total number of roasts (AI + community)';
COMMENT ON COLUMN stacks.view_count IS 'Total number of views';
COMMENT ON COLUMN stacks.ai_alternatives IS 'JSONB storing AI-generated alternative tool suggestions';

COMMENT ON TABLE saved_stacks IS 'Stores user-saved stacks for later reference and reminders';
COMMENT ON COLUMN saved_stacks.reminder_scheduled_for IS 'When to send reminder email (typically 3 days after save)';
