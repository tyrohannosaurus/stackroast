// Stack Kits - Curated template bundles for common use cases
// Each kit includes tools, estimated costs, and use case descriptions

export interface StackKitTool {
  name: string;
  slug: string;
  category: string;
  reason: string;
  monthlyPrice?: number;
  logoUrl?: string;
}

export interface StackKit {
  id: string;
  name: string;
  tagline: string;
  description: string;
  icon: string; // Emoji
  category: 'startup' | 'enterprise' | 'side-project' | 'ai-ml' | 'mobile' | 'fullstack';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  tools: StackKitTool[];
  totalMonthlyCost: number;
  highlights: string[];
  bestFor: string[];
  notFor: string[];
  featured?: boolean;
}

export const STACK_KITS: StackKit[] = [
  // =====================================
  // SIDE PROJECT / INDIE HACKER
  // =====================================
  {
    id: 'indie-hacker',
    name: 'The Indie Hacker Stack',
    tagline: 'Ship fast, spend little, make money',
    description: 'The perfect stack for solo founders building their first profitable product. Optimized for speed, low costs, and maximum developer productivity.',
    icon: '🚀',
    category: 'side-project',
    difficulty: 'beginner',
    featured: true,
    tools: [
      { name: 'Next.js', slug: 'nextjs', category: 'Framework', reason: 'Full-stack React with SSR and API routes', monthlyPrice: 0 },
      { name: 'Supabase', slug: 'supabase', category: 'Backend', reason: 'Database + Auth + Storage in one', monthlyPrice: 0 },
      { name: 'Vercel', slug: 'vercel', category: 'Hosting', reason: 'Zero-config deployment with free tier', monthlyPrice: 0 },
      { name: 'Tailwind CSS', slug: 'tailwind', category: 'Styling', reason: 'Rapid UI development', monthlyPrice: 0 },
      { name: 'Stripe', slug: 'stripe', category: 'Payments', reason: 'Easy payment integration', monthlyPrice: 0 },
      { name: 'Resend', slug: 'resend', category: 'Email', reason: 'Developer-friendly transactional email', monthlyPrice: 0 },
    ],
    totalMonthlyCost: 0,
    highlights: [
      'Can start 100% free',
      'Ship in a weekend',
      'Scales to $10k/mo MRR',
    ],
    bestFor: ['Solo founders', 'MVPs', 'SaaS products', 'Side projects'],
    notFor: ['Enterprise clients', 'Heavy compute workloads'],
  },

  {
    id: 'weekend-project',
    name: 'Weekend Warrior Stack',
    tagline: 'Build and deploy in 48 hours',
    description: 'Minimal stack for maximum speed. Perfect for hackathons, weekend projects, or testing ideas quickly.',
    icon: '⚡',
    category: 'side-project',
    difficulty: 'beginner',
    tools: [
      { name: 'Vite + React', slug: 'vite', category: 'Framework', reason: 'Fastest dev experience', monthlyPrice: 0 },
      { name: 'Firebase', slug: 'firebase', category: 'Backend', reason: 'Instant backend setup', monthlyPrice: 0 },
      { name: 'Netlify', slug: 'netlify', category: 'Hosting', reason: 'Drag and drop deploy', monthlyPrice: 0 },
      { name: 'shadcn/ui', slug: 'shadcn', category: 'UI', reason: 'Beautiful components instantly', monthlyPrice: 0 },
    ],
    totalMonthlyCost: 0,
    highlights: [
      'Zero cost to start',
      '< 2 hour setup',
      'Great DX',
    ],
    bestFor: ['Hackathons', 'Prototypes', 'Learning projects'],
    notFor: ['Production apps', 'Large scale'],
  },

  // =====================================
  // STARTUP / SCALE
  // =====================================
  {
    id: 'series-a-ready',
    name: 'Series A Ready Stack',
    tagline: 'Built to impress investors and scale',
    description: 'Enterprise-grade infrastructure that VCs love. Shows you\'re serious about scaling and security.',
    icon: '💼',
    category: 'startup',
    difficulty: 'advanced',
    featured: true,
    tools: [
      { name: 'Next.js', slug: 'nextjs', category: 'Framework', reason: 'Production-ready React framework', monthlyPrice: 0 },
      { name: 'PostgreSQL', slug: 'postgresql', category: 'Database', reason: 'Enterprise-grade reliability', monthlyPrice: 50 },
      { name: 'AWS', slug: 'aws', category: 'Cloud', reason: 'Industry standard infrastructure', monthlyPrice: 100 },
      { name: 'Auth0', slug: 'auth0', category: 'Auth', reason: 'Enterprise SSO & compliance', monthlyPrice: 23 },
      { name: 'Stripe', slug: 'stripe', category: 'Payments', reason: 'Global payment processing', monthlyPrice: 0 },
      { name: 'Datadog', slug: 'datadog', category: 'Monitoring', reason: 'Full observability', monthlyPrice: 70 },
      { name: 'Sentry', slug: 'sentry', category: 'Error Tracking', reason: 'Real-time error monitoring', monthlyPrice: 26 },
      { name: 'GitHub Actions', slug: 'github-actions', category: 'CI/CD', reason: 'Automated deployments', monthlyPrice: 0 },
    ],
    totalMonthlyCost: 269,
    highlights: [
      'SOC 2 compliant ready',
      'Scales to millions of users',
      'Investor-approved stack',
    ],
    bestFor: ['Funded startups', 'B2B SaaS', 'Enterprise sales'],
    notFor: ['Bootstrapped projects', 'Simple apps'],
  },

  {
    id: 'saas-starter',
    name: 'SaaS Starter Kit',
    tagline: 'Everything for a subscription business',
    description: 'Complete stack for building subscription-based software. Includes auth, payments, emails, and analytics out of the box.',
    icon: '📦',
    category: 'startup',
    difficulty: 'intermediate',
    tools: [
      { name: 'Next.js', slug: 'nextjs', category: 'Framework', reason: 'Full-stack capabilities', monthlyPrice: 0 },
      { name: 'Prisma', slug: 'prisma', category: 'ORM', reason: 'Type-safe database access', monthlyPrice: 0 },
      { name: 'PlanetScale', slug: 'planetscale', category: 'Database', reason: 'Serverless MySQL', monthlyPrice: 29 },
      { name: 'Clerk', slug: 'clerk', category: 'Auth', reason: 'Beautiful auth components', monthlyPrice: 25 },
      { name: 'Stripe', slug: 'stripe', category: 'Payments', reason: 'Subscriptions & billing', monthlyPrice: 0 },
      { name: 'Vercel', slug: 'vercel', category: 'Hosting', reason: 'Edge functions support', monthlyPrice: 20 },
      { name: 'Loops', slug: 'loops', category: 'Email', reason: 'SaaS-focused email marketing', monthlyPrice: 49 },
    ],
    totalMonthlyCost: 123,
    highlights: [
      'Auth + Payments ready',
      'Email marketing built-in',
      'Optimized for MRR',
    ],
    bestFor: ['B2B SaaS', 'Subscription products', 'Micro-SaaS'],
    notFor: ['One-time purchase products', 'Content sites'],
  },

  // =====================================
  // AI / ML
  // =====================================
  {
    id: 'ai-powered-app',
    name: 'AI-Powered App Stack',
    tagline: 'Build the next ChatGPT wrapper',
    description: 'Complete stack for building AI-powered applications. Includes LLM integration, vector databases, and streaming support.',
    icon: '🤖',
    category: 'ai-ml',
    difficulty: 'intermediate',
    featured: true,
    tools: [
      { name: 'Next.js', slug: 'nextjs', category: 'Framework', reason: 'Streaming & edge support', monthlyPrice: 0 },
      { name: 'Vercel AI SDK', slug: 'vercel-ai', category: 'AI', reason: 'Easy LLM integration', monthlyPrice: 0 },
      { name: 'OpenAI', slug: 'openai', category: 'LLM', reason: 'GPT-4 and embeddings', monthlyPrice: 20 },
      { name: 'Pinecone', slug: 'pinecone', category: 'Vector DB', reason: 'Semantic search', monthlyPrice: 0 },
      { name: 'Supabase', slug: 'supabase', category: 'Backend', reason: 'pgvector support', monthlyPrice: 25 },
      { name: 'Upstash', slug: 'upstash', category: 'Cache', reason: 'Rate limiting & caching', monthlyPrice: 0 },
    ],
    totalMonthlyCost: 45,
    highlights: [
      'Streaming responses',
      'RAG-ready',
      'Built-in rate limiting',
    ],
    bestFor: ['AI apps', 'Chatbots', 'Document Q&A', 'AI wrappers'],
    notFor: ['Simple CRUD apps', 'No-AI products'],
  },

  {
    id: 'ml-pipeline',
    name: 'ML Pipeline Stack',
    tagline: 'Train, deploy, and monitor ML models',
    description: 'Production ML infrastructure for training and serving models. Includes experiment tracking, model registry, and monitoring.',
    icon: '🧠',
    category: 'ai-ml',
    difficulty: 'advanced',
    tools: [
      { name: 'Python', slug: 'python', category: 'Language', reason: 'ML ecosystem', monthlyPrice: 0 },
      { name: 'PyTorch', slug: 'pytorch', category: 'Framework', reason: 'Flexible deep learning', monthlyPrice: 0 },
      { name: 'MLflow', slug: 'mlflow', category: 'Tracking', reason: 'Experiment tracking', monthlyPrice: 0 },
      { name: 'Weights & Biases', slug: 'wandb', category: 'MLOps', reason: 'Model monitoring', monthlyPrice: 50 },
      { name: 'AWS SageMaker', slug: 'sagemaker', category: 'Training', reason: 'Managed training', monthlyPrice: 100 },
      { name: 'FastAPI', slug: 'fastapi', category: 'Serving', reason: 'High-performance API', monthlyPrice: 0 },
      { name: 'Docker', slug: 'docker', category: 'Container', reason: 'Reproducible environments', monthlyPrice: 0 },
    ],
    totalMonthlyCost: 150,
    highlights: [
      'End-to-end ML pipeline',
      'Experiment tracking',
      'Production-ready serving',
    ],
    bestFor: ['ML engineers', 'Research teams', 'Custom models'],
    notFor: ['API-only AI apps', 'No ML experience'],
  },

  // =====================================
  // MOBILE
  // =====================================
  {
    id: 'cross-platform-mobile',
    name: 'Cross-Platform Mobile Stack',
    tagline: 'One codebase, iOS + Android',
    description: 'Build native mobile apps with a single codebase. Includes push notifications, analytics, and backend.',
    icon: '📱',
    category: 'mobile',
    difficulty: 'intermediate',
    tools: [
      { name: 'React Native', slug: 'react-native', category: 'Framework', reason: 'Cross-platform native', monthlyPrice: 0 },
      { name: 'Expo', slug: 'expo', category: 'Tooling', reason: 'Simplified development', monthlyPrice: 0 },
      { name: 'Supabase', slug: 'supabase', category: 'Backend', reason: 'Real-time + Auth', monthlyPrice: 25 },
      { name: 'RevenueCat', slug: 'revenuecat', category: 'Payments', reason: 'In-app purchases', monthlyPrice: 0 },
      { name: 'OneSignal', slug: 'onesignal', category: 'Push', reason: 'Push notifications', monthlyPrice: 0 },
      { name: 'Amplitude', slug: 'amplitude', category: 'Analytics', reason: 'Mobile analytics', monthlyPrice: 0 },
    ],
    totalMonthlyCost: 25,
    highlights: [
      'Single codebase',
      'OTA updates',
      'In-app purchases ready',
    ],
    bestFor: ['Consumer apps', 'MVP mobile apps', 'Cross-platform needs'],
    notFor: ['Heavy native features', 'Games'],
  },

  {
    id: 'flutter-stack',
    name: 'Flutter Premium Stack',
    tagline: 'Beautiful apps, everywhere',
    description: 'Flutter-based stack for building gorgeous cross-platform apps with custom UI.',
    icon: '🦋',
    category: 'mobile',
    difficulty: 'intermediate',
    tools: [
      { name: 'Flutter', slug: 'flutter', category: 'Framework', reason: 'Beautiful custom UI', monthlyPrice: 0 },
      { name: 'Firebase', slug: 'firebase', category: 'Backend', reason: 'Real-time database', monthlyPrice: 25 },
      { name: 'Riverpod', slug: 'riverpod', category: 'State', reason: 'Type-safe state management', monthlyPrice: 0 },
      { name: 'Codemagic', slug: 'codemagic', category: 'CI/CD', reason: 'Flutter-native CI/CD', monthlyPrice: 0 },
      { name: 'Mixpanel', slug: 'mixpanel', category: 'Analytics', reason: 'Product analytics', monthlyPrice: 0 },
    ],
    totalMonthlyCost: 25,
    highlights: [
      'Pixel-perfect UI',
      '60fps animations',
      'Web + Mobile + Desktop',
    ],
    bestFor: ['Design-heavy apps', 'Startups', 'Custom experiences'],
    notFor: ['Web-only projects', 'Simple utilities'],
  },

  // =====================================
  // ENTERPRISE
  // =====================================
  {
    id: 'enterprise-java',
    name: 'Enterprise Java Stack',
    tagline: 'Battle-tested for Fortune 500',
    description: 'Traditional enterprise stack trusted by large organizations. Maximum reliability and support.',
    icon: '☕',
    category: 'enterprise',
    difficulty: 'advanced',
    tools: [
      { name: 'Spring Boot', slug: 'spring', category: 'Framework', reason: 'Enterprise standard', monthlyPrice: 0 },
      { name: 'PostgreSQL', slug: 'postgresql', category: 'Database', reason: 'ACID compliance', monthlyPrice: 100 },
      { name: 'Redis', slug: 'redis', category: 'Cache', reason: 'High-performance cache', monthlyPrice: 50 },
      { name: 'Kubernetes', slug: 'kubernetes', category: 'Orchestration', reason: 'Container orchestration', monthlyPrice: 200 },
      { name: 'Jenkins', slug: 'jenkins', category: 'CI/CD', reason: 'Enterprise CI/CD', monthlyPrice: 0 },
      { name: 'Elasticsearch', slug: 'elasticsearch', category: 'Search', reason: 'Full-text search', monthlyPrice: 100 },
      { name: 'Grafana', slug: 'grafana', category: 'Monitoring', reason: 'Observability dashboards', monthlyPrice: 50 },
    ],
    totalMonthlyCost: 500,
    highlights: [
      'Enterprise support available',
      'Proven at scale',
      'Compliance-ready',
    ],
    bestFor: ['Large enterprises', 'Legacy migration', 'High compliance'],
    notFor: ['Startups', 'Fast iteration', 'Small teams'],
  },

  {
    id: 'golang-microservices',
    name: 'Go Microservices Stack',
    tagline: 'High-performance distributed systems',
    description: 'Modern microservices architecture built on Go. Optimized for performance and scalability.',
    icon: '🐹',
    category: 'enterprise',
    difficulty: 'advanced',
    tools: [
      { name: 'Go', slug: 'golang', category: 'Language', reason: 'Performance & simplicity', monthlyPrice: 0 },
      { name: 'gRPC', slug: 'grpc', category: 'Communication', reason: 'Efficient RPC', monthlyPrice: 0 },
      { name: 'PostgreSQL', slug: 'postgresql', category: 'Database', reason: 'Reliable storage', monthlyPrice: 50 },
      { name: 'Kafka', slug: 'kafka', category: 'Messaging', reason: 'Event streaming', monthlyPrice: 100 },
      { name: 'Kubernetes', slug: 'kubernetes', category: 'Orchestration', reason: 'Service mesh', monthlyPrice: 150 },
      { name: 'Prometheus', slug: 'prometheus', category: 'Monitoring', reason: 'Metrics collection', monthlyPrice: 0 },
      { name: 'Jaeger', slug: 'jaeger', category: 'Tracing', reason: 'Distributed tracing', monthlyPrice: 0 },
    ],
    totalMonthlyCost: 300,
    highlights: [
      'Sub-millisecond latency',
      'Highly scalable',
      'Cloud-native',
    ],
    bestFor: ['High-traffic APIs', 'Fintech', 'Real-time systems'],
    notFor: ['Simple apps', 'Small teams', 'Rapid prototyping'],
  },

  // =====================================
  // FULLSTACK / GENERAL
  // =====================================
  {
    id: 't3-stack',
    name: 'The T3 Stack',
    tagline: 'Type-safety from database to UI',
    description: 'Full-stack type-safety with the best DX. Perfect for TypeScript enthusiasts who want end-to-end safety.',
    icon: '🔷',
    category: 'fullstack',
    difficulty: 'intermediate',
    featured: true,
    tools: [
      { name: 'Next.js', slug: 'nextjs', category: 'Framework', reason: 'Full-stack React', monthlyPrice: 0 },
      { name: 'tRPC', slug: 'trpc', category: 'API', reason: 'End-to-end typesafety', monthlyPrice: 0 },
      { name: 'Prisma', slug: 'prisma', category: 'ORM', reason: 'Type-safe database', monthlyPrice: 0 },
      { name: 'NextAuth.js', slug: 'nextauth', category: 'Auth', reason: 'Easy authentication', monthlyPrice: 0 },
      { name: 'Tailwind CSS', slug: 'tailwind', category: 'Styling', reason: 'Utility-first CSS', monthlyPrice: 0 },
      { name: 'Zod', slug: 'zod', category: 'Validation', reason: 'Runtime type checking', monthlyPrice: 0 },
    ],
    totalMonthlyCost: 0,
    highlights: [
      '100% type-safe',
      'Best DX ever',
      'Zero runtime errors',
    ],
    bestFor: ['TypeScript lovers', 'Solo devs', 'New projects'],
    notFor: ['Large teams', 'Non-TS projects'],
  },

  {
    id: 'jamstack',
    name: 'Modern JAMstack',
    tagline: 'Static sites with dynamic capabilities',
    description: 'Build blazing-fast static sites with dynamic features. Perfect for content sites, blogs, and marketing pages.',
    icon: '🍯',
    category: 'fullstack',
    difficulty: 'beginner',
    tools: [
      { name: 'Astro', slug: 'astro', category: 'Framework', reason: 'Zero JS by default', monthlyPrice: 0 },
      { name: 'Tailwind CSS', slug: 'tailwind', category: 'Styling', reason: 'Rapid styling', monthlyPrice: 0 },
      { name: 'Contentful', slug: 'contentful', category: 'CMS', reason: 'Headless CMS', monthlyPrice: 0 },
      { name: 'Cloudflare Pages', slug: 'cloudflare', category: 'Hosting', reason: 'Global CDN', monthlyPrice: 0 },
      { name: 'Fathom', slug: 'fathom', category: 'Analytics', reason: 'Privacy-first analytics', monthlyPrice: 14 },
    ],
    totalMonthlyCost: 14,
    highlights: [
      '100/100 Lighthouse',
      'SEO optimized',
      'Carbon neutral hosting',
    ],
    bestFor: ['Blogs', 'Marketing sites', 'Documentation'],
    notFor: ['Complex web apps', 'Real-time features'],
  },

  {
    id: 'django-stack',
    name: 'Django Batteries Included',
    tagline: 'The Python web framework for perfectionists',
    description: 'Full-featured Python stack with everything built-in. Admin panel, ORM, auth, and more out of the box.',
    icon: '🐍',
    category: 'fullstack',
    difficulty: 'intermediate',
    tools: [
      { name: 'Django', slug: 'django', category: 'Framework', reason: 'Batteries included', monthlyPrice: 0 },
      { name: 'PostgreSQL', slug: 'postgresql', category: 'Database', reason: 'Django\'s best friend', monthlyPrice: 25 },
      { name: 'Redis', slug: 'redis', category: 'Cache', reason: 'Caching & sessions', monthlyPrice: 0 },
      { name: 'Celery', slug: 'celery', category: 'Tasks', reason: 'Background jobs', monthlyPrice: 0 },
      { name: 'HTMX', slug: 'htmx', category: 'Frontend', reason: 'Hypermedia-driven UI', monthlyPrice: 0 },
      { name: 'Railway', slug: 'railway', category: 'Hosting', reason: 'Easy Python hosting', monthlyPrice: 20 },
    ],
    totalMonthlyCost: 45,
    highlights: [
      'Admin panel included',
      'Rapid development',
      'Huge ecosystem',
    ],
    bestFor: ['Python devs', 'Data-heavy apps', 'Internal tools'],
    notFor: ['Microservices', 'Heavy frontend apps'],
  },
];

// Helper functions
export function getKitsByCategory(category: StackKit['category']): StackKit[] {
  return STACK_KITS.filter(kit => kit.category === category);
}

export function getFeaturedKits(): StackKit[] {
  return STACK_KITS.filter(kit => kit.featured);
}

export function getKitById(id: string): StackKit | undefined {
  return STACK_KITS.find(kit => kit.id === id);
}

export function getKitsByDifficulty(difficulty: StackKit['difficulty']): StackKit[] {
  return STACK_KITS.filter(kit => kit.difficulty === difficulty);
}

export const CATEGORY_INFO: Record<StackKit['category'], { label: string; icon: string; description: string }> = {
  'startup': { label: 'Startup', icon: '🚀', description: 'Stacks built for growth and scale' },
  'enterprise': { label: 'Enterprise', icon: '🏢', description: 'Battle-tested for large organizations' },
  'side-project': { label: 'Side Project', icon: '💡', description: 'Quick to start, cheap to run' },
  'ai-ml': { label: 'AI & ML', icon: '🤖', description: 'Build intelligent applications' },
  'mobile': { label: 'Mobile', icon: '📱', description: 'Native and cross-platform apps' },
  'fullstack': { label: 'Full Stack', icon: '🔧', description: 'Complete web application stacks' },
};

export const DIFFICULTY_INFO: Record<StackKit['difficulty'], { label: string; color: string }> = {
  'beginner': { label: 'Beginner', color: 'text-green-500' },
  'intermediate': { label: 'Intermediate', color: 'text-yellow-500' },
  'advanced': { label: 'Advanced', color: 'text-red-500' },
};
