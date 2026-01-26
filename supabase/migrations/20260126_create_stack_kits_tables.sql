-- =====================================================
-- STACK KITS: User-Submitted Curated Tool Collections
-- =====================================================
-- This migration creates tables for user-submitted stack kits feature
-- Kits are curated collections of tools for specific use cases

-- =====================================================
-- 1. Create stack_kits table
-- =====================================================
CREATE TABLE IF NOT EXISTS stack_kits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Kit metadata
  name TEXT NOT NULL CHECK (char_length(name) >= 3 AND char_length(name) <= 100),
  slug TEXT NOT NULL UNIQUE,
  tagline TEXT NOT NULL CHECK (char_length(tagline) >= 10 AND char_length(tagline) <= 150),
  description TEXT NOT NULL CHECK (char_length(description) >= 50 AND char_length(description) <= 2000),
  icon TEXT, -- emoji or icon identifier

  -- Categorization
  category TEXT NOT NULL CHECK (category IN (
    'Full Stack Development',
    'Frontend Development',
    'Backend Development',
    'Mobile Development',
    'DevOps & Infrastructure',
    'Data & Analytics',
    'AI & Machine Learning',
    'Design & Prototyping',
    'Testing & QA',
    'Security & Monitoring',
    'Content & Marketing',
    'Productivity & Collaboration',
    'Other'
  )),
  tags TEXT[] DEFAULT '{}', -- array of tags for multi-tag search
  difficulty TEXT CHECK (difficulty IN ('Beginner', 'Intermediate', 'Advanced', 'Expert')),

  -- Pricing estimate
  total_monthly_cost_min DECIMAL(10,2) DEFAULT 0,
  total_monthly_cost_max DECIMAL(10,2) DEFAULT 0,

  -- Engagement metrics
  upvote_count INTEGER DEFAULT 0 CHECK (upvote_count >= 0),
  comment_count INTEGER DEFAULT 0 CHECK (comment_count >= 0),
  view_count INTEGER DEFAULT 0 CHECK (view_count >= 0),
  clone_count INTEGER DEFAULT 0 CHECK (clone_count >= 0),

  -- Publishing
  published BOOLEAN DEFAULT false,
  featured BOOLEAN DEFAULT false, -- for admin curated featured kits

  -- Moderation
  flagged BOOLEAN DEFAULT false,
  flag_reason TEXT,
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES profiles(id),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add comments
COMMENT ON TABLE stack_kits IS 'User-submitted curated collections of tools for specific use cases';
COMMENT ON COLUMN stack_kits.slug IS 'URL-friendly unique identifier for the kit';
COMMENT ON COLUMN stack_kits.tagline IS 'Short one-liner describing the kit';
COMMENT ON COLUMN stack_kits.tags IS 'Array of tags for multi-dimensional search';
COMMENT ON COLUMN stack_kits.featured IS 'Admin-curated featured kits shown prominently';
COMMENT ON COLUMN stack_kits.flagged IS 'Marked for review due to reported issues';

-- =====================================================
-- 2. Create kit_tools junction table
-- =====================================================
CREATE TABLE IF NOT EXISTS kit_tools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kit_id UUID NOT NULL REFERENCES stack_kits(id) ON DELETE CASCADE,
  tool_id UUID NOT NULL REFERENCES tools(id) ON DELETE CASCADE,

  -- Tool context in this kit
  reason_text TEXT NOT NULL CHECK (char_length(reason_text) >= 10 AND char_length(reason_text) <= 500),
  sort_order INTEGER NOT NULL DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Unique constraint: each tool can only appear once per kit
  UNIQUE(kit_id, tool_id)
);

-- Add comments
COMMENT ON TABLE kit_tools IS 'Junction table linking tools to kits with context about why each tool is included';
COMMENT ON COLUMN kit_tools.reason_text IS 'Explanation of why this tool is included in the kit (10-500 chars)';
COMMENT ON COLUMN kit_tools.sort_order IS 'Display order of tools within the kit';

-- =====================================================
-- 3. Create kit_upvotes table
-- =====================================================
CREATE TABLE IF NOT EXISTS kit_upvotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kit_id UUID NOT NULL REFERENCES stack_kits(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Unique constraint: one upvote per user per kit
  UNIQUE(kit_id, user_id)
);

-- Add comment
COMMENT ON TABLE kit_upvotes IS 'User upvotes for stack kits';

-- =====================================================
-- 4. Create kit_comments table
-- =====================================================
CREATE TABLE IF NOT EXISTS kit_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kit_id UUID NOT NULL REFERENCES stack_kits(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Comment content
  comment_text TEXT NOT NULL CHECK (char_length(comment_text) >= 1 AND char_length(comment_text) <= 1000),

  -- Engagement
  upvote_count INTEGER DEFAULT 0 CHECK (upvote_count >= 0),

  -- Moderation
  flagged BOOLEAN DEFAULT false,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add comment
COMMENT ON TABLE kit_comments IS 'User comments on stack kits';

-- =====================================================
-- 5. Create indexes for performance
-- =====================================================

-- stack_kits indexes
CREATE INDEX IF NOT EXISTS idx_stack_kits_creator_id ON stack_kits(creator_id);
CREATE INDEX IF NOT EXISTS idx_stack_kits_slug ON stack_kits(slug);
CREATE INDEX IF NOT EXISTS idx_stack_kits_published ON stack_kits(published) WHERE published = true;
CREATE INDEX IF NOT EXISTS idx_stack_kits_category ON stack_kits(category) WHERE published = true;
CREATE INDEX IF NOT EXISTS idx_stack_kits_featured ON stack_kits(featured) WHERE featured = true;
CREATE INDEX IF NOT EXISTS idx_stack_kits_created_at ON stack_kits(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_stack_kits_upvotes ON stack_kits(upvote_count DESC) WHERE published = true;
CREATE INDEX IF NOT EXISTS idx_stack_kits_tags ON stack_kits USING GIN(tags); -- GIN index for array search

-- Composite index for common query pattern
CREATE INDEX IF NOT EXISTS idx_stack_kits_published_category_upvotes
  ON stack_kits(published, category, upvote_count DESC)
  WHERE published = true;

-- kit_tools indexes
CREATE INDEX IF NOT EXISTS idx_kit_tools_kit_id ON kit_tools(kit_id);
CREATE INDEX IF NOT EXISTS idx_kit_tools_tool_id ON kit_tools(tool_id);
CREATE INDEX IF NOT EXISTS idx_kit_tools_kit_sort ON kit_tools(kit_id, sort_order);

-- kit_upvotes indexes
CREATE INDEX IF NOT EXISTS idx_kit_upvotes_kit_id ON kit_upvotes(kit_id);
CREATE INDEX IF NOT EXISTS idx_kit_upvotes_user_id ON kit_upvotes(user_id);
CREATE INDEX IF NOT EXISTS idx_kit_upvotes_kit_user ON kit_upvotes(kit_id, user_id);

-- kit_comments indexes
CREATE INDEX IF NOT EXISTS idx_kit_comments_kit_id ON kit_comments(kit_id);
CREATE INDEX IF NOT EXISTS idx_kit_comments_user_id ON kit_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_kit_comments_created_at ON kit_comments(created_at DESC);

-- =====================================================
-- 6. Create triggers for updated_at
-- =====================================================

-- Trigger for stack_kits.updated_at
CREATE OR REPLACE FUNCTION update_stack_kits_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_stack_kits_updated_at ON stack_kits;
CREATE TRIGGER trigger_stack_kits_updated_at
  BEFORE UPDATE ON stack_kits
  FOR EACH ROW
  EXECUTE FUNCTION update_stack_kits_updated_at();

-- Trigger for kit_comments.updated_at
CREATE OR REPLACE FUNCTION update_kit_comments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_kit_comments_updated_at ON kit_comments;
CREATE TRIGGER trigger_kit_comments_updated_at
  BEFORE UPDATE ON kit_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_kit_comments_updated_at();

-- =====================================================
-- 7. Create triggers for engagement counters
-- =====================================================

-- Update kit upvote_count when kit_upvotes changes
CREATE OR REPLACE FUNCTION update_kit_upvote_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE stack_kits
    SET upvote_count = upvote_count + 1
    WHERE id = NEW.kit_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE stack_kits
    SET upvote_count = GREATEST(0, upvote_count - 1)
    WHERE id = OLD.kit_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_kit_upvote_count ON kit_upvotes;
CREATE TRIGGER trigger_kit_upvote_count
  AFTER INSERT OR DELETE ON kit_upvotes
  FOR EACH ROW
  EXECUTE FUNCTION update_kit_upvote_count();

-- Update kit comment_count when kit_comments changes
CREATE OR REPLACE FUNCTION update_kit_comment_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE stack_kits
    SET comment_count = comment_count + 1
    WHERE id = NEW.kit_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE stack_kits
    SET comment_count = GREATEST(0, comment_count - 1)
    WHERE id = OLD.kit_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_kit_comment_count ON kit_comments;
CREATE TRIGGER trigger_kit_comment_count
  AFTER INSERT OR DELETE ON kit_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_kit_comment_count();

-- =====================================================
-- 8. Row Level Security (RLS) Policies
-- =====================================================

-- Enable RLS
ALTER TABLE stack_kits ENABLE ROW LEVEL SECURITY;
ALTER TABLE kit_tools ENABLE ROW LEVEL SECURITY;
ALTER TABLE kit_upvotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE kit_comments ENABLE ROW LEVEL SECURITY;

-- ===== stack_kits policies =====

-- Anyone can view published kits
DROP POLICY IF EXISTS "Anyone can view published kits" ON stack_kits;
CREATE POLICY "Anyone can view published kits"
  ON stack_kits FOR SELECT
  USING (published = true OR auth.uid() = creator_id);

-- Authenticated users can create kits
DROP POLICY IF EXISTS "Authenticated users can create kits" ON stack_kits;
CREATE POLICY "Authenticated users can create kits"
  ON stack_kits FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = creator_id);

-- Users can update their own unpublished kits
DROP POLICY IF EXISTS "Users can update their own kits" ON stack_kits;
CREATE POLICY "Users can update their own kits"
  ON stack_kits FOR UPDATE
  TO authenticated
  USING (auth.uid() = creator_id)
  WITH CHECK (auth.uid() = creator_id);

-- Users can delete their own kits
DROP POLICY IF EXISTS "Users can delete their own kits" ON stack_kits;
CREATE POLICY "Users can delete their own kits"
  ON stack_kits FOR DELETE
  TO authenticated
  USING (auth.uid() = creator_id);

-- ===== kit_tools policies =====

-- Anyone can view tools for published kits
DROP POLICY IF EXISTS "Anyone can view kit tools for published kits" ON kit_tools;
CREATE POLICY "Anyone can view kit tools for published kits"
  ON kit_tools FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM stack_kits
      WHERE stack_kits.id = kit_tools.kit_id
      AND (stack_kits.published = true OR stack_kits.creator_id = auth.uid())
    )
  );

-- Kit creators can manage their kit's tools
DROP POLICY IF EXISTS "Kit creators can manage their kit tools" ON kit_tools;
CREATE POLICY "Kit creators can manage their kit tools"
  ON kit_tools FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM stack_kits
      WHERE stack_kits.id = kit_tools.kit_id
      AND stack_kits.creator_id = auth.uid()
    )
  );

-- ===== kit_upvotes policies =====

-- Anyone can view upvotes for published kits
DROP POLICY IF EXISTS "Anyone can view kit upvotes" ON kit_upvotes;
CREATE POLICY "Anyone can view kit upvotes"
  ON kit_upvotes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM stack_kits
      WHERE stack_kits.id = kit_upvotes.kit_id
      AND stack_kits.published = true
    )
  );

-- Authenticated users can upvote published kits
DROP POLICY IF EXISTS "Users can upvote published kits" ON kit_upvotes;
CREATE POLICY "Users can upvote published kits"
  ON kit_upvotes FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM stack_kits
      WHERE stack_kits.id = kit_upvotes.kit_id
      AND stack_kits.published = true
    )
  );

-- Users can remove their own upvotes
DROP POLICY IF EXISTS "Users can remove their own upvotes" ON kit_upvotes;
CREATE POLICY "Users can remove their own upvotes"
  ON kit_upvotes FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ===== kit_comments policies =====

-- Anyone can view comments on published kits
DROP POLICY IF EXISTS "Anyone can view comments on published kits" ON kit_comments;
CREATE POLICY "Anyone can view comments on published kits"
  ON kit_comments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM stack_kits
      WHERE stack_kits.id = kit_comments.kit_id
      AND stack_kits.published = true
    )
  );

-- Authenticated users can comment on published kits
DROP POLICY IF EXISTS "Users can comment on published kits" ON kit_comments;
CREATE POLICY "Users can comment on published kits"
  ON kit_comments FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM stack_kits
      WHERE stack_kits.id = kit_comments.kit_id
      AND stack_kits.published = true
    )
  );

-- Users can update their own comments
DROP POLICY IF EXISTS "Users can update their own comments" ON kit_comments;
CREATE POLICY "Users can update their own comments"
  ON kit_comments FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own comments
DROP POLICY IF EXISTS "Users can delete their own comments" ON kit_comments;
CREATE POLICY "Users can delete their own comments"
  ON kit_comments FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- =====================================================
-- 9. Grant permissions
-- =====================================================

GRANT SELECT ON stack_kits TO authenticated, anon;
GRANT INSERT, UPDATE, DELETE ON stack_kits TO authenticated;

GRANT SELECT ON kit_tools TO authenticated, anon;
GRANT INSERT, UPDATE, DELETE ON kit_tools TO authenticated;

GRANT SELECT ON kit_upvotes TO authenticated, anon;
GRANT INSERT, DELETE ON kit_upvotes TO authenticated;

GRANT SELECT ON kit_comments TO authenticated, anon;
GRANT INSERT, UPDATE, DELETE ON kit_comments TO authenticated;

-- =====================================================
-- 10. Create helper functions
-- =====================================================

-- Function to increment view count
CREATE OR REPLACE FUNCTION increment_kit_view_count(kit_id_param UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE stack_kits
  SET view_count = view_count + 1
  WHERE id = kit_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION increment_kit_view_count TO authenticated, anon;

-- Function to check if user has upvoted a kit
CREATE OR REPLACE FUNCTION user_has_upvoted_kit(kit_id_param UUID, user_id_param UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM kit_upvotes
    WHERE kit_id = kit_id_param AND user_id = user_id_param
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION user_has_upvoted_kit TO authenticated, anon;

-- Function to get kits with stats (similar to get_roasts_with_stats)
CREATE OR REPLACE FUNCTION get_kits_with_stats(
  p_category TEXT DEFAULT NULL,
  p_tags TEXT[] DEFAULT NULL,
  p_limit INTEGER DEFAULT 20,
  p_offset INTEGER DEFAULT 0,
  p_sort_by TEXT DEFAULT 'newest'
)
RETURNS TABLE (
  id UUID,
  creator_id UUID,
  name TEXT,
  slug TEXT,
  tagline TEXT,
  description TEXT,
  icon TEXT,
  category TEXT,
  tags TEXT[],
  difficulty TEXT,
  total_monthly_cost_min DECIMAL,
  total_monthly_cost_max DECIMAL,
  upvote_count INTEGER,
  comment_count INTEGER,
  view_count INTEGER,
  clone_count INTEGER,
  published BOOLEAN,
  featured BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  creator_username TEXT,
  creator_avatar_url TEXT,
  tool_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    sk.id,
    sk.creator_id,
    sk.name,
    sk.slug,
    sk.tagline,
    sk.description,
    sk.icon,
    sk.category,
    sk.tags,
    sk.difficulty,
    sk.total_monthly_cost_min,
    sk.total_monthly_cost_max,
    sk.upvote_count,
    sk.comment_count,
    sk.view_count,
    sk.clone_count,
    sk.published,
    sk.featured,
    sk.created_at,
    sk.updated_at,
    p.username AS creator_username,
    p.avatar_url AS creator_avatar_url,
    COALESCE(tool_counts.tool_count, 0) AS tool_count
  FROM
    stack_kits sk
  LEFT JOIN profiles p ON sk.creator_id = p.id
  LEFT JOIN (
    SELECT kit_id, COUNT(*) AS tool_count
    FROM kit_tools
    GROUP BY kit_id
  ) tool_counts ON sk.id = tool_counts.kit_id
  WHERE
    sk.published = true
    AND (p_category IS NULL OR sk.category = p_category)
    AND (p_tags IS NULL OR sk.tags && p_tags) -- array overlap operator
  ORDER BY
    CASE
      WHEN p_sort_by = 'newest' THEN sk.created_at
    END DESC,
    CASE
      WHEN p_sort_by = 'popular' THEN sk.upvote_count
    END DESC,
    CASE
      WHEN p_sort_by = 'views' THEN sk.view_count
    END DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

GRANT EXECUTE ON FUNCTION get_kits_with_stats TO authenticated, anon;

COMMENT ON FUNCTION get_kits_with_stats IS 'Fetches published kits with pre-aggregated statistics, creator info, and tool counts';

-- Function to create a hardcoded kit (bypasses RLS for system operations)
CREATE OR REPLACE FUNCTION create_hardcoded_kit(
  p_kit_id UUID,
  p_creator_id UUID,
  p_name TEXT,
  p_slug TEXT,
  p_tagline TEXT,
  p_description TEXT,
  p_icon TEXT,
  p_category TEXT,
  p_tags TEXT[],
  p_difficulty TEXT,
  p_total_monthly_cost_min DECIMAL,
  p_total_monthly_cost_max DECIMAL,
  p_featured BOOLEAN
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_kit_id UUID;
BEGIN
  -- Insert the kit (bypasses RLS due to SECURITY DEFINER)
  INSERT INTO stack_kits (
    id,
    creator_id,
    name,
    slug,
    tagline,
    description,
    icon,
    category,
    tags,
    difficulty,
    total_monthly_cost_min,
    total_monthly_cost_max,
    published,
    featured
  ) VALUES (
    p_kit_id,
    p_creator_id,
    p_name,
    p_slug,
    p_tagline,
    p_description,
    p_icon,
    p_category,
    p_tags,
    p_difficulty,
    p_total_monthly_cost_min,
    p_total_monthly_cost_max,
    true,
    p_featured
  )
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    tagline = EXCLUDED.tagline,
    description = EXCLUDED.description,
    icon = EXCLUDED.icon,
    category = EXCLUDED.category,
    tags = EXCLUDED.tags,
    difficulty = EXCLUDED.difficulty,
    total_monthly_cost_min = EXCLUDED.total_monthly_cost_min,
    total_monthly_cost_max = EXCLUDED.total_monthly_cost_max,
    featured = EXCLUDED.featured,
    updated_at = NOW()
  RETURNING id INTO v_kit_id;
  
  RETURN v_kit_id;
END;
$$;

GRANT EXECUTE ON FUNCTION create_hardcoded_kit TO authenticated, anon;

COMMENT ON FUNCTION create_hardcoded_kit IS 'Creates a hardcoded/curated kit in the database (bypasses RLS for system operations)';
