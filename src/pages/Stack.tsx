import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Flame, ExternalLink, ArrowLeft, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { StackTabs } from "@/components/StackTabs";
import { FixMyStackButton } from "@/components/FixMyStackButton";
import CloneStackButton from "@/components/CloneStackButton";
import type { Stack as StackType } from "@/types";

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
    logo_url: string;
    category: string;
    base_price: number;
    affiliate_link: string;
    website_url: string;
  };
}

export default function Stack() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [stack, setStack] = useState<Stack | null>(null);
  const [items, setItems] = useState<StackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function fetchStack() {
      if (!slug) return;

      try {
        // Fetch stack
        const { data: stackData, error: stackError } = await supabase
          .from("stacks")
          .select("*")
          .eq("slug", slug)
          .single();

        if (stackError || !stackData) {
          toast.error("Stack not found");
          navigate("/");
          return;
        }

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
        setItems(itemsData || []);

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
      karma: 0,
      total_tips_received: 0,
    },
  } : null;

  if (loading) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading stack...</p>
        </div>
      </div>
    );
  }

  if (!stack || !transformedStack) {
    return null;
  }

  return (
    <div className="min-h-screen bg-canvas pb-20">
      {/* Header */}
      <header className="border-b border-border bg-surface/80 backdrop-blur-xl">
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
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Stack Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold mb-2 text-foreground">{stack.name}</h1>
              <p className="text-muted-foreground">
                {items.length} tools • ${totalCost.toFixed(2)}/month
              </p>
            </div>
            <div className="flex items-center gap-2">
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
                    Share
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Tools Grid */}
        <div className="mb-12">
          <h2 className="text-xl font-semibold mb-4 text-foreground">Tech Stack</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {items.map((item) => (
              <Card
                key={item.id}
                className="p-4 bg-surface border-border hover:border-orange-500/50 transition-all shadow-elegant hover:shadow-elegant-hover"
              >
                <div className="flex items-center gap-4">
                  <img
                    src={item.tool.logo_url}
                    alt={item.tool.name}
                    className="w-12 h-12 object-contain"
                  />
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground">{item.tool.name}</h3>
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
                    className="text-orange-400 hover:text-orange-500 hover:bg-orange-500/10"
                    onClick={() => {
                      // Track affiliate click
                      supabase.from("affiliate_clicks").insert({
                        tool_id: item.tool.id,
                        stack_id: stack.id,
                        source: "stack_page",
                      });
                      // Open link
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

        {/* Cost Breakdown */}
        <Card className="p-6 bg-surface border-border shadow-elegant mb-8">
          <h3 className="font-semibold mb-4 text-foreground">Monthly Cost Breakdown</h3>
          <div className="space-y-2">
            {items.filter(item => item.tool.base_price > 0).map((item) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span className="text-muted-foreground">{item.tool.name}</span>
                <span className="font-mono text-foreground">${item.tool.base_price.toFixed(2)}</span>
              </div>
            ))}
            <div className="border-t border-border pt-2 mt-2">
              <div className="flex justify-between font-semibold">
                <span className="text-foreground">Total</span>
                <span className="text-orange-500">${totalCost.toFixed(2)}/month</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Fix My Stack Button */}
        <div className="mb-12">
          <FixMyStackButton stack={transformedStack} />
        </div>

        {/* Tabs for Roasts and Discussion */}
        <div className="mt-12">
          <StackTabs stackId={stack.id} />
        </div>
      </div>
    </div>
  );
}