# StackRoast Project Context

**Project Name:** StackRoast (formerly stackroastdemotest)  
**Last Updated:** January 2025  
**Status:** Production-ready monetization features implemented

---

## 🎯 Project Overview

StackRoast is a community-driven platform where developers submit their tech stacks to receive AI-powered "roasts" (humorous critiques). The platform helps developers identify weaknesses in their stacks, discover better alternatives, and save money through affiliate partnerships.

**Core Value Proposition:** 
- Submit your tech stack → Get brutally honest AI roasts
- Discover better alternatives with cost savings
- Save stacks for later reference
- Browse curated stack kits for common use cases

---

## 🛠️ Tech Stack

### Frontend
- **Framework:** React 18.3.1 + TypeScript 5.8.3
- **Build Tool:** Vite 7.3.1 (with SWC for fast compilation)
- **Routing:** React Router DOM 6.30.1
- **UI Library:** shadcn/ui (Radix UI primitives)
- **Styling:** Tailwind CSS 3.4.17 with custom design system
- **State Management:** React Query (TanStack Query) 5.83.0
- **Forms:** React Hook Form 7.61.1 + Zod 3.25.76
- **Icons:** Lucide React 0.462.0
- **Animations:** Framer Motion 12.27.1
- **Notifications:** Sonner (toast notifications)

### Backend & Database
- **Database:** Supabase (PostgreSQL)
- **Auth:** Supabase Auth (OAuth: Google, GitHub, Twitter)
- **Edge Functions:** Supabase Edge Functions (Deno)
- **Email:** Resend API (via Edge Function)

### AI & External Services
- **AI Model:** Google Gemini 2.0 Flash Exp (`@google/generative-ai` 0.24.1)
- **API Key:** `VITE_GOOGLE_AI_API_KEY` environment variable

### Development Tools
- **Testing:** Vitest 3.2.4 + Testing Library
- **Linting:** ESLint 9.32.0 + TypeScript ESLint
- **Package Manager:** npm (package-lock.json present)

---

## 🎨 Design System: Magma Theme (Fire & Ash)

### Color Palette
- **Primary:** Electric Orange (Orange-500) - `hsl(24.6 95% 53.1%)` - "Magma"
- **Background:** Zinc-950 (Dark Ash) - `hsl(240 10% 3.9%)`
- **Surface:** Zinc-900 (Charcoal) - `hsl(240 5.9% 10%)`
- **Accent:** Hot Orange gradients (Orange-500 → Red-500)
- **Text:** Zinc-100 (crisp headings), Zinc-400 (body text)

### Design Philosophy
- **Dark-first:** Default dark theme with elegant light mode support
- **Fire & Ash aesthetic:** Orange/red gradients represent "burning" stacks
- **Glass morphism:** Backdrop blur effects on cards and navigation
- **Gradient accents:** Orange-to-red gradients for CTAs and highlights
- **Typography:** Inter (sans-serif) + JetBrains Mono (monospace)

### Key Design Tokens
- `--fire-orange`: Orange-500 for primary actions
- `--fire-red`: Red-500 for destructive/roast actions
- `--gradient-fire`: Orange → Red gradient for buttons
- `--shadow-glow`: Orange glow shadows
- `--surface-glass`: Glass morphism backgrounds

### UI Patterns
- **Cards:** Dark cards with subtle borders, hover effects with orange glow
- **Buttons:** Gradient buttons (orange-to-red) with glow effects
- **Badges:** Severity-based colors (red/orange/yellow for high/medium/low)
- **Loading States:** Custom LoadingFire component with animated flames

---

## 📁 Project Structure

```
stackroast/
├── src/
│   ├── components/          # React components
│   │   ├── ui/             # shadcn/ui components
│   │   ├── feed/           # Feed-related components
│   │   ├── AlternativeSuggestions.tsx  # AI alternatives display
│   │   ├── FeaturedStacks.tsx          # Sponsored stacks
│   │   ├── SaveStackButton.tsx         # Save stack functionality
│   │   └── ...
│   ├── contexts/           # React contexts (Auth, Theme)
│   ├── data/               # Static data (stackKits, affiliateLinks)
│   ├── hooks/              # Custom React hooks
│   ├── lib/                # Utilities & services
│   │   ├── generateRoast.tsx           # Gemini AI integration
│   │   ├── analytics.ts                # Click tracking
│   │   ├── supabase.ts                 # Supabase client
│   │   └── ...
│   ├── pages/              # Route pages
│   │   ├── Index.tsx                   # Homepage
│   │   ├── Stack.tsx                   # Stack detail page
│   │   ├── StackKits.tsx              # Stack kits browser
│   │   ├── SavedStacks.tsx             # User saved stacks
│   │   └── ...
│   └── types/              # TypeScript type definitions
├── supabase/
│   ├── functions/          # Edge Functions
│   │   ├── send-email/     # Email sending
│   │   └── send-reminders/ # Saved stack reminders
│   └── migrations/         # Database migrations
└── public/                  # Static assets
```

---

## 🗄️ Database Schema

### Core Tables
- **`stacks`** - User-submitted tech stacks
  - `id`, `slug`, `name`, `profile_id`, `view_count`, `upvote_count`
  - `ai_alternatives` (JSONB) - Generated alternative suggestions
  - `alternatives_generated_at` (TIMESTAMP)
  
- **`stack_items`** - Tools in each stack (many-to-many)
  - `stack_id`, `tool_id`, `sort_order`

- **`tools`** - Tool catalog
  - `id`, `name`, `slug`, `logo_url`, `category`, `base_price`
  - `affiliate_link`, `website_url`, `priority_score`

- **`profiles`** - User profiles
  - `id`, `username`, `karma_points`, `avatar_url`

- **`ai_roasts`** - AI-generated roasts
  - `stack_id`, `roast_text`, `burn_score`, `persona`

### Monetization Tables
- **`saved_stacks`** - User saved stacks
  - `user_id`, `stack_id`, `custom_name`, `notes`
  - `reminder_scheduled_for`, `reminder_sent`

- **`featured_stacks`** - Sponsored/featured stacks
  - `stack_id`, `sponsor_name`, `sponsor_logo_url`
  - `start_date`, `end_date`, `priority`, `active`

- **`alternative_clicks`** - Track affiliate clicks from alternatives
- **`featured_stack_clicks`** - Track featured stack clicks

---

## ✨ Key Features Implemented

### 1. AI-Powered Roasts
- **Gemini AI Integration:** Uses `gemini-2.0-flash-exp` model
- **Multiple Personas:** Different roast styles (Cynical Senior, Startup Bro, etc.)
- **Streaming Support:** Real-time text generation
- **Visual Roasts:** Image analysis for architecture diagrams
- **Burn Score:** Calculated based on roast content and tool mentions

### 2. AI-Powered Alternative Suggestions (Monetization)
- **Smart Analysis:** Identifies weak/outdated/overpriced tools
- **Savings Calculations:** Monthly/yearly cost savings + time saved
- **Affiliate Integration:** Automatic affiliate link injection
- **Sponsored Tools:** Priority placement for sponsored alternatives
- **Component:** `AlternativeSuggestions.tsx` with accordion UI

### 3. Save Stack Feature
- **Dual Mode:** Works for authenticated and unauthenticated users
- **LocalStorage Fallback:** Saves locally if not signed in
- **Auto-Migration:** Migrates localStorage saves on signup
- **Email Reminders:** 3-day reminder emails via Edge Function
- **Components:** `SaveStackButton.tsx`, `SavedStacks.tsx` page

### 4. Native Sponsorships & Featured Stacks
- **Featured Display:** Carousel on homepage, single card on stack pages
- **Sponsor Attribution:** Logo and name prominently displayed
- **Click Tracking:** Analytics for featured stack clicks
- **Component:** `FeaturedStacks.tsx` with carousel support

### 5. Predefined Stack Kits
- **Curated Templates:** 10+ stack kits for different use cases
- **Categories:** Startup, Enterprise, Side Project, AI/ML, Mobile, Full Stack
- **Clone Functionality:** Opens all affiliate links automatically
- **Commission Tracking:** Tracks potential commissions per kit
- **Page:** `StackKits.tsx` with filtering and search

### 6. Authentication & User Profiles
- **OAuth Providers:** Google, GitHub, Twitter
- **Profile System:** Username, karma points, avatar
- **Context:** `AuthContext.tsx` with `useAuth()` hook

---

## 🔧 Key Implementation Details

### Error Handling
- **Rate Limits:** Clean "Rate limit exceeded" messages (normalizes Gemini API errors)
- **Graceful Degradation:** Features work even if migrations haven't been run
- **Error Normalization:** `normalizeError()` function in `generateRoast.tsx`

### Navigation
- **Slug-based Routing:** `/stack/:slug` for stack detail pages
- **Fallback Handling:** Auto-generates slugs if missing, tries ID lookup if slug fails
- **URL Parameters:** Stack Kits page supports `?kit=kit-id` for direct linking

### Affiliate System
- **Data File:** `src/data/affiliateLinks.ts` with commission rates
- **Sponsored Tools:** Priority placement in `SPONSORED_TOOLS` config
- **Click Tracking:** All clicks tracked via `analytics.ts`
- **Commission Calculation:** Per-kit commission totals calculated dynamically

### Email System
- **Edge Function:** `send-reminders` for saved stack reminders
- **Resend Integration:** Via Supabase Edge Function
- **Templates:** Email templates in `src/lib/emailTemplates.ts`

---

## 🚀 Environment Variables

Required environment variables (`.env`):
```
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_GOOGLE_AI_API_KEY=your-gemini-api-key
```

Supabase Edge Function secrets:
```
RESEND_API_KEY=re_xxxxx
FROM_EMAIL=StackRoast <noreply@stackroast.dev>
SITE_URL=https://stackroast.dev
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

---

## 📊 Current Project State

### ✅ Completed Features
- [x] AI roast generation (streaming & non-streaming)
- [x] Visual roast (image analysis)
- [x] Community roasts system
- [x] Stack submission & management
- [x] User authentication (OAuth)
- [x] AI-powered alternative suggestions
- [x] Save stack functionality
- [x] Featured/sponsored stacks
- [x] Stack kits with affiliate links
- [x] Click tracking & analytics
- [x] Email reminder system (Edge Function)
- [x] Responsive design (mobile-friendly)
- [x] Dark/Light theme support

### 🔄 Pending Migrations
The following database migrations need to be run:
1. `20250101_add_alternatives_tables.sql` - AI alternatives columns
2. `20250102_add_saved_stacks_table.sql` - Saved stacks table
3. `20250103_add_featured_stacks_table.sql` - Featured stacks table
4. `20250104_insert_featured_stacks.sql` - Sample featured stacks

### ⚠️ Known Issues / TODOs
- Some stacks may have null slugs (handled with auto-generation)
- `ai_alternatives` column may not exist (handled gracefully)
- Email reminder cron job needs to be set up: `supabase functions cron send-reminders "0 10 * * *"`
- Autoplay carousel plugin not installed (optional enhancement)

---

## 🎯 Immediate Next Steps

### 1. Database Setup
- Run all migrations in `supabase/migrations/`
- Set up cron job for email reminders
- Insert sample featured stacks (or use migration)

### 2. Configuration
- Configure Resend API key in Supabase secrets
- Verify Gemini API key is set
- Update `SITE_URL` in Edge Function environment

### 3. Testing
- Test AI alternative generation
- Test save stack flow (authenticated & unauthenticated)
- Test featured stacks display
- Test stack kit cloning

### 4. Content
- Add more featured stacks to database
- Review and update affiliate links
- Add testimonials to stack kits

---

## 📝 Code Patterns & Conventions

### Component Structure
- Components use TypeScript interfaces for props
- Error boundaries and loading states are consistent
- Toast notifications via Sonner for user feedback

### Styling Conventions
- Tailwind utility classes with custom design tokens
- Dark theme as default, light theme supported
- Gradient backgrounds for CTAs: `bg-gradient-to-r from-orange-500 to-red-500`
- Glass morphism: `bg-surface-glass backdrop-blur-md`

### API Patterns
- Supabase client initialized in `lib/supabase.ts`
- Error handling with try-catch and user-friendly messages
- Loading states with `LoadingFire` component
- Optimistic UI updates where appropriate

### File Naming
- Components: PascalCase (e.g., `SaveStackButton.tsx`)
- Utilities: camelCase (e.g., `generateRoast.tsx`)
- Pages: PascalCase matching route name
- Types: Defined in `src/types/index.tsx`

---

## 🔗 Key Routes

- `/` - Homepage with feed and featured content
- `/stack/:slug` - Stack detail page
- `/kits` - Stack kits browser
- `/kits?kit=kit-id` - Direct kit link
- `/saved` - User saved stacks
- `/dashboard` - User dashboard
- `/user/:username` - User profile
- `/roast-me/:code` - Roast invite page

---

## 💡 Design Decisions

1. **Vite over Next.js:** Chosen for faster dev experience and simpler setup
2. **React Router:** Client-side routing (not Next.js App Router)
3. **shadcn/ui:** Headless components for flexibility
4. **Supabase:** All-in-one backend (auth, database, storage, edge functions)
5. **Gemini AI:** Chosen for roast generation (alternative to OpenAI)
6. **Dark-first:** Default dark theme aligns with "roast" aesthetic
7. **Magma Theme:** Orange/red gradients represent "burning" stacks

---

## 🐛 Common Issues & Solutions

### Rate Limit Errors
- **Symptom:** Verbose Gemini API error messages
- **Solution:** Error normalization in `generateRoast.tsx` shows clean messages

### Missing Slugs
- **Symptom:** Stacks redirect to homepage
- **Solution:** Auto-generation in `RoastFeed.tsx`, ID fallback in `Stack.tsx`

### Missing Columns
- **Symptom:** Database errors for `ai_alternatives`
- **Solution:** Graceful handling, separate queries, migrations available

### Navigation Issues
- **Symptom:** Clicking roasts redirects home
- **Solution:** Enhanced error handling and slug validation

---

## 📚 Important Files Reference

- **AI Generation:** `src/lib/generateRoast.tsx`
- **Affiliate Links:** `src/data/affiliateLinks.ts`
- **Stack Kits:** `src/data/stackKits.ts`
- **Analytics:** `src/lib/analytics.ts`
- **Theme:** `src/index.css` (Magma theme definitions)
- **Auth:** `src/contexts/AuthContext.tsx`
- **Database Client:** `src/lib/supabase.ts`

---

## 🎨 Component Library

All UI components follow shadcn/ui patterns:
- Located in `src/components/ui/`
- Built on Radix UI primitives
- Styled with Tailwind + custom tokens
- Fully accessible (ARIA compliant)

Key custom components:
- `LoadingFire` - Animated flame loader
- `AlternativeSuggestions` - AI alternatives display
- `FeaturedStacks` - Sponsored content carousel
- `SaveStackButton` - Save/unsave functionality
- `StackKitCard` - Stack kit display card

---

## 🔐 Security Considerations

- **RLS Policies:** Row Level Security enabled on all tables
- **API Keys:** Stored in environment variables (never committed)
- **OAuth:** Secure OAuth flow via Supabase
- **CORS:** Configured in Edge Functions
- **Input Validation:** Zod schemas for form validation

---

## 📈 Monetization Strategy

1. **Affiliate Revenue:** Commission from tool signups via affiliate links
2. **Sponsored Content:** Featured stacks with sponsor attribution
3. **Stack Kits:** Curated templates drive multiple affiliate conversions
4. **Email Reminders:** Re-engagement drives return visits

**Tracking:**
- All affiliate clicks tracked in database
- Commission rates defined in `affiliateLinks.ts`
- Analytics queries available for revenue reporting

---

## 🚦 Development Workflow

1. **Local Development:** `npm run dev` (Vite dev server on port 8080)
2. **Build:** `npm run build` (production build)
3. **Testing:** `npm test` (Vitest)
4. **Linting:** `npm run lint` (ESLint)

**Database:**
- Migrations in `supabase/migrations/`
- Run via Supabase CLI or SQL editor
- Edge Functions deploy: `supabase functions deploy <function-name>`

---

## 📞 Support & Resources

- **Supabase Docs:** https://supabase.com/docs
- **Gemini API:** https://ai.google.dev/gemini-api/docs
- **shadcn/ui:** https://ui.shadcn.com
- **Tailwind CSS:** https://tailwindcss.com/docs
- **React Router:** https://reactrouter.com

---

**Last Commit:** `12cae61` - "feat: Implement monetization features - AI alternatives, save stack, sponsorships & stack kits"

**Project Status:** ✅ All 4 monetization features implemented and ready for production
