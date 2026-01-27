# StackRoast Revenue Optimization Plan

**Goal:** $30K/month in affiliate revenue
**Current State:** Pre-launch, no affiliates set up
**Strategy:** Viral + Product Hunt launch

---

## Phase 1: Foundation (IMPLEMENTED)

### UI Optimizations (Done)

1. **Roast → Recommendations CTA** (`AIRoastTab.tsx`)
   - Added conversion CTA card after roast displays
   - Shows potential savings amount
   - Directs users to recommendations section
   - Expected impact: +15-20% of roast viewers to recommendations

2. **Savings Banner at Top** (`AlternativeSuggestions.tsx`)
   - Moved savings summary to top of recommendations
   - Eye-catching gradient design with animation
   - Shows monthly/yearly savings prominently
   - Progress indicator for motivation
   - Expected impact: +10-15% click-through

3. **Benefit-First CTAs** (`RecommendationCard.tsx`)
   - Dynamic CTA text based on context:
     - "Save $X/mo" for budget alternatives
     - "Add {tool}" for missing tools
     - "Fix Now" for high severity issues
     - "Start Free" as default
   - Shadow effects for depth
   - Expected impact: +12-25% CTR

4. **Social Proof & Urgency** (`UrgencyBadge.tsx`, `RecommendationCard.tsx`)
   - Context score badges (e.g., "87% match")
   - Popular choice indicators
   - Trending badges for hot tools
   - Limited time indicators
   - Expected impact: +10-15% trust increase

5. **Email Capture Modal** (`EmailCaptureModal.tsx`)
   - Captures leads before recommendations
   - Shows value proposition (savings, recommendations count)
   - Marketing consent checkbox
   - Skip option for non-blockers
   - Expected impact: 40-50% email capture rate

6. **Kit-to-Affiliate Flow** (`StackKitDetailDialog.tsx`)
   - "Try Free" buttons on each tool in kit
   - Cost optimization CTA card
   - Tracks affiliate clicks properly
   - Expected impact: +200-300% conversion from kit pages

7. **A/B Testing Infrastructure** (`analytics.ts`)
   - Centralized A/B test configuration
   - Variant assignment with persistence
   - Event tracking for impressions, clicks, conversions
   - Session-based funnel tracking

---

## Phase 2: Affiliate Setup (TODO - CRITICAL)

### High-Commission Affiliate Programs to Sign Up For

| Tool | Commission | Cookie Duration | Notes |
|------|------------|-----------------|-------|
| **Vercel** | $50-100/signup | 30 days | Contact enterprise partnerships |
| **Supabase** | 20% recurring | 60 days | Apply via PartnerStack |
| **Railway** | $25/signup | 30 days | Contact via Discord |
| **PlanetScale** | 20% recurring | 30 days | Apply via website |
| **Stripe** | $0 (no program) | - | Use ecosystem partners instead |
| **Auth0** | $100-250/qualified lead | 30 days | Developer program |
| **Clerk** | 20% recurring | 60 days | Contact partnerships |
| **Resend** | 20% recurring | 30 days | Apply via website |
| **Neon** | 20% recurring | 30 days | Contact via Discord |
| **Upstash** | 20% recurring | 30 days | Apply via website |
| **Sentry** | $50-100/signup | 30 days | Developer program |
| **LaunchDarkly** | Varies | 30 days | Enterprise leads |
| **Datadog** | $200-500/enterprise lead | 30 days | High value, low volume |

### Affiliate Link Implementation

```typescript
// src/data/affiliateLinks.ts - Update with real affiliate URLs
export const AFFILIATE_LINKS = {
  vercel: {
    url: 'https://vercel.com/?ref=stackroast',
    commission: 50,
  },
  supabase: {
    url: 'https://supabase.com/?ref=stackroast',
    commission: 20, // percentage
    recurring: true,
  },
  // ... add more
};
```

---

## Phase 3: Launch Strategy (TODO)

### Product Hunt Launch Checklist

- [ ] Create compelling product page
- [ ] Prepare launch day assets (screenshots, GIF demos)
- [ ] Build hunter network (reach out to top hunters)
- [ ] Schedule for Tuesday-Thursday (best days)
- [ ] Prepare social media content
- [ ] Set up real-time monitoring

### Viral Loop Optimization

1. **Burn Card Sharing**
   - Add UTM tracking to shared URLs
   - Create unique referral codes per share
   - Track viral coefficient (K-factor)

2. **Twitter/X Integration**
   - One-click tweet with roast highlight
   - Include burn score in share text
   - Add @StackRoast mention

3. **Referral Program**
   - Give referrers credit for conversions
   - Show leaderboard of top referrers
   - Consider cash/credit rewards

---

## Phase 4: Email Sequences (TODO)

### Trigger-Based Sequences

**Sequence 1: Post-Roast (User generated roast but didn't view recommendations)**
- Email 1 (2 hours): "Your stack improvements are ready"
- Email 2 (1 day): "3 quick wins for your {stack_name}"
- Email 3 (3 days): "Engineers are saving $X with these tools"

**Sequence 2: Viewed Recommendations (User viewed but didn't click)**
- Email 1 (2 hours): "You left ${savings} on the table"
- Email 2 (1 day): "Here's why {top_tool} is #1"
- Email 3 (3 days): "Limited: {tool} special pricing"

**Sequence 3: Clicked but No Conversion**
- Email 1 (1 day): "Need help getting started with {tool}?"
- Email 2 (3 days): "Quick tips for {tool} setup"
- Email 3 (7 days): "{tool} just released {feature}"

### Implementation
- Use Resend for transactional emails
- Set up Supabase Edge Function triggers
- Track opens, clicks, conversions

---

## Phase 5: SEO & Content (TODO)

### Comparison Pages

Create `/compare/{tool1}-vs-{tool2}` pages for high-volume searches:

1. Vercel vs Netlify
2. Supabase vs Firebase
3. Railway vs Render vs Fly.io
4. Clerk vs Auth0 vs Supabase Auth
5. PlanetScale vs Neon vs Supabase
6. Prisma vs Drizzle vs TypeORM
7. Stripe vs Paddle vs LemonSqueezy
8. Tailwind vs Bootstrap vs CSS-in-JS
9. Next.js vs Remix vs Nuxt
10. Cursor vs VS Code vs Windsurf

Each page should include:
- Feature comparison matrix
- Pricing comparison
- Use case recommendations
- Affiliate CTAs for both tools
- User comments/votes

### Blog Content Ideas

- "The Ultimate Indie Hacker Stack 2026"
- "How I Cut My SaaS Costs by 60%"
- "Best Free Tiers for Startups"
- "AI Tools Every Developer Needs"
- "Why You Should Ditch [Popular Tool]"

---

## Phase 6: Conversion Rate Optimization (ONGOING)

### A/B Tests to Run

1. **CTA Text Variants**
   - A: "Save $X/mo"
   - B: "Start Free Trial"
   - C: "Try {Tool}"
   - D: "See How It Compares"

2. **Savings Banner Position**
   - A: Top only
   - B: Bottom only
   - C: Both top and bottom

3. **Email Capture Timing**
   - A: Immediate popup
   - B: After 3 seconds
   - C: After 5 seconds
   - D: On scroll to recommendations

4. **Urgency Elements**
   - A: No urgency
   - B: "X engineers using this"
   - C: "Limited time offer"
   - D: Both

### Metrics to Track

```
Daily Dashboard:
- Unique visitors
- Roasts generated
- Recommendations viewed
- Affiliate clicks
- Email captures
- Estimated revenue

Weekly Review:
- Conversion rates by funnel step
- A/B test results
- Top converting tools
- Revenue by source
- User feedback
```

---

## Revenue Projections

### Conservative (10K visitors/mo)
- 3% CTR on recommendations
- 2% conversion at affiliate site
- $150 avg commission
= **$900/month**

### Moderate (25K visitors/mo)
- 10% CTR on recommendations (with optimizations)
- 5% conversion at affiliate site
- $200 avg commission
= **$25,000/month**

### Aggressive (50K visitors/mo)
- 15% CTR on recommendations
- 8% conversion
- $250 avg commission
= **$150,000/month**

---

## Immediate Next Steps

### This Week
1. [ ] Sign up for 5 affiliate programs (Vercel, Supabase, Railway, Clerk, Resend)
2. [ ] Add affiliate URLs to database
3. [ ] Set up email capture table in Supabase
4. [ ] Test all new UI components
5. [ ] Deploy to production

### Next Week
1. [ ] Launch on Product Hunt
2. [ ] Set up email sequences (minimum 1 sequence)
3. [ ] Create 2 comparison pages
4. [ ] Start A/B testing CTAs
5. [ ] Monitor and iterate

### Month 1 Goals
- [ ] 10K visitors
- [ ] 1K email captures
- [ ] $3-5K affiliate revenue
- [ ] Identify top 3 converting tools

---

## Database Tables Needed

```sql
-- Email captures
CREATE TABLE email_captures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  source TEXT,
  stack_name TEXT,
  potential_savings DECIMAL,
  recommendation_count INT,
  marketing_consent BOOLEAN DEFAULT false,
  session_id TEXT,
  captured_at TIMESTAMPTZ DEFAULT NOW()
);

-- A/B test events
CREATE TABLE ab_test_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_name TEXT NOT NULL,
  variant TEXT NOT NULL,
  event_type TEXT NOT NULL, -- impression, click, conversion
  metadata JSONB,
  session_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Funnel events
CREATE TABLE funnel_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  step TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  stack_id UUID,
  savings_amount DECIMAL,
  recommendation_count INT,
  tool_name TEXT,
  kit_id UUID,
  referrer TEXT,
  page_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enhanced alternative clicks
ALTER TABLE alternative_clicks ADD COLUMN IF NOT EXISTS session_id TEXT;
ALTER TABLE alternative_clicks ADD COLUMN IF NOT EXISTS rec_type TEXT;
ALTER TABLE alternative_clicks ADD COLUMN IF NOT EXISTS savings_amount TEXT;
ALTER TABLE alternative_clicks ADD COLUMN IF NOT EXISTS cta_variant TEXT;
ALTER TABLE alternative_clicks ADD COLUMN IF NOT EXISTS position INT;
ALTER TABLE alternative_clicks ADD COLUMN IF NOT EXISTS source TEXT;
ALTER TABLE alternative_clicks ADD COLUMN IF NOT EXISTS estimated_commission DECIMAL;
ALTER TABLE alternative_clicks ADD COLUMN IF NOT EXISTS referrer TEXT;
```

---

## Key Success Metrics

| Metric | Current | Target (30 days) | Target (90 days) |
|--------|---------|------------------|------------------|
| Monthly Visitors | 0 | 25K | 100K |
| Email Capture Rate | 0% | 30% | 40% |
| Recommendation CTR | ~3% | 15% | 20% |
| Affiliate Conversion | ~2% | 5% | 8% |
| Monthly Revenue | $0 | $5K | $30K |

---

*Last Updated: January 27, 2026*
