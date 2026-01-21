-- Manual SQL script to insert featured stacks
-- Run this after finding your actual stack IDs/slugs

-- Step 1: Find stacks you want to feature
-- Run this query first to see available stacks:
/*
SELECT 
  id,
  slug,
  name,
  created_at,
  view_count,
  burn_score
FROM stacks
ORDER BY view_count DESC, created_at DESC
LIMIT 20;
*/

-- Step 2: Insert featured stacks using actual stack IDs
-- Replace the UUIDs below with actual stack IDs from Step 1

-- Example: Feature a popular stack sponsored by Railway
INSERT INTO featured_stacks (
  stack_id,
  sponsor_name,
  sponsor_logo_url,
  start_date,
  end_date,
  priority,
  active,
  cta_text
) VALUES
  -- Replace 'YOUR-STACK-ID-HERE' with actual UUID from stacks table
  (
    'YOUR-STACK-ID-HERE'::UUID,
    'Railway',
    'https://railway.app/brand/logo-light.svg',
    CURRENT_DATE,
    CURRENT_DATE + INTERVAL '7 days',
    1,
    true,
    'View Stack'
  )
ON CONFLICT DO NOTHING;

-- Example: Feature another stack sponsored by Vercel
INSERT INTO featured_stacks (
  stack_id,
  sponsor_name,
  sponsor_logo_url,
  start_date,
  end_date,
  priority,
  active,
  cta_text
) VALUES
  (
    'YOUR-STACK-ID-HERE'::UUID,
    'Vercel',
    'https://vercel.com/favicon.ico',
    CURRENT_DATE,
    CURRENT_DATE + INTERVAL '7 days',
    2,
    true,
    'View Stack'
  )
ON CONFLICT DO NOTHING;

-- Example: Feature a stack sponsored by Supabase
INSERT INTO featured_stacks (
  stack_id,
  sponsor_name,
  sponsor_logo_url,
  start_date,
  end_date,
  priority,
  active,
  cta_text
) VALUES
  (
    'YOUR-STACK-ID-HERE'::UUID,
    'Supabase',
    'https://supabase.com/favicon.ico',
    CURRENT_DATE,
    CURRENT_DATE + INTERVAL '7 days',
    3,
    true,
    'View Stack'
  )
ON CONFLICT DO NOTHING;

-- Verify inserted featured stacks
SELECT 
  fs.id,
  fs.sponsor_name,
  fs.priority,
  fs.start_date,
  fs.end_date,
  s.name as stack_name,
  s.slug as stack_slug
FROM featured_stacks fs
JOIN stacks s ON fs.stack_id = s.id
WHERE fs.active = true
ORDER BY fs.priority ASC, fs.created_at DESC;
