import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { FeedContainer } from "./feed/FeedContainer";
import { transformLegacyStack } from "@/lib/stackAdapter";
import { LoadingFire } from "@/components/LoadingFire";
import { Flame } from "lucide-react";
import type { Stack } from "@/types";

interface LegacyStack {
  id: string;
  name: string;
  slug: string;
  created_at: string;
  view_count: number;
  profile_id: string | null;
  profiles: {
    username: string;
    karma_points?: number;
  } | null;
  roast_count?: number;
  ai_roasts: {
    roast_text: string;
    burn_score: number;
    persona?: string;
  } | null;
  community_roasts_count: number;
  total_upvotes: number;
  tool_preview: string[];
}

export function RoastFeed() {
  const [stacks, setStacks] = useState<Stack[]>([]);
  const [stackToolMap, setStackToolMap] = useState<Map<string, string[]>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const abortController = new AbortController();

    const loadStacks = async () => {
      try {
        // OPTIMIZED: Single query with all relationships loaded at once
        let { data: stacksData, error: stackError } = await supabase
          .from("stacks")
          .select(`
            id,
            name,
            slug,
            created_at,
            view_count,
            profile_id,
            upvote_count,
            comment_count,
            roast_count,
            profiles:profile_id (
              username
            ),
            ai_roasts (
              roast_text,
              burn_score,
              upvotes,
              downvotes
            ),
            stack_items (
              tool_id,
              sort_order,
              tool:tools (
                id,
                name,
                logo_url,
                affiliate_link
              )
            )
          `)
          .eq("is_public", true)
          .order("created_at", { ascending: false })
          .limit(20);

        // Fallback if is_public column doesn't exist
        if (stackError && (stackError.message?.includes("column") || stackError.code === "42703" || stackError.message?.includes("is_public"))) {
          console.warn("is_public column not found, fetching all stacks. Run migration 20250105_fix_stacks_schema.sql to fix this.");
          const fallbackResult = await supabase
            .from("stacks")
            .select(`
              id,
              name,
              slug,
              created_at,
              view_count,
              profile_id,
              upvote_count,
              comment_count,
              roast_count,
              profiles:profile_id (
                username
              ),
              ai_roasts (
                roast_text,
                burn_score,
                upvotes,
                downvotes
              ),
              stack_items (
                tool_id,
                sort_order,
                tool:tools (
                  id,
                  name,
                  logo_url,
                  affiliate_link
                )
              )
            `)
            .order("created_at", { ascending: false })
            .limit(20);
          
          stacksData = fallbackResult.data;
          stackError = fallbackResult.error;
        }

        // Ignore AbortError (expected in React Strict Mode)
        if (stackError && (stackError.name === 'AbortError' || stackError.message?.includes('aborted'))) {
          return;
        }

        if (stackError) {
          // Check for RLS/permission errors
          if (stackError.message?.includes('permission') || stackError.message?.includes('policy') || stackError.code === '42501') {
            console.error("❌ RLS Policy Error: Access denied to stacks table. Check RLS policies in Supabase.");
            console.error("Error details:", stackError);
            if (isMounted) {
              setError("Permission denied. Please check database RLS policies.");
            }
            return;
          }
          
          console.error("Stack query error:", stackError);
          if (isMounted) {
            setError(stackError.message || "Failed to load roasts");
          }
          return;
        }

        if (!stacksData || stacksData.length === 0) {
          console.warn("⚠️  No stacks found in database. Database may be empty or all stacks are private.");
          if (isMounted) {
            setStacks([]);
            setLoading(false);
          }
          return;
        }
        
        console.log(`✅ Loaded ${stacksData.length} stacks from database (optimized query)`);

        // DEBUG: Log first stack to see structure
        if (stacksData[0]) {
          console.log('🔍 First stack raw data:', stacksData[0]);
          console.log('🔍 First stack ai_roasts:', stacksData[0].ai_roasts);
        }

        // OPTIMIZED: Single iteration combining enrichment, tool map building, and transformation
        // Reduces O(3n) to O(n) by processing all three operations in one pass
        const toolMap = new Map<string, string[]>();
        const transformedStacks: Stack[] = [];

        for (let i = 0; i < stacksData.length; i++) {
          const stack = stacksData[i];

          // Extract profile data (already loaded via relationship)
          const profile = stack.profiles ? {
            username: stack.profiles.username,
            karma_points: stack.profiles.karma_points
          } : null;

          // Extract AI roast (handle both array and single object formats from Supabase)
          let aiRoast = null;
          if (stack.ai_roasts) {
            if (Array.isArray(stack.ai_roasts)) {
              // Multiple roasts - take the first one that has roast_text
              aiRoast = stack.ai_roasts.find((r: any) => r?.roast_text?.trim()) ||
                       (stack.ai_roasts.length > 0 ? stack.ai_roasts[0] : null);
            } else {
              // Single roast object
              aiRoast = stack.ai_roasts;
            }
          }

          // Debug: Log if roast exists but has no text (only in development)
          if (import.meta.env.DEV && aiRoast && (!aiRoast.roast_text || aiRoast.roast_text.trim() === '')) {
            console.warn(`⚠️ Stack ${stack.id} (${stack.name}) has ai_roasts object but no roast_text:`, {
              aiRoast,
              roast_text: aiRoast.roast_text,
              burn_score: aiRoast.burn_score
            });
          }

          // Extract tools (already loaded via relationship)
          const stackItems = stack.stack_items || [];
          const tool_preview = stackItems
            .slice(0, 6)
            .map((item: any) => item.tool?.logo_url)
            .filter(Boolean);
          const tool_ids = stackItems.map((item: any) => item.tool_id).filter(Boolean);
          const tools_full = stackItems.map((item: any) => item.tool).filter(Boolean);

          // Generate slug if missing
          let stackSlug = stack.slug;
          if (!stackSlug || stackSlug.trim() === '') {
            stackSlug = stack.name
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, '-')
              .replace(/^-+|-+$/g, '')
              .substring(0, 50) + '-' + stack.id.substring(0, 8);
            console.warn(`Stack ${stack.id} missing slug, generated: ${stackSlug}`);
          }

          const enriched = {
            ...stack,
            slug: stackSlug,
            profiles: profile,
            ai_roasts: aiRoast,
            community_roasts_count: stack.roast_count || 0,
            total_upvotes: stack.upvote_count || 0,
            total_community_votes: 0, // Removed from initial query for performance
            top_community_roast_score: null, // Removed from initial query for performance
            tool_preview,
            tool_ids,
            tools_full,
            comment_count: stack.comment_count || 0,
          };

          // DEBUG: Log enriched stack (only in development)
          if (import.meta.env.DEV && i === 0) {
            console.log('🔍 First enriched stack:', {
              id: enriched.id,
              name: enriched.name,
              has_ai_roasts: !!enriched.ai_roasts,
              ai_roasts_type: typeof enriched.ai_roasts,
              ai_roasts_roast_text: enriched.ai_roasts?.roast_text,
              ai_roasts_roast_text_length: enriched.ai_roasts?.roast_text?.length,
              ai_roasts_burn_score: enriched.ai_roasts?.burn_score
            });
          }

          // Build tool map (previously separate iteration)
          toolMap.set(enriched.id, enriched.tool_ids || []);

          // Transform to Stack type (previously separate iteration)
          const transformed = transformLegacyStack(enriched);
          transformedStacks.push(transformed);

          // DEBUG: Log first transformed stack
          if (import.meta.env.DEV && i === 0) {
            console.log('🔍 First transformed stack:', transformed);
            console.log('🔍 Has ai_roast_full?', !!transformed.ai_roast_full);
          }
        }

        // Only update state if component is still mounted
        if (isMounted) {
          setStackToolMap(toolMap);
          setStacks(transformedStacks);
        }
      } catch (error: any) {
        // Ignore AbortError (expected in React Strict Mode)
        if (error?.name === 'AbortError' || error?.message?.includes('aborted')) {
          return;
        }
        
        if (isMounted) {
          console.error("Error loading stacks:", error);
          setError(error.message || "Failed to load roasts");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadStacks();

    return () => {
      isMounted = false;
      abortController.abort();
    };
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingFire size="md" text="Loading roasts..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <Flame className="w-12 h-12 mx-auto mb-4 text-red-500 opacity-50" />
        <p className="text-red-500 mb-4">Error loading roasts</p>
        <p className="text-sm text-zinc-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <Flame className="w-6 h-6 text-orange-400" />
        <h2 className="text-3xl font-bold">Latest Roasts</h2>
      </div>

      {stacks.length > 0 ? (
        <FeedContainer initialStacks={stacks} stackToolMap={stackToolMap} />
      ) : (
        <div className="text-center py-12 text-zinc-500">
          <Flame className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No roasts yet. Be the first to submit a stack!</p>
        </div>
      )}
    </div>
  );
}