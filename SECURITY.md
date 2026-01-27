# Security & Best Practices

## 🔐 API Keys & Environment Variables

### Current Architecture
- **Client-side API keys**: The app uses `VITE_` prefixed environment variables which are **bundled into the client-side code**
- This is **expected behavior** for Vite/React apps, but means API keys are visible in browser DevTools

### API Keys in Use
- `VITE_GOOGLE_AI_API_KEY` - Google Gemini API
- `VITE_GROQ_API_KEY` - Groq API (fallback)
- `VITE_SUPABASE_URL` - Supabase project URL (public, safe to expose)
- `VITE_SUPABASE_ANON_KEY` - Supabase anonymous key (public, safe to expose)

### Security Recommendations

#### ✅ Already Implemented
- `.env` and `.env.local` are in `.gitignore`
- Environment variables are not committed to git
- Supabase uses Row Level Security (RLS) for data protection

#### ⚠️ Recommended Improvements

1. **For Production**:
   - Set environment variables in Vercel/Supabase dashboard (not in code)
   - Use Supabase Edge Functions for sensitive AI operations (optional)
   - Implement rate limiting on API calls
   - Monitor API usage for unusual patterns

2. **API Key Rotation**:
   - Rotate keys if they were ever committed to git history
   - Use separate keys for development and production
   - Set up key rotation schedule (every 90 days recommended)

3. **Client-Side Key Exposure**:
   - **Current**: Keys are visible in browser (this is normal for Vite apps)
   - **Mitigation**: 
     - Use Supabase Edge Functions to proxy AI calls (hides keys from client)
     - Implement server-side rate limiting
     - Monitor for abuse

### Environment Variable Setup

**Local Development** (`.env.local` - not committed):
```env
VITE_GOOGLE_AI_API_KEY=your_key_here
VITE_GROQ_API_KEY=your_key_here
VITE_SUPABASE_URL=your_url
VITE_SUPABASE_ANON_KEY=your_key
```

**Production** (Vercel/Supabase Dashboard):
- Set all `VITE_*` variables in deployment platform
- Never commit `.env` files to git

---

## 🛡️ TypeScript Configuration

### Current Status
- ✅ **Strict mode enabled** in `tsconfig.app.json`
- ✅ Type checking enabled for better code quality

### Benefits
- Catches type errors at compile time
- Prevents `null`/`undefined` bugs
- Enforces proper type usage
- Reduces runtime errors

---

## 📝 Logging

### Current Implementation
- Created `src/lib/logger.ts` for centralized logging
- Development: Logs everything
- Production: Only logs errors and warnings

### Migration Path
Replace `console.log` with `logger.log` throughout codebase:
```typescript
// Before
console.log('Debug info');

// After
import { logger } from '@/lib/logger';
logger.log('Debug info'); // Only in dev
logger.error('Error'); // Always logged
```

---

## ✅ TODO Items

### 1. Stack Upvotes (RoastCard.tsx)
- **Status**: Upvotes are stored in `stacks.upvote_count` column
- **Note**: The TODO refers to creating a `stack_votes` table for tracking individual user votes
- **Current**: Uses simple increment (no user tracking)
- **Future**: Create `stack_votes` table similar to `kit_upvotes` for proper vote tracking

### 2. Percentile Calculation (stack-scorer.ts)
- **Status**: Uses estimated distribution
- **Note**: For accurate percentiles, implement database query comparing score against all stacks
- **Current**: Works but is an approximation
- **Future**: Add RPC function `get_stack_percentile(stack_id)` for real-time calculation

---

## 🧪 Testing

### Current Status
- No test coverage
- Test infrastructure exists (Vitest configured)

### Recommended Next Steps
1. Add unit tests for critical functions
2. Add integration tests for API calls
3. Add E2E tests for user flows
4. Target: 70%+ coverage for core features

---

## 📊 Code Quality Metrics

- **TypeScript Strict Mode**: ✅ Enabled
- **Console.log Statements**: 291 found (migration in progress)
- **TODO Comments**: 2 found (documented above)
- **Test Coverage**: 0% (infrastructure ready)

---

## 🔄 Next Steps

1. ✅ Enable TypeScript strict mode
2. 🔄 Replace console.log with logger (in progress)
3. 📝 Document TODO items
4. ⏳ Add test coverage (future work)
5. ⏳ Consider moving AI calls to Edge Functions (optional)
