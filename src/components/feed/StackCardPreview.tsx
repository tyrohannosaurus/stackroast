import { useState, memo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, TrendingUp } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import CloneStackButton from '@/components/CloneStackButton';
import type { Stack } from '@/types';

interface StackCardPreviewProps {
  stack: Stack;
}

function StackCardPreviewComponent({ stack }: StackCardPreviewProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [upvoteCount, setUpvoteCount] = useState(stack.upvote_count);
  const [hasUpvoted, setHasUpvoted] = useState(false);
  const [isUpvoting, setIsUpvoting] = useState(false);

  // Truncate roast to first 150 characters
  // Check if we have any roast text at all
  const hasRoastText = stack.ai_roast_full && stack.ai_roast_full.trim().length > 0;
  const hasSummary = stack.ai_roast_summary && stack.ai_roast_summary.trim().length > 0;
  
  let previewText = 'AI roast coming soon...';
  if (hasSummary) {
    previewText = stack.ai_roast_summary;
  } else if (hasRoastText) {
    // Extract first 150 chars and add ellipsis if longer
    const truncated = stack.ai_roast_full.substring(0, 150);
    previewText = stack.ai_roast_full.length > 150 ? truncated + '...' : truncated;
  }

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't navigate if clicking on a button or link
    if ((e.target as HTMLElement).closest('button, a')) {
      return;
    }
    navigate(`/stack/${stack.slug}`);
  };

  const handleUpvote = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!user) {
      toast.error('Please sign in to upvote');
      return;
    }

    if (isUpvoting) return;
    setIsUpvoting(true);

    try {
      const newCount = hasUpvoted ? upvoteCount - 1 : upvoteCount + 1;
      
      const { error } = await supabase
        .from('stacks')
        .update({ upvote_count: newCount })
        .eq('id', stack.id);

      if (error) {
        console.error('Upvote error:', error);
        toast.error('Failed to upvote');
        return;
      }

      setUpvoteCount(newCount);
      setHasUpvoted(!hasUpvoted);
      
      if (!hasUpvoted) {
        toast.success('Upvoted! 🔥');
      }
    } catch (error) {
      console.error('Upvote error:', error);
      toast.error('Something went wrong');
    } finally {
      setIsUpvoting(false);
    }
  };

  return (
    <div 
      className="bg-card rounded-lg p-4 cursor-pointer group border border-border hover:border-border-strong hover:shadow-md transition-all"
      onClick={handleCardClick}
    >
      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        <Avatar className="w-8 h-8">
          <AvatarImage src={stack.user.avatar_url} alt={stack.user.username} />
          <AvatarFallback className="bg-primary text-primary-foreground text-xs">{stack.user.username[0]?.toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <Link
            to={`/user/${stack.user.username}`}
            className="font-medium text-sm hover:text-primary transition-colors"
          >
            @{stack.user.username}
          </Link>
          <p className="text-xs text-muted-foreground truncate">
            {stack.title}
          </p>
        </div>
        <div className="text-right">
          <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-gum-pink-light">
            <span className="text-base font-bold text-primary">
              {stack.burn_score}
            </span>
          </div>
        </div>
      </div>

      {/* Roast Preview */}
      <div className="bg-muted rounded-md p-3 mb-3">
        <p className="text-sm text-muted-foreground line-clamp-2">
          {previewText}
        </p>
      </div>

      {/* Stats & Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            🔥 {stack.roast_count}
          </span>
          {stack.community_votes !== undefined && stack.community_votes !== 0 && (
            <span className="flex items-center gap-1">
              👍 {stack.community_votes > 0 ? '+' : ''}{stack.community_votes}
            </span>
          )}
          <span className="flex items-center gap-1">
            ⬆ {upvoteCount}
          </span>
          <span className="flex items-center gap-1">
            💬 {stack.comment_count}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <CloneStackButton
            tools={stack.tools.map(tool => ({
              id: tool.id,
              name: tool.name,
              affiliate_url: tool.affiliate_url,
              logo_url: tool.logo_url,
            }))}
            stackName={stack.title}
            variant="ghost"
            size="sm"
          />
          <Button 
            variant="ghost" 
            size="sm" 
            asChild
            className="group-hover:text-primary"
          >
            <Link to={`/stack/${stack.slug}`}>
              View <ArrowRight className="w-3 h-3 ml-1" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

export const StackCardPreview = memo(StackCardPreviewComponent);
