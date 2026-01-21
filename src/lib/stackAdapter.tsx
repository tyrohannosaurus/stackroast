import type { Stack } from '@/types';

interface ToolFull {
  id: string;
  name: string;
  slug: string;
  logo_url: string;
  category?: string;
}

interface LegacyStack {
  id: string;
  name: string;
  slug: string;
  created_at: string;
  view_count: number;
  profile_id: string | null;
  profiles: {
    username: string;
    karma_points: number;
  } | null;
  ai_roasts: {
    roast_text: string;
    burn_score: number;
    persona: string;
  } | null;
  community_roasts_count: number;
  total_upvotes: number;
  tool_preview: string[];
  tools_full?: ToolFull[];
}

export function transformLegacyStack(legacyStack: LegacyStack): Stack {
  // Get the actual roast text, not the placeholder
  const roastText = legacyStack.ai_roasts?.roast_text || '';
  
  // Use full tool data if available, otherwise fall back to logo URLs
  const tools = legacyStack.tools_full && legacyStack.tools_full.length > 0
    ? legacyStack.tools_full.map((tool) => ({
        id: tool.id,
        name: tool.name,
        slug: tool.slug,
        logo_url: tool.logo_url,
        category: tool.category,
      }))
    : legacyStack.tool_preview.map((logo_url, index) => ({
        id: `tool-${index}`,
        name: '',
        slug: '',
        logo_url: logo_url,
      }));
  
  return {
    id: legacyStack.id,
    slug: legacyStack.slug,
    user_id: legacyStack.profile_id || '',
    title: legacyStack.name,
    tools,
    github_url: undefined,
    burn_score: legacyStack.ai_roasts?.burn_score || 0,
    ai_roast_summary: roastText ? roastText.substring(0, 150) + '...' : undefined,
    ai_roast_full: roastText || undefined,
    total_cost: 0,
    view_count: legacyStack.view_count || 0,
    upvote_count: legacyStack.total_upvotes || 0,
    comment_count: 0,
    roast_count: legacyStack.community_roasts_count || 0,
    created_at: legacyStack.created_at,
    user: {
      id: legacyStack.profile_id || '',
      username: legacyStack.profiles?.username || 'Anonymous',
      avatar_url: undefined,
      bio: undefined,
      github_url: undefined,
      twitter_handle: undefined,
      logs: legacyStack.profiles?.karma_points || 0,
      total_tips_received: 0,
    },
  };
}