import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { LoadingFire } from "@/components/LoadingFire";
import { 
  Flame, 
  RefreshCw, 
  Share2, 
  Download,
  ArrowUp, 
  ArrowDown, 
  MessageCircle,
  Send,
  Award,
  MessageSquare,
  Reply
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { generateRoast } from "@/lib/generateRoast";
import { BurnCardDialog } from "@/components/BurnCard";

interface AIRoast {
  roast_text: string;
  burn_score: number;
  persona: string;
}

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

interface Discussion {
  id: string;
  user_id: string;
  parent_id: string | null;
  message: string;
  upvotes: number;
  created_at: string;
  profiles: {
    username: string;
    avatar_url?: string;
  };
  replies?: Discussion[];
}

interface StackEngagementProps {
  stackId: string;
  stackSlug: string;
  stackName: string;
}

export function StackEngagement({ stackId, stackSlug, stackName }: StackEngagementProps) {
  const { user, refreshProfile } = useAuth();
  
  // AI Roast state
  const [aiRoast, setAiRoast] = useState<AIRoast | null>(null);
  const [loadingAiRoast, setLoadingAiRoast] = useState(true);
  const [generatingRoast, setGeneratingRoast] = useState(false);
  const [burnCardOpen, setBurnCardOpen] = useState(false);
  const [toolCount, setToolCount] = useState(0);
  const [username, setUsername] = useState("Anonymous");

  // Community roasts state
  const [roasts, setRoasts] = useState<CommunityRoast[]>([]);
  const [newRoast, setNewRoast] = useState("");
  const [loadingRoasts, setLoadingRoasts] = useState(true);
  const [submittingRoast, setSubmittingRoast] = useState(false);
  const [replyingToRoast, setReplyingToRoast] = useState<string | null>(null);
  const [roastReplyText, setRoastReplyText] = useState("");

  // Discussion state
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loadingDiscussions, setLoadingDiscussions] = useState(true);
  const [submittingMessage, setSubmittingMessage] = useState(false);
  const [replyingToDiscussion, setReplyingToDiscussion] = useState<string | null>(null);
  const [discussionReplyText, setDiscussionReplyText] = useState("");

  useEffect(() => {
    loadAllData();
  }, [stackId, user]);

  const loadAllData = async () => {
    await Promise.all([
      loadAiRoast(),
      loadRoasts(),
      loadDiscussions(),
      loadStackInfo(),
    ]);
  };

  const loadStackInfo = async () => {
    const { data: stack } = await supabase
      .from("stacks")
      .select("profile_id")
      .eq("id", stackId)
      .single();

    if (stack) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", stack.profile_id)
        .maybeSingle();
      setUsername(profile?.username || "Anonymous");
    }

    const { count } = await supabase
      .from("stack_items")
      .select("*", { count: "exact", head: true })
      .eq("stack_id", stackId);
    setToolCount(count || 0);
  };

  // ============ AI ROAST ============
  const loadAiRoast = async () => {
    setLoadingAiRoast(true);
    const { data } = await supabase
      .from("ai_roasts")
      .select("roast_text, burn_score, persona")
      .eq("stack_id", stackId)
      .maybeSingle();
    setAiRoast(data);
    setLoadingAiRoast(false);
  };

  const handleGenerateRoast = async () => {
    setGeneratingRoast(true);
    try {
      const { data: stack } = await supabase
        .from("stacks")
        .select("name")
        .eq("id", stackId)
        .single();

      if (!stack) {
        toast.error("Could not find stack");
        return;
      }

      const { data: stackItems } = await supabase
        .from("stack_items")
        .select(`tool:tools (name, category)`)
        .eq("stack_id", stackId);

      const tools = stackItems?.map((item: any) => item.tool).filter(Boolean) || [];
      
      if (tools.length === 0) {
        toast.error("No tools in this stack");
        return;
      }

      toast.info("Generating AI roast...");
      const { roastText, burnScore, persona } = await generateRoast(stack.name, tools);

      await supabase.from("ai_roasts").delete().eq("stack_id", stackId);
      await supabase.from("ai_roasts").insert({
        stack_id: stackId,
        roast_text: roastText,
        burn_score: burnScore,
        persona,
      });

      setAiRoast({ roast_text: roastText, burn_score: burnScore, persona });
      toast.success("AI roast generated! 🔥");
    } catch (error: any) {
      toast.error(error?.message || "Failed to generate roast");
    } finally {
      setGeneratingRoast(false);
    }
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/stack/${stackSlug}`;
    const text = aiRoast
      ? `🔥 "${stackName}" got a ${aiRoast.burn_score}/100 burn score!\n\n"${aiRoast.roast_text.substring(0, 100)}..."`
      : `Check out this tech stack!`;
    
    if (navigator.share) {
      try {
        await navigator.share({ title: 'StackRoast', text, url });
      } catch {}
    } else {
      navigator.clipboard.writeText(`${text}\n${url}`);
      toast.success("Link copied!");
    }
  };

  // ============ COMMUNITY ROASTS ============
  const loadRoasts = async () => {
    setLoadingRoasts(true);
    const { data } = await supabase
      .from("community_roasts")
      .select(`*, profiles:user_id (username, karma_points, avatar_url)`)
      .eq("stack_id", stackId)
      .order("upvotes", { ascending: false });

    if (data && user) {
      const { data: votes } = await supabase
        .from("roast_votes")
        .select("roast_id, vote_type")
        .eq("user_id", user.id)
        .in("roast_id", data.map(r => r.id));

      const voteMap = new Map(votes?.map(v => [v.roast_id, v.vote_type]));
      data.forEach(roast => {
        roast.user_vote = voteMap.get(roast.id) as "up" | "down" | null;
      });
    }

    // Get comment counts
    const roastsWithCounts = await Promise.all(
      (data || []).map(async (roast) => {
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

  const handleSubmitRoast = async () => {
    if (!user) {
      toast.error("Please sign in to roast");
      return;
    }
    if (!newRoast.trim() || newRoast.trim().length < 10) {
      toast.error("Roast must be at least 10 characters");
      return;
    }

    setSubmittingRoast(true);
    try {
      await supabase.from("community_roasts").insert({
        stack_id: stackId,
        user_id: user.id,
        roast_text: newRoast.trim(),
      });

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
      setSubmittingRoast(false);
    }
  };

  const handleVoteRoast = async (roastId: string, voteType: "up" | "down") => {
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

  const loadRoastComments = async (roastId: string) => {
    const { data } = await supabase
      .from("roast_comments")
      .select(`*, profiles:user_id (username, avatar_url)`)
      .eq("roast_id", roastId)
      .order("created_at", { ascending: true });

    setRoasts(prev => prev.map(r => 
      r.id === roastId ? { ...r, comments: data as RoastComment[] } : r
    ));
  };

  const handleSubmitRoastComment = async (roastId: string) => {
    if (!user || !roastReplyText.trim()) return;

    try {
      await supabase.from("roast_comments").insert({
        roast_id: roastId,
        user_id: user.id,
        comment_text: roastReplyText.trim(),
      });

      toast.success("Comment added! +1 log");
      setRoastReplyText("");
      setReplyingToRoast(null);
      loadRoastComments(roastId);
      
      setRoasts(prev => prev.map(r => 
        r.id === roastId ? { ...r, comment_count: (r.comment_count || 0) + 1 } : r
      ));
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  // ============ DISCUSSIONS ============
  const loadDiscussions = async () => {
    setLoadingDiscussions(true);
    const { data } = await supabase
      .from("discussions")
      .select(`*, profiles:user_id (username, avatar_url)`)
      .eq("stack_id", stackId)
      .is("parent_id", null)
      .order("created_at", { ascending: false });

    // Load replies
    for (const discussion of data || []) {
      const { data: replies } = await supabase
        .from("discussions")
        .select(`*, profiles:user_id (username, avatar_url)`)
        .eq("parent_id", discussion.id)
        .order("created_at", { ascending: true });
      discussion.replies = replies || [];
    }

    setDiscussions(data as any || []);
    setLoadingDiscussions(false);
  };

  const handleSubmitMessage = async () => {
    if (!user) {
      toast.error("Please sign in to post");
      return;
    }
    if (!newMessage.trim()) return;

    setSubmittingMessage(true);
    try {
      await supabase.from("discussions").insert({
        stack_id: stackId,
        user_id: user.id,
        parent_id: replyingToDiscussion,
        message: newMessage.trim(),
      });

      await supabase.rpc("award_karma", {
        user_uuid: user.id,
        points: 1,
      });

      // Refresh profile to update karma display
      await refreshProfile();

      toast.success("Posted! +1 log");
      setNewMessage("");
      setReplyingToDiscussion(null);
      setDiscussionReplyText("");
      loadDiscussions();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSubmittingMessage(false);
    }
  };

  const handleSubmitDiscussionReply = async (parentId: string) => {
    if (!user || !discussionReplyText.trim()) return;

    try {
      await supabase.from("discussions").insert({
        stack_id: stackId,
        user_id: user.id,
        parent_id: parentId,
        message: discussionReplyText.trim(),
      });

      toast.success("Reply posted! +1 log");
      setDiscussionReplyText("");
      setReplyingToDiscussion(null);
      loadDiscussions();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const getBurnColor = (score: number) => {
    if (score >= 80) return 'text-red-500';
    if (score >= 60) return 'text-orange-500';
    if (score >= 40) return 'text-yellow-500';
    return 'text-green-500';
  };

  const getBurnLabel = (score: number) => {
    if (score >= 80) return '🔥🔥🔥 SAVAGE';
    if (score >= 60) return '🔥🔥 SPICY';
    if (score >= 40) return '🔥 WARM';
    return '❄️ MILD';
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Column 1: AI Roast */}
      <div className="lg:col-span-1">
        <Card className="p-5 bg-gradient-to-br from-orange-500/10 via-red-500/5 to-transparent border-orange-500/30 sticky top-24">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-orange-400" />
              <h3 className="font-semibold">AI Roast</h3>
            </div>
            {aiRoast && (
              <div className="text-right">
                <div className={`text-3xl font-bold ${getBurnColor(aiRoast.burn_score)}`}>
                  {aiRoast.burn_score}
                </div>
                <div className="text-xs text-zinc-500">/100</div>
              </div>
            )}
          </div>

          {loadingAiRoast ? (
            <div className="flex justify-center py-4">
              <LoadingFire size="sm" />
            </div>
          ) : aiRoast ? (
            <div className="space-y-4">
              <div className="text-xs text-zinc-500">
                🤖 {aiRoast.persona} says:
              </div>
              <blockquote className="text-sm italic text-zinc-300 leading-relaxed border-l-2 border-orange-500/50 pl-3">
                "{aiRoast.roast_text}"
              </blockquote>
              
              <div className="flex items-center justify-between pt-2">
                <Badge variant="secondary" className={`text-xs ${getBurnColor(aiRoast.burn_score)}`}>
                  {getBurnLabel(aiRoast.burn_score)}
                </Badge>
              </div>

              <div className="flex gap-2 pt-2 border-t border-white/10">
                <Button size="sm" variant="ghost" onClick={handleShare} className="flex-1 text-xs">
                  <Share2 className="w-3 h-3 mr-1" />
                  Share
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setBurnCardOpen(true)} className="flex-1 text-xs">
                  <Download className="w-3 h-3 mr-1" />
                  Card
                </Button>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={handleGenerateRoast} 
                  disabled={generatingRoast}
                  className="text-xs"
                >
                  <RefreshCw className={`w-3 h-3 ${generatingRoast ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-6">
              <Flame className="w-10 h-10 mx-auto mb-3 text-zinc-700" />
              <p className="text-sm text-zinc-500 mb-3">No AI roast yet</p>
              <Button size="sm" onClick={handleGenerateRoast} disabled={generatingRoast}>
                <Flame className="w-4 h-4 mr-2" />
                {generatingRoast ? 'Generating...' : 'Generate Roast'}
              </Button>
            </div>
          )}
        </Card>

        {/* Burn Card Dialog */}
        {aiRoast && (
          <BurnCardDialog
            open={burnCardOpen}
            onOpenChange={setBurnCardOpen}
            stackName={stackName}
            burnScore={aiRoast.burn_score}
            roastText={aiRoast.roast_text}
            persona={aiRoast.persona}
            username={username}
            toolCount={toolCount}
            stackSlug={stackSlug}
          />
        )}
      </div>

      {/* Column 2: Community Roasts */}
      <div className="lg:col-span-1">
        <Card className="p-5 bg-surface/50 border-white/10">
          <div className="flex items-center gap-2 mb-4">
            <Flame className="w-5 h-5 text-orange-400" />
            <h3 className="font-semibold">Community Roasts</h3>
            <span className="text-xs text-zinc-500">({roasts.length})</span>
          </div>

          {/* Submit Roast */}
          <div className="mb-4">
            <Textarea
              placeholder="Drop your roast... 🔥"
              value={newRoast}
              onChange={(e) => setNewRoast(e.target.value)}
              rows={2}
              className="resize-none mb-2 text-sm bg-transparent border-zinc-700"
            />
            <Button 
              size="sm" 
              onClick={handleSubmitRoast} 
              disabled={submittingRoast || !newRoast.trim()}
              className="w-full"
            >
              <Flame className="w-3 h-3 mr-2" />
              {submittingRoast ? "Posting..." : "Submit Roast"}
            </Button>
          </div>

          {/* Roasts List */}
          <div className="space-y-3 max-h-[500px] overflow-y-auto">
            {loadingRoasts ? (
              <div className="flex justify-center py-4">
                <LoadingFire size="sm" />
              </div>
            ) : roasts.length > 0 ? (
              roasts.map((roast, idx) => (
                <div key={roast.id} className="p-3 bg-zinc-900/50 rounded-lg border border-zinc-800/50">
                  {idx < 3 && (
                    <Badge variant="secondary" className="text-xs mb-2 bg-orange-500/10 text-orange-400">
                      <Award className="w-3 h-3 mr-1" />
                      #{idx + 1}
                    </Badge>
                  )}
                  
                  <div className="flex items-start gap-2 mb-2">
                    <Avatar className="w-5 h-5">
                      <AvatarImage src={roast.profiles.avatar_url} />
                      <AvatarFallback className="text-xs">{roast.profiles.username[0]?.toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <span className="text-xs font-medium">@{roast.profiles.username}</span>
                      <span className="text-xs text-zinc-600 ml-2">
                        {formatDistanceToNow(new Date(roast.created_at), { addSuffix: true })}
                      </span>
                    </div>
                  </div>

                  <p className="text-sm text-zinc-300 mb-2">{roast.roast_text}</p>

                  <div className="flex items-center gap-3 text-xs">
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleVoteRoast(roast.id, "up")}
                        className={`h-6 w-6 p-0 ${roast.user_vote === "up" ? "text-orange-400" : "text-zinc-500"}`}
                      >
                        <ArrowUp className="w-3 h-3" />
                      </Button>
                      <span className={(roast.upvotes ?? 0) - (roast.downvotes ?? 0) > 0 ? 'text-orange-400' : 'text-zinc-500'}>
                        {(roast.upvotes ?? 0) - (roast.downvotes ?? 0)}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleVoteRoast(roast.id, "down")}
                        className={`h-6 w-6 p-0 ${roast.user_vote === "down" ? "text-blue-400" : "text-zinc-500"}`}
                      >
                        <ArrowDown className="w-3 h-3" />
                      </Button>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (replyingToRoast === roast.id) {
                          setReplyingToRoast(null);
                        } else {
                          setReplyingToRoast(roast.id);
                          if (!roast.comments) loadRoastComments(roast.id);
                        }
                      }}
                      className="h-6 px-2 text-zinc-500 hover:text-zinc-300"
                    >
                      <MessageCircle className="w-3 h-3 mr-1" />
                      {roast.comment_count || 0}
                    </Button>
                  </div>

                  {/* Comments */}
                  {replyingToRoast === roast.id && (
                    <div className="mt-3 pt-3 border-t border-zinc-800/50 space-y-2">
                      {roast.comments?.map((comment) => (
                        <div key={comment.id} className="flex items-start gap-2 pl-2 border-l border-zinc-700">
                          <Avatar className="w-4 h-4">
                            <AvatarFallback className="text-[10px]">{comment.profiles.username[0]?.toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <span className="text-xs font-medium text-zinc-400">@{comment.profiles.username}</span>
                            <p className="text-xs text-zinc-500">{comment.comment_text}</p>
                          </div>
                        </div>
                      ))}
                      
                      <div className="flex gap-2">
                        <Input
                          placeholder="Add comment..."
                          value={roastReplyText}
                          onChange={(e) => setRoastReplyText(e.target.value)}
                          className="h-7 text-xs bg-transparent border-zinc-700"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSubmitRoastComment(roast.id);
                          }}
                        />
                        <Button size="sm" className="h-7 px-2" onClick={() => handleSubmitRoastComment(roast.id)}>
                          <Send className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-6 text-zinc-500 text-sm">
                No roasts yet. Be the first!
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Column 3: Discussion */}
      <div className="lg:col-span-1">
        <Card className="p-5 bg-surface/50 border-white/10">
          <div className="flex items-center gap-2 mb-4">
            <MessageSquare className="w-5 h-5 text-blue-400" />
            <h3 className="font-semibold">Discussion</h3>
            <span className="text-xs text-zinc-500">
              ({discussions.reduce((acc, d) => acc + 1 + (d.replies?.length || 0), 0)})
            </span>
          </div>

          {/* New Message */}
          <div className="mb-4">
            <Textarea
              placeholder="Share your thoughts..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              rows={2}
              className="resize-none mb-2 text-sm bg-transparent border-zinc-700"
            />
            <Button 
              size="sm" 
              onClick={handleSubmitMessage} 
              disabled={submittingMessage || !newMessage.trim()}
              className="w-full"
            >
              <MessageSquare className="w-3 h-3 mr-2" />
              {submittingMessage ? "Posting..." : "Post"}
            </Button>
          </div>

          {/* Discussion List */}
          <div className="space-y-3 max-h-[500px] overflow-y-auto">
            {loadingDiscussions ? (
              <div className="flex justify-center py-4">
                <LoadingFire size="sm" />
              </div>
            ) : discussions.length > 0 ? (
              discussions.map((discussion) => (
                <div key={discussion.id} className="p-3 bg-zinc-900/50 rounded-lg border border-zinc-800/50">
                  <div className="flex items-start gap-2 mb-2">
                    <Avatar className="w-5 h-5">
                      <AvatarImage src={discussion.profiles.avatar_url} />
                      <AvatarFallback className="text-xs">{discussion.profiles.username[0]?.toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <span className="text-xs font-medium">@{discussion.profiles.username}</span>
                      <span className="text-xs text-zinc-600 ml-2">
                        {formatDistanceToNow(new Date(discussion.created_at), { addSuffix: true })}
                      </span>
                    </div>
                  </div>

                  <p className="text-sm text-zinc-300 mb-2">{discussion.message}</p>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setReplyingToDiscussion(replyingToDiscussion === discussion.id ? null : discussion.id);
                      }}
                      className="h-6 px-2 text-xs text-zinc-500 hover:text-zinc-300"
                    >
                      <Reply className="w-3 h-3 mr-1" />
                      Reply
                    </Button>
                    {discussion.replies && discussion.replies.length > 0 && (
                      <span className="text-xs text-zinc-600">
                        {discussion.replies.length} {discussion.replies.length === 1 ? 'reply' : 'replies'}
                      </span>
                    )}
                  </div>

                  {/* Replies */}
                  {discussion.replies && discussion.replies.length > 0 && (
                    <div className="mt-3 pl-3 border-l border-zinc-800 space-y-2">
                      {discussion.replies.map((reply) => (
                        <div key={reply.id} className="py-2">
                          <div className="flex items-center gap-2 mb-1">
                            <Avatar className="w-4 h-4">
                              <AvatarFallback className="text-[10px]">{reply.profiles.username[0]?.toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <span className="text-xs font-medium text-zinc-400">@{reply.profiles.username}</span>
                            <span className="text-xs text-zinc-600">
                              {formatDistanceToNow(new Date(reply.created_at), { addSuffix: true })}
                            </span>
                          </div>
                          <p className="text-xs text-zinc-400 pl-6">{reply.message}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Reply Input */}
                  {replyingToDiscussion === discussion.id && (
                    <div className="mt-3 pt-3 border-t border-zinc-800/50 flex gap-2">
                      <Input
                        placeholder="Write a reply..."
                        value={discussionReplyText}
                        onChange={(e) => setDiscussionReplyText(e.target.value)}
                        className="h-7 text-xs bg-transparent border-zinc-700"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSubmitDiscussionReply(discussion.id);
                        }}
                      />
                      <Button size="sm" className="h-7 px-2" onClick={() => handleSubmitDiscussionReply(discussion.id)}>
                        <Send className="w-3 h-3" />
                      </Button>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-6 text-zinc-500 text-sm">
                No discussion yet. Start the conversation!
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
