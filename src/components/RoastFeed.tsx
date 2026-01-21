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
}

export function RoastFeed() {
  const [stacks, setStacks] = useState<Stack[]>([]);
  const [stackToolMap, setStackToolMap] = useState<Map<string, string[]>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStacks();
  }, []);

  const loadStacks = async () => {
    try {
      const { data: stacksData, error: stackError } = await supabase
        .from("stacks")
        .select("id, name, slug, created_at, view_count, profile_id, upvote_count, comment_count")
        .eq("is_public", true)
        .order("created_at", { ascending: false })
        .limit(20);

      if (stackError) {
        console.error("Stack query error:", stackError);
        throw stackError;
      }

      if (!stacksData || stacksData.length === 0) {
        setStacks([]);
        setLoading(false);
        return;
      }

      const enrichedStacks = await Promise.all(
        stacksData.map(async (stack) => {
          let profile = null;
          if (stack.profile_id) {
            const { data: profileData } = await supabase
              .from("profiles")
              .select("username, karma_points")
              .eq("id", stack.profile_id)
              .maybeSingle();
            profile = profileData;
          }

          const { data: aiRoastData } = await supabase
            .from("ai_roasts")
            .select("roast_text, burn_score, persona")
            .eq("stack_id", stack.id)
            .maybeSingle();

          const { data: roastStats } = await supabase
            .from("community_roasts")
            .select("upvotes")
            .eq("stack_id", stack.id);

          const community_roasts_count = roastStats?.length || 0;
          const total_upvotes = stack.upvote_count || roastStats?.reduce((sum, r) => sum + (r.upvotes || 0), 0) || 0;

          const { data: toolsData } = await supabase
            .from("stack_items")
            .select(`
              tool_id,
              tool:tools (id, name, slug, logo_url, category)
            `)
            .eq("stack_id", stack.id)
            .order("sort_order")
            .limit(6);

          const tool_preview = toolsData?.map((item: any) => item.tool?.logo_url).filter(Boolean) || [];
          const tool_ids = toolsData?.map((item: any) => item.tool_id).filter(Boolean) || [];
          const tools_full = toolsData?.map((item: any) => item.tool).filter(Boolean) || [];

          // Ensure slug exists, generate from name if missing
          let stackSlug = stack.slug;
          if (!stackSlug || stackSlug.trim() === '') {
            // Generate slug from name
            stackSlug = stack.name
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, '-')
              .replace(/^-+|-+$/g, '')
              .substring(0, 50) + '-' + stack.id.substring(0, 8);
            console.warn(`Stack ${stack.id} missing slug, generated: ${stackSlug}`);
          }

          return {
            ...stack,
            slug: stackSlug,
            profiles: profile,
            ai_roasts: aiRoastData || null,
            community_roasts_count,
            total_upvotes,
            tool_preview,
            tool_ids,
            tools_full,
            comment_count: stack.comment_count || 0,
          };
        })
      );

      // Build tool map for filtering
      const toolMap = new Map<string, string[]>();
      enrichedStacks.forEach(stack => {
        toolMap.set(stack.id, (stack as any).tool_ids || []);
      });
      setStackToolMap(toolMap);

      // Transform legacy stacks to new Stack type
      const transformedStacks = enrichedStacks.map(transformLegacyStack);
      setStacks(transformedStacks);
    } catch (error: any) {
      console.error("Error loading stacks:", error);
      setError(error.message || "Failed to load roasts");
    } finally {
      setLoading(false);
    }
  };

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