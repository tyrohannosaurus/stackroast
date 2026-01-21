import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Flame, RefreshCw, Share2, Download } from "lucide-react";
import { generateRoastStreaming } from "@/lib/generateRoast";
import { BurnCardDialog } from "@/components/BurnCard";
import { LoadingFire } from "@/components/LoadingFire";
import { PersonaSelector } from "@/components/PersonaSelector";
import { getRandomPersona, type PersonaKey } from "@/lib/roastPersonas";
import { sendRoastNotificationEmail } from "@/lib/emailService";
import { useAuth } from "@/contexts/AuthContext";

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
  const { user } = useAuth();
  const [aiRoast, setAiRoast] = useState<AIRoast | null>(null);
  const [stackInfo, setStackInfo] = useState<StackInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [burnCardOpen, setBurnCardOpen] = useState(false);
  const [selectedPersona, setSelectedPersona] = useState<PersonaKey | 'random'>('random');
  const [streamingText, setStreamingText] = useState<string>('');
  const [streamingPersona, setStreamingPersona] = useState<string>('');
  const roastContainerRef = useRef<HTMLDivElement>(null);

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

            const { error: insertError } = await supabase.from("ai_roasts").insert({
              stack_id: stackId,
              roast_text: result.roastText,
              burn_score: result.burnScore,
              persona: result.persona,
            });

            if (insertError) {
              console.error("Failed to save roast:", insertError.message);
            }

            // Set final roast state
            setAiRoast({ 
              roast_text: result.roastText, 
              burn_score: result.burnScore, 
              persona: result.persona 
            });
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
            <div className={`text-5xl font-bold ${aiRoast ? getBurnScoreColor(aiRoast.burn_score) : 'text-muted-foreground'}`}>
              {aiRoast ? aiRoast.burn_score : '--'}
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
                <blockquote className="text-base md:text-lg font-light italic text-card-foreground leading-relaxed border-l-4 border-orange-500 pl-4">
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
                <blockquote className="text-base md:text-lg font-light italic text-card-foreground leading-relaxed border-l-4 border-orange-500 pl-4">
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
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 transition-all duration-500"
                    style={{ width: `${aiRoast.burn_score}%` }}
                  />
                </div>
              </div>
            </div>
          ) : generating ? (
            // Initial loading state before streaming starts
            <div className="flex flex-col items-center justify-center py-12">
              <LoadingFire size="md" text="Warming up the roaster..." />
            </div>
          ) : (
            // No roast yet state
            <div className="text-center py-12">
              <Flame className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
              <p className="text-lg text-muted-foreground mb-2">No AI roast yet</p>
              <p className="text-sm text-muted-foreground">Click the button below to generate a savage AI roast for this stack</p>
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
