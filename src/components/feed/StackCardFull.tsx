import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageSquare, TrendingUp, BarChart3, Flame } from 'lucide-react';
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

export function StackCardFull({ stack, rank }: StackCardFullProps) {
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
    } catch (error: any) {
      console.error('Upvote error:', error);
      toast.error('Failed to upvote');
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

  return (
    <Card 
      className="p-6 bg-zinc-50 dark:bg-zinc-900/30 border-zinc-200 dark:border-white/10 hover:border-orange-500/30 transition-all cursor-pointer"
      onClick={handleCardClick}
    >
      {/* Rank Badge */}
      {rank <= 3 && (
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/30 mb-4">
          <Flame className="w-4 h-4 text-orange-400" />
          <span className="text-sm font-medium text-orange-300">
            #{rank} Hottest
          </span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarImage src={stack.user.avatar_url} alt={stack.user.username} />
            <AvatarFallback>{stack.user.username[0]?.toUpperCase()}</AvatarFallback>
          </Avatar>
          <div>
            <Link 
              to={`/user/${stack.user.username}`}
              className="font-medium text-foreground hover:text-orange-400 transition-colors"
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
          <div className="text-3xl font-bold text-gradient">
            {stack.burn_score}
          </div>
          <div className="text-xs text-muted-foreground">Burn Score</div>
        </div>
      </div>

      {/* Tools */}
      <div className="flex flex-wrap gap-2 mb-4">
        {stack.tools.slice(0, 6).map((tool, index) => (
          <div 
            key={tool.id || `tool-${index}`}
            className="px-3 py-1 rounded-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-white/10 text-sm flex items-center gap-2 text-foreground"
          >
            {tool.logo_url ? (
              <img 
                src={tool.logo_url} 
                alt={tool.name || 'Tool'} 
                className="w-4 h-4 object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            ) : (
              <div className="w-4 h-4 rounded bg-orange-500/20 flex items-center justify-center text-[10px] text-orange-500 font-bold">
                {(tool.name || '?')[0]?.toUpperCase()}
              </div>
            )}
            {tool.name || 'Unknown Tool'}
          </div>
        ))}
        {stack.tools.length > 6 && (
          <div className="px-3 py-1 rounded-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-white/10 text-sm text-muted-foreground">
            +{stack.tools.length - 6} more
          </div>
        )}
      </div>

      {/* FULL AI ROAST */}
      <div className="bg-white dark:bg-zinc-800 rounded-lg p-4 mb-4 border border-zinc-200 dark:border-white/10">
        <div className="flex items-center gap-2 mb-2">
          <Flame className="w-4 h-4 text-orange-400" />
          <span className="text-sm font-medium text-orange-400">AI Roast</span>
        </div>
        <p className="text-foreground leading-relaxed whitespace-pre-wrap">
          {stack.ai_roast_full || "AI roast coming soon..."}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <TrendingUp className="w-4 h-4" />
            {upvoteCount}
          </span>
          <span className="flex items-center gap-1">
            <MessageSquare className="w-4 h-4" />
            {stack.comment_count}
          </span>
          <span className="flex items-center gap-1">
            <BarChart3 className="w-4 h-4" />
            {stack.view_count}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <CloneStackButton
            tools={stack.tools.map(tool => ({
              id: tool.id,
              name: tool.name,
              affiliate_url: tool.affiliate_url,
              logo_url: tool.logo_url,
            }))}
            stackName={stack.title}
            variant="default"
            size="sm"
          />
          <Button 
            variant={hasUpvoted ? "default" : "outline"} 
            size="sm"
            onClick={handleUpvote}
            disabled={isUpvoting}
            className={hasUpvoted ? "bg-orange-500 hover:bg-orange-600" : ""}
          >
            <TrendingUp className={`w-4 h-4 mr-1 ${isUpvoting ? 'animate-pulse' : ''}`} />
            {hasUpvoted ? 'Upvoted' : 'Upvote'}
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link to={`/stack/${stack.slug}`}>
              <MessageSquare className="w-4 h-4 mr-1" />
              Discuss
            </Link>
          </Button>
        </div>
      </div>
    </Card>
  );
}