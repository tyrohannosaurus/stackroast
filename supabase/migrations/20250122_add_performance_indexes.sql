-- Migration: Add performance indexes for Latest Roasts and Leaderboards
-- This migration adds indexes to speed up common queries

-- ============================================
-- 1. STACKS TABLE INDEXES
-- ============================================

-- Index for Latest Roasts query (is_public + created_at DESC)
CREATE INDEX IF NOT EXISTS idx_stacks_public_created_desc 
ON stacks(is_public, created_at DESC) 
WHERE is_public = TRUE;

-- Index for Popular Stacks leaderboard (is_public + upvote_count DESC)
CREATE INDEX IF NOT EXISTS idx_stacks_public_upvotes_desc 
ON stacks(is_public, upvote_count DESC) 
WHERE is_public = TRUE;

-- Index for Trending Stacks (is_public + created_at + view_count)
CREATE INDEX IF NOT EXISTS idx_stacks_trending 
ON stacks(is_public, created_at DESC, view_count DESC) 
WHERE is_public = TRUE;

-- ============================================
-- 2. PROFILES TABLE INDEXES
-- ============================================

-- Index for Log Leaders (karma_points DESC)
CREATE INDEX IF NOT EXISTS idx_profiles_karma_desc 
ON profiles(karma_points DESC NULLS LAST);

-- ============================================
-- 3. COMMUNITY_ROASTS TABLE INDEXES
-- ============================================

-- Index for counting roasts by user (for Top Roasters leaderboard)
CREATE INDEX IF NOT EXISTS idx_community_roasts_user_id_count 
ON community_roasts(user_id) 
WHERE user_id IS NOT NULL;

-- Index for stack_id lookups (already exists but ensure it's there)
CREATE INDEX IF NOT EXISTS idx_community_roasts_stack_id 
ON community_roasts(stack_id);

-- ============================================
-- 4. AI_ROASTS TABLE INDEXES
-- ============================================

-- Index for Most Burned leaderboard (burn_score DESC)
CREATE INDEX IF NOT EXISTS idx_ai_roasts_burn_score_desc 
ON ai_roasts(burn_score DESC);

-- Index for stack_id (already exists but ensure it's there)
CREATE INDEX IF NOT EXISTS idx_ai_roasts_stack_id 
ON ai_roasts(stack_id);

-- ============================================
-- 5. ANALYZE TABLES (Update statistics for query planner)
-- ============================================

ANALYZE stacks;
ANALYZE profiles;
ANALYZE community_roasts;
ANALYZE ai_roasts;
ANALYZE stack_items;
