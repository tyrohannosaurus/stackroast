# StackRoast Repository

## Repository Description

**StackRoast** - Get brutally honest AI-powered critiques of your tech stack. Discover better alternatives and learn from the community.

## Repository Structure

### Root Directories

#### `.github/`
GitHub configuration files, repository documentation, and project metadata.

#### `public/`
Static assets served directly by the web server - images, logos, favicons, and other public files.

#### `scripts/`
Utility scripts for database setup, system user configuration, and maintenance tasks.

#### `src/`
Main application source code containing React components, pages, utilities, type definitions, and application logic.

#### `supabase/`
Backend infrastructure including database migrations and Supabase Edge Functions for serverless operations.

### Source Code Structure (`src/`)

- **`components/`** - Reusable React components (UI, forms, dialogs, cards, etc.)
- **`pages/`** - Page-level components (Home, Stack detail, Dashboard, User profiles, etc.)
- **`lib/`** - Utility functions and helpers (validation, API clients, UUID generation, etc.)
- **`types/`** - TypeScript type definitions and database interfaces
- **`contexts/`** - React context providers (Authentication, Theme management)
- **`data/`** - Static data files (hardcoded stack kits and featured content)

### Backend Structure (`supabase/`)

- **`migrations/`** - Database schema migrations (versioned by date, idempotent)
- **`functions/`** - Supabase Edge Functions (logo fetching, email sending, reminders)

## Key Technologies

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui
- **Backend**: Supabase (PostgreSQL, Auth, Edge Functions)
- **AI**: Google Gemini AI, Groq

## Getting Started

See [README.md](../README.md) for detailed setup instructions.
