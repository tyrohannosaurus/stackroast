-- Migration: Add tool moderation and user tracking
-- This enables quality control for user-added tools

-- =====================================================
-- 1. Add moderation columns to tools table
-- =====================================================
ALTER TABLE tools 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'approved' 
  CHECK (status IN ('approved', 'pending', 'rejected')),
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
ADD COLUMN IF NOT EXISTS verified_website BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS logo_fetched BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS flagged_reason TEXT;

-- Create indexes for filtering
CREATE INDEX IF NOT EXISTS idx_tools_status ON tools(status);
CREATE INDEX IF NOT EXISTS idx_tools_created_by ON tools(created_by);
CREATE INDEX IF NOT EXISTS idx_tools_status_created_by ON tools(status, created_by);

-- =====================================================
-- 2. Create rate limiting tracking table
-- =====================================================
CREATE TABLE IF NOT EXISTS user_tool_additions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  tool_id UUID REFERENCES tools(id) ON DELETE CASCADE,
  added_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, tool_id)
);

-- Index for rate limit queries (by user and date)
CREATE INDEX IF NOT EXISTS idx_user_tool_additions_user_date 
ON user_tool_additions(user_id, DATE(added_at));

-- Index for counting approved tools per user
CREATE INDEX IF NOT EXISTS idx_tools_created_by_status 
ON tools(created_by, status) 
WHERE created_by IS NOT NULL;

-- =====================================================
-- 3. RLS policies for user_tool_additions
-- =====================================================
ALTER TABLE user_tool_additions ENABLE ROW LEVEL SECURITY;

-- Users can view their own tool additions
CREATE POLICY "Users can view own tool additions"
ON user_tool_additions
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Users can insert their own tool additions
CREATE POLICY "Users can insert own tool additions"
ON user_tool_additions
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- =====================================================
-- 4. Update tools RLS policies for status filtering
-- =====================================================
-- Drop existing SELECT policy if it exists
DROP POLICY IF EXISTS "Anyone can view approved tools" ON tools;
DROP POLICY IF EXISTS "Users can view their own tools" ON tools;

-- Policy: Anyone can view approved tools
CREATE POLICY "Anyone can view approved tools"
ON tools
FOR SELECT
TO public
USING (status = 'approved');

-- Policy: Users can view their own pending/rejected tools
CREATE POLICY "Users can view own pending/rejected tools"
ON tools
FOR SELECT
TO authenticated
USING (
  status IN ('pending', 'rejected') 
  AND created_by = auth.uid()
);

-- =====================================================
-- 5. Helper function to check if user is trusted
-- =====================================================
CREATE OR REPLACE FUNCTION is_trusted_user(user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  approved_count INTEGER;
  total_count INTEGER;
  rejection_rate NUMERIC;
  account_age_days INTEGER;
BEGIN
  -- Count approved tools created by user
  SELECT COUNT(*) INTO approved_count
  FROM tools
  WHERE created_by = user_uuid
    AND status = 'approved';
  
  -- Count total tools created by user
  SELECT COUNT(*) INTO total_count
  FROM tools
  WHERE created_by = user_uuid;
  
  -- Calculate rejection rate
  IF total_count > 0 THEN
    rejection_rate := (total_count - approved_count)::NUMERIC / total_count::NUMERIC * 100;
  ELSE
    rejection_rate := 0;
  END IF;
  
  -- Get account age
  SELECT EXTRACT(DAY FROM NOW() - created_at) INTO account_age_days
  FROM profiles
  WHERE id = user_uuid;
  
  -- Trusted: 10+ approved tools
  IF approved_count >= 10 THEN
    RETURN true;
  END IF;
  
  -- Super trusted: 10+ approved, <10% rejection, 30+ days old
  IF approved_count >= 10 
     AND rejection_rate < 10 
     AND account_age_days >= 30 THEN
    RETURN true;
  END IF;
  
  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 6. Helper function to get user's tool addition count for today
-- =====================================================
CREATE OR REPLACE FUNCTION get_today_tool_additions(user_uuid UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)
    FROM user_tool_additions
    WHERE user_id = user_uuid
      AND DATE(added_at) = CURRENT_DATE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 7. Update existing tools to be approved by default
-- =====================================================
UPDATE tools 
SET status = 'approved' 
WHERE status IS NULL;

-- =====================================================
-- 8. Add unique constraint on name (case-insensitive) if not exists
-- =====================================================
-- Check if unique constraint exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'tools_name_unique_lower'
  ) THEN
    -- Create unique index on lowercased name
    CREATE UNIQUE INDEX tools_name_unique_lower 
    ON tools(LOWER(name));
  END IF;
END $$;
