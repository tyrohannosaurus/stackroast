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
  Medal
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
    loadLeaderboard();
  }, [category]);

  const loadLeaderboard = async () => {
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
    } finally {
      setLoading(false);
    }
  };

  const loadLogsLeaders = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, avatar_url, karma_points')
      .order('karma_points', { ascending: false })
      .limit(10);

    if (!error && data) {
      setUsers(data);
      setStacks([]);
    }
  };

  const loadTopRoasters = async () => {
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

    if (!error && data) {
      // Get roast counts for each user
      const usersWithCounts = await Promise.all(
        data.map(async (user) => {
          const { count } = await supabase
            .from('community_roasts')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id);

          return { ...user, roast_count: count || 0 };
        })
      );

      setUsers(usersWithCounts.sort((a, b) => (b.roast_count || 0) - (a.roast_count || 0)));
      setStacks([]);
    }
  };

  const loadTopStacks = async () => {
    const { data: stacksData, error } = await supabase
      .from('stacks')
      .select('id, name, slug, view_count, upvote_count, profile_id')
      .eq('is_public', true)
      .order('upvote_count', { ascending: false })
      .limit(10);

    if (!error && stacksData) {
      const stacksWithDetails = await Promise.all(
        stacksData.map(async (stack) => {
          const { data: roast } = await supabase
            .from('ai_roasts')
            .select('burn_score')
            .eq('stack_id', stack.id)
            .maybeSingle();

          const { data: profile } = await supabase
            .from('profiles')
            .select('username')
            .eq('id', stack.profile_id)
            .maybeSingle();

          return {
            ...stack,
            burn_score: roast?.burn_score || 0,
            username: profile?.username || 'Anonymous'
          };
        })
      );

      setStacks(stacksWithDetails);
      setUsers([]);
    }
  };

  const loadMostBurned = async () => {
    const { data: roasts, error } = await supabase
      .from('ai_roasts')
      .select('stack_id, burn_score')
      .order('burn_score', { ascending: false })
      .limit(10);

    if (!error && roasts) {
      const stacksWithDetails = await Promise.all(
        roasts.map(async (roast) => {
          const { data: stack } = await supabase
            .from('stacks')
            .select('id, name, slug, view_count, upvote_count, profile_id')
            .eq('id', roast.stack_id)
            .single();

          if (!stack) return null;

          const { data: profile } = await supabase
            .from('profiles')
            .select('username')
            .eq('id', stack.profile_id)
            .maybeSingle();

          return {
            ...stack,
            burn_score: roast.burn_score,
            username: profile?.username || 'Anonymous'
          };
        })
      );

      setStacks(stacksWithDetails.filter(Boolean) as LeaderboardStack[]);
      setUsers([]);
    }
  };

  const loadTrendingStacks = async () => {
    // Trending = recent stacks with good engagement (views + upvotes)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    const { data: stacksData, error } = await supabase
      .from('stacks')
      .select('id, name, slug, view_count, upvote_count, profile_id, created_at')
      .eq('is_public', true)
      .gte('created_at', oneDayAgo)
      .order('view_count', { ascending: false })
      .limit(10);

    if (!error && stacksData) {
      const stacksWithDetails = await Promise.all(
        stacksData.map(async (stack) => {
          const { data: roast } = await supabase
            .from('ai_roasts')
            .select('burn_score')
            .eq('stack_id', stack.id)
            .maybeSingle();

          const { data: profile } = await supabase
            .from('profiles')
            .select('username')
            .eq('id', stack.profile_id)
            .maybeSingle();

          return {
            ...stack,
            burn_score: roast?.burn_score || 0,
            username: profile?.username || 'Anonymous'
          };
        })
      );

      setStacks(stacksWithDetails);
      setUsers([]);
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
    stacks: <TrendingUp className="w-4 h-4" />,
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
