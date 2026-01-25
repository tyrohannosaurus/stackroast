# Migration Guide: Moving Fixes to Main Project

This guide helps you safely migrate all the security and performance fixes from this dev/test folder to your main project folder.

## ⚠️ Important: Don't Just Copy Everything!

Some files should NOT be copied directly. Follow this guide to avoid breaking your main project.

---

## 📋 Step-by-Step Migration

### Step 1: Backup Your Main Project (CRITICAL!)

```bash
# Navigate to your main project
cd /path/to/your/main/project

# Create a backup
git add .
git commit -m "Backup before applying security fixes"

# Or if not using git
cp -r . ../main-project-backup
```

---

### Step 2: Copy New Files

These files are **NEW** and safe to copy directly:

```bash
# From this dev folder, copy these NEW files to main project:

# Validation library
cp src/lib/validation.ts /path/to/main/src/lib/

# Type definitions
cp src/types/database.ts /path/to/main/src/types/

# Error boundary component
cp src/components/ErrorBoundary.tsx /path/to/main/src/components/

# Database migrations
cp supabase/migrations/20260123_fix_critical_rls_policies.sql /path/to/main/supabase/migrations/
cp supabase/migrations/20260123_optimize_roast_queries.sql /path/to/main/supabase/migrations/

# Documentation
cp AUDIT_FIXES_SUMMARY.md /path/to/main/
cp DEPLOYMENT_GUIDE.md /path/to/main/
cp ENVIRONMENT_SETUP.md /path/to/main/
cp SETUP_CHECKLIST.md /path/to/main/
cp .env.example /path/to/main/
```

---

### Step 3: Update Modified Files (CAREFULLY!)

These files were **MODIFIED**. You need to apply changes carefully:

#### Option A: Manual Merge (Recommended)

Use a diff tool to review and apply changes:

```bash
# Compare and merge each file
code --diff /path/to/main/src/App.tsx stackroast-main/src/App.tsx

# For each file, review changes and apply manually:
# - src/App.tsx
# - src/contexts/AuthContext.tsx
# - src/components/CommunityRoastsTab.tsx
# - src/components/SubmitStackDialog.tsx
# - src/pages/Index.tsx
# - src/components/RepoRoastDialog.tsx
# - supabase/functions/send-email/index.ts
# - supabase/functions/send-reminders/index.ts
```

#### Option B: Git Merge (If Using Git)

```bash
# In main project
git remote add fixes /path/to/stackroast-main
git fetch fixes
git cherry-pick <commit-hash>  # Pick specific commits
```

---

### Step 4: Key Changes to Apply

Here's what changed in each file:

#### `src/App.tsx`
**ADD:**
```typescript
import { ErrorBoundary } from "@/components/ErrorBoundary";

// Wrap app in error boundaries
<ErrorBoundary>
  <QueryClientProvider>
    // ... rest of app
  </QueryClientProvider>
</ErrorBoundary>
```

#### `src/contexts/AuthContext.tsx`
**ADD:**
```typescript
import { useRef } from "react"; // Add to imports

// Add before loadProfile function
const loadingProfileRef = useRef<string | null>(null);

// In loadProfile, add race condition guard
const loadProfile = async (userId: string) => {
  if (loadingProfileRef.current === userId) {
    console.log("Profile load already in progress");
    return;
  }
  loadingProfileRef.current = userId;

  try {
    // ... existing code
  } finally {
    if (loadingProfileRef.current === userId) {
      loadingProfileRef.current = null;
    }
  }
};
```

#### `src/components/SubmitStackDialog.tsx`
**ADD:**
```typescript
import { CreateStackSchema, generateSlug, isXssSafe, formatZodError } from "@/lib/validation";

// In handleSubmit, replace basic validation with:
const validationResult = CreateStackSchema.safeParse({
  name: stackName,
  description: "",
  selectedTools: selectedTools.map(t => ({
    id: t.id,
    name: t.name,
    category: t.category
  })),
  isPublic: true,
});

if (!validationResult.success) {
  const errorMessage = formatZodError(validationResult.error);
  toast({
    title: "Validation Error",
    description: errorMessage,
    variant: "destructive",
  });
  return;
}

if (!isXssSafe(stackName)) {
  toast({
    title: "Invalid Input",
    description: "Stack name contains invalid characters or tags.",
    variant: "destructive",
  });
  return;
}

// Use validated slug generation
const slug = generateSlug(name);
```

#### `src/components/CommunityRoastsTab.tsx`
**ADD:**
```typescript
import type { CommunityRoastWithProfile, CommunityRoastWithStats, SupabaseError } from "@/types/database";

// Change query from community_roasts to:
const { data, error } = await supabase
  .from("community_roasts_with_stats")
  .select("*")
  .eq("stack_id", stackId);

// Update state type
const [roasts, setRoasts] = useState<CommunityRoastWithProfile[]>([]);
```

#### `src/pages/Index.tsx` & `src/components/RepoRoastDialog.tsx`
**REPLACE:**
```typescript
// Replace all instances of:
window.location.href = `/path`;

// With:
import { useNavigate } from "react-router-dom";
const navigate = useNavigate();
navigate(`/path`);
```

#### `supabase/functions/send-email/index.ts` & `send-reminders/index.ts`
**REPLACE CORS:**
```typescript
// Replace:
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "...",
};

// With:
const ALLOWED_ORIGINS = [
  "https://stackroast.dev",
  "https://www.stackroast.dev",
  "http://localhost:5173",
];

function getCorsHeaders(origin: string | null): Record<string, string> {
  const allowedOrigin = origin && ALLOWED_ORIGINS.includes(origin)
    ? origin
    : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Max-Age": "86400",
  };
}

// In serve() function:
const origin = req.headers.get("origin");
const corsHeaders = getCorsHeaders(origin);
```

**ADD TIMEOUT:**
```typescript
// For fetch calls, add:
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 10000);

try {
  const response = await fetch(url, {
    signal: controller.signal,
    // ... other options
  });
} finally {
  clearTimeout(timeoutId);
}
```

---

### Step 5: Don't Copy These Files!

**DO NOT COPY** these from dev folder (they're specific to this folder):

```
❌ node_modules/        # Will reinstall
❌ dist/                # Will rebuild
❌ .env.local           # Environment-specific
❌ package-lock.json    # May conflict with main project
❌ bun.lockb            # If main project uses npm
```

---

### Step 6: Update Dependencies

In your main project:

```bash
# Install any new dependencies
npm install zod  # If not already installed

# Fix security vulnerabilities
npm audit fix

# Rebuild
npm run build
```

---

### Step 7: Test Before Deployment

```bash
# In main project
npm run dev

# Test these critical paths:
# 1. Submit stack with XSS → Should be blocked
# 2. Navigate between pages → Should use React Router
# 3. Load roast feed → Should use optimized query
# 4. Trigger error → Error boundary should catch
```

---

## 🔍 Verification Checklist

After migration, verify:

- [ ] `npm run dev` starts without errors
- [ ] Build succeeds: `npm run build`
- [ ] No TypeScript errors
- [ ] Import statements resolve correctly
- [ ] Validation library works
- [ ] Error boundaries catch errors
- [ ] Database migrations exist in correct folder

---

## 🆘 Troubleshooting

### Issue: Import errors for validation.ts

**Solution:**
```bash
# Make sure file exists
ls src/lib/validation.ts

# Check TypeScript paths in tsconfig.json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### Issue: Import errors for database types

**Solution:**
```bash
# Make sure file exists
ls src/types/database.ts
```

### Issue: Build fails after migration

**Solution:**
```bash
# Clean rebuild
rm -rf node_modules dist
npm install
npm run build
```

### Issue: Runtime errors about missing modules

**Solution:**
```bash
# Check package.json has zod
npm install zod

# Reinstall all dependencies
npm install
```

---

## 🎯 Quick Migration (5 Minutes)

If your main project is identical to this dev folder:

```bash
#!/bin/bash
MAIN="/path/to/main/project"
DEV="/path/to/stackroast-main"

# Backup
cd $MAIN
git add . && git commit -m "Pre-migration backup"

# Copy new files
cp $DEV/src/lib/validation.ts $MAIN/src/lib/
cp $DEV/src/types/database.ts $MAIN/src/types/
cp $DEV/src/components/ErrorBoundary.tsx $MAIN/src/components/
cp $DEV/supabase/migrations/20260123*.sql $MAIN/supabase/migrations/
cp $DEV/*.md $MAIN/
cp $DEV/.env.example $MAIN/

# Copy modified files (review first!)
cp $DEV/src/App.tsx $MAIN/src/
cp $DEV/src/contexts/AuthContext.tsx $MAIN/src/contexts/
cp $DEV/src/components/CommunityRoastsTab.tsx $MAIN/src/components/
cp $DEV/src/components/SubmitStackDialog.tsx $MAIN/src/components/
cp $DEV/src/pages/Index.tsx $MAIN/src/pages/
cp $DEV/src/components/RepoRoastDialog.tsx $MAIN/src/components/
cp $DEV/supabase/functions/send-email/index.ts $MAIN/supabase/functions/send-email/
cp $DEV/supabase/functions/send-reminders/index.ts $MAIN/supabase/functions/send-reminders/

# Reinstall
cd $MAIN
npm install
npm audit fix

# Test
npm run build
npm run dev
```

---

## ✅ Post-Migration

After copying files:

1. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   # Fill in your values
   ```

2. **Apply database migrations**
   ```bash
   supabase db push
   ```

3. **Redeploy edge functions**
   ```bash
   supabase functions deploy send-email
   supabase functions deploy send-reminders
   ```

4. **Test thoroughly** before deploying to production

---

## 💡 Best Practice

Instead of copying everything, consider:

1. **Review changes** in each file
2. **Apply incrementally** (one file at a time)
3. **Test after each change**
4. **Commit frequently** so you can rollback if needed

This is safer than a bulk copy and helps you understand the changes.

---

**Summary:** You need to copy new files and carefully merge changes in modified files. Don't just copy the entire folder! Follow this guide for a safe migration. 🚀
