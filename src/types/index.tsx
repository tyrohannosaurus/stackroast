// Database types
export interface Stack {
    id: string;
    slug: string;
    user_id: string;
    title: string;
    name?: string; // Alias for title
    tools: Tool[];
    github_url?: string;
    burn_score: number;
    ai_roast_summary?: string;
    ai_roast_full?: string;
    total_cost: number;
    view_count: number;
    upvote_count: number;
    comment_count: number;
    roast_count: number;
    community_votes?: number;
    top_community_roast_score?: number | null;
    created_at: string;
    user: Profile;
    tool_previews?: string[];
  }
  
  export interface Profile {
    id: string;
    username: string;
    avatar_url?: string;
    bio?: string;
    github_url?: string;
    twitter_handle?: string;
    logs: number;
    total_tips_received: number;
  }
  
  export interface Tool {
    id: string;
    name: string;
    slug: string;
    logo_url?: string;
    category?: string;
    base_price?: number;
  affiliate_url?: string;
  affiliate_link?: string;
  website_url?: string;
  }
  
  export type SortMode = 'hot' | 'new' | 'top';

  // Roast Invite types for "Roast a Friend" feature
  export interface RoastInvite {
    id: string;
    code: string;
    sender_id: string | null;
    sender_name: string;
    recipient_name: string;
    custom_message?: string;
    status: 'pending' | 'completed' | 'expired';
    stack_id?: string;
    created_at: string;
    expires_at: string;
    completed_at?: string;
  }