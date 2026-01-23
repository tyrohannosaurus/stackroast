import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Flame, ArrowUp, ArrowDown, RefreshCw } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { generateRoast } from "@/lib/generateRoast";

interface CommunityRoast {
  id: string;
  user_id: string;
  roast_text: string;
  upvotes: number;
  downvotes: number;
  created_at: string;
  profiles: {
    username: string;
    karma_points: number;
  };
  user_vote?: "up" | "down" | null;
}

interface AIRoast {
  roast_text: string;
  burn_score: number;
  persona: string;
}

interface RoastsTabProps {
  stackId: string;
}

export function RoastsTab({ stackId }: RoastsTabProps) {
  const { user, refreshProfile } = useAuth();
  const [roasts, setRoasts] = useState<CommunityRoast[]>([]);
  const [aiRoast, setAiRoast] = useState<AIRoast | null>(null);
  const [newRoast, setNewRoast] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingAiRoast, setLoadingAiRoast] = useState(true);
  const [generatingRoast, setGeneratingRoast] = useState(false);

  useEffect(() => {
    loadRoasts();
    loadAiRoast();
  }, [stackId, user]);

  const loadAiRoast = async () => {
    setLoadingAiRoast(true);
    try {
      const { data, error } = await supabase
        .from("ai_roasts")
        .select("roast_text, burn_score, persona")
        .eq("stack_id", stackId)
        .maybeSingle();

      if (error) {
        console.error("Error loading AI roast:", error);
        return;
      }

      setAiRoast(data);
    } finally {
      setLoadingAiRoast(false);
    }
  };

  const handleGenerateRoast = async () => {
    setGeneratingRoast(true);
    try {
      // First, get the stack info and tools
      const { data: stack, error: stackError } = await supabase
        .from("stacks")
        .select("name")
        .eq("id", stackId)
        .single();

      if (stackError || !stack) {
        toast.error("Could not find stack information");
        return;
      }

      const { data: stackItems, error: itemsError } = await supabase
        .from("stack_items")
        .select(`
          tool:tools (name, category)
        `)
        .eq("stack_id", stackId);

      if (itemsError) {
        toast.error("Could not load stack tools");
        return;
      }

      const tools = stackItems
        ?.map((item: any) => item.tool)
        .filter(Boolean) || [];

      if (tools.length === 0) {
        toast.error("No tools found in this stack");
        return;
      }

      toast.info("Generating AI roast... This may take a moment.");

      // Generate the roast
      const { roastText, burnScore, persona } = await generateRoast(
        stack.name,
        tools
      );

      // Delete any existing roast for this stack
      await supabase
        .from("ai_roasts")
        .delete()
        .eq("stack_id", stackId);

      // Save the new roast
      const { error: insertError } = await supabase
        .from("ai_roasts")
        .insert({
          stack_id: stackId,
          roast_text: roastText,
          burn_score: burnScore,
          persona: persona,
        });

      if (insertError) {
        console.error("Error saving roast:", insertError);
        toast.error("Failed to save roast: " + insertError.message);
        return;
      }

      // Reload the AI roast
      setAiRoast({ roast_text: roastText, burn_score: burnScore, persona });
      toast.success("AI roast generated successfully! 🔥");
    } catch (error: any) {
      console.error("Error generating roast:", error);
      toast.error(error?.message || "Failed to generate AI roast");
    } finally {
      setGeneratingRoast(false);
    }
  };

  const loadRoasts = async () => {
    const { data, error } = await supabase
      .from("community_roasts")
      .select(`
        *,
        profiles:user_id (username, karma_points)
      `)
      .eq("stack_id", stackId)
      .order("upvotes", { ascending: false });

    if (error) {
      console.error("Error loading roasts:", error);
      return;
    }

    // Load user votes
    if (user) {
      const { data: votes } = await supabase
        .from("roast_votes")
        .select("roast_id, vote_type")
        .eq("user_id", user.id)
        .in("roast_id", data.map((r) => r.id));

      const voteMap = new Map(votes?.map((v) => [v.roast_id, v.vote_type]));
      data.forEach((roast) => {
        roast.user_vote = voteMap.get(roast.id) as "up" | "down" | null;
      });
    }

    setRoasts(data as any);
  };

  const handleSubmitRoast = async () => {
    if (!user) {
      toast.error("Please sign in to roast this stack");
      return;
    }

    if (!newRoast.trim()) {
      toast.error("Roast cannot be empty");
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.from("community_roasts").insert({
        stack_id: stackId,
        user_id: user.id,
        roast_text: newRoast.trim(),
      });

      if (error) throw error;

      // Award karma (+2 for roasting)
      await supabase.rpc("award_karma", {
        user_uuid: user.id,
        points: 2,
      });

      // Refresh profile to update karma display
      await refreshProfile();

      toast.success("Roast submitted! +2 logs 🔥");
      setNewRoast("");
      loadRoasts();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (roastId: string, voteType: "up" | "down") => {
    if (!user) {
      toast.error("Please sign in to vote");
      return;
    }

    try {
      await supabase.rpc("handle_roast_vote", {
        p_roast_id: roastId,
        p_user_id: user.id,
        p_vote_type: voteType,
      });

      loadRoasts();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const getPersonaEmoji = (persona: string) => {
    if (persona?.toLowerCase().includes('vc') || persona?.toLowerCase().includes('silicon')) return '💼';
    if (persona?.toLowerCase().includes('rust')) return '🦀';
    if (persona?.toLowerCase().includes('senior') || persona?.toLowerCase().includes('cynical')) return '👴';
    return '🤖';
  };

  const getPersonaDisplayName = (persona: string) => {
    if (!persona) return 'The AI';
    return persona;
  };

  return (
    <div className="space-y-8">
      {/* AI Roast - Prominent Section */}
      <div className="border-2 border-orange-500 rounded-lg p-8 bg-gradient-to-br from-orange-500/10 to-red-500/10">
        <div className="flex items-center gap-3 mb-6">
          <Flame className="w-8 h-8 text-orange-400" />
          <h2 className="text-3xl font-bold">AI Roast</h2>
          <span className="ml-auto text-5xl font-bold text-orange-400">
            {aiRoast ? `${aiRoast.burn_score}/100` : '--/100'}
          </span>
        </div>

        <div className="space-y-4">
          {loadingAiRoast ? (
            <div className="text-zinc-400 text-lg">
              <p className="text-xl italic text-zinc-400">Loading AI roast...</p>
            </div>
          ) : aiRoast ? (
            <div className="text-zinc-400 text-lg">
              <p className="mb-4">
                {getPersonaEmoji(aiRoast.persona)}{' '}
                <span className="font-semibold">{getPersonaDisplayName(aiRoast.persona)} says:</span>
              </p>
              <p className="text-2xl font-light italic text-zinc-200">
                "{aiRoast.roast_text}"
              </p>
            </div>
          ) : (
            <div className="text-zinc-400 text-lg">
              <p className="mb-4">🤖 <span className="font-semibold">The AI says:</span></p>
              <p className="text-2xl font-light italic text-zinc-200">
                "No AI roast generated yet for this stack."
              </p>
            </div>
          )}

          <div className="flex items-center gap-4 mt-6">
            {aiRoast && (
              <div className="flex items-center gap-4 text-sm text-zinc-500">
                <span>Burn Score: {aiRoast.burn_score}/100</span>
                <span>•</span>
                <span>Persona: {aiRoast.persona}</span>
              </div>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleGenerateRoast}
              disabled={generatingRoast || loadingAiRoast}
              className="ml-auto"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${generatingRoast ? 'animate-spin' : ''}`} />
              {generatingRoast ? 'Generating...' : aiRoast ? 'Regenerate Roast' : 'Generate AI Roast'}
            </Button>
          </div>
        </div>
      </div>

      {/* Community Roasts Section */}
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Flame className="w-5 h-5 text-orange-400" />
          <h3 className="text-2xl font-bold">Community Roasts ({roasts.length})</h3>
        </div>

        {/* Submit Roast */}
        <div className="space-y-3">
          <Textarea
            placeholder="Drop your roast here... 🔥 Be creative, be savage!"
            value={newRoast}
            onChange={(e) => setNewRoast(e.target.value)}
            rows={3}
            className="resize-none"
          />
          <Button onClick={handleSubmitRoast} disabled={loading}>
            <Flame className="w-4 h-4 mr-2" />
            {loading ? "Submitting..." : "Submit Roast"}
          </Button>
        </div>

        {/* Roast List */}
        <div className="space-y-4">
          {roasts.map((roast) => (
            <div
              key={roast.id}
              className="border border-zinc-800 rounded-lg p-4 hover:border-orange-500/50 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-semibold">@{roast.profiles.username}</span>
                    <span className="text-sm text-zinc-500">
                      {formatDistanceToNow(new Date(roast.created_at), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-zinc-300 text-lg">{roast.roast_text}</p>
                </div>

                {/* Vote Buttons */}
                <div className="flex items-center gap-2 ml-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleVote(roast.id, "up")}
                    className={roast.user_vote === "up" ? "text-orange-400" : ""}
                  >
                    <ArrowUp className="w-4 h-4" />
                  </Button>
                  <span className="font-semibold min-w-8 text-center">
                    {(roast.upvotes ?? 0) - (roast.downvotes ?? 0)}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleVote(roast.id, "down")}
                    className={roast.user_vote === "down" ? "text-blue-400" : ""}
                  >
                    <ArrowDown className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}

          {roasts.length === 0 && (
            <div className="text-center py-12 text-zinc-500">
              <Flame className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No community roasts yet. Be the first to roast this stack!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}