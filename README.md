# StackRoast 🔥

Get brutally honest AI-powered critiques of your tech stack. Discover better alternatives and learn from the community.

## About

StackRoast is a platform where developers can submit their tech stacks and receive AI-generated roasts (humorous critiques) that help identify weaknesses, discover better tools, and make informed decisions about technology choices.

### Key Features

- **AI-Powered Roasts**: Get honest, humorous critiques of your tech stack with burn scores
- **Stack Kits**: Curated collections of tools for specific use cases
- **Community Engagement**: Upvote, comment, and discuss stacks with the community
- **Alternative Suggestions**: AI-powered recommendations for better tool alternatives
- **Leaderboards**: Track top stacks, roasters, and most burned stacks
- **Stack Sharing**: Share stacks with friends via invite links
- **Visual Roasts**: Generate visual critiques of your stack
- **Tool Database**: Comprehensive database of development tools with logos and metadata

## Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for build tooling
- **React Router** for routing
- **Tailwind CSS** for styling
- **shadcn/ui** for UI components
- **TanStack Query** for data fetching
- **Framer Motion** for animations

### Backend
- **Supabase** for database, authentication, and Edge Functions
- **PostgreSQL** with Row Level Security (RLS)
- **Supabase Edge Functions** for serverless functions

### AI/ML
- **Google Gemini AI** for roast generation
- **Groq** as backup AI provider

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account and project
- Environment variables configured (see `.env.example`)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/tyrohannosaurus/stackroast.git
   cd stackroast
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Fill in your Supabase credentials:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (for scripts)

4. **Run database migrations**
   
   Apply all migrations in `supabase/migrations/` to your Supabase project:
   ```bash
   # Using Supabase CLI
   supabase db push
   
   # Or manually via Supabase Dashboard SQL Editor
   ```

5. **Set up system user** (for hardcoded stack kits)
   ```bash
   node scripts/create-system-user.js
   ```

6. **Start development server**
   ```bash
   npm run dev
   ```

7. **Open in browser**
   ```
   http://localhost:5173
   ```

## Project Structure

```
stackroast/
├── src/
│   ├── components/     # React components
│   ├── pages/          # Page components
│   ├── lib/            # Utility functions
│   ├── types/          # TypeScript type definitions
│   ├── contexts/       # React contexts (Auth, Theme)
│   └── data/           # Static data (hardcoded stack kits)
├── supabase/
│   ├── migrations/     # Database migrations
│   └── functions/      # Edge Functions
├── public/             # Static assets
└── scripts/            # Utility scripts
```

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm test` - Run tests

### Database Migrations

All database schema changes are managed through migration files in `supabase/migrations/`. Migrations are versioned by date and should be idempotent (safe to run multiple times).

### Edge Functions

Supabase Edge Functions are located in `supabase/functions/`:
- `fetch-logo` - Fetches tool logos from websites
- `send-email` - Sends transactional emails
- `send-reminders` - Scheduled function for reminder emails

## Environment Variables

Required environment variables:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key  # For scripts only
GEMINI_API_KEY=your_gemini_api_key  # For AI features
GROQ_API_KEY=your_groq_api_key     # Backup AI provider
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is private and proprietary.

## Support

For support, email hello@stackroast.com or visit the [Support page](https://stackroast.com/support).

---

Built with 🔥 by the StackRoast team
