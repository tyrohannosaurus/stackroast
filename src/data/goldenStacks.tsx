export const GOLDEN_STACKS = {
    solopreneur: {
      name: 'The $10k/mo Solopreneur Stack',
      description: 'Everything you need to build and launch a profitable SaaS solo',
      tools: [
        { slug: 'nextjs', reason: 'Fast development with SEO built-in' },
        { slug: 'supabase', reason: 'Database + Auth in one platform' },
        { slug: 'stripe', reason: 'Simple payment processing' },
        { slug: 'vercel', reason: 'Zero-config deployment' },
        { slug: 'resend', reason: 'Developer-friendly emails' },
        { slug: 'tailwind', reason: 'Rapid UI development' },
      ],
      totalCost: 50,
    },
    
    startup: {
      name: 'The Venture-Ready Startup Stack',
      description: 'Enterprise-grade stack for scaling startups',
      tools: [
        { slug: 'nextjs', reason: 'Production-ready framework' },
        { slug: 'postgresql', reason: 'Reliable enterprise database' },
        { slug: 'auth0', reason: 'Enterprise authentication' },
        { slug: 'stripe', reason: 'Global payment infrastructure' },
        { slug: 'sentry', reason: 'Error tracking at scale' },
        { slug: 'datadog', reason: 'Full observability' },
      ],
      totalCost: 200,
    },
    
    nocode: {
      name: 'The Zero-DevOps Stack',
      description: 'Ship fast without infrastructure headaches',
      tools: [
        { slug: 'vercel', reason: 'One-click deployment' },
        { slug: 'supabase', reason: 'Managed database & auth' },
        { slug: 'clerk', reason: 'Drop-in authentication' },
        { slug: 'stripe', reason: 'Payments without backend' },
        { slug: 'resend', reason: 'Email without SMTP setup' },
      ],
      totalCost: 85,
    },
  };