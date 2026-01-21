import type { Stack, SortMode } from '@/types';

export function calculateHotScore(stack: Stack): number {
  const now = new Date();
  const created = new Date(stack.created_at);
  const hoursOld = (now.getTime() - created.getTime()) / (1000 * 60 * 60);
  const engagementScore = (stack.upvote_count * 2) + (stack.comment_count * 3);
  return engagementScore / Math.pow(hoursOld + 2, 1.5);
}

export function sortStacks(stacks: Stack[], mode: SortMode): Stack[] {
  const sorted = [...stacks];
  
  switch (mode) {
    case 'hot':
      return sorted.sort((a, b) => calculateHotScore(b) - calculateHotScore(a));
    case 'new':
      return sorted.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    case 'top':
      return sorted.sort((a, b) => b.upvote_count - a.upvote_count);
    default:
      return sorted;
  }
}

export function splitFeed(stacks: Stack[]) {
  return {
    topThree: stacks.slice(0, 3),
    restOfFeed: stacks.slice(3)
  };
}