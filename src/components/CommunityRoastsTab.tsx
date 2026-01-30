import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { LoadingFire } from "@/components/LoadingFire";
import { Flame, ArrowUp, ArrowDown, Award, TrendingUp, MessageCircle, Send, ChevronDown, ChevronUp } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { CommunityRoastWithProfile, CommunityRoastWithStats, SupabaseError, CommunityRoast, RoastComment } from "@/types/database";

interface CommunityRoastsTabProps {
  stackId: string;
}

export function CommunityRoastsTab({ stackId }: CommunityRoastsTabProps) {
  const { user, refreshProfile } = useAuth();
  const [roasts, setRoasts] = useState<CommunityRoastWithProfile[]>([]);
  const [newRoast, setNewRoast] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingRoasts, setLoadingRoasts] = useState(true);
  const [sortBy, setSortBy] = useState<'top' | 'new'>('top');
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [submittingReply, setSubmittingReply] = useState(false);

  useEffect(() => {
    loadRoasts();
  }, [stackId, user, sortBy]);

  const loadRoasts = async () => {
    setLoadingRoasts(true);

    try {
      // Use the optimized view with pre-aggregated comment counts
      // This eliminates the N+1 query pattern
      const query = supabase
        .from("community_roasts_with_stats")
        .select("*")
        .eq("stack_id", stackId);

      if (sortBy === 'top') {
        query.order("upvotes", { ascending: false });
      } else {
        query.order("created_at", { ascending: false });
      }

      const { data, error } = await query;

      if (error) {
        const supaError = error as SupabaseError;
        console.error("Error loading roasts:", supaError);
        toast.error(`Failed to load roasts: ${supaError.message}`);
        setLoadingRoasts(false);
        return;
      }

      // Ensure upvotes and downvotes are always numbers and map to expected format
      const normalizedData: CommunityRoastWithProfile[] = (data || []).map((roast: CommunityRoastWithStats) => ({
        id: roast.id,
        stack_id: roast.stack_id,
        user_id: roast.user_id,
        roast_text: roast.roast_content,
        upvotes: roast.upvotes ?? 0,
        downvotes: roast.downvotes ?? 0,
        created_at: roast.created_at,
        comment_count: roast.comment_count ?? 0,
        profiles: {
          username: roast.author_username || "Anonymous",
          karma_points: 0, // Can be added to view if needed
          avatar_url: roast.author_avatar_url
        }
      }));

      // Load user votes in a single query if user is authenticated
      if (user && normalizedData.length > 0) {
        const { data: votes } = await supabase
          .from("roast_votes")
          .select("roast_id, vote_type")
          .eq("user_id", user.id)
          .in("roast_id", normalizedData.map((r) => r.id));

        const voteMap = new Map(votes?.map((v) => [v.roast_id, v.vote_type]));
        normalizedData.forEach((roast) => {
          roast.user_vote = voteMap.get(roast.id) as "up" | "down" | null;
        });
      }

      setRoasts(normalizedData);
    } catch (err) {
      const error = err as Error;
      console.error("Error loading roasts:", error);
      toast.error(`An error occurred while loading roasts: ${error.message}`);
    } finally {
      setLoadingRoasts(false);
    }
  };

  const loadComments = async (roastId: string) => {
    const { data, error } = await supabase
      .from("roast_comments")
      .select(`
        *,
        profiles:user_id (username, avatar_url)
      `)
      .eq("roast_id", roastId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error loading comments:", error);
      return;
    }

    setRoasts(prev => prev.map(roast => 
      roast.id === roastId 
        ? { ...roast, comments: data as (RoastComment & { profiles: { username: string; avatar_url?: string } })[] }
        : roast
    ));
  };

  const toggleComments = async (roastId: string) => {
    const newExpanded = new Set(expandedComments);
    if (newExpanded.has(roastId)) {
      newExpanded.delete(roastId);
    } else {
      newExpanded.add(roastId);
      // Load comments if not already loaded
      const roast = roasts.find(r => r.id === roastId);
      if (!roast?.comments) {
        await loadComments(roastId);
      }
    }
    setExpandedComments(newExpanded);
  };

  const handleSubmitComment = async (roastId: string) => {
    if (!user) {
      toast.error("Please sign in to comment");
      return;
    }

    if (!replyText.trim()) {
      toast.error("Comment cannot be empty");
      return;
    }

    setSubmittingReply(true);

    try {
      const { error } = await supabase.from("roast_comments").insert({
        roast_id: roastId,
        user_id: user.id,
        comment_text: replyText.trim(),
      });

      if (error) throw error;

      // Award karma for commenting (+1)
      await supabase.rpc("award_karma", {
        user_uuid: user.id,
        points: 1,
      });

      // Refresh profile to update karma display
      await refreshProfile();

      toast.success("Comment added! +1 log");
      setReplyText("");
      setReplyingTo(null);
      
      // Reload comments
      await loadComments(roastId);
      
      // Update comment count
      setRoasts(prev => prev.map(roast => 
        roast.id === roastId 
          ? { ...roast, comment_count: (roast.comment_count || 0) + 1 }
          : roast
      ));
    } catch (error: any) {
      toast.error(error.message || "Failed to add comment");
    } finally {
      setSubmittingReply(false);
    }
  };

  const handleSubmitRoast = async () => {
    if (!user) {
      toast.error("Please sign in to roast this stack");
      return;
    }

    if (!newRoast.trim()) {
      toast.error("Roast cannot be empty");
      return;
    }

    if (newRoast.trim().length < 10) {
      toast.error("Roast must be at least 10 characters");
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.from("community_roasts").insert({
        stack_id: stackId,
        user_id: user.id,
        roast_text: newRoast.trim(),
      });

      if (error) throw error;

      await supabase.rpc("award_karma", {
        user_uuid: user.id,
        points: 2,
      });

      // Refresh profile to update karma display
      await refreshProfile();

      toast.success("Roast submitted! +2 logs 🔥");
      setNewRoast("");
      loadRoasts();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (roastId: string, voteType: "up" | "down") => {
    if (!user) {
      toast.error("Please sign in to vote");
      return;
    }

    try {
      await supabase.rpc("handle_roast_vote", {
        p_roast_id: roastId,
        p_user_id: user.id,
        p_vote_type: voteType,
      });

      loadRoasts();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const getScore = (roast: CommunityRoastWithProfile) => {
    const upvotes = roast.upvotes ?? 0;
    const downvotes = roast.downvotes ?? 0;
    const score = upvotes - downvotes;
    // Ensure we never return NaN
    return isNaN(score) ? 0 : score;
  };

  return (
    <div className="space-y-6">
      {/* Header with Sort */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Flame className="w-4 h-4" />
          <span>{roasts.length} {roasts.length === 1 ? 'roast' : 'roasts'}</span>
        </div>

        <div className="flex items-center gap-1 bg-muted rounded-lg p-1 border border-border">
          <Button
            variant={sortBy === 'top' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setSortBy('top')}
            className="gap-1"
          >
            <TrendingUp className="w-3 h-3" />
            Top
          </Button>
          <Button
            variant={sortBy === 'new' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setSortBy('new')}
          >
            New
          </Button>
        </div>
      </div>

      {/* Submit Roast */}
      <div className="border border-border rounded-lg p-4 bg-muted/50">
        <Textarea
          placeholder="Drop your roast here... 🔥 Be creative, be savage!"
          value={newRoast}
          onChange={(e) => setNewRoast(e.target.value)}
          rows={3}
          className="resize-none mb-3 bg-transparent border-border"
        />
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {newRoast.length}/500 characters • Earn +2 logs for roasting
          </span>
          <Button 
            onClick={handleSubmitRoast} 
            disabled={loading || !newRoast.trim()}
            size="sm"
          >
            <Flame className="w-4 h-4 mr-2" />
            {loading ? "Submitting..." : "Submit Roast"}
          </Button>
        </div>
      </div>

      {/* Roast List */}
      {loadingRoasts ? (
        <div className="flex items-center justify-center py-12">
          <LoadingFire size="md" text="Loading roasts..." />
        </div>
      ) : roasts.length > 0 ? (
        <div className="space-y-4">
          {roasts.map((roast, index) => (
            <div
              key={roast.id}
              className="border border-border rounded-lg p-4 hover:border-orange-500/30 transition-colors bg-card/50"
            >
              <div className="flex gap-4">
                {/* Vote Section */}
                <div className="flex flex-col items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleVote(roast.id, "up")}
                    className={`p-1 h-8 w-8 ${roast.user_vote === "up" ? "text-orange-500 bg-orange-500/10" : "text-muted-foreground"}`}
                  >
                    <ArrowUp className="w-5 h-5" />
                  </Button>
                  <span className={`font-bold text-lg ${getScore(roast) > 0 ? 'text-orange-500' : getScore(roast) < 0 ? 'text-blue-500' : 'text-muted-foreground'}`}>
                    {getScore(roast)}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleVote(roast.id, "down")}
                    className={`p-1 h-8 w-8 ${roast.user_vote === "down" ? "text-blue-500 bg-blue-500/10" : "text-muted-foreground"}`}
                  >
                    <ArrowDown className="w-5 h-5" />
                  </Button>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  {/* Rank Badge for top 3 */}
                  {index < 3 && sortBy === 'top' && (
                    <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-orange-500/20 to-red-500/20 text-orange-500 text-xs mb-2">
                      <Award className="w-3 h-3" />
                      #{index + 1} Top Roast
                    </div>
                  )}

                  {/* User Info */}
                  <div className="flex items-center gap-2 mb-2">
                    <Avatar className="w-6 h-6">
                      <AvatarImage src={roast.profiles.avatar_url} />
                      <AvatarFallback>{roast.profiles.username[0]?.toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <span className="font-medium text-sm text-foreground">@{roast.profiles.username}</span>
                    <span className="text-xs text-muted-foreground">
                      • {roast.profiles.karma_points} logs
                    </span>
                    <span className="text-xs text-muted-foreground">
                      • {formatDistanceToNow(new Date(roast.created_at), { addSuffix: true })}
                    </span>
                  </div>

                  {/* Roast Text */}
                  <p className="text-foreground text-lg leading-relaxed">{roast.roast_text}</p>

                  {/* Comment Button */}
                  <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleComments(roast.id)}
                      className="text-muted-foreground hover:text-foreground gap-2"
                    >
                      <MessageCircle className="w-4 h-4" />
                      {roast.comment_count || 0} {roast.comment_count === 1 ? 'comment' : 'comments'}
                      {expandedComments.has(roast.id) ? (
                        <ChevronUp className="w-3 h-3" />
                      ) : (
                        <ChevronDown className="w-3 h-3" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setReplyingTo(replyingTo === roast.id ? null : roast.id);
                        if (!expandedComments.has(roast.id)) {
                          toggleComments(roast.id);
                        }
                      }}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      Reply
                    </Button>
                  </div>

                  {/* Comments Section */}
                  {expandedComments.has(roast.id) && (
                    <div className="mt-3 space-y-3">
                      {/* Reply Input */}
                      {(replyingTo === roast.id || (roast.comment_count || 0) === 0) && (
                        <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg">
                          <Avatar className="w-6 h-6 mt-1">
                            <AvatarFallback className="text-xs">
                              {user?.email?.[0]?.toUpperCase() || '?'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <Input
                              placeholder="Add a quick comment..."
                              value={replyingTo === roast.id ? replyText : ''}
                              onChange={(e) => {
                                setReplyingTo(roast.id);
                                setReplyText(e.target.value);
                              }}
                              onFocus={() => setReplyingTo(roast.id)}
                              className="bg-transparent border-border text-sm h-8"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                  e.preventDefault();
                                  handleSubmitComment(roast.id);
                                }
                              }}
                            />
                          </div>
                          <Button
                            size="sm"
                            onClick={() => handleSubmitComment(roast.id)}
                            disabled={submittingReply || !replyText.trim()}
                            className="h-8 px-3"
                          >
                            <Send className="w-3 h-3" />
                          </Button>
                        </div>
                      )}

                      {/* Existing Comments */}
                      {roast.comments && roast.comments.length > 0 && (
                        <div className="space-y-2 pl-2 border-l-2 border-border">
                          {roast.comments.map((comment) => (
                            <div key={comment.id} className="flex items-start gap-2 py-2">
                              <Avatar className="w-5 h-5">
                                <AvatarImage src={comment.profiles.avatar_url} />
                                <AvatarFallback className="text-xs">
                                  {comment.profiles.username[0]?.toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium text-foreground">
                                    @{comment.profiles.username}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                                  </span>
                                </div>
                                <p className="text-sm text-muted-foreground mt-0.5">{comment.comment_text}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Show reply button if comments exist but input is hidden */}
                      {replyingTo !== roast.id && (roast.comment_count || 0) > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setReplyingTo(roast.id)}
                          className="text-muted-foreground hover:text-foreground text-xs"
                        >
                          + Add a comment
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 border border-dashed border-border rounded-lg">
          <Flame className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground mb-2">No community roasts yet</p>
          <p className="text-sm text-muted-foreground">Be the first to roast this stack!</p>
        </div>
      )}
    </div>
  );
}
