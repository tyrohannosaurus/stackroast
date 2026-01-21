import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Flame, Calendar, TrendingUp, Settings, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { LoadingFire } from "@/components/LoadingFire";
import type { Stack } from "@/types";
import { transformLegacyStack } from "@/lib/stackAdapter";

interface Profile {
  id: string;
  username: string;
  karma_points: number;
  created_at: string;
  bio?: string;
  avatar_url?: string;
  github_url?: string;
  twitter_handle?: string;
  total_tips_received?: number;
}

export default function UserProfile() {
  const { username } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [stacks, setStacks] = useState<Stack[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"stacks" | "stats">("stacks");

  const isOwnProfile = user && profile && user.id === profile.id;

  useEffect(() => {
    loadProfile();
  }, [username]);

  const loadProfile = async () => {
    if (!username) return;

    try {
      // Remove @ symbol if present
      const cleanUsername = username.replace("@", "");

      // Fetch profile
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("username", cleanUsername)
        .single();

      if (profileError || !profileData) {
        toast.error("User not found");
        navigate("/");
        return;
      }

      setProfile(profileData);

      // Fetch user's stacks
      const { data: stacksData, error: stacksError } = await supabase
        .from("stacks")
        .select("id, name, slug, created_at, view_count, profile_id, upvote_count, comment_count")
        .eq("profile_id", profileData.id)
        .eq("is_public", true)
        .order("created_at", { ascending: false });

      if (stacksError) {
        console.error("Stacks error:", stacksError);
        setStacks([]);
        return;
      }

      // Enrich stacks with additional data
      const enrichedStacks = await Promise.all(
        (stacksData || []).map(async (stack) => {
          const { data: aiRoastData } = await supabase
            .from("ai_roasts")
            .select("roast_text, burn_score, persona")
            .eq("stack_id", stack.id)
            .maybeSingle();

          const { data: roastStats } = await supabase
            .from("community_roasts")
            .select("upvotes")
            .eq("stack_id", stack.id);

          const { data: toolsData } = await supabase
            .from("stack_items")
            .select(`
              tool_id,
              tool:tools (logo_url)
            `)
            .eq("stack_id", stack.id)
            .order("sort_order")
            .limit(4);

          const tool_preview = toolsData?.map((item: any) => item.tool?.logo_url).filter(Boolean) || [];
          const community_roasts_count = roastStats?.length || 0;

          return {
            ...stack,
            profiles: profileData,
            ai_roasts: aiRoastData || null,
            community_roasts_count,
            total_upvotes: stack.upvote_count || 0,
            tool_preview,
            comment_count: stack.comment_count || 0,
          };
        })
      );

      const transformedStacks = enrichedStacks.map(transformLegacyStack);
      setStacks(transformedStacks);
    } catch (error) {
      console.error("Error loading profile:", error);
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { 
      month: "short", 
      year: "numeric" 
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center">
        <LoadingFire size="md" text="Loading profile..." />
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  const totalStackViews = stacks.reduce((sum, stack) => sum + stack.view_count, 0);
  const totalUpvotes = stacks.reduce((sum, stack) => sum + stack.upvote_count, 0);

  return (
    <div className="min-h-screen bg-canvas pb-20">
      {/* Header */}
      <header className="border-b border-border bg-surface/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
          <div className="flex items-center gap-2">
            <Flame className="w-6 h-6 text-orange-500" />
            <span className="font-semibold text-foreground">StackRoast</span>
          </div>
        </div>
      </header>

      {/* Profile Content */}
      <div className="container mx-auto px-4 py-12 max-w-5xl">
        {/* Profile Header */}
        <Card className="p-8 bg-surface border-border shadow-elegant mb-8">
          <div className="flex items-start gap-6">
            {/* Avatar */}
            <Avatar className="w-24 h-24 border-2 border-orange-500/30">
              <AvatarImage src={profile.avatar_url} alt={profile.username} />
              <AvatarFallback className="text-2xl bg-orange-500/20 text-orange-500">
                {profile.username[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>

            {/* Profile Info */}
            <div className="flex-1">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h1 className="text-3xl font-bold text-foreground mb-1">
                    @{profile.username}
                  </h1>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      Joined {formatDate(profile.created_at)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Flame className="w-4 h-4 text-orange-400" />
                      {profile.karma_points} Karma
                    </span>
                  </div>
                </div>
                
                {isOwnProfile && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toast.info("Profile editing coming soon!")}
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Edit Profile
                  </Button>
                )}
              </div>

              {/* Bio */}
              {profile.bio && (
                <p className="text-foreground mb-4">
                  {profile.bio}
                </p>
              )}

              {/* Stats */}
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-foreground">{stacks.length}</div>
                  <div className="text-xs text-muted-foreground">Stacks</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-foreground">{totalStackViews}</div>
                  <div className="text-xs text-muted-foreground">Views</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-foreground">{totalUpvotes}</div>
                  <div className="text-xs text-muted-foreground">Upvotes</div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Tabs */}
        <div className="flex items-center gap-4 mb-6 border-b border-border">
          <button
            className={`pb-3 px-4 font-medium transition-colors ${
              activeTab === "stacks"
                ? "text-orange-500 border-b-2 border-orange-500"
                : "text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => setActiveTab("stacks")}
          >
            Stacks ({stacks.length})
          </button>
          <button
            className={`pb-3 px-4 font-medium transition-colors ${
              activeTab === "stats"
                ? "text-orange-500 border-b-2 border-orange-500"
                : "text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => setActiveTab("stats")}
          >
            Stats
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === "stacks" && (
          <div className="space-y-4">
            {stacks.length > 0 ? (
              stacks.map((stack) => (
                <Card
                  key={stack.id}
                  className="p-6 bg-surface border-border hover:border-orange-500/50 transition-all cursor-pointer shadow-elegant hover:shadow-elegant-hover"
                  onClick={() => navigate(`/stack/${stack.slug}`)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-foreground mb-2">
                        {stack.title}
                      </h3>
                      
                      {/* Tools Preview */}
                      <div className="flex items-center gap-2 mb-3">
                        {stack.tool_previews?.slice(0, 5).map((logo, idx) => (
                          <img
                            key={idx}
                            src={logo}
                            alt="Tool"
                            className="w-6 h-6 rounded"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        ))}
                        {stack.tools.length > 5 && (
                          <span className="text-xs text-muted-foreground">
                            +{stack.tools.length - 5} more
                          </span>
                        )}
                      </div>

                      {/* AI Roast Preview */}
                      {stack.ai_roast_summary && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {stack.ai_roast_summary}
                        </p>
                      )}

                      {/* Stats */}
                      <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <TrendingUp className="w-3 h-3" />
                          {stack.upvote_count}
                        </span>
                        <span>👁 {stack.view_count}</span>
                        <span>💬 {stack.comment_count}</span>
                        <span>🔥 {stack.roast_count}</span>
                      </div>
                    </div>

                    {/* Burn Score */}
                    <div className="text-center ml-6">
                      <div className="text-3xl font-bold text-gradient">
                        {stack.burn_score}
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        Burn Score
                      </Badge>
                    </div>
                  </div>
                </Card>
              ))
            ) : (
              <div className="text-center py-12">
                <Flame className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">
                  {isOwnProfile 
                    ? "You haven't submitted any stacks yet. Get roasted!"
                    : "This user hasn't submitted any stacks yet."}
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === "stats" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-6 bg-surface border-border shadow-elegant">
              <div className="text-3xl font-bold text-orange-500 mb-2">
                {profile.karma_points}
              </div>
              <div className="text-sm text-muted-foreground">Total Karma Points</div>
            </Card>
            <Card className="p-6 bg-surface border-border shadow-elegant">
              <div className="text-3xl font-bold text-orange-500 mb-2">
                {totalStackViews}
              </div>
              <div className="text-sm text-muted-foreground">Total Stack Views</div>
            </Card>
            <Card className="p-6 bg-surface border-border shadow-elegant">
              <div className="text-3xl font-bold text-orange-500 mb-2">
                {totalUpvotes}
              </div>
              <div className="text-sm text-muted-foreground">Total Upvotes</div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}