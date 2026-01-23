# StackRoast 🔥

A community-driven platform where developers submit their tech stacks to receive AI-powered "roasts" (humorous critiques). Get brutally honest feedback on your stack, discover better alternatives, and learn from the community.

## 🎯 What is StackRoast?

StackRoast helps developers identify weaknesses in their tech stacks through AI-powered roasts. Whether you're building a startup, side project, or enterprise application, StackRoast provides honest feedback and helps you discover better tools and alternatives.

**Core Features:**
- 🤖 **AI-Powered Roasts** - Get humorous, honest critiques of your tech stack
- 🔍 **Alternative Suggestions** - Discover better tools with cost and time savings
- 💾 **Save Stacks** - Save interesting stacks for later reference
- 📦 **Stack Kits** - Browse curated stack templates for common use cases
- 👥 **Community Feed** - Explore roasts from other developers
- 🗳️ **Voting & Comments** - Engage with the community

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- A Supabase account (for database and authentication)
- Google AI API key (for Gemini AI roasts)

### Installation

1. **Clone the repository**
   ```sh
   git clone <YOUR_GIT_URL>
   cd stackroast
   ```

2. **Install dependencies**
   ```sh
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env` file in the root directory:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_GOOGLE_AI_API_KEY=your_google_ai_api_key
   ```

4. **Set up Supabase**
   
   - Create a new Supabase project
   - Run the migrations in `supabase/migrations/` to set up the database schema
   - Configure OAuth providers (Google, GitHub, Twitter) in Supabase dashboard

5. **Start the development server**
   ```sh
   npm run dev
   ```

   The app will be available at `http://localhost:5173`

## 🛠️ Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** - Fast build tool with SWC
- **React Router** - Client-side routing
- **shadcn/ui** - Beautiful UI components
- **Tailwind CSS** - Utility-first styling
- **React Query** - Server state management
- **React Hook Form + Zod** - Form handling and validation
- **Framer Motion** - Smooth animations

### Backend
- **Supabase** - PostgreSQL database, authentication, and edge functions
- **Supabase Auth** - OAuth with Google, GitHub, and Twitter
- **Supabase Edge Functions** - Serverless functions (Deno runtime)

### AI
- **Google Gemini 2.0 Flash** - AI model for generating roasts and alternative suggestions

## 📁 Project Structure

```
stackroast/
├── src/
│   ├── components/       # React components
│   │   ├── ui/          # shadcn/ui components
│   │   ├── feed/        # Feed-related components
│   │   └── ...
│   ├── contexts/        # React contexts (Auth, Theme)
│   ├── data/            # Static data (stack kits, etc.)
│   ├── hooks/           # Custom React hooks
│   ├── lib/             # Utilities & services
│   │   ├── generateRoast.tsx    # Gemini AI integration
│   │   ├── supabase.ts          # Supabase client
│   │   └── ...
│   ├── pages/           # Route pages
│   │   ├── Index.tsx            # Homepage
│   │   ├── Stack.tsx            # Stack detail page
│   │   ├── StackKits.tsx        # Stack kits browser
│   │   ├── SavedStacks.tsx      # User saved stacks
│   │   └── ...
│   └── types/           # TypeScript definitions
├── supabase/
│   ├── functions/       # Edge Functions
│   │   ├── send-email/  # Email sending
│   │   └── send-reminders/ # Saved stack reminders
│   └── migrations/      # Database migrations
└── public/              # Static assets
```

## ✨ Key Features

### AI-Powered Roasts
Submit your tech stack and receive humorous, honest critiques powered by Google Gemini AI. Roasts analyze your stack's strengths and weaknesses, outdated tools, and potential improvements.

### Alternative Suggestions
Get AI-generated alternative tool suggestions with detailed comparisons, cost savings, and time estimates. Discover better options for your specific use case.

### Save Stacks
Save interesting stacks for later reference. Works for both authenticated and unauthenticated users (with localStorage fallback). Get email reminders to revisit saved stacks.

### Stack Kits
Browse curated stack templates for common use cases:
- Startup stacks
- Enterprise solutions
- Side projects
- AI/ML projects
- Mobile development
- Full-stack applications

### Community Features
- Browse community roasts in the feed
- Vote on stacks and roasts
- Comment and discuss
- View user profiles with karma points

## 🎨 Design System

StackRoast uses a "Magma" theme with a fire & ash aesthetic:
- **Primary Color**: Electric Orange (representing "burning" stacks)
- **Background**: Dark ash/charcoal tones
- **Glass Morphism**: Backdrop blur effects on cards
- **Gradient Accents**: Orange-to-red gradients for highlights

The design is dark-first with elegant light mode support.

## 🧪 Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm test` - Run tests (Vitest)

### Database Migrations

Migrations are located in `supabase/migrations/`. Apply them using Supabase CLI:

```sh
supabase db push
```

## 📝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is open source and available under the MIT License.
