-- Migration: Verify and fix RLS policies for public access
-- This ensures anonymous users can read public stacks

-- First, let's check current RLS status
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public' 
AND tablename = 'stacks';

-- Check existing policies
SELECT 
  policyname,
  cmd,
  roles,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'stacks'
ORDER BY policyname;

-- Drop all existing policies to start fresh (avoid conflicts)
DROP POLICY IF EXISTS "Anyone can view public stacks" ON stacks;
DROP POLICY IF EXISTS "Public stacks are viewable by everyone" ON stacks;
DROP POLICY IF EXISTS "Users can view their own stacks" ON stacks;
DROP POLICY IF EXISTS "Anyone can insert stacks" ON stacks;
DROP POLICY IF EXISTS "Users can insert their own stacks" ON stacks;
DROP POLICY IF EXISTS "Users can update their own stacks" ON stacks;
DROP POLICY IF EXISTS "Users can delete their own stacks" ON stacks;

-- Enable RLS
ALTER TABLE stacks ENABLE ROW LEVEL SECURITY;

-- Policy 1: Anyone (including anonymous) can view public stacks
CREATE POLICY "Anyone can view public stacks"
ON stacks
FOR SELECT
TO public
USING (is_public = TRUE);

-- Policy 2: Authenticated users can view their own stacks (even if private)
CREATE POLICY "Users can view their own stacks"
ON stacks
FOR SELECT
TO authenticated
USING (
  is_public = TRUE 
  OR profile_id = auth.uid()
);

-- Policy 3: Anyone can insert stacks (for anonymous submissions)
CREATE POLICY "Anyone can insert stacks"
ON stacks
FOR INSERT
TO public
WITH CHECK (true);

-- Policy 4: Users can update their own stacks
CREATE POLICY "Users can update their own stacks"
ON stacks
FOR UPDATE
TO authenticated
USING (profile_id = auth.uid())
WITH CHECK (profile_id = auth.uid());

-- Policy 5: Users can delete their own stacks
CREATE POLICY "Users can delete their own stacks"
ON stacks
FOR DELETE
TO authenticated
USING (profile_id = auth.uid());

-- Verify the policies were created
SELECT 
  policyname,
  cmd as operation,
  roles,
  CASE 
    WHEN qual IS NOT NULL THEN 'Has USING clause'
    ELSE 'No USING clause'
  END as using_clause,
  CASE 
    WHEN with_check IS NOT NULL THEN 'Has WITH CHECK clause'
    ELSE 'No WITH CHECK clause'
  END as with_check_clause
FROM pg_policies
WHERE tablename = 'stacks'
ORDER BY policyname;

-- Test query as anonymous user (simulates what the app does)
-- This should return all public stacks
SET ROLE anon;
SELECT 
  COUNT(*) as public_stacks_count,
  string_agg(name, ', ') as stack_names
FROM stacks
WHERE is_public = TRUE;
RESET ROLE;

-- Final verification: Count public stacks
SELECT 
  COUNT(*) as total_public_stacks,
  COUNT(CASE WHEN view_count > 0 THEN 1 END) as stacks_with_views,
  COUNT(CASE WHEN upvote_count > 0 THEN 1 END) as stacks_with_upvotes
FROM stacks
WHERE is_public = TRUE;
