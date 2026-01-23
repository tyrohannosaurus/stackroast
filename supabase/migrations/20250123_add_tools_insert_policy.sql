-- Migration: Add RLS policy for users to insert new tools
-- This allows users to add tools that don't exist in the database

-- Enable RLS on tools table if not already enabled
ALTER TABLE tools ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Anyone can insert tools" ON tools;
DROP POLICY IF EXISTS "Users can insert tools" ON tools;

-- Policy: Anyone can insert new tools (for user-contributed tools)
-- This allows users to add tools that aren't in the database yet
CREATE POLICY "Anyone can insert tools"
ON tools
FOR INSERT
TO public
WITH CHECK (
  name IS NOT NULL
  AND name != ''
  AND slug IS NOT NULL
  AND slug != ''
);

-- Ensure tools table has required columns
-- These should already exist, but adding IF NOT EXISTS for safety
DO $$
BEGIN
  -- Add category column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tools' AND column_name = 'category'
  ) THEN
    ALTER TABLE tools ADD COLUMN category TEXT;
  END IF;

  -- Add logo_url column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tools' AND column_name = 'logo_url'
  ) THEN
    ALTER TABLE tools ADD COLUMN logo_url TEXT;
  END IF;

  -- Add website_url column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tools' AND column_name = 'website_url'
  ) THEN
    ALTER TABLE tools ADD COLUMN website_url TEXT;
  END IF;

  -- Add priority_score column if it doesn't exist (defaults to 0 for new tools)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tools' AND column_name = 'priority_score'
  ) THEN
    ALTER TABLE tools ADD COLUMN priority_score INTEGER DEFAULT 0;
  END IF;
END $$;

-- Create index on name for faster duplicate checking
CREATE INDEX IF NOT EXISTS idx_tools_name_lower ON tools(LOWER(name));
CREATE INDEX IF NOT EXISTS idx_tools_slug ON tools(slug);
