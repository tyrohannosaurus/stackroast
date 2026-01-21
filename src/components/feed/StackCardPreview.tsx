import { useState } from 'react';
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

export function StackCardPreview({ stack }: StackCardPreviewProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [upvoteCount, setUpvoteCount] = useState(stack.upvote_count);
  const [hasUpvoted, setHasUpvoted] = useState(false);
  const [isUpvoting, setIsUpvoting] = useState(false);

  // Truncate roast to first 150 characters
  const previewText = stack.ai_roast_summary || 
    stack.ai_roast_full?.substring(0, 150) + '...' || 
    'AI roast coming soon...';

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
    } catch (error) {
      console.error('Upvote error:', error);
    } finally {
      setIsUpvoting(false);
    }
  };

  return (
    <Card 
      className="p-4 bg-surface/50 border-white/10 hover:border-orange-500/30 transition-all group cursor-pointer"
      onClick={handleCardClick}
    >
      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        <Avatar className="w-8 h-8">
          <AvatarImage src={stack.user.avatar_url} alt={stack.user.username} />
          <AvatarFallback>{stack.user.username[0]?.toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <Link 
            to={`/user/${stack.user.username}`}
            className="font-medium text-sm hover:text-orange-400 transition-colors"
          >
            @{stack.user.username}
          </Link>
          <p className="text-xs text-muted-foreground truncate">
            {stack.title}
          </p>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold text-gradient">
            {stack.burn_score}
          </div>
        </div>
      </div>

      {/* Roast Preview */}
      <div className="bg-black/20 rounded-lg p-3 mb-3 border border-white/5">
        <p className="text-sm text-muted-foreground line-clamp-2">
          {previewText}
        </p>
      </div>

      {/* Stats & Action */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <button
            onClick={handleUpvote}
            disabled={isUpvoting}
            className={`flex items-center gap-1 px-2 py-1 rounded-md transition-colors ${
              hasUpvoted 
                ? 'bg-orange-500/20 text-orange-400' 
                : 'hover:bg-white/5'
            }`}
          >
            <TrendingUp className={`w-3 h-3 ${isUpvoting ? 'animate-pulse' : ''}`} />
            {upvoteCount}
          </button>
          <span className="flex items-center gap-1">
            🔥 {stack.roast_count}
          </span>
          <span className="flex items-center gap-1">
            💬 {stack.comment_count}
          </span>
          <span className="flex items-center gap-1">
            👁 {stack.view_count}
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
            className="group-hover:text-orange-400 transition-colors"
          >
            <Link to={`/stack/${stack.slug}`}>
              View Full <ArrowRight className="w-3 h-3 ml-1" />
            </Link>
          </Button>
        </div>
      </div>
    </Card>
  );
}