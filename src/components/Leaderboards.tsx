import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Trophy, 
  Flame, 
  TrendingUp, 
  Users, 
  Zap,
  Crown,
  Medal,
  Star
} from "lucide-react";
import { Link } from "react-router-dom";
import { LoadingFire } from "@/components/LoadingFire";

interface LeaderboardUser {
  id: string;
  username: string;
  avatar_url?: string;
  karma_points: number;
  stack_count?: number;
  roast_count?: number;
  total_burn_score?: number;
}

interface LeaderboardStack {
  id: string;
  name: string;
  slug: string;
  burn_score: number;
  view_count: number;
  upvote_count: number;
  username: string;
}

type LeaderboardCategory = 'logs' | 'roasters' | 'stacks' | 'burned' | 'trending';

export function Leaderboards() {
  const [category, setCategory] = useState<LeaderboardCategory>('logs');
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [stacks, setStacks] = useState<LeaderboardStack[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadLeaderboard = async () => {
      if (!isMounted) return;
      
      setLoading(true);
      try {
        switch (category) {
          case 'logs':
            await loadLogsLeaders();
            break;
          case 'roasters':
            await loadTopRoasters();
            break;
          case 'stacks':
            await loadTopStacks();
            break;
          case 'burned':
            await loadMostBurned();
            break;
          case 'trending':
            await loadTrendingStacks();
            break;
        }
      } catch (error: any) {
        // Ignore AbortError (expected in React Strict Mode)
        if (error?.name === 'AbortError' || error?.message?.includes('aborted')) {
          return;
        }
        console.error('Error loading leaderboard:', error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadLeaderboard();

    return () => {
      isMounted = false;
    };
  }, [category]);

  const loadLogsLeaders = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, avatar_url, karma_points')
        .order('karma_points', { ascending: false })
        .limit(10);

      // Ignore AbortError (expected in React Strict Mode)
      if (error && (error.name === 'AbortError' || error.message?.includes('aborted'))) {
        return;
      }

      if (error) {
        console.error('Error loading logs leaders:', error);
        if (error.message?.includes('permission') || error.message?.includes('policy')) {
          console.error('❌ RLS Policy Error: Access denied to profiles table.');
        }
        setUsers([]);
        setStacks([]);
        return;
      }

      if (data && data.length > 0) {
        setUsers(data);
        setStacks([]);
      } else {
        console.warn('⚠️  No profiles found for leaderboard');
        setUsers([]);
        setStacks([]);
      }
    } catch (error: any) {
      // Ignore AbortError
      if (error?.name === 'AbortError' || error?.message?.includes('aborted')) {
        return;
      }
      console.error('Error in loadLogsLeaders:', error);
    }
  };

  const loadTopRoasters = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id, 
          username, 
          avatar_url, 
          karma_points
        `)
        .order('karma_points', { ascending: false })
        .limit(10);

      // Ignore AbortError
      if (error && (error.name === 'AbortError' || error.message?.includes('aborted'))) {
        return;
      }

      if (error) {
        console.error('Error loading top roasters:', error);
        setUsers([]);
        setStacks([]);
        return;
      }

      if (data && data.length > 0) {
        // OPTIMIZED: Get all roast counts in a single query instead of N queries
        const userIds = data.map(u => u.id);
        const { data: allRoasts, error: roastError } = await supabase
          .from('community_roasts')
          .select('user_id')
          .in('user_id', userIds)
          .not('user_id', 'is', null);

        // Count roasts per user
        const roastCountMap = new Map<string, number>();
        if (allRoasts && !roastError) {
          allRoasts.forEach((roast: any) => {
            if (roast.user_id) {
              roastCountMap.set(roast.user_id, (roastCountMap.get(roast.user_id) || 0) + 1);
            }
          });
        }

        // Combine with roast counts and sort
        const usersWithCounts = data
          .map((user) => ({
            ...user,
            roast_count: roastCountMap.get(user.id) || 0,
          }))
          .sort((a, b) => b.roast_count - a.roast_count);

        setUsers(usersWithCounts);
        setStacks([]);
      } else {
        setUsers([]);
        setStacks([]);
      }
    } catch (error: any) {
      // Ignore AbortError
      if (error?.name === 'AbortError' || error?.message?.includes('aborted')) {
        return;
      }
      console.error('Error in loadTopRoasters:', error);
    }
  };

  const loadTopStacks = async () => {
    try {
      // OPTIMIZED: Single query with joins instead of N+1 queries
      const { data: stacksData, error } = await supabase
        .from('stacks')
        .select(`
          id, name, slug, view_count, upvote_count, profile_id,
          profiles:profile_id (username),
          ai_roasts (burn_score)
        `)
        .eq('is_public', true)
        .order('upvote_count', { ascending: false })
        .limit(10);

      // Ignore AbortError
      if (error && (error.name === 'AbortError' || error.message?.includes('aborted'))) {
        return;
      }

      if (error) {
        console.error('Error loading top stacks:', error);
        if (error.message?.includes('column') || error.code === '42703') {
          console.warn('⚠️  is_public column not found. Run migration 20250105_fix_stacks_schema.sql');
        } else if (error.message?.includes('permission') || error.message?.includes('policy')) {
          console.error('❌ RLS Policy Error: Access denied to stacks table.');
        }
        setStacks([]);
        setUsers([]);
        return;
      }

      if (stacksData && stacksData.length > 0) {
        // Transform the joined data - NO additional queries needed!
        const stacksWithDetails = stacksData.map((stack: any) => {
          const aiRoast = Array.isArray(stack.ai_roasts) && stack.ai_roasts.length > 0
            ? stack.ai_roasts[0]
            : stack.ai_roasts;
          const profile = Array.isArray(stack.profiles) ? stack.profiles[0] : stack.profiles;
          
          return {
            id: stack.id,
            name: stack.name,
            slug: stack.slug,
            view_count: stack.view_count,
            upvote_count: stack.upvote_count,
            profile_id: stack.profile_id,
            burn_score: aiRoast?.burn_score || 0,
            username: profile?.username || 'Anonymous'
          };
        });

        setStacks(stacksWithDetails);
        setUsers([]);
      } else {
        console.warn('⚠️  No public stacks found for leaderboard');
        setStacks([]);
        setUsers([]);
      }
    } catch (error: any) {
      // Ignore AbortError
      if (error?.name === 'AbortError' || error?.message?.includes('aborted')) {
        return;
      }
      console.error('Error in loadTopStacks:', error);
    }
  };

  const loadMostBurned = async () => {
    try {
      // OPTIMIZED: Single query with joins from ai_roasts table
      const { data: roastsData, error } = await supabase
        .from('ai_roasts')
        .select(`
          burn_score,
          stack:stacks!inner (
            id, name, slug, view_count, upvote_count, profile_id,
            profiles:profile_id (username)
          )
        `)
        .order('burn_score', { ascending: false })
        .limit(10);

      // Ignore AbortError
      if (error && (error.name === 'AbortError' || error.message?.includes('aborted'))) {
        return;
      }

      if (error) {
        console.error('Error loading most burned:', error);
        setStacks([]);
        setUsers([]);
        return;
      }

      if (roastsData && roastsData.length > 0) {
        // Transform the joined data - NO additional queries needed!
        const stacksWithDetails = roastsData.map((item: any) => {
          const stack = item.stack;
          const profile = Array.isArray(stack?.profiles) ? stack.profiles[0] : stack?.profiles;
          
          return {
            id: stack?.id,
            name: stack?.name,
            slug: stack?.slug,
            view_count: stack?.view_count || 0,
            upvote_count: stack?.upvote_count || 0,
            profile_id: stack?.profile_id,
            burn_score: item.burn_score || 0,
            username: profile?.username || 'Anonymous'
          };
        }).filter(Boolean);

        setStacks(stacksWithDetails as LeaderboardStack[]);
        setUsers([]);
      } else {
        setStacks([]);
        setUsers([]);
      }
    } catch (error: any) {
      // Ignore AbortError
      if (error?.name === 'AbortError' || error?.message?.includes('aborted')) {
        return;
      }
      console.error('Error in loadMostBurned:', error);
    }
  };

  const loadTrendingStacks = async () => {
    try {
      // Trending = recent stacks with good engagement (views + upvotes)
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      
      // OPTIMIZED: Single query with joins instead of N+1 queries
      const { data: stacksData, error } = await supabase
        .from('stacks')
        .select(`
          id, name, slug, view_count, upvote_count, profile_id, created_at,
          profiles:profile_id (username),
          ai_roasts (burn_score)
        `)
        .eq('is_public', true)
        .gte('created_at', oneDayAgo)
        .order('view_count', { ascending: false })
        .limit(10);

      // Ignore AbortError
      if (error && (error.name === 'AbortError' || error.message?.includes('aborted'))) {
        return;
      }

      if (error) {
        console.error('Error loading trending stacks:', error);
        setStacks([]);
        setUsers([]);
        return;
      }

      if (stacksData && stacksData.length > 0) {
        // Transform the joined data - NO additional queries needed!
        const stacksWithDetails = stacksData.map((stack: any) => {
          const aiRoast = Array.isArray(stack.ai_roasts) && stack.ai_roasts.length > 0
            ? stack.ai_roasts[0]
            : stack.ai_roasts;
          const profile = Array.isArray(stack.profiles) ? stack.profiles[0] : stack.profiles;
          
          return {
            id: stack.id,
            name: stack.name,
            slug: stack.slug,
            view_count: stack.view_count,
            upvote_count: stack.upvote_count,
            profile_id: stack.profile_id,
            burn_score: aiRoast?.burn_score || 0,
            username: profile?.username || 'Anonymous'
          };
        });

        setStacks(stacksWithDetails);
        setUsers([]);
      } else {
        setStacks([]);
        setUsers([]);
      }
    } catch (error: any) {
      // Ignore AbortError
      if (error?.name === 'AbortError' || error?.message?.includes('aborted')) {
        return;
      }
      console.error('Error in loadTrendingStacks:', error);
    }
  };

  const getRankIcon = (index: number) => {
    if (index === 0) return <Crown className="w-5 h-5 text-yellow-400" />;
    if (index === 1) return <Medal className="w-5 h-5 text-zinc-400" />;
    if (index === 2) return <Medal className="w-5 h-5 text-amber-600" />;
    return <span className="w-5 h-5 flex items-center justify-center text-sm text-zinc-500">#{index + 1}</span>;
  };

  const categoryIcons = {
    logs: <Trophy className="w-4 h-4" />,
    roasters: <Flame className="w-4 h-4" />,
    stacks: <Star className="w-4 h-4" />,
    burned: <Zap className="w-4 h-4" />,
    trending: <TrendingUp className="w-4 h-4" />,
  };

  const categoryLabels = {
    logs: 'Log Leaders',
    roasters: 'Top Roasters',
    stacks: 'Popular Stacks',
    burned: 'Most Burned',
    trending: 'Trending',
  };

  return (
    <Card id="leaderboards" className="p-4 bg-surface/50 border-white/10">
      <div className="flex items-center gap-2 mb-4">
        <Trophy className="w-5 h-5 text-yellow-400" />
        <h3 className="font-semibold">Leaderboards</h3>
      </div>

      <Tabs value={category} onValueChange={(v) => setCategory(v as LeaderboardCategory)}>
        <TabsList className="w-full grid grid-cols-5 h-auto p-1 mb-4">
          {(Object.keys(categoryLabels) as LeaderboardCategory[]).map((cat) => (
            <TabsTrigger
              key={cat}
              value={cat}
              className="text-xs px-2 py-1.5 data-[state=active]:bg-orange-500/20"
            >
              {categoryIcons[cat]}
            </TabsTrigger>
          ))}
        </TabsList>

        <div className="text-sm font-medium text-zinc-400 mb-3">
          {categoryLabels[category]}
        </div>

        {loading ? (
          <div className="flex justify-center py-6">
            <LoadingFire size="sm" />
          </div>
        ) : (
          <div className="space-y-2">
            {/* User Leaderboards */}
            {users.length > 0 && users.map((user, index) => (
              <Link
                key={user.id}
                to={`/user/${user.username}`}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors"
              >
                <div className="w-6 flex justify-center">
                  {getRankIcon(index)}
                </div>
                <Avatar className="w-8 h-8">
                  <AvatarImage src={user.avatar_url} />
                  <AvatarFallback>{user.username[0]?.toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">@{user.username}</p>
                </div>
                <div className="text-right">
                  {category === 'logs' && (
                    <span className="text-sm font-bold text-orange-400">{user.karma_points}</span>
                  )}
                  {category === 'roasters' && (
                    <span className="text-sm font-bold text-orange-400">{user.roast_count} 🔥</span>
                  )}
                </div>
              </Link>
            ))}

            {/* Stack Leaderboards */}
            {stacks.length > 0 && stacks.map((stack, index) => (
              <Link
                key={stack.id}
                to={`/stack/${stack.slug}`}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors"
              >
                <div className="w-6 flex justify-center">
                  {getRankIcon(index)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{stack.name}</p>
                  <p className="text-xs text-zinc-500">by @{stack.username}</p>
                </div>
                <div className="text-right">
                  {category === 'burned' && (
                    <span className="text-sm font-bold text-red-400">{stack.burn_score}🔥</span>
                  )}
                  {category === 'stacks' && (
                    <span className="text-sm font-bold text-green-400">↑{stack.upvote_count}</span>
                  )}
                  {category === 'trending' && (
                    <span className="text-sm font-bold text-blue-400">{stack.view_count}👁</span>
                  )}
                </div>
              </Link>
            ))}

            {users.length === 0 && stacks.length === 0 && (
              <div className="text-center py-6 text-zinc-500 text-sm">
                No data yet
              </div>
            )}
          </div>
        )}
      </Tabs>
    </Card>
  );
}
