-- Migration: Fix Supabase Security Linter Issues
-- This migration addresses all security warnings from the Supabase linter:
-- 1. Function search_path security issues
-- 2. Overly permissive RLS policies
-- 3. Note about leaked password protection (requires dashboard setting)

-- ============================================================================
-- PART 1: Fix Function Search Path Security Issues
-- ============================================================================
-- All functions should have SET search_path = '' or SET search_path = 'public'
-- to prevent search_path manipulation attacks

-- Fix award_karma function
DO $$
DECLARE
  func_oid oid;
BEGIN
  SELECT oid INTO func_oid
  FROM pg_proc
  WHERE proname = 'award_karma' 
  AND pronamespace = 'public'::regnamespace
  LIMIT 1;
  
  IF func_oid IS NOT NULL THEN
    EXECUTE format('ALTER FUNCTION %s SET search_path = ''''', func_oid::regprocedure);
  END IF;
END $$;

-- Fix update_saved_stacks_updated_at function
DO $$
DECLARE
  func_oid oid;
BEGIN
  SELECT oid INTO func_oid
  FROM pg_proc
  WHERE proname = 'update_saved_stacks_updated_at' 
  AND pronamespace = 'public'::regnamespace
  LIMIT 1;
  
  IF func_oid IS NOT NULL THEN
    EXECUTE format('ALTER FUNCTION %s SET search_path = ''''', func_oid::regprocedure);
  END IF;
END $$;

-- Fix handle_roast_vote function
DO $$
DECLARE
  func_oid oid;
BEGIN
  SELECT oid INTO func_oid
  FROM pg_proc
  WHERE proname = 'handle_roast_vote' 
  AND pronamespace = 'public'::regnamespace
  LIMIT 1;
  
  IF func_oid IS NOT NULL THEN
    EXECUTE format('ALTER FUNCTION %s SET search_path = ''''', func_oid::regprocedure);
  END IF;
END $$;

-- Fix handle_discussion_vote function
DO $$
DECLARE
  func_oid oid;
BEGIN
  SELECT oid INTO func_oid
  FROM pg_proc
  WHERE proname = 'handle_discussion_vote' 
  AND pronamespace = 'public'::regnamespace
  LIMIT 1;
  
  IF func_oid IS NOT NULL THEN
    EXECUTE format('ALTER FUNCTION %s SET search_path = ''''', func_oid::regprocedure);
  END IF;
END $$;

-- Fix handle_ai_roast_vote function
DO $$
DECLARE
  func_oid oid;
BEGIN
  SELECT oid INTO func_oid
  FROM pg_proc
  WHERE proname = 'handle_ai_roast_vote' 
  AND pronamespace = 'public'::regnamespace
  LIMIT 1;
  
  IF func_oid IS NOT NULL THEN
    EXECUTE format('ALTER FUNCTION %s SET search_path = ''''', func_oid::regprocedure);
  END IF;
END $$;

-- Fix increment_stack_views function
DO $$
DECLARE
  func_oid oid;
BEGIN
  SELECT oid INTO func_oid
  FROM pg_proc
  WHERE proname = 'increment_stack_views' 
  AND pronamespace = 'public'::regnamespace
  LIMIT 1;
  
  IF func_oid IS NOT NULL THEN
    EXECUTE format('ALTER FUNCTION %s SET search_path = ''''', func_oid::regprocedure);
  END IF;
END $$;

-- ============================================================================
-- PART 2: Fix Overly Permissive RLS Policies
-- ============================================================================

-- Fix ai_roasts INSERT policy
-- Current: "Authenticated users can insert AI roasts" with WITH CHECK (true)
-- New: Require authenticated user and valid stack_id
DROP POLICY IF EXISTS "Authenticated users can insert AI roasts" ON ai_roasts;

CREATE POLICY "Authenticated users can insert AI roasts"
ON ai_roasts
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL
  AND stack_id IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM stacks
    WHERE stacks.id = ai_roasts.stack_id
    AND (stacks.profile_id = auth.uid() OR stacks.is_public = TRUE)
  )
);

-- Fix stacks INSERT policy
-- Current: "Anyone can insert stacks" with WITH CHECK (true)
-- New: Allow anonymous inserts but require valid data
DROP POLICY IF EXISTS "Anyone can insert stacks" ON stacks;

CREATE POLICY "Anyone can insert stacks"
ON stacks
FOR INSERT
TO public
WITH CHECK (
  name IS NOT NULL
  AND name != ''
  AND slug IS NOT NULL
  AND slug != ''
  -- If profile_id is set, it must match auth.uid() for authenticated users
  AND (
    profile_id IS NULL
    OR (auth.uid() IS NOT NULL AND profile_id = auth.uid())
  )
);

-- Fix stack_items INSERT policy
-- Current: "Anyone can insert stack items" with WITH CHECK (true)
-- New: Require valid stack_id and tool_id
DROP POLICY IF EXISTS "Anyone can insert stack items" ON stack_items;

CREATE POLICY "Anyone can insert stack items"
ON stack_items
FOR INSERT
TO public
WITH CHECK (
  stack_id IS NOT NULL
  AND tool_id IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM stacks
    WHERE stacks.id = stack_items.stack_id
    AND (stacks.is_public = TRUE OR stacks.profile_id = auth.uid())
  )
  AND EXISTS (
    SELECT 1 FROM tools
    WHERE tools.id = stack_items.tool_id
  )
);

-- ============================================================================
-- PART 3: Verification Queries
-- ============================================================================

-- Verify function search_path settings
SELECT 
  proname as function_name,
  pg_get_functiondef(oid) LIKE '%SET search_path%' as has_search_path_set
FROM pg_proc
WHERE pronamespace = 'public'::regnamespace
AND proname IN (
  'award_karma',
  'update_saved_stacks_updated_at',
  'handle_roast_vote',
  'handle_discussion_vote',
  'handle_ai_roast_vote',
  'increment_stack_views'
)
ORDER BY proname;

-- Verify RLS policies
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd as operation,
  roles,
  CASE 
    WHEN with_check = 'true' THEN '⚠️ Always true (needs fixing)'
    WHEN with_check IS NULL THEN 'No WITH CHECK'
    ELSE '✓ Has proper WITH CHECK'
  END as with_check_status
FROM pg_policies
WHERE tablename IN ('ai_roasts', 'stacks', 'stack_items')
AND cmd = 'INSERT'
ORDER BY tablename, policyname;

-- ============================================================================
-- PART 4: Manual Steps Required
-- ============================================================================
-- The following requires manual action in the Supabase Dashboard:
--
-- 1. Enable Leaked Password Protection:
--    - Go to: https://app.supabase.com/project/_/auth/settings
--    - Navigate to "Password" section
--    - Enable "Leaked Password Protection"
--    - This checks passwords against HaveIBeenPwned.org database
--
-- This cannot be done via SQL migration as it's a dashboard setting.
