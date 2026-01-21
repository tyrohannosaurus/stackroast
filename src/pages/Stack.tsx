import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Flame, ExternalLink, ArrowLeft, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { StackThreeColumnLayout } from "@/components/StackThreeColumnLayout";
import { LoadingFire } from "@/components/LoadingFire";
import { FixMyStackButton } from "@/components/FixMyStackButton";
import CloneStackButton from "@/components/CloneStackButton";
import { ShareButton } from "@/components/ShareButton";
import { AlternativeSuggestions } from "@/components/AlternativeSuggestions";
import { SaveStackButton } from "@/components/SaveStackButton";
import { FeaturedStacks } from "@/components/FeaturedStacks";
import type { Stack as StackType } from "@/types";
import type { StackAlternativesResult } from "@/lib/generateRoast";

interface Stack {
  id: string;
  name: string;
  slug: string;
  created_at: string;
  view_count: number;
}

interface StackItem {
  id: string;
  tool: {
    id: string;
    name: string;
    slug?: string;
    logo_url: string;
    category: string;
    base_price: number;
    affiliate_link: string;
    website_url: string;
  };
}

interface AIRoast {
  roast_text: string;
  burn_score: number;
  persona: string;
}

export default function Stack() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [stack, setStack] = useState<Stack | null>(null);
  const [items, setItems] = useState<StackItem[]>([]);
  const [aiRoast, setAiRoast] = useState<AIRoast | null>(null);
  const [aiAlternatives, setAiAlternatives] = useState<StackAlternativesResult | null>(null);
  const [username, setUsername] = useState<string>("anonymous");
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function fetchStack() {
      if (!slug) {
        console.error("No slug provided");
        setLoading(false);
        return;
      }

      try {
        console.log("Fetching stack with slug:", slug);
        
        // First, let's check if slug exists at all
        if (!slug || slug.trim() === '') {
          console.error("Invalid slug provided:", slug);
          toast.error("Invalid stack URL");
          setLoading(false);
          return;
        }
        
        // Fetch stack by slug first
        // Note: ai_alternatives column may not exist if migration hasn't been run
        let { data: stackData, error: stackError } = await supabase
          .from("stacks")
          .select("*")
          .eq("slug", slug.trim())
          .maybeSingle();
        
        // If not found by slug, try finding by ID (in case slug is missing or URL uses ID)
        if (!stackData && !stackError) {
          // Check if slug looks like a UUID
          const isUUID = slug.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
          
          if (isUUID) {
            console.log("Trying to find stack by ID instead of slug");
            const { data: stackById, error: errorById } = await supabase
              .from("stacks")
              .select("*")
              .eq("id", slug.trim())
              .maybeSingle();
            
            if (stackById && !errorById) {
              stackData = stackById;
              stackError = null;
              console.log("Found stack by ID:", stackById.name);
              
              // If stack found by ID but has no slug, generate one and update
              if (!stackData.slug || stackData.slug.trim() === '') {
                const generatedSlug = stackData.name
                  .toLowerCase()
                  .replace(/[^a-z0-9]+/g, '-')
                  .replace(/^-+|-+$/g, '')
                  .substring(0, 50) + '-' + stackData.id.substring(0, 8);
                
                // Update the stack with generated slug (don't wait for it)
                supabase
                  .from("stacks")
                  .update({ slug: generatedSlug })
                  .eq("id", stackData.id)
                  .then(() => {
                    console.log("Updated stack with generated slug:", generatedSlug);
                  });
                
                stackData.slug = generatedSlug;
              }
            }
          }
        }

        if (stackError) {
          console.error("Stack fetch error:", stackError);
          console.error("Error code:", stackError.code);
          console.error("Error message:", stackError.message);
          console.error("Searched slug:", slug);
          
          // Debug: List all available slugs
          const { data: allStacks } = await supabase
            .from("stacks")
            .select("slug, name")
            .limit(10);
          console.log("Available stacks (first 10):", allStacks);
          
          toast.error(`Error loading stack: ${stackError.message}`);
          setLoading(false);
          return;
        }

        if (!stackData) {
          console.error("Stack data is null for slug:", slug);
          
          // Debug: List all available slugs
          const { data: allStacks } = await supabase
            .from("stacks")
            .select("slug, name")
            .limit(10);
          console.log("Available stacks (first 10):", allStacks);
          console.log("Searched for slug:", slug);
          
          toast.error(`Stack "${slug}" not found`);
          setTimeout(() => {
            navigate("/");
          }, 3000);
          setLoading(false);
          return;
        }

        console.log("Stack found successfully:", stackData.name, "slug:", stackData.slug);

        // Fetch stack items with tool details
        const { data: itemsData, error: itemsError } = await supabase
          .from("stack_items")
          .select(`
            id,
            tool:tools (
              id,
              name,
              slug,
              logo_url,
              category,
              base_price,
              affiliate_link,
              website_url
            )
          `)
          .eq("stack_id", stackData.id)
          .order("sort_order");

        if (itemsError) {
          console.error("Items error:", itemsError);
        }

        setStack(stackData);
        // Transform the nested tool structure to match StackItem interface
        const transformedItems: StackItem[] = (itemsData || []).map((item: any) => ({
          id: item.id,
          tool: item.tool as StackItem['tool'],
        }));
        setItems(transformedItems);

        // Fetch AI roast for sharing
        const { data: roastData } = await supabase
          .from("ai_roasts")
          .select("roast_text, burn_score, persona")
          .eq("stack_id", stackData.id)
          .maybeSingle();
        
        if (roastData) {
          setAiRoast(roastData);
        }

        // Fetch AI alternatives if they exist
        // Note: ai_alternatives column may not exist if migration hasn't been run
        // Try to fetch it separately to avoid breaking if column doesn't exist
        try {
          const { data: altData } = await supabase
            .from("stacks")
            .select("ai_alternatives")
            .eq("id", stackData.id)
            .maybeSingle();
          
          if (altData?.ai_alternatives) {
            setAiAlternatives(altData.ai_alternatives as StackAlternativesResult);
          }
        } catch (e) {
          // Column doesn't exist yet, that's okay
          console.log("ai_alternatives column not available yet (migration not run)");
        }

        // Fetch username if profile exists
        if (stackData.profile_id) {
          const { data: profileData } = await supabase
            .from("profiles")
            .select("username")
            .eq("id", stackData.profile_id)
            .maybeSingle();
          
          if (profileData?.username) {
            setUsername(profileData.username);
          }
        }

        // Increment view count
        await supabase.rpc("increment_stack_views", {
          stack_uuid: stackData.id,
        });
      } catch (error) {
        console.error("Error:", error);
        toast.error("Failed to load stack");
      } finally {
        setLoading(false);
      }
    }

    fetchStack();
  }, [slug, navigate]);

  const totalCost = items.reduce((sum, item) => sum + (item.tool.base_price || 0), 0);

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    toast.success("Link copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  // Transform stack data for FixMyStackButton
  const transformedStack: StackType | null = stack ? {
    id: stack.id,
    slug: stack.slug,
    user_id: '',
    title: stack.name,
    tools: items.map(item => ({
      id: item.tool.id,
      name: item.tool.name,
      slug: item.tool.slug || '',
      logo_url: item.tool.logo_url,
      category: item.tool.category,
      base_price: item.tool.base_price,
      affiliate_url: item.tool.affiliate_link,
    })),
    burn_score: 0,
    total_cost: totalCost,
    view_count: stack.view_count,
    upvote_count: 0,
    comment_count: 0,
    roast_count: 0,
    created_at: stack.created_at,
    user: {
      id: '',
      username: 'Anonymous',
      logs: 0,
      total_tips_received: 0,
    } as StackType['user'],
  } : null;

  if (loading) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center">
        <LoadingFire size="md" text="Loading stack..." />
      </div>
    );
  }

  if (!stack || !transformedStack) {
    return null;
  }

  return (
    <div className="min-h-screen bg-canvas pb-20">
      {/* Header */}
      <header className="border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
          <div className="flex items-center gap-2">
            <Flame className="w-6 h-6 text-orange-500" />
            <span className="font-semibold text-foreground">StackRoast</span>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Stack Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
            <div className="flex-1">
              <h1 className="text-3xl md:text-4xl font-bold mb-2 text-foreground">{stack.name}</h1>
              <p className="text-muted-foreground">
                {items.length} tools • ${totalCost.toFixed(2)}/month
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <SaveStackButton
                stackId={stack.id}
                stackName={stack.name}
                stackSlug={stack.slug}
                variant="outline"
                size="default"
              />
              <ShareButton
                stackName={stack.name}
                stackSlug={stack.slug}
                burnScore={aiRoast?.burn_score || 0}
                roastPreview={aiRoast?.roast_text}
                persona={aiRoast?.persona}
                username={username}
                toolCount={items.length}
                variant="outline"
                showLabel={true}
              />
              <CloneStackButton
                tools={items.map(item => ({
                  id: item.tool.id,
                  name: item.tool.name,
                  affiliate_url: item.tool.affiliate_link,
                  logo_url: item.tool.logo_url,
                }))}
                stackName={stack.name}
                variant="default"
                size="default"
              />
              <Button
                onClick={copyLink}
                variant="outline"
                size="default"
                className="flex items-center gap-2"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy Link
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Tools Grid & Cost Breakdown - Side by Side */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Tools Grid - Takes 2 columns */}
          <div className="lg:col-span-2">
            <h2 className="text-xl font-semibold mb-4 text-foreground">Tech Stack</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {items.map((item) => (
              <Card
                key={item.id}
                className="p-4 bg-card border-border hover:border-orange-500/50 transition-all"
              >
                  <div className="flex items-center gap-4">
                    <img
                      src={item.tool.logo_url}
                      alt={item.tool.name}
                      className="w-10 h-10 object-contain"
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground truncate">{item.tool.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="text-xs">
                          {item.tool.category}
                        </Badge>
                        {item.tool.base_price > 0 && (
                          <span className="text-xs text-muted-foreground">
                            ${item.tool.base_price}/mo
                          </span>
                        )}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-orange-400 hover:text-orange-500 hover:bg-orange-500/10 flex-shrink-0"
                      onClick={() => {
                        supabase.from("affiliate_clicks").insert({
                          tool_id: item.tool.id,
                          stack_id: stack.id,
                          source: "stack_page",
                        });
                        window.open(item.tool.affiliate_link || item.tool.website_url, '_blank');
                      }}
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Cost Breakdown & Fix My Stack - Takes 1 column */}
          <div className="space-y-6">
            <Card className="p-6 bg-surface border-border">
              <h3 className="font-semibold mb-4 text-foreground">Monthly Cost</h3>
              <div className="space-y-2">
                {items.filter(item => item.tool.base_price > 0).map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-muted-foreground truncate mr-2">{item.tool.name}</span>
                    <span className="font-mono text-foreground flex-shrink-0">${item.tool.base_price.toFixed(2)}</span>
                  </div>
                ))}
                <div className="border-t border-border pt-2 mt-2">
                  <div className="flex justify-between font-semibold">
                    <span className="text-foreground">Total</span>
                    <span className="text-orange-500">${totalCost.toFixed(2)}/mo</span>
                  </div>
                </div>
              </div>
            </Card>

            <FixMyStackButton stack={transformedStack} />
          </div>
        </div>

        {/* Featured Stacks Sidebar */}
        <div className="mb-8">
          <FeaturedStacks limit={1} showCarousel={false} />
        </div>

        {/* AI Alternatives Section */}
        <div className="mb-8">
          <div className="mb-4">
            <h2 className="text-2xl font-bold text-foreground">Better Alternatives</h2>
            <p className="text-sm text-muted-foreground mt-1">
              AI-powered suggestions to optimize your stack and save money
            </p>
          </div>
          <AlternativeSuggestions
            stackId={stack.id}
            stackName={stack.name}
            tools={transformedStack.tools}
            existingAlternatives={aiAlternatives}
          />
        </div>

        {/* Roasts & Discussion Layout */}
        <StackThreeColumnLayout stackId={stack.id} stackSlug={stack.slug} />
      </div>
    </div>
  );
}