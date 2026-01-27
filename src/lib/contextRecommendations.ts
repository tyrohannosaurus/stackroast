/**
 * Context-driven recommendation engine
 * Provides honest, context-appropriate tool recommendations
 * NOT commission-driven - prioritizes technical fit over affiliate revenue
 */

export interface StackContext {
  expectedUsers?: number;
  budget?: 'low' | 'medium' | 'high' | 'enterprise';
  complexity?: 'low' | 'medium' | 'high';
  useCase?: 'side-project' | 'startup' | 'production' | 'enterprise';
  scalingNeeds?: boolean;
}

export interface Recommendation {
  tool: string;
  reason: string;
  score: number; // 0-100, technical fit score
  context: string; // Why this tool fits this context
  tradeoffs?: string[];
  budgetAlternative?: {
    tool: string;
    reason: string;
    savings: number;
    tradeoffs: string[];
  };
}

// Tiered tool categories for proper context matching
export const TIERED_CATEGORIES = {
  'Cloud Platforms (Production/Scale)': {
    tools: ['AWS', 'Google Cloud', 'Azure', 'GCP'],
    for: 'Production apps, scaling needs, enterprise',
    minUsers: 1000,
    complexity: 'high' as const,
  },
  'Web Hosting (Shared/Small Sites)': {
    tools: ['Hostinger', 'Bluehost', 'SiteGround', 'DreamHost', 'A2 Hosting', 'InMotion Hosting'],
    for: 'Blogs, portfolios, small business sites',
    maxUsers: 1000,
    complexity: 'low' as const,
  },
  'Managed PaaS (Developer-Friendly)': {
    tools: ['Vercel', 'Netlify', 'Railway', 'Render', 'Fly.io'],
    for: 'Rapid deployment, side projects, developer experience',
    maxUsers: 10000,
    complexity: 'medium' as const,
  },
  'Database (Production)': {
    tools: ['AWS RDS', 'Google Cloud SQL', 'Azure Database', 'PlanetScale'],
    for: 'Production databases, high availability, scaling',
    minUsers: 5000,
    complexity: 'high' as const,
  },
  'Database (Small Projects)': {
    tools: ['Supabase', 'Neon', 'Turso', 'Railway Postgres'],
    for: 'Side projects, MVPs, development',
    maxUsers: 1000,
    complexity: 'low' as const,
  },
};

/**
 * Get context-appropriate hosting recommendation
 */
export function getHostingRecommendation(context: StackContext): Recommendation {
  const { expectedUsers = 0, budget = 'medium', complexity = 'medium', useCase = 'startup' } = context;

  // Production SaaS with users
  if (expectedUsers > 5000 || complexity === 'high' || useCase === 'production' || useCase === 'enterprise') {
    return {
      tool: 'AWS',
      reason: 'Production SaaS requires enterprise-grade infrastructure',
      score: 90,
      context: `For ${expectedUsers}+ users and ${complexity} complexity, AWS provides the scalability and reliability you need.`,
      tradeoffs: ['Higher cost', 'Steeper learning curve', 'More configuration required'],
      budgetAlternative: {
        tool: 'Railway',
        reason: 'Start with Railway ($20-40/month) and migrate to AWS when you hit 5K+ users',
        savings: 250,
        tradeoffs: ['Less scaling headroom', 'Migration required later'],
      },
    };
  }

  // Side project / small site
  if (expectedUsers < 100 || useCase === 'side-project' || budget === 'low') {
    return {
      tool: 'Hostinger',
      reason: 'Perfect for small sites and side projects',
      score: 85,
      context: `For ${expectedUsers} users/day, Hostinger's $3/month plan handles this perfectly. You're pre-optimizing for scale you don't have.`,
      tradeoffs: ['Limited scaling', 'Shared resources', 'Manual server management'],
    };
  }

  // Growing startup / medium scale
  if (expectedUsers < 5000 && useCase === 'startup') {
    return {
      tool: 'Railway',
      reason: 'Best balance of simplicity and capability for growing startups',
      score: 88,
      context: `Start with Railway ($20-40/month) for your ${expectedUsers} users. Better than AWS complexity at your stage, but plan migration to AWS/GCP when you hit 5K+ users.`,
      tradeoffs: ['Migration required at scale', 'Less enterprise features'],
      budgetAlternative: {
        tool: 'Vercel',
        reason: 'If you only need frontend hosting, Vercel is free for hobby projects',
        savings: 20,
        tradeoffs: ['Frontend only', 'Limited backend capabilities'],
      },
    };
  }

  // Default: Managed PaaS
  return {
    tool: 'Vercel',
    reason: 'Developer-friendly deployment with great DX',
    score: 80,
    context: 'Good default for most web applications with moderate traffic.',
  };
}

/**
 * Get context-appropriate database recommendation
 */
export function getDatabaseRecommendation(context: StackContext): Recommendation {
  const { expectedUsers = 0, complexity = 'medium', useCase = 'startup' } = context;

  if (expectedUsers > 5000 || complexity === 'high' || useCase === 'production') {
    return {
      tool: 'AWS RDS',
      reason: 'Production databases need managed services and high availability',
      score: 90,
      context: 'For production workloads, AWS RDS provides managed backups, scaling, and high availability.',
      tradeoffs: ['Higher cost', 'AWS lock-in'],
      budgetAlternative: {
        tool: 'PlanetScale',
        reason: 'Serverless MySQL with branching, good for production at lower cost',
        savings: 100,
        tradeoffs: ['MySQL only', 'Different scaling model'],
      },
    };
  }

  return {
    tool: 'Supabase',
    reason: 'Perfect for MVPs and side projects with built-in auth',
    score: 85,
    context: 'Free tier available, includes auth and storage, great developer experience.',
  };
}

/**
 * Generate context-driven recommendation explanation
 */
export function generateContextExplanation(
  currentTool: string,
  recommendedTool: string,
  context: StackContext
): string {
  const { expectedUsers = 0, useCase = 'startup' } = context;

  // Example explanations based on context
  if (currentTool === 'AWS' && recommendedTool === 'Hostinger') {
    return `AWS for a personal blog getting ${expectedUsers} visits/day? You're burning $300/month when Hostinger at $3/month would handle this in its sleep. Save that AWS firepower for when you actually need to scale.`;
  }

  if (currentTool === 'Hostinger' && recommendedTool === 'AWS') {
    return `Hostinger for a SaaS app with ${expectedUsers} users? Bold move. When (not if) you hit scaling issues, you'll be migrating to AWS/GCP anyway. Start there now or pay the migration tax later.`;
  }

  return `Based on your use case (${useCase}) and expected traffic (${expectedUsers} users), ${recommendedTool} is the right choice for your context.`;
}

/**
 * Score recommendation based on context fit (0-100)
 * Higher score = better technical fit
 */
export function scoreRecommendation(tool: string, context: StackContext): number {
  let score = 50; // Base score

  // Adjust based on user count
  if (context.expectedUsers) {
    if (context.expectedUsers > 10000) {
      // Enterprise scale
      if (['AWS', 'Google Cloud', 'Azure'].includes(tool)) score += 30;
      if (['Hostinger', 'Bluehost'].includes(tool)) score -= 40;
    } else if (context.expectedUsers < 100) {
      // Small scale
      if (['Hostinger', 'Vercel', 'Netlify'].includes(tool)) score += 30;
      if (['AWS', 'Google Cloud'].includes(tool)) score -= 30;
    }
  }

  // Adjust based on complexity
  if (context.complexity === 'high') {
    if (['AWS', 'Google Cloud', 'Azure'].includes(tool)) score += 20;
    if (['Hostinger', 'Bluehost'].includes(tool)) score -= 30;
  } else if (context.complexity === 'low') {
    if (['Vercel', 'Netlify', 'Railway'].includes(tool)) score += 20;
    if (['AWS', 'Google Cloud'].includes(tool)) score -= 20;
  }

  // Adjust based on use case
  if (context.useCase === 'side-project' || context.useCase === 'startup') {
    if (['Vercel', 'Netlify', 'Railway', 'Hostinger'].includes(tool)) score += 15;
  } else if (context.useCase === 'production' || context.useCase === 'enterprise') {
    if (['AWS', 'Google Cloud', 'Azure'].includes(tool)) score += 20;
  }

  return Math.min(100, Math.max(0, score));
}
