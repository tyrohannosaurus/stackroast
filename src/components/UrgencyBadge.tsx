import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Clock, Flame, Users, Zap } from 'lucide-react';

type UrgencyType = 'limited-time' | 'popular' | 'trending' | 'hot-deal';

interface UrgencyBadgeProps {
  type: UrgencyType;
  value?: string | number;
  className?: string;
}

export function UrgencyBadge({ type, value, className = '' }: UrgencyBadgeProps) {
  const [timeLeft, setTimeLeft] = useState<string>('');

  useEffect(() => {
    if (type === 'limited-time') {
      // Calculate time until end of month (typical affiliate promo period)
      const now = new Date();
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
      const diff = endOfMonth.getTime() - now.getTime();
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));

      if (days <= 7) {
        setTimeLeft(`${days} day${days !== 1 ? 's' : ''} left`);
      }
    }
  }, [type]);

  switch (type) {
    case 'limited-time':
      if (!timeLeft) return null;
      return (
        <Badge
          variant="outline"
          className={`bg-red-500/20 text-red-400 border-red-500/50 animate-pulse ${className}`}
        >
          <Clock className="w-3 h-3 mr-1" />
          {timeLeft}
        </Badge>
      );

    case 'popular':
      return (
        <Badge
          variant="outline"
          className={`bg-blue-500/20 text-blue-400 border-blue-500/50 ${className}`}
        >
          <Users className="w-3 h-3 mr-1" />
          Used by {value || '10K+'} devs
        </Badge>
      );

    case 'trending':
      return (
        <Badge
          variant="outline"
          className={`bg-orange-500/20 text-orange-400 border-orange-500/50 ${className}`}
        >
          <Flame className="w-3 h-3 mr-1" />
          Trending
        </Badge>
      );

    case 'hot-deal':
      return (
        <Badge
          variant="outline"
          className={`bg-gradient-to-r from-red-500/20 to-orange-500/20 text-orange-400 border-orange-500/50 animate-pulse ${className}`}
        >
          <Zap className="w-3 h-3 mr-1" />
          {value || 'Special offer'}
        </Badge>
      );

    default:
      return null;
  }
}

// Helper to determine which urgency badge to show based on tool data
export function getUrgencyType(tool: {
  name: string;
  popularity?: number;
  hasPromo?: boolean;
}): UrgencyType | null {
  // Popular tools
  const popularTools = [
    'vercel',
    'supabase',
    'stripe',
    'tailwind',
    'nextjs',
    'react',
    'typescript',
    'prisma',
    'railway',
    'planetscale',
    'clerk',
    'resend',
  ];

  const toolNameLower = tool.name.toLowerCase();

  if (tool.hasPromo) {
    return 'hot-deal';
  }

  if (popularTools.some((p) => toolNameLower.includes(p))) {
    return 'popular';
  }

  // Trending based on recent growth
  const trendingTools = ['cursor', 'v0', 'bolt', 'windsurf', 'claude', 'anthropic'];
  if (trendingTools.some((t) => toolNameLower.includes(t))) {
    return 'trending';
  }

  return null;
}
