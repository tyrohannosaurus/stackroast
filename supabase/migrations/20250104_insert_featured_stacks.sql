-- Migration: Insert example featured stacks for sponsorships
-- This migration automatically features the top 3 stacks by view count

-- Step 1: Feature top 3 stacks by view count with different sponsors
-- This will only insert if stacks exist and aren't already featured

DO $$
DECLARE
  v_stack_record RECORD;
  v_sponsors TEXT[] := ARRAY['Railway', 'Vercel', 'Supabase'];
  v_logos TEXT[] := ARRAY[
    'https://railway.app/brand/logo-light.svg',
    'https://vercel.com/favicon.ico',
    'https://supabase.com/favicon.ico'
  ];
  v_counter INT := 1;
BEGIN
  -- Loop through top 3 stacks by view count
  FOR v_stack_record IN
    SELECT id, name, slug, view_count
    FROM stacks
    WHERE id NOT IN (SELECT stack_id FROM featured_stacks WHERE active = true)
    ORDER BY view_count DESC NULLS LAST, created_at DESC
    LIMIT 3
  LOOP
    -- Insert featured stack with sponsor
    INSERT INTO featured_stacks (
      stack_id,
      sponsor_name,
      sponsor_logo_url,
      start_date,
      end_date,
      priority,
      active,
      cta_text
    ) VALUES (
      v_stack_record.id,
      v_sponsors[v_counter],
      v_logos[v_counter],
      CURRENT_DATE,
      CURRENT_DATE + INTERVAL '7 days',
      v_counter,
      true,
      'View Stack'
    )
    ON CONFLICT DO NOTHING;

    RAISE NOTICE 'Featured stack: % (sponsored by %)', v_stack_record.name, v_sponsors[v_counter];
    v_counter := v_counter + 1;
  END LOOP;

  -- If no stacks were found, log a message
  IF v_counter = 1 THEN
    RAISE NOTICE 'No stacks found to feature. Please create some stacks first.';
  END IF;
END $$;

-- Verify inserted featured stacks
SELECT 
  fs.id,
  fs.sponsor_name,
  fs.priority,
  fs.start_date,
  fs.end_date,
  s.name as stack_name,
  s.slug as stack_slug,
  s.view_count
FROM featured_stacks fs
JOIN stacks s ON fs.stack_id = s.id
WHERE fs.active = true
ORDER BY fs.priority ASC;
