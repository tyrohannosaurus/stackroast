import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Flame, RefreshCw, Share2, Download } from "lucide-react";
import { generateRoast } from "@/lib/generateRoast";
import { BurnCardDialog } from "@/components/BurnCard";
import { LoadingFire } from "@/components/LoadingFire";

interface AIRoast {
  roast_text: string;
  burn_score: number;
  persona: string;
}

interface StackInfo {
  name: string;
  username: string;
  toolCount: number;
}

interface AIRoastTabProps {
  stackId: string;
  stackSlug?: string;
}

export function AIRoastTab({ stackId, stackSlug }: AIRoastTabProps) {
  const [aiRoast, setAiRoast] = useState<AIRoast | null>(null);
  const [stackInfo, setStackInfo] = useState<StackInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [burnCardOpen, setBurnCardOpen] = useState(false);

  useEffect(() => {
    loadAiRoast();
    loadStackInfo();
  }, [stackId]);

  const loadAiRoast = async () => {
    setLoading(true);
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
      setLoading(false);
    }
  };

  const loadStackInfo = async () => {
    const { data: stack } = await supabase
      .from("stacks")
      .select("name, profile_id")
      .eq("id", stackId)
      .single();

    if (!stack) return;

    const { data: profile } = await supabase
      .from("profiles")
      .select("username")
      .eq("id", stack.profile_id)
      .maybeSingle();

    const { count } = await supabase
      .from("stack_items")
      .select("*", { count: "exact", head: true })
      .eq("stack_id", stackId);

    setStackInfo({
      name: stack.name,
      username: profile?.username || "Anonymous",
      toolCount: count || 0,
    });
  };

  const handleGenerateRoast = async () => {
    setGenerating(true);
    try {
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
        .select(`tool:tools (name, category)`)
        .eq("stack_id", stackId);

      if (itemsError) {
        toast.error("Could not load stack tools");
        return;
      }

      const tools = stackItems?.map((item: any) => item.tool).filter(Boolean) || [];

      if (tools.length === 0) {
        toast.error("No tools found in this stack");
        return;
      }

      toast.info("Generating AI roast... This may take a moment.");

      const { roastText, burnScore, persona } = await generateRoast(stack.name, tools);

      await supabase.from("ai_roasts").delete().eq("stack_id", stackId);

      const { error: insertError } = await supabase.from("ai_roasts").insert({
        stack_id: stackId,
        roast_text: roastText,
        burn_score: burnScore,
        persona: persona,
      });

      if (insertError) {
        toast.error("Failed to save roast: " + insertError.message);
        return;
      }

      setAiRoast({ roast_text: roastText, burn_score: burnScore, persona });
      toast.success("AI roast generated successfully! 🔥");
    } catch (error: any) {
      console.error("Error generating roast:", error);
      toast.error(error?.message || "Failed to generate AI roast");
    } finally {
      setGenerating(false);
    }
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/stack/${stackSlug}`;
    const text = aiRoast 
      ? `🔥 My stack just got roasted with a ${aiRoast.burn_score}/100 burn score!\n\n"${aiRoast.roast_text.substring(0, 150)}..."\n\nGet your stack roasted at:`
      : `Check out this tech stack on StackRoast!`;
    
    if (navigator.share) {
      try {
        await navigator.share({ title: 'StackRoast', text, url });
      } catch (err) {
        // User cancelled or share failed
      }
    } else {
      navigator.clipboard.writeText(`${text}\n${url}`);
      toast.success("Link copied to clipboard!");
    }
  };

  const getPersonaEmoji = (persona: string) => {
    if (persona?.toLowerCase().includes('vc') || persona?.toLowerCase().includes('silicon')) return '💼';
    if (persona?.toLowerCase().includes('rust')) return '🦀';
    if (persona?.toLowerCase().includes('senior') || persona?.toLowerCase().includes('cynical')) return '👴';
    return '🤖';
  };

  const getBurnScoreColor = (score: number) => {
    if (score >= 80) return 'text-red-500';
    if (score >= 60) return 'text-orange-500';
    if (score >= 40) return 'text-yellow-500';
    return 'text-green-500';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingFire size="md" text="Loading roast..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Main AI Roast Card */}
      <div className="relative overflow-hidden border-2 border-orange-500/50 rounded-xl bg-zinc-100 dark:bg-zinc-900">
        {/* Burn Score Badge */}
        <div className="absolute top-4 right-4">
          <div className="text-center">
            <div className={`text-6xl font-bold ${aiRoast ? getBurnScoreColor(aiRoast.burn_score) : 'text-zinc-400 dark:text-zinc-600'}`}>
              {aiRoast ? aiRoast.burn_score : '--'}
            </div>
            <div className="text-sm text-zinc-500 font-medium">/100 BURN</div>
          </div>
        </div>

        <div className="p-8">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-full bg-orange-500/20">
              <Flame className="w-8 h-8 text-orange-500" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground">AI Roast</h2>
              {aiRoast && (
                <p className="text-sm text-muted-foreground">
                  {getPersonaEmoji(aiRoast.persona)} Roasted by {aiRoast.persona}
                </p>
              )}
            </div>
          </div>

          {/* Roast Content */}
          {aiRoast ? (
            <div className="space-y-6">
              {/* Inner white card for roast text */}
              <div className="bg-white dark:bg-zinc-800 rounded-lg p-6 border border-zinc-200 dark:border-zinc-700">
                <blockquote className="text-lg md:text-xl font-light italic text-zinc-800 dark:text-zinc-200 leading-relaxed border-l-4 border-orange-500 pl-6">
                  "{aiRoast.roast_text}"
                </blockquote>
              </div>

              {/* Burn Meter */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Burn Intensity</span>
                  <span className={getBurnScoreColor(aiRoast.burn_score)}>
                    {aiRoast.burn_score >= 80 ? '🔥🔥🔥 SAVAGE' : 
                     aiRoast.burn_score >= 60 ? '🔥🔥 SPICY' : 
                     aiRoast.burn_score >= 40 ? '🔥 WARM' : '❄️ MILD'}
                  </span>
                </div>
                <div className="h-3 bg-zinc-300 dark:bg-zinc-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 transition-all duration-500"
                    style={{ width: `${aiRoast.burn_score}%` }}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <Flame className="w-16 h-16 mx-auto mb-4 text-zinc-400 dark:text-zinc-600" />
              <p className="text-xl text-muted-foreground mb-2">No AI roast yet</p>
              <p className="text-sm text-muted-foreground">Click the button below to generate a savage AI roast for this stack</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="border-t border-zinc-200 dark:border-zinc-700 p-4 flex items-center justify-between bg-zinc-200/50 dark:bg-zinc-800/50">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleGenerateRoast}
              disabled={generating}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${generating ? 'animate-spin' : ''}`} />
              {generating ? 'Generating...' : aiRoast ? 'Regenerate' : 'Generate Roast'}
            </Button>
          </div>

          {aiRoast && (
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={handleShare}>
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setBurnCardOpen(true)}>
                <Download className="w-4 h-4 mr-2" />
                Burn Card
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Burn Card Dialog */}
      {aiRoast && stackInfo && (
        <BurnCardDialog
          open={burnCardOpen}
          onOpenChange={setBurnCardOpen}
          stackName={stackInfo.name}
          burnScore={aiRoast.burn_score}
          roastText={aiRoast.roast_text}
          persona={aiRoast.persona}
          username={stackInfo.username}
          toolCount={stackInfo.toolCount}
          stackSlug={stackSlug || ''}
        />
      )}
    </div>
  );
}
