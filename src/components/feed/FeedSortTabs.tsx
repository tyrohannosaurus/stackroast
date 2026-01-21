import { Button } from '@/components/ui/button';
import { Flame, Clock, TrendingUp } from 'lucide-react';
import type { SortMode } from '@/types';

interface FeedSortTabsProps {
  currentMode: SortMode;
  onModeChange: (mode: SortMode) => void;
}

export function FeedSortTabs({ currentMode, onModeChange }: FeedSortTabsProps) {
  return (
    <div className="flex items-center gap-2 border-b border-white/10 pb-3 mb-6">
      <span className="text-sm text-muted-foreground mr-2">Sort by:</span>
      
      <Button
        variant={currentMode === 'hot' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onModeChange('hot')}
        className="gap-2"
      >
        <Flame className="w-4 h-4" />
        Hot
      </Button>
      
      <Button
        variant={currentMode === 'new' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onModeChange('new')}
        className="gap-2"
      >
        <Clock className="w-4 h-4" />
        New
      </Button>
      
      <Button
        variant={currentMode === 'top' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onModeChange('top')}
        className="gap-2"
      >
        <TrendingUp className="w-4 h-4" />
        Top
      </Button>
    </div>
  );
}