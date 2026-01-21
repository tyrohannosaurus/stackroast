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

interface RoastComment {
  id: string;
  roast_id: string;
  user_id: string;
  comment_text: string;
  created_at: string;
  profiles: {
    username: string;
    avatar_url?: string;
  };
}

interface CommunityRoast {
  id: string;
  user_id: string;
  roast_text: string;
  upvotes: number;
  downvotes: number;
  created_at: string;
  profiles: {
    username: string;
    karma_points: number;
    avatar_url?: string;
  };
  user_vote?: "up" | "down" | null;
  comments?: RoastComment[];
  comment_count?: number;
}

interface CommunityRoastsTabProps {
  stackId: string;
}

export function CommunityRoastsTab({ stackId }: CommunityRoastsTabProps) {
  const { user } = useAuth();
  const [roasts, setRoasts] = useState<CommunityRoast[]>([]);
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
    const query = supabase
      .from("community_roasts")
      .select(`
        *,
        profiles:user_id (username, karma_points, avatar_url)
      `)
      .eq("stack_id", stackId);

    if (sortBy === 'top') {
      query.order("upvotes", { ascending: false });
    } else {
      query.order("created_at", { ascending: false });
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error loading roasts:", error);
      setLoadingRoasts(false);
      return;
    }

    if (user && data.length > 0) {
      const { data: votes } = await supabase
        .from("roast_votes")
        .select("roast_id, vote_type")
        .eq("user_id", user.id)
        .in("roast_id", data.map((r) => r.id));

      const voteMap = new Map(votes?.map((v) => [v.roast_id, v.vote_type]));
      data.forEach((roast) => {
        roast.user_vote = voteMap.get(roast.id) as "up" | "down" | null;
      });
    }

    // Get comment counts for each roast
    const roastsWithCounts = await Promise.all(
      data.map(async (roast) => {
        const { count } = await supabase
          .from("roast_comments")
          .select("*", { count: "exact", head: true })
          .eq("roast_id", roast.id);
        return { ...roast, comment_count: count || 0 };
      })
    );

    setRoasts(roastsWithCounts as any);
    setLoadingRoasts(false);
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
        ? { ...roast, comments: data as RoastComment[] }
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
        p_user_id: user.id,
        p_points: 1,
        p_action_type: "comment_submit",
        p_reference_id: roastId,
      });

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
        p_user_id: user.id,
        p_points: 2,
        p_action_type: "roast_submit",
        p_reference_id: stackId,
      });

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

  const getScore = (roast: CommunityRoast) => roast.upvotes - roast.downvotes;

  return (
    <div className="space-y-6">
      {/* Header with Sort */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Flame className="w-5 h-5 text-orange-400" />
          <h3 className="text-xl font-bold">Community Roasts</h3>
          <span className="text-sm text-zinc-500">({roasts.length})</span>
        </div>

        <div className="flex items-center gap-1 bg-zinc-900 rounded-lg p-1">
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
      <div className="border border-zinc-800 rounded-lg p-4 bg-zinc-900/50">
        <Textarea
          placeholder="Drop your roast here... 🔥 Be creative, be savage!"
          value={newRoast}
          onChange={(e) => setNewRoast(e.target.value)}
          rows={3}
          className="resize-none mb-3 bg-transparent border-zinc-700"
        />
        <div className="flex items-center justify-between">
          <span className="text-xs text-zinc-500">
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
              className="border border-zinc-800 rounded-lg p-4 hover:border-orange-500/30 transition-colors bg-zinc-900/30"
            >
              <div className="flex gap-4">
                {/* Vote Section */}
                <div className="flex flex-col items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleVote(roast.id, "up")}
                    className={`p-1 h-8 w-8 ${roast.user_vote === "up" ? "text-orange-400 bg-orange-400/10" : "text-zinc-500"}`}
                  >
                    <ArrowUp className="w-5 h-5" />
                  </Button>
                  <span className={`font-bold text-lg ${getScore(roast) > 0 ? 'text-orange-400' : getScore(roast) < 0 ? 'text-blue-400' : 'text-zinc-500'}`}>
                    {getScore(roast)}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleVote(roast.id, "down")}
                    className={`p-1 h-8 w-8 ${roast.user_vote === "down" ? "text-blue-400 bg-blue-400/10" : "text-zinc-500"}`}
                  >
                    <ArrowDown className="w-5 h-5" />
                  </Button>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  {/* Rank Badge for top 3 */}
                  {index < 3 && sortBy === 'top' && (
                    <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-orange-500/20 to-red-500/20 text-orange-400 text-xs mb-2">
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
                    <span className="font-medium text-sm">@{roast.profiles.username}</span>
                    <span className="text-xs text-zinc-500">
                      • {roast.profiles.karma_points} logs
                    </span>
                    <span className="text-xs text-zinc-600">
                      • {formatDistanceToNow(new Date(roast.created_at), { addSuffix: true })}
                    </span>
                  </div>

                  {/* Roast Text */}
                  <p className="text-zinc-200 text-lg leading-relaxed">{roast.roast_text}</p>

                  {/* Comment Button */}
                  <div className="flex items-center gap-4 mt-3 pt-3 border-t border-zinc-800/50">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleComments(roast.id)}
                      className="text-zinc-500 hover:text-zinc-300 gap-2"
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
                      className="text-zinc-500 hover:text-zinc-300"
                    >
                      Reply
                    </Button>
                  </div>

                  {/* Comments Section */}
                  {expandedComments.has(roast.id) && (
                    <div className="mt-3 space-y-3">
                      {/* Reply Input */}
                      {(replyingTo === roast.id || (roast.comment_count || 0) === 0) && (
                        <div className="flex items-start gap-2 p-3 bg-zinc-800/30 rounded-lg">
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
                              className="bg-transparent border-zinc-700 text-sm h-8"
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
                        <div className="space-y-2 pl-2 border-l-2 border-zinc-800">
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
                                  <span className="text-sm font-medium text-zinc-300">
                                    @{comment.profiles.username}
                                  </span>
                                  <span className="text-xs text-zinc-600">
                                    {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                                  </span>
                                </div>
                                <p className="text-sm text-zinc-400 mt-0.5">{comment.comment_text}</p>
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
                          className="text-zinc-500 hover:text-zinc-300 text-xs"
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
        <div className="text-center py-12 border border-dashed border-zinc-800 rounded-lg">
          <Flame className="w-12 h-12 mx-auto mb-4 text-zinc-700" />
          <p className="text-zinc-500 mb-2">No community roasts yet</p>
          <p className="text-sm text-zinc-600">Be the first to roast this stack!</p>
        </div>
      )}
    </div>
  );
}
