import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { MessageSquare, ArrowUp, ArrowDown, Reply } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Discussion {
  id: string;
  user_id: string;
  parent_id: string | null;
  message: string;
  upvotes: number;
  is_ai_generated: boolean;
  created_at: string;
  profiles: {
    username: string;
    karma_points: number;
  };
  user_vote?: "up" | "down" | null;
  replies?: Discussion[];
}

interface DiscussionSectionProps {
  stackId: string;
}

export function DiscussionSection({ stackId }: DiscussionSectionProps) {
  const { user, profile } = useAuth();
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadDiscussions();
  }, [stackId, user]);

  const loadDiscussions = async () => {
    const { data, error } = await supabase
      .from("discussions")
      .select(`
        *,
        profiles:user_id (username, karma_points)
      `)
      .eq("stack_id", stackId)
      .is("parent_id", null)
      .order("upvotes", { ascending: false });

    if (error) {
      console.error("Error loading discussions:", error);
      return;
    }

    // Load votes for current user
    if (user) {
      const { data: votes } = await supabase
        .from("discussion_votes")
        .select("discussion_id, vote_type")
        .eq("user_id", user.id)
        .in(
          "discussion_id",
          data.map((d) => d.id)
        );

      const voteMap = new Map(votes?.map((v) => [v.discussion_id, v.vote_type]));
      
      data.forEach((discussion) => {
        discussion.user_vote = voteMap.get(discussion.id) as "up" | "down" | null;
      });
    }

    // Load replies for each discussion
    for (const discussion of data) {
      const { data: replies } = await supabase
        .from("discussions")
        .select(`
          *,
          profiles:user_id (username, karma_points)
        `)
        .eq("parent_id", discussion.id)
        .order("created_at", { ascending: true });

      discussion.replies = replies || [];
    }

    setDiscussions(data as any);
  };

  const handleSubmit = async () => {
    if (!user) {
      toast.error("Please sign in to join the discussion");
      return;
    }

    if (!newMessage.trim()) {
      toast.error("Message cannot be empty");
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.from("discussions").insert({
        stack_id: stackId,
        user_id: user.id,
        parent_id: replyingTo,
        message: newMessage.trim(),
      });

      if (error) throw error;

      // Award karma for posting (+1)
      await supabase.rpc("award_karma", {
        p_user_id: user.id,
        p_points: 1,
        p_action_type: "discussion_post",
        p_reference_id: stackId,
      });

      toast.success("Message posted! +1 log");
      setNewMessage("");
      setReplyingTo(null);
      loadDiscussions();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (discussionId: string, voteType: "up" | "down") => {
    if (!user) {
      toast.error("Please sign in to vote");
      return;
    }

    try {
      await supabase.rpc("handle_discussion_vote", {
        p_discussion_id: discussionId,
        p_user_id: user.id,
        p_vote_type: voteType,
      });

      loadDiscussions();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <MessageSquare className="w-5 h-5" />
        <h2 className="text-2xl font-bold">
          Discussion ({discussions.reduce((acc, d) => acc + 1 + (d.replies?.length || 0), 0)})
        </h2>
      </div>

      {/* Message Input */}
      <div className="space-y-3">
        <Textarea
          placeholder={replyingTo ? "Write your reply..." : "Share your thoughts..."}
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          rows={3}
          className="resize-none"
        />
        <div className="flex justify-between items-center">
          {replyingTo && (
            <Button variant="ghost" size="sm" onClick={() => setReplyingTo(null)}>
              Cancel Reply
            </Button>
          )}
          <Button onClick={handleSubmit} disabled={loading} className="ml-auto">
            {loading ? "Posting..." : "Send"}
          </Button>
        </div>
      </div>

      {/* Discussion List */}
      <div className="space-y-4">
        {discussions.map((discussion) => (
          <DiscussionMessage
            key={discussion.id}
            discussion={discussion}
            onVote={handleVote}
            onReply={(id) => setReplyingTo(id)}
            currentUserId={user?.id}
          />
        ))}

        {discussions.length === 0 && (
          <div className="text-center py-12 text-zinc-500">
            <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No messages yet. Start the conversation!</p>
          </div>
        )}
      </div>
    </div>
  );
}

// Individual Discussion Message Component
function DiscussionMessage({
  discussion,
  onVote,
  onReply,
  currentUserId,
}: {
  discussion: Discussion;
  onVote: (id: string, type: "up" | "down") => void;
  onReply: (id: string) => void;
  currentUserId?: string;
}) {
  return (
    <div className="border border-zinc-800 rounded-lg p-4 space-y-3">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <span className="font-semibold">@{discussion.profiles.username}</span>
          <span className="text-sm text-zinc-500">
            {formatDistanceToNow(new Date(discussion.created_at), { addSuffix: true })}
          </span>
          {discussion.is_ai_generated && (
            <span className="text-xs px-2 py-0.5 bg-orange-500/20 text-orange-400 rounded-full">
              AI
            </span>
          )}
        </div>

        {/* Vote Buttons */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onVote(discussion.id, "up")}
            className={discussion.user_vote === "up" ? "text-orange-400" : ""}
          >
            <ArrowUp className="w-4 h-4" />
          </Button>
          <span className="font-semibold min-w-8 text-center">{discussion.upvotes}</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onVote(discussion.id, "down")}
            className={discussion.user_vote === "down" ? "text-blue-400" : ""}
          >
            <ArrowDown className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Message */}
      <p className="text-zinc-300">{discussion.message}</p>

      {/* Reply Button */}
      <div className="flex items-center gap-4 text-sm">
        <Button variant="ghost" size="sm" onClick={() => onReply(discussion.id)}>
          <Reply className="w-3 h-3 mr-1" />
          Reply
        </Button>
        {discussion.replies && discussion.replies.length > 0 && (
          <span className="text-zinc-500">
            {discussion.replies.length} {discussion.replies.length === 1 ? "reply" : "replies"}
          </span>
        )}
      </div>

      {/* Replies */}
      {discussion.replies && discussion.replies.length > 0 && (
        <div className="ml-8 space-y-3 mt-4 border-l-2 border-zinc-800 pl-4">
          {discussion.replies.map((reply) => (
            <DiscussionMessage
              key={reply.id}
              discussion={reply}
              onVote={onVote}
              onReply={onReply}
              currentUserId={currentUserId}
            />
          ))}
        </div>
      )}
    </div>
  );
}