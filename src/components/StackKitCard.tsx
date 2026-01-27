import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Wrench, ChevronRight, Star, TrendingUp, Eye, MessageSquare } from 'lucide-react';
import type { StackKitWithStats, StackKitDifficulty } from '@/types/database';

interface StackKitCardProps {
  kit: StackKitWithStats;
  onClick: () => void;
  featured?: boolean;
  compact?: boolean;
}

const DIFFICULTY_COLORS: Record<StackKitDifficulty, string> = {
  'Beginner': 'border-green-500/50 text-green-500',
  'Intermediate': 'border-blue-500/50 text-blue-500',
  'Advanced': 'border-purple-500/50 text-purple-500',
  'Expert': 'border-red-500/50 text-red-500',
};

export function StackKitCard({ kit, onClick, featured, compact }: StackKitCardProps) {
  const difficultyColor = kit.difficulty ? DIFFICULTY_COLORS[kit.difficulty] : '';

  if (compact) {
    return (
      <Card
        className="p-4 hover:border-orange-500/50 cursor-pointer transition-all group"
        onClick={onClick}
      >
        <div className="flex items-center gap-4">
          {/* Icon */}
          <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center text-2xl shrink-0">
            {kit.icon || '📦'}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold truncate">{kit.name}</h3>
              {featured && <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />}
            </div>
            <p className="text-sm text-muted-foreground truncate">{kit.tagline}</p>
          </div>

          {/* Meta */}
          <div className="flex items-center gap-4 shrink-0">
            <div className="text-sm text-muted-foreground">
              <Wrench className="w-4 h-4 inline mr-1" />
              {kit.tool_count}
            </div>
            <div className="text-sm text-muted-foreground">
              <TrendingUp className="w-4 h-4 inline mr-1" />
              {kit.upvote_count}
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-orange-500 transition-colors" />
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card
      className={`overflow-hidden hover:border-orange-500/50 cursor-pointer transition-all group ${
        featured ? 'ring-2 ring-orange-500/30' : ''
      }`}
      onClick={onClick}
    >
      {/* Header */}
      <div className="p-6 pb-4">
        <div className="flex items-start justify-between mb-3">
          <div className="w-14 h-14 rounded-xl bg-muted flex items-center justify-center text-3xl">
            {kit.icon || '📦'}
          </div>
          <div className="flex items-center gap-2">
            {featured && (
              <Badge className="bg-yellow-500/20 text-yellow-500 border-yellow-500/30">
                <Star className="w-3 h-3 mr-1 fill-current" />
                Featured
              </Badge>
            )}
            {kit.difficulty && (
              <Badge variant="outline" className={difficultyColor}>
                {kit.difficulty}
              </Badge>
            )}
          </div>
        </div>

        <h3 className="font-bold text-lg mb-1 group-hover:text-orange-400 transition-colors">
          {kit.name}
        </h3>
        <p className="text-sm text-muted-foreground line-clamp-2">
          {kit.tagline}
        </p>
      </div>

      {/* Tags Preview */}
      {kit.tags && kit.tags.length > 0 && (
        <div className="px-6 pb-4">
          <div className="flex flex-wrap gap-1.5">
            {kit.tags.slice(0, 3).map((tag, i) => (
              <Badge 
                key={i} 
                variant="secondary" 
                className="text-xs cursor-pointer hover:bg-orange-500/20 hover:text-orange-400 transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  // Navigate to kits page with tag search
                  window.location.href = `/kits?search=${encodeURIComponent(tag)}`;
                }}
              >
                {tag}
              </Badge>
            ))}
            {kit.tags.length > 3 && (
              <Badge variant="secondary" className="text-xs bg-orange-500/10 text-orange-400">
                +{kit.tags.length - 3} more
              </Badge>
            )}
          </div>
        </div>
      )}

      {/* Author */}
      <div className="px-6 pb-4">
        <div className="flex items-center gap-2">
          <div className="text-xs text-muted-foreground">
            by <span className="text-foreground font-medium">{kit.creator_username}</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-border bg-muted/30 flex items-center justify-between">
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1 text-muted-foreground" title="Tools">
            <Wrench className="w-4 h-4" />
            <span>{kit.tool_count}</span>
          </div>
          <div className="flex items-center gap-1 text-muted-foreground" title="Upvotes">
            <TrendingUp className="w-4 h-4" />
            <span>{kit.upvote_count}</span>
          </div>
          <div className="flex items-center gap-1 text-muted-foreground" title="Views">
            <Eye className="w-4 h-4" />
            <span>{kit.view_count}</span>
          </div>
          <div className="flex items-center gap-1 text-muted-foreground" title="Comments">
            <MessageSquare className="w-4 h-4" />
            <span>{kit.comment_count}</span>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="text-orange-400 hover:text-orange-300 hover:bg-orange-500/10"
        >
          View Kit
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </Card>
  );
}
