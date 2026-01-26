-- =====================================================
-- Add create_hardcoded_kit function
-- =====================================================
-- This function allows creating hardcoded kits in the database
-- It bypasses RLS policies using SECURITY DEFINER

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
