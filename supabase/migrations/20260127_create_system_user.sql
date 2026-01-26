-- =====================================================
-- Create System User Profile for Hardcoded Stack Kits
-- =====================================================
-- This migration creates a system profile for hardcoded/curated stack kits
-- 
-- IMPORTANT: The auth user must be created FIRST using one of these methods:
-- 
-- Method 1 (Recommended): Run the script
--   node scripts/create-system-user.js
--   (Requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY env vars)
--
-- Method 2: Use Supabase Dashboard
--   1. Go to Authentication > Users
--   2. Click "Add User" > "Create new user"  
--   3. Set ID to: 00000000-0000-0000-0000-000000000001
--   4. Set Email to: system@stackroast.app
--   5. Confirm email
--   6. Then run this migration again
--
-- Method 3: Use Supabase CLI Admin API
--   supabase db execute --file supabase/migrations/20260127_create_system_user.sql

-- Use a fixed UUID for the system user (deterministic)
-- This UUID is: 00000000-0000-0000-0000-000000000001
-- Fallback user: 4a4dbd5a-e119-4c41-b4d6-382a426d0ae4 (hello@stackroast.com)
DO $$
DECLARE
  system_user_id UUID := '00000000-0000-0000-0000-000000000001';
  fallback_user_id UUID := '4a4dbd5a-e119-4c41-b4d6-382a426d0ae4';
  auth_user_exists BOOLEAN;
  fallback_user_exists BOOLEAN;
  user_to_use UUID;
BEGIN
  -- Check if standard system auth user exists
  SELECT EXISTS(SELECT 1 FROM auth.users WHERE id = system_user_id) INTO auth_user_exists;
  
  -- Check if fallback user exists
  SELECT EXISTS(SELECT 1 FROM auth.users WHERE id = fallback_user_id) INTO fallback_user_exists;
  
  -- Determine which user to use
  IF auth_user_exists THEN
    user_to_use := system_user_id;
    RAISE NOTICE 'Using standard system user: %', system_user_id;
  ELSIF fallback_user_exists THEN
    user_to_use := fallback_user_id;
    RAISE NOTICE 'Using fallback system user: %', fallback_user_id;
  ELSE
    RAISE WARNING 'No system auth user found. Please create one:';
    RAISE WARNING '  - Standard: UID % with email system@stackroast.app', system_user_id;
    RAISE WARNING '  - Or use existing: UID % (hello@stackroast.com)', fallback_user_id;
    RAISE WARNING 'This migration will be skipped.';
    RETURN;
  END IF;

  -- Create the profile if it doesn't exist
  INSERT INTO profiles (
    id,
    username,
    karma_points,
    avatar_url,
    bio,
    created_at,
    updated_at
  ) VALUES (
    user_to_use,
    'StackRoast',
    0,
    NULL,
    'Official StackRoast curated stack kits',
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    username = 'StackRoast',
    bio = 'Official StackRoast curated stack kits',
    updated_at = NOW();
    
  RAISE NOTICE '✅ System profile created/updated successfully for user: %', user_to_use;
END $$;

COMMENT ON TABLE profiles IS 'User profiles including system user for curated content';
