import { useState, memo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageSquare, TrendingUp, Flame, Sparkles } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import CloneStackButton from '@/components/CloneStackButton';
import type { Stack } from '@/types';

interface StackCardFullProps {
  stack: Stack;
  rank: number;
}

function StackCardFullComponent({ stack, rank }: StackCardFullProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [upvoteCount, setUpvoteCount] = useState(stack.upvote_count);
  const [hasUpvoted, setHasUpvoted] = useState(false);
  const [isUpvoting, setIsUpvoting] = useState(false);

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
        toast.error('Failed to upvote: ' + error.message);
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

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't navigate if clicking on a button or link
    if ((e.target as HTMLElement).closest('button, a')) {
      return;
    }
    navigate(`/stack/${stack.slug}`);
  };

  const hasRoast = stack.ai_roast_full && stack.ai_roast_full.trim().length > 0;

  return (
    <Card 
      className="p-6 bg-card border-border hover:border-orange-500/50 transition-all cursor-pointer group"
      onClick={handleCardClick}
    >
      {/* Rank Badge */}
      <div className="flex items-center gap-2 mb-4">
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-red-600 font-bold text-white text-sm">
          #{rank}
        </div>
        <div className="text-xs text-muted-foreground">Top Stack</div>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <Avatar className="w-10 h-10">
            <AvatarImage src={stack.user.avatar_url} alt={stack.user.username} />
            <AvatarFallback>{stack.user.username[0]?.toUpperCase()}</AvatarFallback>
          </Avatar>
          <div>
            <Link 
              to={`/user/${stack.user.username}`}
              className="font-medium text-foreground hover:text-orange-500 transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              @{stack.user.username}
            </Link>
            <p className="text-sm text-muted-foreground">
              {stack.title}
            </p>
          </div>
        </div>
        
        {/* Burn Score */}
        <div className="text-center">
          <div className="text-3xl font-bold bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
            {stack.burn_score}
          </div>
          <div className="text-xs text-muted-foreground">Burn Score</div>
        </div>
      </div>

      {/* Tools */}
      <div className="flex flex-wrap gap-2 mb-4">
        {stack.tools.slice(0, 6).map((tool) => (
          <div 
            key={tool.id}
            className="px-3 py-1 rounded-full bg-muted/50 border border-border text-sm flex items-center gap-2"
          >
            {tool.logo_url && (
              <img src={tool.logo_url} alt={tool.name} className="w-4 h-4" />
            )}
            {tool.name}
          </div>
        ))}
        {stack.tools.length > 6 && (
          <div className="px-3 py-1 rounded-full bg-muted/50 border border-border text-sm text-muted-foreground">
            +{stack.tools.length - 6} more
          </div>
        )}
      </div>

      {/* AI Roast or Placeholder */}
      {hasRoast ? (
        <div className="bg-gradient-to-br from-orange-500/10 via-red-500/10 to-orange-500/5 rounded-lg p-4 mb-4 border border-orange-500/20">
          <div className="flex items-center gap-2 mb-2">
            <Flame className="w-4 h-4 text-orange-400" />
            <span className="text-sm font-medium text-orange-400">AI Roast</span>
          </div>
          <p className="text-foreground leading-relaxed whitespace-pre-wrap">
            {stack.ai_roast_full}
          </p>
        </div>
      ) : (
        <div className="bg-muted/30 rounded-lg p-4 mb-4 border border-border">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground">AI Roast</span>
          </div>
          <p className="text-muted-foreground italic">
            AI roast coming soon... Click to view this stack and generate a roast!
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <button
            onClick={handleUpvote}
            disabled={isUpvoting}
            className={`flex items-center gap-1 hover:text-orange-500 transition-colors ${hasUpvoted ? 'text-orange-500' : ''}`}
          >
            <TrendingUp className="w-4 h-4" />
            {upvoteCount}
          </button>
          <span className="flex items-center gap-1">
            <MessageSquare className="w-4 h-4" />
            {stack.comment_count || 0}
          </span>
          <span className="flex items-center gap-1">
            👁 {stack.view_count}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <CloneStackButton
            tools={stack.tools.map(tool => ({
              id: tool.id,
              name: tool.name,
              affiliate_url: (tool as any).affiliate_url,
              logo_url: tool.logo_url,
            }))}
            stackName={stack.title}
            variant="ghost"
            size="sm"
          />
        </div>
      </div>
    </Card>
  );
}

export const StackCardFull = memo(StackCardFullComponent);