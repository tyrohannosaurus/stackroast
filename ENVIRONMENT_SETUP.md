# Environment Variables Setup Guide

This guide helps you configure all the required API keys and environment variables for StackRoast.

## 🔑 Required Environment Variables

### 1. Supabase Configuration (Required)

**Where to find:**
1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to **Settings** → **API**

**Variables needed:**
```bash
VITE_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 2. AI Provider (At least one required)

#### Option A: Google AI / Gemini (Recommended)

**Where to get:**
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Click **"Get API Key"**
3. Create a new API key or use existing

**Variable:**
```bash
VITE_GOOGLE_AI_API_KEY=AIzaSy...
```

**Rate limits:** Free tier includes generous limits

#### Option B: Groq (Alternative/Backup)

**Where to get:**
1. Go to [Groq Console](https://console.groq.com/keys)
2. Sign up/login
3. Create a new API key

**Variable:**
```bash
VITE_GROQ_API_KEY=gsk_...
```

**Note:** You can configure both for redundancy. The app will use Google AI as primary and fall back to Groq.

---

## 📝 Setup Instructions

### Local Development

1. **Copy the example file:**
   ```bash
   cp .env.example .env.local
   ```

2. **Fill in your values:**
   ```bash
   # Edit .env.local with your actual values
   nano .env.local  # or use your favorite editor
   ```

3. **Verify the file:**
   ```bash
   cat .env.local
   ```

4. **Start development server:**
   ```bash
   npm run dev
   ```

### Production Deployment

Environment variables need to be set in your hosting platform's dashboard:

#### Vercel

1. Go to your project → **Settings** → **Environment Variables**
2. Add each variable:
   - Name: `VITE_SUPABASE_URL`
   - Value: `https://your-project.supabase.co`
   - Environment: **Production**, **Preview**, **Development**
3. Click **Save**
4. Redeploy

#### Netlify

1. Go to **Site settings** → **Build & deploy** → **Environment**
2. Click **Edit variables**
3. Add each variable
4. Save and redeploy

#### Other Platforms

Most platforms have an environment variables section in their dashboard. Add all `VITE_*` variables there.

---

## 🔐 Supabase Edge Function Secrets

Edge functions need separate environment variables:

### Via Supabase CLI

```bash
# Email service API key (for Resend)
supabase secrets set RESEND_API_KEY=re_your_key_here

# From email address
supabase secrets set FROM_EMAIL="StackRoast <noreply@stackroast.dev>"

# Your site URL
supabase secrets set SITE_URL=https://stackroast.dev
```

### Via Supabase Dashboard

1. Go to **Edge Functions** → **Manage secrets**
2. Add each secret:
   - `RESEND_API_KEY` - Your Resend API key
   - `FROM_EMAIL` - Email sender address
   - `SITE_URL` - Your production URL

---

## 🧪 Testing Your Configuration

### 1. Test Supabase Connection

```typescript
// In browser console after starting app
console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL);

// Should not show "undefined"
```

### 2. Test AI Provider

Try submitting a stack. If AI roast generation works, your API key is configured correctly.

**Success:** Stack gets roasted with AI-generated content
**Failure:** Check browser console for API key errors

### 3. Test Email Functions

```bash
# Test send-email function
curl -X POST \
  https://your-project.supabase.co/functions/v1/send-email \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "test@example.com",
    "subject": "Test",
    "html": "<p>Test email</p>"
  }'
```

**Success:** Returns `{"success": true}`
**Failure:** Check Supabase logs

---

## 🛡️ Security Best Practices

### ✅ DO:
- Use `.env.local` for local development (ignored by git)
- Keep production keys in hosting platform's secure storage
- Rotate API keys periodically
- Use different keys for development and production
- Set rate limits on your API keys

### ❌ DON'T:
- Commit `.env` files to git
- Share API keys in screenshots or public channels
- Use production keys in development
- Hard-code API keys in source code

---

## 🔄 Environment Variable Reference

| Variable | Required | Used By | Purpose |
|----------|----------|---------|---------|
| `VITE_SUPABASE_URL` | ✅ Yes | Frontend | Connect to Supabase database |
| `VITE_SUPABASE_ANON_KEY` | ✅ Yes | Frontend | Authenticate with Supabase |
| `VITE_GOOGLE_AI_API_KEY` | ⚠️ One required | Frontend | Generate AI roasts with Gemini |
| `VITE_GROQ_API_KEY` | ⚠️ One required | Frontend | Fallback AI provider |
| `VITE_SITE_URL` | ⭐ Optional | Frontend | Site URL for sharing/emails |
| `RESEND_API_KEY` | ✅ Yes | Edge Functions | Send emails via Resend |
| `FROM_EMAIL` | ✅ Yes | Edge Functions | Email sender address |
| `SITE_URL` | ✅ Yes | Edge Functions | Production URL for links |

---

## 🆘 Troubleshooting

### Issue: "Supabase URL is not defined"

**Solution:**
1. Check `.env.local` exists
2. Restart dev server: `npm run dev`
3. Verify variable name is exactly `VITE_SUPABASE_URL`

### Issue: "AI API key is not configured"

**Solution:**
1. Check you have either `VITE_GOOGLE_AI_API_KEY` or `VITE_GROQ_API_KEY` set
2. Restart dev server
3. Check for typos in variable name
4. Verify API key is valid (test on provider's website)

### Issue: Edge function returns 500 error

**Solution:**
1. Check Supabase logs: Dashboard → Edge Functions → Logs
2. Verify secrets are set: `supabase secrets list`
3. Ensure `RESEND_API_KEY` is valid
4. Check email format in `FROM_EMAIL`

### Issue: CORS error when calling edge functions

**Solution:**
1. Edge functions were updated to whitelist specific origins
2. Check `ALLOWED_ORIGINS` in edge function code includes your domain
3. Redeploy edge functions: `supabase functions deploy`

---

## 📋 Quick Setup Checklist

- [ ] Copy `.env.example` to `.env.local`
- [ ] Get Supabase URL and anon key from dashboard
- [ ] Get Google AI API key (or Groq key)
- [ ] Fill in all values in `.env.local`
- [ ] Set edge function secrets in Supabase
- [ ] Test locally: `npm run dev`
- [ ] Submit a test stack to verify AI works
- [ ] Set production env vars in hosting platform
- [ ] Deploy and test in production

---

## 🎯 Minimum Working Configuration

For a minimal working setup, you need:

```bash
# .env.local
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_GOOGLE_AI_API_KEY=AIza...
```

```bash
# Supabase secrets (for edge functions)
RESEND_API_KEY=re_xxx
FROM_EMAIL=StackRoast <noreply@stackroast.dev>
SITE_URL=https://stackroast.dev
```

That's it! These are the bare minimum to get the app running.

---

**Need help?** Check the browser console and Supabase logs for specific error messages.
