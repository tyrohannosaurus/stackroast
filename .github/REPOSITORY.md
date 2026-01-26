# StackRoast Repository

## Repository Description

**StackRoast** - Get brutally honest AI-powered critiques of your tech stack. Discover better alternatives and learn from the community.

## Repository Structure

### `/src` - Source Code
- **`components/`** - Reusable React components (UI, forms, dialogs, etc.)
- **`pages/`** - Page-level components (Home, Stack detail, Dashboard, etc.)
- **`lib/`** - Utility functions and helpers (validation, API clients, etc.)
- **`types/`** - TypeScript type definitions and interfaces
- **`contexts/`** - React context providers (Auth, Theme)
- **`data/`** - Static data files (hardcoded stack kits)

### `/supabase` - Backend & Database
- **`migrations/`** - Database schema migrations (versioned by date)
- **`functions/`** - Supabase Edge Functions (serverless functions)

### `/public` - Static Assets
- Images, logos, and other static files served directly

### `/scripts` - Utility Scripts
- Node.js scripts for setup and maintenance tasks

## Key Technologies

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui
- **Backend**: Supabase (PostgreSQL, Auth, Edge Functions)
- **AI**: Google Gemini AI, Groq

## Getting Started

See [README.md](../README.md) for detailed setup instructions.
