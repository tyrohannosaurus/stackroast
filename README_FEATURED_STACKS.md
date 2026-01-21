# Featured Stacks Setup Guide

This guide explains how to insert and manage featured stacks for sponsorships.

## Quick Start

### Option 1: Automatic Migration (Recommended)

Run the migration file that automatically features the top 3 stacks:

```bash
# If using Supabase CLI
supabase migration up

# Or run the SQL directly in Supabase Dashboard
# Copy contents of: supabase/migrations/20250104_insert_featured_stacks.sql
```

This will automatically:
- Find the top 3 stacks by view count
- Feature them with sponsors: Railway, Vercel, and Supabase
- Set them to be active for 7 days

### Option 2: Manual SQL Insert

If you want to feature specific stacks, use the manual script:

1. First, find stacks you want to feature:
```sql
SELECT id, slug, name, view_count, burn_score
FROM stacks
ORDER BY view_count DESC
LIMIT 10;
```

2. Insert featured stacks using the stack IDs:
```sql
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
    'Railway',
    'https://railway.app/brand/logo-light.svg',
    CURRENT_DATE,
    CURRENT_DATE + INTERVAL '7 days',
    1,
    true,
    'View Stack'
  );
```

### Option 3: Node.js Script

Run the automated script:

```bash
# Set environment variables
export SUPABASE_URL="your-supabase-url"
export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# Run script
node scripts/insert-featured-stacks.js
```

## Managing Featured Stacks

### View Active Featured Stacks

```sql
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
  AND fs.start_date <= CURRENT_DATE
  AND fs.end_date >= CURRENT_DATE
ORDER BY fs.priority ASC;
```

### Update Featured Stack Dates

```sql
UPDATE featured_stacks
SET 
  start_date = '2025-01-15',
  end_date = '2025-01-22'
WHERE id = 'featured-stack-id';
```

### Deactivate a Featured Stack

```sql
UPDATE featured_stacks
SET active = false
WHERE id = 'featured-stack-id';
```

### Change Sponsor

```sql
UPDATE featured_stacks
SET 
  sponsor_name = 'New Sponsor',
  sponsor_logo_url = 'https://newsponsor.com/logo.png'
WHERE id = 'featured-stack-id';
```

## Sponsor Logos

Common sponsor logo URLs:

- **Railway**: `https://railway.app/brand/logo-light.svg`
- **Vercel**: `https://vercel.com/favicon.ico`
- **Supabase**: `https://supabase.com/favicon.ico`
- **AWS**: `https://a0.awsstatic.com/libra-css/images/logos/aws_logo_smile_1200x630.png`
- **Clerk**: `https://clerk.com/favicon.ico`
- **Stripe**: `https://stripe.com/favicon.ico`

## Priority System

- **Priority 1**: Highest priority, appears first
- **Priority 2**: Medium priority
- **Priority 3**: Lower priority

Featured stacks are ordered by priority (ascending), then by creation date.

## Display Locations

Featured stacks appear in:
1. **Homepage**: Below hero section, above feed (carousel if multiple)
2. **Stack Detail Page**: Sidebar (single card)

## Analytics

Track featured stack clicks:
```sql
SELECT 
  fs.sponsor_name,
  COUNT(fsc.id) as click_count,
  COUNT(DISTINCT fsc.user_id) as unique_users
FROM featured_stacks fs
LEFT JOIN featured_stack_clicks fsc ON fs.id = fsc.featured_stack_id
WHERE fs.active = true
GROUP BY fs.sponsor_name
ORDER BY click_count DESC;
```
