import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Flame, RefreshCw, Share2, Download, ArrowUp, ArrowDown, Sparkles, TrendingUp, DollarSign } from "lucide-react";
import { generateRoastStreaming } from "@/lib/generateRoast";
import { BurnCardDialog } from "@/components/BurnCard";
import { LoadingFire } from "@/components/LoadingFire";
import { PersonaSelector } from "@/components/PersonaSelector";
import { getRandomPersona, type PersonaKey } from "@/lib/roastPersonas";
import { sendRoastNotificationEmail } from "@/lib/emailService";
import { useAuth } from "@/contexts/AuthContext";

interface AIRoast {
  id: string;
  roast_text: string;
  burn_score: number;
  ai_burn_score?: number; // Original AI-generated score
  persona: string;
  upvotes: number;
  downvotes: number;
  user_vote?: "up" | "down" | null;
}

interface StackInfo {
  name: string;
  username: string;
  toolCount: number;
}

interface AIRoastTabProps {
  stackId: string;
  stackSlug?: string;
  onScrollToRecommendations?: () => void;
  potentialSavings?: number;
}

export function AIRoastTab({ stackId, stackSlug, onScrollToRecommendations, potentialSavings }: AIRoastTabProps) {
  const { user } = useAuth();
  const [aiRoast, setAiRoast] = useState<AIRoast | null>(null);
  const [stackInfo, setStackInfo] = useState<StackInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [burnCardOpen, setBurnCardOpen] = useState(false);
  const [selectedPersona, setSelectedPersona] = useState<PersonaKey | 'random'>('random');
  const [streamingText, setStreamingText] = useState<string>('');
  const [streamingPersona, setStreamingPersona] = useState<string>('');
  const [votingEnabled, setVotingEnabled] = useState(false); // Track if voting migration is available
  const roastContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadAiRoast();
    loadStackInfo();
  }, [stackId, user]); // Reload when user changes to update vote status

  const loadAiRoast = async () => {
    setLoading(true);
    try {
      // Try to load with new columns first, fallback to old structure if migration not run
      let { data, error } = await supabase
        .from("ai_roasts")
        .select("id, roast_text, burn_score, ai_burn_score, persona, upvotes, downvotes")
        .eq("stack_id", stackId)
        .maybeSingle();

      // If columns don't exist, try without them
      if (error && (error.code === '42703' || error.message?.includes('does not exist'))) {
        console.warn("Voting columns not found, using basic query. Run migration 20250122_add_ai_roast_voting.sql");
        const fallbackResult = await supabase
          .from("ai_roasts")
          .select("id, roast_text, burn_score, persona")
          .eq("stack_id", stackId)
          .maybeSingle();
        
        if (fallbackResult.error) {
          console.error("Error loading AI roast:", fallbackResult.error);
          return;
        }
        
        data = fallbackResult.data;
        error = null;
      } else if (error) {
        console.error("Error loading AI roast:", error);
        return;
      }
      
      if (data) {
        // Load user's vote if logged in
        let userVote: "up" | "down" | null = null;
        if (user) {
          const { data: voteData } = await supabase
            .from("ai_roast_votes")
            .select("vote_type")
            .eq("ai_roast_id", data.id)
            .eq("user_id", user.id)
            .maybeSingle();
          
          userVote = voteData?.vote_type as "up" | "down" | null;
        }
        
        // Ensure all numeric fields are properly set (handle missing columns if migration not run)
        const upvotes = typeof data.upvotes === 'number' ? data.upvotes : 0;
        const downvotes = typeof data.downvotes === 'number' ? data.downvotes : 0;
        const burnScore = typeof data.burn_score === 'number' ? data.burn_score : 0;
        const aiBurnScore = typeof data.ai_burn_score === 'number' ? data.ai_burn_score : burnScore;
        
        // Ensure ID is present
        if (!data.id) {
          console.error("AI roast data missing ID:", data);
          setAiRoast(null);
          return;
        }
        
        // Check if voting columns exist (migration has been run)
        const hasVotingColumns = typeof data.upvotes !== 'undefined' || typeof data.downvotes !== 'undefined';
        setVotingEnabled(hasVotingColumns);
        
        setAiRoast({
          id: data.id, // Explicitly set ID first
          roast_text: data.roast_text,
          burn_score: burnScore,
          ai_burn_score: aiBurnScore,
          persona: data.persona,
          upvotes,
          downvotes,
          user_vote: userVote,
        });
      } else {
        setAiRoast(null);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (voteType: "up" | "down") => {
    if (!user) {
      toast.error("Please sign in to vote");
      return;
    }

    if (!aiRoast) {
      toast.error("Roast not loaded");
      return;
    }

    // Get the roast ID - try from aiRoast.id first, or fetch it if missing
    let roastId = aiRoast.id;
    
    if (!roastId) {
      console.warn("AI roast ID missing, fetching from database...");
      // Fetch the roast ID from database
      const { data, error } = await supabase
        .from("ai_roasts")
        .select("id")
        .eq("stack_id", stackId)
        .maybeSingle();
      
      if (error || !data?.id) {
        console.error("Could not find AI roast ID:", error);
        toast.error("Could not find roast. Please refresh the page.");
        return;
      }
      
      roastId = data.id;
      // Update the aiRoast state with the ID
      setAiRoast({ ...aiRoast, id: roastId });
    }

    try {
      console.log('Voting on AI roast:', { roastId, voteType, userId: user.id });
      
      const { error: rpcError } = await supabase.rpc("handle_ai_roast_vote", {
        p_ai_roast_id: roastId,
        p_user_uuid: user.id,
        p_vote_type: voteType === "up" ? "up" : "down",
      });

      if (rpcError) {
        // Check if RPC function doesn't exist (migration not run)
        if (rpcError.code === '42883' || rpcError.message?.includes('does not exist') || rpcError.message?.includes('404')) {
          toast.error("Voting feature not available. Please run the database migration first.");
          console.error("RPC function handle_ai_roast_vote not found. Run migration: supabase/migrations/20250122_add_ai_roast_voting.sql");
          return;
        }
        throw rpcError;
      }

      // Reload the roast to get updated scores
      await loadAiRoast();
      toast.success(voteType === "up" ? "Upvoted! 🔥" : "Downvoted");
    } catch (error: any) {
      console.error("Error voting on AI roast:", error);
      toast.error(error.message || "Failed to vote");
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
    setStreamingText('');
    setStreamingPersona('');
    
    // Clear existing roast while generating
    setAiRoast(null);
    
    try {
      const { data: stack, error: stackError } = await supabase
        .from("stacks")
        .select("name")
        .eq("id", stackId)
        .single();

      if (stackError || !stack) {
        toast.error("Could not find stack information");
        setGenerating(false);
        return;
      }

      const { data: stackItems, error: itemsError } = await supabase
        .from("stack_items")
        .select(`tool:tools (name, category)`)
        .eq("stack_id", stackId);

      if (itemsError) {
        toast.error("Could not load stack tools");
        setGenerating(false);
        return;
      }

      const tools = stackItems?.map((item: any) => item.tool).filter(Boolean) || [];

      if (tools.length === 0) {
        toast.error("No tools found in this stack");
        setGenerating(false);
        return;
      }

      // Determine which persona to use
      const personaToUse = selectedPersona === 'random' ? getRandomPersona() : selectedPersona;

      // Use streaming API
      await generateRoastStreaming(
        stack.name,
        tools,
        {
          onChunk: (chunk, fullText) => {
            setStreamingText(fullText);
            // Auto-scroll to bottom of roast container
            if (roastContainerRef.current) {
              roastContainerRef.current.scrollTop = roastContainerRef.current.scrollHeight;
            }
          },
          onComplete: async (result) => {
            setStreamingPersona(result.persona);
            
            // Save to database
            await supabase.from("ai_roasts").delete().eq("stack_id", stackId);

            // Try to insert with new columns, fallback if migration not run
            const insertData: any = {
              stack_id: stackId,
              roast_text: result.roastText,
              burn_score: result.burnScore,
              persona: result.persona,
            };
            
            // Only add new columns if they exist (migration has been run)
            try {
              // Check if columns exist by trying a select
              const { error: testError } = await supabase
                .from("ai_roasts")
                .select("ai_burn_score")
                .limit(0);
              
              if (!testError || testError.code !== '42703') {
                // Columns exist, add them
                insertData.ai_burn_score = result.burnScore;
                insertData.upvotes = 0;
                insertData.downvotes = 0;
              }
            } catch {
              // Columns don't exist, use basic insert
            }
            
            const { error: insertError } = await supabase.from("ai_roasts").insert(insertData);

            if (insertError) {
              console.error("Failed to save roast:", insertError.message);
            }

            // Reload roast to get the ID and proper structure with voting data
            await loadAiRoast();
            setStreamingText('');
            setGenerating(false);
            toast.success("AI roast generated! 🔥");

            // Send email notification if user is logged in
            if (user?.email && stackInfo) {
              sendRoastNotificationEmail(
                user.email,
                stackInfo.username,
                stack.name,
                result.burnScore,
                result.roastText.substring(0, 150) + '...',
                stackSlug || stackId,
                result.persona,
                user.id
              ).catch(err => {
                console.log('Roast notification email not sent:', err);
              });
            }
          },
          onError: (error) => {
            console.error("Error generating roast:", error);
            toast.error(error?.message || "Failed to generate AI roast");
            setStreamingText('');
            setGenerating(false);
          }
        },
        personaToUse
      );
    } catch (error: any) {
      console.error("Error generating roast:", error);
      toast.error(error?.message || "Failed to generate AI roast");
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
    const p = persona?.toLowerCase() || '';
    if (p.includes('vc') || p.includes('silicon')) return '💼';
    if (p.includes('rust')) return '🦀';
    if (p.includes('senior') || p.includes('cynical')) return '👴';
    if (p.includes('linux') || p.includes('purist')) return '🐧';
    if (p.includes('startup') || p.includes('founder')) return '🚀';
    if (p.includes('security')) return '🔒';
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
      <div className="relative overflow-hidden border-2 border-orange-500/50 rounded-xl bg-gradient-to-br from-orange-500/10 via-red-500/5 to-transparent">
        {/* Burn Score Badge */}
        <div className="absolute top-4 right-4 z-10">
          <div className="text-center bg-card/90 backdrop-blur-sm rounded-lg p-3 border border-orange-500/30">
            <div className={`text-5xl font-bold ${aiRoast ? getBurnScoreColor(aiRoast.burn_score ?? 0) : 'text-muted-foreground'}`}>
              {aiRoast ? (aiRoast.burn_score ?? 0) : '--'}
            </div>
            <div className="text-xs text-muted-foreground font-medium">/100 BURN</div>
          </div>
        </div>

        <div className="p-6 pr-32">
          {/* Header */}
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-full bg-orange-500/20">
              <Flame className="w-6 h-6 text-orange-500" />
            </div>
            <div>
              {aiRoast && (
                <p className="text-sm text-muted-foreground">
                  {getPersonaEmoji(aiRoast.persona)} Roasted by {aiRoast.persona}
                </p>
              )}
            </div>
          </div>

          {/* Roast Content */}
          {generating && streamingText ? (
            // Streaming state - show text as it comes in
            <div className="space-y-4">
              <div 
                ref={roastContainerRef}
                className="bg-card rounded-lg p-5 border border-orange-500/20 max-h-[400px] overflow-y-auto"
              >
                {streamingPersona && (
                  <p className="text-sm text-muted-foreground mb-3">
                    {getPersonaEmoji(streamingPersona)} Roasting as {streamingPersona}...
                  </p>
                )}
                <blockquote className="text-sm font-light italic text-card-foreground leading-relaxed border-l-4 border-orange-500 pl-4">
                  "{streamingText}
                  <span className="inline-block w-2 h-5 ml-1 bg-orange-500 animate-pulse" />
                  "
                </blockquote>
              </div>
              
              {/* Animated burn meter while generating */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Calculating burn intensity...</span>
                  <span className="text-orange-500 animate-pulse">🔥 ROASTING</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 animate-pulse"
                    style={{ width: '60%' }}
                  />
                </div>
              </div>
            </div>
          ) : aiRoast ? (
            // Complete roast state
            <div className="space-y-4">
              {/* Roast text */}
              <div className="bg-card rounded-lg p-5 border border-orange-500/20">
                <blockquote className="text-sm font-light italic text-card-foreground leading-relaxed border-l-4 border-orange-500 pl-4">
                  "{aiRoast.roast_text}"
                </blockquote>
              </div>

              {/* Voting Section - Only show if voting is enabled */}
              {votingEnabled && (
                <div className="flex items-center gap-4 pt-4 border-t border-orange-500/20">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleVote("up")}
                      className={`h-8 w-8 p-0 ${aiRoast.user_vote === "up" ? "text-orange-500 bg-orange-500/10" : "text-muted-foreground hover:text-orange-500"}`}
                      disabled={!user}
                      title={user ? "Upvote this roast" : "Sign in to vote"}
                    >
                      <ArrowUp className="w-5 h-5" />
                    </Button>
                    <span className={`font-bold text-sm min-w-[2rem] text-center ${
                      ((aiRoast.upvotes ?? 0) - (aiRoast.downvotes ?? 0)) > 0 ? 'text-orange-500' : 
                      ((aiRoast.upvotes ?? 0) - (aiRoast.downvotes ?? 0)) < 0 ? 'text-blue-500' : 
                      'text-muted-foreground'
                    }`}>
                      {(aiRoast.upvotes ?? 0) - (aiRoast.downvotes ?? 0)}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleVote("down")}
                      className={`h-8 w-8 p-0 ${aiRoast.user_vote === "down" ? "text-blue-500 bg-blue-500/10" : "text-muted-foreground hover:text-blue-500"}`}
                      disabled={!user}
                      title={user ? "Downvote this roast" : "Sign in to vote"}
                    >
                      <ArrowDown className="w-5 h-5" />
                    </Button>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {aiRoast.ai_burn_score && aiRoast.ai_burn_score !== aiRoast.burn_score && (
                      <span>
                        AI: {aiRoast.ai_burn_score} → Community: {aiRoast.burn_score}
                      </span>
                    )}
                  </div>
                </div>
              )}

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
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 transition-all duration-500"
                    style={{ width: `${aiRoast.burn_score}%` }}
                  />
                </div>
              </div>

              {/* Conversion CTA - Fix Your Stack */}
              {onScrollToRecommendations && (
                <Card className="mt-6 p-5 bg-gradient-to-r from-violet-500/20 via-purple-500/15 to-pink-500/20 border-2 border-violet-500/50 shadow-lg">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Sparkles className="w-5 h-5 text-violet-400" />
                        <h3 className="font-bold text-lg text-foreground">
                          Don't just get roasted. Get better.
                        </h3>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        See exactly what to fix, upgrade, or ditch — powered by AI
                      </p>
                      {potentialSavings && potentialSavings > 0 && (
                        <div className="flex items-center gap-2 mt-2 p-2 bg-green-500/10 rounded-md w-fit">
                          <DollarSign className="w-4 h-4 text-green-500" />
                          <span className="text-sm font-bold text-green-500">
                            ${potentialSavings.toFixed(0)}/mo in savings found
                          </span>
                        </div>
                      )}
                    </div>
                    <Button
                      onClick={onScrollToRecommendations}
                      size="lg"
                      className="w-full sm:w-auto bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600 text-white font-semibold shadow-lg hover:scale-105 transition-transform"
                    >
                      <TrendingUp className="w-4 h-4 mr-2" />
                      Show Me How
                    </Button>
                  </div>
                </Card>
              )}
            </div>
          ) : generating ? (
            // Initial loading state before streaming starts
            <div className="flex flex-col items-center justify-center py-12">
              <LoadingFire size="md" text="Warming up the roaster..." />
            </div>
          ) : (
            // No roast yet state
            <div className="text-center py-12">
              <Flame className="w-12 h-12 mx-auto mb-3 text-orange-500/50" />
              <p className="text-lg font-semibold text-foreground mb-2">This stack hasn't been roasted yet</p>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Get a brutally honest AI critique of your tools. Find out what's weak, what's overkill, and what you're missing.
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="border-t border-orange-500/20 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-muted/30">
          <div className="flex flex-wrap items-center gap-2">
            <PersonaSelector
              selectedPersona={selectedPersona}
              onSelect={setSelectedPersona}
              disabled={generating}
            />
            <Button
              variant="default"
              size="sm"
              onClick={handleGenerateRoast}
              disabled={generating}
              className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${generating ? 'animate-spin' : ''}`} />
              {generating ? 'Roasting...' : aiRoast ? 'Roast Again' : 'Roast This Stack'}
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
