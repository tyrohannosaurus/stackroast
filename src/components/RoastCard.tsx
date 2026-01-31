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
      className="bg-card rounded-lg p-5 cursor-pointer group border border-border hover:border-border-strong hover:shadow-md transition-all"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="text-lg font-bold mb-1 group-hover:text-primary transition-colors">
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
          <div className="flex flex-col items-center px-3 py-2 rounded-md bg-gum-pink-light">
            <Flame className="w-4 h-4 text-primary mb-0.5" />
            <span className="text-xl font-bold text-primary">
              {stack.ai_roasts.burn_score}
            </span>
            <span className="text-xs text-muted-foreground">/ 100</span>
          </div>
        )}
      </div>

      {/* Tool Preview */}
      {stack.tool_preview.length > 0 && (
        <div className="flex items-center gap-2 mb-3">
          {stack.tool_preview.map((logo, idx) => (
            <img
              key={idx}
              src={logo}
              alt=""
              className="w-7 h-7 rounded border border-border"
            />
          ))}
          {stack.tool_preview.length >= 4 && (
            <span className="text-xs text-muted-foreground">+more</span>
          )}
        </div>
      )}

      {/* AI Roast Preview */}
      {stack.ai_roasts ? (
        <div className="bg-muted rounded-md p-3 mb-3">
          <div className="flex items-start gap-2 mb-1.5">
            <Badge variant="secondary" className="text-xs">
              {stack.ai_roasts.persona === "vc_bro"
                ? "VC Bro"
                : stack.ai_roasts.persona === "rust_evangelist"
                ? "Rust Evangelist"
                : "Senior Dev"}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground line-clamp-2 italic">
            "{stack.ai_roasts.roast_text}"
          </p>
        </div>
      ) : (
        <div className="bg-muted rounded-md p-3 mb-3">
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
