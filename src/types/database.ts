/**
 * Database type definitions
 * Provides type-safe interfaces for all database entities
 */

// =====================================================
// DATABASE TABLES
// =====================================================

export interface Profile {
  id: string;
  username: string;
  bio?: string;
  avatar_url?: string;
  karma_points: number;
  created_at: string;
  updated_at?: string;
}

export interface Stack {
  id: string;
  name: string;
  slug: string;
  description?: string;
  user_id?: string;
  profile_id?: string;
  is_public: boolean;
  ai_roast_generated: boolean;
  created_at: string;
  updated_at?: string;
}

export interface Tool {
  id: string;
  name: string;
  slug: string;
  logo_url: string;
  website_url?: string;
  category: string;
  description?: string;
  priority_score?: number;
  created_at: string;
}

export interface StackItem {
  id: string;
  stack_id: string;
  tool_id: string;
  position?: number;
  sort_order?: number;
  created_at: string;
}

export interface AIRoast {
  id: string;
  stack_id: string;
  roast_text: string;
  burn_score?: number;
  originality_score?: number;
  practicality_score?: number;
  hype_score?: number;
  overall_score?: number;
  persona?: string;
  created_at: string;
}

export interface CommunityRoast {
  id: string;
  stack_id: string;
  user_id: string;
  roast_text: string;
  roast_content?: string; // Alternative field name used in some views
  upvotes: number;
  downvotes: number;
  created_at: string;
  updated_at?: string;
}

export interface RoastVote {
  id: string;
  roast_id: string;
  user_id: string;
  vote_type: "up" | "down";
  vote_value: 1 | -1;
  created_at: string;
}

export interface RoastComment {
  id: string;
  roast_id: string;
  user_id: string;
  content: string;
  comment_text?: string; // Alternative field name
  parent_id?: string;
  created_at: string;
  deleted_at?: string;
}

export interface ToolAlternative {
  id: string;
  tool_id: string;
  alternative_tool_id: string;
  reason?: string;
  created_at: string;
}

export interface AlternativeClick {
  id: string;
  alternative_id: string;
  stack_id: string;
  clicked_at: string;
}

export interface SavedStack {
  id: string;
  user_id: string;
  stack_id: string;
  reminder_email?: string;
  reminder_sent: boolean;
  created_at: string;
}

export interface StackKit {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  display_order?: number;
  created_at: string;
}

export interface StackKitTool {
  id: string;
  kit_id: string;
  tool_id: string;
  created_at: string;
}

// =====================================================
// JOIN TYPES (with related data)
// =====================================================

export interface StackWithTools extends Stack {
  tools?: ToolWithDetails[];
  stack_items?: StackItem[];
  profile?: Profile;
}

export interface ToolWithDetails extends Tool {
  stack_items?: StackItem[];
}

export interface CommunityRoastWithProfile extends CommunityRoast {
  profiles: {
    username: string;
    karma_points: number;
    avatar_url?: string;
  };
  user_vote?: "up" | "down" | null;
  comments?: RoastCommentWithProfile[];
  comment_count?: number;
}

export interface RoastCommentWithProfile extends RoastComment {
  profiles: {
    username: string;
    avatar_url?: string;
  };
}

// =====================================================
// VIEW TYPES (database views)
// =====================================================

export interface CommunityRoastWithStats {
  id: string;
  stack_id: string;
  user_id: string;
  roast_content: string;
  created_at: string;
  updated_at?: string;
  comment_count: number;
  total_votes: number;
  upvotes: number;
  downvotes: number;
  author_username: string;
  author_avatar_url?: string;
}

// =====================================================
// API RESPONSE TYPES
// =====================================================

export interface SupabaseError {
  message: string;
  details?: string;
  hint?: string;
  code?: string;
}

export interface SupabaseResponse<T> {
  data: T | null;
  error: SupabaseError | null;
}

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// =====================================================
// FORM INPUT TYPES
// =====================================================

export interface CreateStackInput {
  name: string;
  description?: string;
  slug?: string;
  isPublic: boolean;
  selectedTools: ToolSelection[];
}

export interface ToolSelection {
  id: string;
  name: string;
  category?: string;
}

export interface CreateRoastInput {
  stackId: string;
  roastText: string;
}

export interface CreateCommentInput {
  roastId: string;
  content: string;
  parentId?: string;
}

export interface CreateVoteInput {
  roastId: string;
  voteType: "up" | "down";
}

export interface UpdateProfileInput {
  username?: string;
  bio?: string;
  avatarUrl?: string;
}

// =====================================================
// UTILITY TYPES
// =====================================================

export type SortOrder = "asc" | "desc";
export type RoastSortBy = "newest" | "oldest" | "top" | "controversial";

export interface SortConfig {
  field: string;
  order: SortOrder;
}

export interface FilterConfig {
  category?: string;
  isPublic?: boolean;
  userId?: string;
}

// =====================================================
// GITHUB TYPES
// =====================================================

export interface GitHubRepo {
  owner: string;
  repo: string;
  description?: string;
  stars?: number;
  language?: string;
}

export interface GitHubFile {
  path: string;
  content: string;
  type: string;
}

// =====================================================
// AI GENERATION TYPES
// =====================================================

export interface RoastGenerationResult {
  roastText: string;
  burnScore: number;
  persona: string;
  personaKey: string;
}

export interface AIRoastScores {
  originality: number;
  practicality: number;
  hype: number;
  overall: number;
}

// =====================================================
// AUTHENTICATION TYPES
// =====================================================

export interface AuthUser {
  id: string;
  email?: string;
  user_metadata?: {
    username?: string;
    name?: string;
    avatar_url?: string;
  };
}

export interface Session {
  user: AuthUser;
  access_token: string;
  refresh_token?: string;
  expires_at?: number;
}

// =====================================================
// ERROR TYPES
// =====================================================

export interface ValidationError {
  field: string;
  message: string;
}

export interface APIError {
  message: string;
  code?: string;
  statusCode?: number;
  validationErrors?: ValidationError[];
}

// =====================================================
// REALTIME SUBSCRIPTION TYPES
// =====================================================

export type RealtimeEventType = "INSERT" | "UPDATE" | "DELETE";

export interface RealtimePayload<T> {
  eventType: RealtimeEventType;
  new: T;
  old: T;
  table: string;
}
