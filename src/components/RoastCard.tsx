import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Flame, MessageSquare, ArrowUp, BarChart3 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface RoastCardProps {
  stack: {
    id: string;
    name: string;
    slug: string;
    created_at: string;
    view_count: number;
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
  };
}

export function RoastCard({ stack }: RoastCardProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [upvoted, setUpvoted] = useState(false);
  const [localUpvotes, setLocalUpvotes] = useState(stack.total_upvotes);

  const handleQuickUpvote = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card navigation

    if (!user) {
      toast.error("Please sign in to upvote");
      return;
    }

    if (upvoted) {
      toast.info("You've already upvoted this stack");
      return;
    }

    try {
      // For now, just increment locally (we'll add proper stack voting later)
      setUpvoted(true);
      setLocalUpvotes(prev => prev + 1);
      toast.success("Upvoted! 🔥");

      // Note: Currently uses simple increment. For proper vote tracking with user history,
      // create a stack_votes table similar to kit_upvotes. See SECURITY.md for details.
    } catch (error: any) {
      toast.error(error.message);
      setUpvoted(false);
      setLocalUpvotes(prev => prev - 1);
    }
  };

  return (
    <div
      onClick={() => navigate(`/stack/${stack.slug}`)}
      className="bg-card rounded-2xl p-6 cursor-pointer group border-2 border-border shadow-brutal hover:shadow-brutal-sm hover:translate-x-0.5 hover:translate-y-0.5 transition-all"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-xl font-bold mb-1 group-hover:text-primary transition-colors tracking-tight">
            {stack.name}
          </h3>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>by @{stack.profiles?.username || "anonymous"}</span>
            <span>•</span>
            <span>{formatDistanceToNow(new Date(stack.created_at), { addSuffix: true })}</span>
          </div>
        </div>

        {/* Burn Score Badge */}
        {stack.ai_roasts && (
          <div className="flex flex-col items-center px-3 py-2 rounded-xl bg-primary/10 border-2 border-border">
            <Flame className="w-5 h-5 text-primary mb-1" />
            <span className="text-2xl font-bold text-primary">
              {stack.ai_roasts.burn_score}
            </span>
            <span className="text-xs text-muted-foreground">/ 100</span>
          </div>
        )}
      </div>

      {/* Tool Preview */}
      {stack.tool_preview.length > 0 && (
        <div className="flex items-center gap-2 mb-4">
          {stack.tool_preview.map((logo, idx) => (
            <img
              key={idx}
              src={logo}
              alt=""
              className="w-8 h-8 rounded-lg border-2 border-border"
            />
          ))}
          {stack.tool_preview.length >= 4 && (
            <span className="text-sm text-muted-foreground font-medium">+more</span>
          )}
        </div>
      )}

      {/* AI Roast Preview */}
      {stack.ai_roasts ? (
        <div className="bg-muted rounded-xl p-4 mb-4 border-2 border-border">
          <div className="flex items-start gap-2 mb-2">
            <Badge variant="secondary" className="text-xs border-2 border-border font-semibold">
              {stack.ai_roasts.persona === "vc_bro"
                ? "The VC Bro"
                : stack.ai_roasts.persona === "rust_evangelist"
                ? "The Rust Evangelist"
                : "The Senior Dev"}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground line-clamp-2 italic leading-relaxed">
            "{stack.ai_roasts.roast_text}"
          </p>
        </div>
      ) : (
        <div className="bg-muted rounded-xl p-4 mb-4 border-2 border-border">
          <p className="text-sm text-muted-foreground italic">
            Awaiting AI roast...
          </p>
        </div>
      )}

      {/* Stats Footer with Quick Upvote */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 text-sm text-muted-foreground font-medium">
          <div className="flex items-center gap-1">
            <Flame className="w-4 h-4" />
            <span>{stack.community_roasts_count} roasts</span>
          </div>
          <div className="flex items-center gap-1">
            <MessageSquare className="w-4 h-4" />
            <span>{stack.community_roasts_count} comments</span>
          </div>
          <div className="flex items-center gap-1">
            <BarChart3 className="w-4 h-4" />
            <span>{stack.view_count} views</span>
          </div>
        </div>

        {/* Quick Upvote Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleQuickUpvote}
          className={`rounded-full ${
            upvoted ? "text-primary" : "text-muted-foreground hover:text-primary"
          } transition-colors`}
        >
          <ArrowUp className={`w-4 h-4 mr-1 ${upvoted ? "fill-current" : ""}`} />
          {localUpvotes}
        </Button>
      </div>
    </div>
  );
}
