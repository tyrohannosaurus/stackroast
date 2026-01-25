# Deployment Guide - Security & Performance Fixes

This guide walks through deploying all the security and performance fixes implemented during the audit.

## ✅ Pre-Deployment Checklist

- [x] All dependencies installed (`npm install`)
- [x] Security vulnerabilities fixed (`npm audit fix`)
- [x] Build passes without errors (`npm run build`)
- [x] Validation library tested and working
- [x] Migration files reviewed for syntax errors

---

## 🗄️ Step 1: Database Migrations

### Option A: Using Supabase CLI (Recommended)

```bash
# 1. Install Supabase CLI if not already installed
npm install -g supabase

# 2. Login to Supabase
supabase login

# 3. Link your project
supabase link --project-ref <your-project-ref>

# 4. Apply migrations
supabase db push

# 5. Verify migrations applied successfully
supabase db diff
```

### Option B: Manual SQL Execution

If you don't have Supabase CLI, run the migrations manually in the Supabase Dashboard:

1. Go to **Supabase Dashboard** → **SQL Editor**

2. **First Migration - Security Fixes:**
   - Copy contents of `supabase/migrations/20260123_fix_critical_rls_policies.sql`
   - Paste into SQL Editor
   - Click **Run**
   - Verify: "Success. No rows returned"

3. **Second Migration - Performance:**
   - Copy contents of `supabase/migrations/20260123_optimize_roast_queries.sql`
   - Paste into SQL Editor
   - Click **Run**
   - Verify: "Success. No rows returned"

4. **Test the view:**
   ```sql
   SELECT COUNT(*) FROM community_roasts_with_stats;
   ```

### Verify Database Changes

After running migrations, verify they were applied:

```sql
-- Check RLS policies exist
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE tablename IN ('stacks', 'stack_items', 'roast_votes', 'roast_comments')
ORDER BY tablename, policyname;

-- Check view was created
SELECT COUNT(*) FROM community_roasts_with_stats;

-- Check constraints were added
SELECT conname, contype, conrelid::regclass
FROM pg_constraint
WHERE conrelid IN (
  'stacks'::regclass,
  'roast_votes'::regclass,
  'roast_comments'::regclass,
  'ai_roasts'::regclass
)
ORDER BY conrelid, conname;
```

Expected results:
- **Policies:** Should see new "Authenticated users can..." and "Public can..." policies
- **View:** Should return count of community roasts
- **Constraints:** Should see `_check` constraints for validation

---

## ⚡ Step 2: Deploy Edge Functions

Update both edge functions with CORS fixes and timeouts:

```bash
# 1. Deploy send-email function
supabase functions deploy send-email

# 2. Deploy send-reminders function
supabase functions deploy send-reminders

# 3. Verify deployment
supabase functions list
```

### Test Edge Functions

```bash
# Test send-email function
curl -X POST \
  https://<your-project-ref>.supabase.co/functions/v1/send-email \
  -H "Authorization: Bearer <anon-key>" \
  -H "Content-Type: application/json" \
  -H "Origin: https://stackroast.dev" \
  -d '{
    "to": "test@example.com",
    "subject": "Test Email",
    "html": "<p>Test</p>"
  }'

# Should return CORS headers in response
```

---

## 🚀 Step 3: Deploy Frontend

### Option A: Vercel

```bash
# 1. Build the project
npm run build

# 2. Deploy to Vercel
vercel deploy --prod

# Or if using Vercel CLI
npm install -g vercel
vercel login
vercel link
vercel --prod
```

### Option B: Netlify

```bash
# 1. Build the project
npm run build

# 2. Deploy to Netlify
netlify deploy --prod --dir=dist

# Or using Netlify CLI
npm install -g netlify-cli
netlify login
netlify link
netlify deploy --prod
```

### Option C: Any Static Host

```bash
# 1. Build the project
npm run build

# 2. Upload the `dist/` folder to your hosting provider
# The dist folder contains all static files needed
```

---

## 🔐 Step 4: Environment Variables

Ensure these environment variables are set in your hosting platform:

### Production Environment Variables

```bash
# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Google AI (if using Gemini)
VITE_GOOGLE_AI_API_KEY=your-google-ai-key

# Site URL
VITE_SITE_URL=https://stackroast.dev
```

### Supabase Edge Function Secrets

Set these in Supabase Dashboard → Edge Functions → Secrets:

```bash
RESEND_API_KEY=re_your_resend_key
FROM_EMAIL=StackRoast <noreply@stackroast.dev>
SITE_URL=https://stackroast.dev
```

Or via CLI:

```bash
supabase secrets set RESEND_API_KEY=re_your_resend_key
supabase secrets set FROM_EMAIL="StackRoast <noreply@stackroast.dev>"
supabase secrets set SITE_URL=https://stackroast.dev
```

---

## 🧪 Step 5: Post-Deployment Testing

### Critical Path Testing

1. **Stack Submission with Validation**
   ```
   ✓ Submit stack with valid data → Success
   ✓ Submit stack with XSS attempt → Rejected
   ✓ Submit stack with HTML tags → Rejected
   ✓ Submit stack with 101+ char name → Rejected
   ✓ Submit stack with empty name → Error message
   ```

2. **Community Roasts Performance**
   ```
   ✓ Load roast feed → Fast, single query
   ✓ Comment counts displayed → Accurate
   ✓ Vote counts displayed → Accurate
   ✓ No N+1 queries in network tab
   ```

3. **Error Handling**
   ```
   ✓ Trigger component error → Error boundary shows
   ✓ Click "Try Again" → Component recovers
   ✓ Click "Go Home" → Navigates to home
   ```

4. **CORS Protection**
   ```
   ✓ Call edge function from allowed origin → Success
   ✓ Call edge function from random origin → CORS error
   ```

5. **Navigation**
   ```
   ✓ Click kit card → React Router navigation (no reload)
   ✓ Submit GitHub repo → React Router navigation (no reload)
   ✓ Browser back button → Works correctly
   ```

### Browser Console Checks

Open browser DevTools and check:

```javascript
// Should see no XSS warnings
// Should see no TypeScript errors
// Should see validation working
console.log('Stack submitted'); // When submitting valid stack
```

### Network Tab Checks

1. **Load Community Roasts:**
   - Should see **1 query** to `community_roasts_with_stats`
   - Should NOT see multiple `roast_comments` queries

2. **Edge Function Calls:**
   - Should see CORS headers in response:
     ```
     Access-Control-Allow-Origin: https://stackroast.dev
     Access-Control-Allow-Methods: POST, OPTIONS
     ```

---

## 📊 Step 6: Monitoring Setup (Optional but Recommended)

### A. Add Error Tracking

Install Sentry for production error tracking:

```bash
npm install @sentry/react

# In src/main.tsx:
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "your-sentry-dsn",
  environment: import.meta.env.MODE,
  integrations: [
    Sentry.browserTracingIntegration(),
  ],
  tracesSampleRate: 0.1,
});
```

### B. Performance Monitoring

Add to ErrorBoundary component:

```typescript
componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
  // Send to error tracking
  if (import.meta.env.PROD) {
    Sentry.captureException(error, { extra: errorInfo });
  }
}
```

---

## 🔄 Step 7: Rollback Plan

If something goes wrong, you can rollback:

### Database Rollback

```sql
-- Drop new policies
DROP POLICY IF EXISTS "Authenticated users can insert valid stacks" ON stacks;
-- ... (drop other new policies)

-- Recreate old policies
CREATE POLICY "Anyone can insert stacks"
ON stacks FOR INSERT TO public
WITH CHECK (true);
-- ... (recreate other old policies)

-- Drop the view
DROP VIEW IF EXISTS community_roasts_with_stats;
```

### Frontend Rollback

```bash
# Redeploy previous build
git checkout <previous-commit>
npm run build
vercel deploy --prod  # or your deployment command
```

### Edge Functions Rollback

```bash
# Restore old edge function code from git
git checkout <previous-commit> supabase/functions/
supabase functions deploy send-email
supabase functions deploy send-reminders
```

---

## 📝 Post-Deployment Checklist

- [ ] Database migrations applied successfully
- [ ] Edge functions deployed and tested
- [ ] Frontend deployed to production
- [ ] Environment variables configured
- [ ] CORS working correctly
- [ ] Validation blocking XSS attempts
- [ ] Performance improved (N+1 queries fixed)
- [ ] Error boundaries catching errors
- [ ] Navigation using React Router (no full page reloads)
- [ ] All critical paths tested
- [ ] Error tracking configured (optional)
- [ ] Team notified of deployment

---

## 🆘 Troubleshooting

### Issue: Migration Fails

**Error:** `relation "stacks" does not exist`

**Solution:** Check table names in your schema. Adjust migration if table names differ.

---

### Issue: View Returns No Data

**Error:** `SELECT COUNT(*) FROM community_roasts_with_stats; returns 0`

**Solution:**
1. Check if `community_roasts` table exists and has data
2. Verify table/column names match your schema
3. Check RLS policies aren't blocking access

---

### Issue: Edge Function CORS Error

**Error:** `CORS policy: No 'Access-Control-Allow-Origin' header is present`

**Solution:**
1. Verify edge functions were redeployed
2. Check `ALLOWED_ORIGINS` includes your domain
3. Ensure Origin header is sent in request

---

### Issue: Build Fails

**Error:** `Cannot find module '@/lib/validation'`

**Solution:**
```bash
# Ensure file exists
ls src/lib/validation.ts

# Rebuild
rm -rf node_modules dist
npm install
npm run build
```

---

### Issue: Types Not Working

**Error:** `Property 'comment_count' does not exist on type 'CommunityRoast'`

**Solution:**
```typescript
// Use the correct type
import type { CommunityRoastWithStats } from "@/types/database";

// Update component
const roast: CommunityRoastWithStats = data;
```

---

## 📞 Support

If you encounter issues:

1. Check browser console for errors
2. Check Supabase Dashboard → Logs
3. Review `AUDIT_FIXES_SUMMARY.md` for implementation details
4. Check network tab for failed requests
5. Verify environment variables are set correctly

---

## 🎉 Success Criteria

Deployment is successful when:

- ✅ Stack submission validates input and rejects XSS
- ✅ Roast feeds load in <500ms with single query
- ✅ Error boundaries catch and display errors gracefully
- ✅ CORS only allows whitelisted origins
- ✅ Navigation is instant (React Router, no reloads)
- ✅ All TypeScript types compile correctly
- ✅ No security vulnerabilities in `npm audit`

---

**Deployed by:** [Your Name]
**Deployment Date:** [Date]
**Version:** Post-Audit Security & Performance Fixes
**Rollback Tested:** Yes/No
