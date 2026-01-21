// Affiliate links and commission data for monetization
// These links are injected into AI-generated alternative suggestions

export interface AffiliateLink {
  url: string;
  commission: number; // Commission in dollars per signup/referral
  tier?: 'gold' | 'silver' | 'bronze';
}

export const AFFILIATE_LINKS: Record<string, AffiliateLink> = {
  'Railway': { 
    url: 'https://railway.app?referralCode=stackroast', 
    commission: 150,
    tier: 'gold'
  },
  'Vercel': { 
    url: 'https://vercel.com/signup?ref=stackroast', 
    commission: 50,
    tier: 'gold'
  },
  'Supabase': { 
    url: 'https://supabase.com/dashboard/sign-up?ref=stackroast', 
    commission: 100,
    tier: 'gold'
  },
  'Clerk': { 
    url: 'https://clerk.com?ref=stackroast', 
    commission: 150,
    tier: 'gold'
  },
  'Kinsta': { 
    url: 'https://kinsta.com/?kaid=STACKROAST', 
    commission: 200,
    tier: 'gold'
  },
  'Resend': { 
    url: 'https://resend.com?ref=stackroast', 
    commission: 75,
    tier: 'silver'
  },
  'PlanetScale': { 
    url: 'https://planetscale.com?ref=stackroast', 
    commission: 120,
    tier: 'silver'
  },
  'Auth0': { 
    url: 'https://auth0.com?ref=stackroast', 
    commission: 250,
    tier: 'gold'
  },
  'DataDog': { 
    url: 'https://datadog.com?ref=stackroast', 
    commission: 300,
    tier: 'gold'
  },
  'Sentry': { 
    url: 'https://sentry.io?ref=stackroast', 
    commission: 80,
    tier: 'silver'
  },
  'Stripe': {
    url: 'https://stripe.com?ref=stackroast',
    commission: 100,
    tier: 'gold'
  },
  'Firebase': {
    url: 'https://firebase.google.com?ref=stackroast',
    commission: 50,
    tier: 'silver'
  },
  'Netlify': {
    url: 'https://netlify.com?ref=stackroast',
    commission: 50,
    tier: 'silver'
  },
  'Cloudflare': {
    url: 'https://cloudflare.com?ref=stackroast',
    commission: 100,
    tier: 'gold'
  },
  'Pinecone': {
    url: 'https://pinecone.io?ref=stackroast',
    commission: 100,
    tier: 'silver'
  },
  'Upstash': {
    url: 'https://upstash.com?ref=stackroast',
    commission: 75,
    tier: 'silver'
  },
  'PostgreSQL': {
    url: 'https://postgresql.org?ref=stackroast',
    commission: 0, // Open source, no affiliate
    tier: 'bronze'
  },
  'Redis': {
    url: 'https://redis.io?ref=stackroast',
    commission: 0, // Open source, no affiliate
    tier: 'bronze'
  },
  'MongoDB': {
    url: 'https://mongodb.com?ref=stackroast',
    commission: 150,
    tier: 'silver'
  },
  'AWS': {
    url: 'https://aws.amazon.com?ref=stackroast',
    commission: 200,
    tier: 'gold'
  },
  'Azure': {
    url: 'https://azure.microsoft.com?ref=stackroast',
    commission: 200,
    tier: 'gold'
  },
  'GCP': {
    url: 'https://cloud.google.com?ref=stackroast',
    commission: 200,
    tier: 'gold'
  },
};

// Sponsored tools configuration for priority placement
export const SPONSORED_TOOLS: Record<string, { tool: string; tier: 'gold' | 'silver' | 'bronze'; priority: number }> = {
  hosting: { tool: 'Railway', tier: 'gold', priority: 1 },
  auth: { tool: 'Clerk', tier: 'gold', priority: 1 },
  database: { tool: 'Supabase', tier: 'gold', priority: 1 },
  email: { tool: 'Resend', tier: 'silver', priority: 1 },
  monitoring: { tool: 'Sentry', tier: 'silver', priority: 1 },
};

// Get affiliate link for a tool name (case-insensitive)
export function getAffiliateLink(toolName: string): AffiliateLink | null {
  const normalizedName = Object.keys(AFFILIATE_LINKS).find(
    key => key.toLowerCase() === toolName.toLowerCase()
  );
  
  if (normalizedName) {
    return AFFILIATE_LINKS[normalizedName];
  }
  
  return null;
}

// Check if a tool is sponsored
export function isSponsoredTool(toolName: string, category?: string): boolean {
  if (!category) return false;
  
  const sponsored = SPONSORED_TOOLS[category.toLowerCase()];
  if (!sponsored) return false;
  
  return sponsored.tool.toLowerCase() === toolName.toLowerCase();
}
