'use client';

import { useState } from 'react';
import { StackCardFull } from './StackCardFull';
import { StackCardPreview } from './StackCardPreview';
import { FeedSortTabs } from './FeedSortTabs';
import { FeedDivider } from './FeedDivider';
import { ToolFilter } from './ToolFilter';
import { sortStacks, splitFeed } from '@/lib/feedSorting';
import type { Stack, SortMode } from '@/types';

interface FeedContainerProps {
  initialStacks: Stack[];
  stackToolMap?: Map<string, string[]>; // Map of stack ID to tool IDs
}

export function FeedContainer({ initialStacks, stackToolMap }: FeedContainerProps) {
  const [sortMode, setSortMode] = useState<SortMode>('hot');
  const [selectedTools, setSelectedTools] = useState<string[]>([]);
  
  // Filter stacks by selected tools
  const filteredStacks = selectedTools.length > 0 && stackToolMap
    ? initialStacks.filter(stack => {
        const stackTools = stackToolMap.get(stack.id) || [];
        return selectedTools.some(toolId => stackTools.includes(toolId));
      })
    : initialStacks;
  
  // Sort stacks based on current mode
  const sortedStacks = sortStacks(filteredStacks, sortMode);
  
  // Split into top 3 and rest
  const { topThree, restOfFeed } = splitFeed(sortedStacks);

  return (
    <div className="space-y-6">
      {/* Sort Tabs */}
      <FeedSortTabs 
        currentMode={sortMode} 
        onModeChange={setSortMode} 
      />

      {/* Tool Filter */}
      <ToolFilter
        selectedTools={selectedTools}
        onToolsChange={setSelectedTools}
      />

      {/* Top 3 - Full Roasts */}
      {topThree.length > 0 && (
        <div className="space-y-6">
          {topThree.map((stack, index) => (
            <StackCardFull 
              key={stack.id} 
              stack={stack}
              rank={index + 1}
            />
          ))}
        </div>
      )}

      {/* Divider */}
      {restOfFeed.length > 0 && <FeedDivider />}

      {/* Rest - Preview Cards */}
      {restOfFeed.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          {restOfFeed.map((stack) => (
            <StackCardPreview 
              key={stack.id} 
              stack={stack}
            />
          ))}
        </div>
      )}

      {/* Empty State */}
      {sortedStacks.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            {selectedTools.length > 0 
              ? "No stacks found with the selected tools. Try adjusting your filters."
              : "No stacks found. Be the first to submit!"}
          </p>
        </div>
      )}
    </div>
  );
}