"use client";

import { useState, useEffect, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { addEventReview, addAdminEventReview } from "@/lib/queries";
import type { EventReview } from "@/lib/types";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, Send, User, Shield } from "lucide-react";

interface CommentsDialogProps {
  eventId: string;
  eventName: string;
  clubId: string;
  comments: EventReview[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userEmail?: string;
  isAdmin?: boolean;
}

export function CommentsDialog({
  eventId,
  eventName,
  clubId,
  comments: initialComments,
  open,
  onOpenChange,
  userEmail,
  isAdmin = false,
}: CommentsDialogProps) {
  const [newComment, setNewComment] = useState("");
  const [localComments, setLocalComments] =
    useState<EventReview[]>(initialComments);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Sync local comments when initialComments prop changes
  useEffect(() => {
    setLocalComments(initialComments);
  }, [initialComments]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [localComments]);

  const queryClient = useQueryClient();

  // Mutation for club comments
  const clubMutation = useMutation({
    mutationFn: addEventReview,
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["events", clubId] });
      setNewComment("");

      if (result && result.review) {
        setLocalComments((prev) => [...prev, result.review as EventReview]);
      }

      toast.success("Comment added successfully!");
    },
    onError: (err: Error) => {
      toast.error("Failed to add comment", {
        description: err.message || "Please try again later.",
      });
    },
  });

  // Mutation for admin comments
  const adminMutation = useMutation({
    mutationFn: addAdminEventReview,
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      setNewComment("");

      if (result && result.review) {
        setLocalComments((prev) => [...prev, result.review as EventReview]);
      }

      toast.success("Comment added successfully!");
    },
    onError: (err: Error) => {
      toast.error("Failed to add comment", {
        description: err.message || "Please try again later.",
      });
    },
  });

  const handleSubmit = () => {
    if (!newComment.trim()) {
      toast.error("Please enter a comment");
      return;
    }

    if (isAdmin && userEmail) {
      // Admin posting comment
      adminMutation.mutate({
        eventId,
        adminEmail: userEmail,
        comment: newComment.trim(),
      });
    } else {
      // Club posting comment
      clubMutation.mutate({
        eventId,
        clubId,
        comment: newComment.trim(),
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && e.ctrlKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const isPending = clubMutation.isPending || adminMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 shrink-0">
          <DialogTitle className="flex items-center gap-2">
            Chat
            {isAdmin && <Badge variant="default">Admin</Badge>}
          </DialogTitle>
          <DialogDescription>
            Discussion for <strong>{eventName}</strong>
          </DialogDescription>
        </DialogHeader>

        {/* Comments List - Native scrolling */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto px-6"
        >
          <div className="space-y-3 pb-4">
            {localComments.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No messages yet. Start the conversation!
              </p>
            ) : (
              localComments.map((comment) => (
                <CommentItem key={comment.id} comment={comment} />
              ))
            )}
          </div>
        </div>

        {/* Add Comment Section */}
        <div className="border-t px-6 py-4 shrink-0">
          <div className="flex gap-3 items-center">
            <div className="flex-1">
              <Textarea
                placeholder="Type your message here... (Ctrl+Enter to send)"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isPending}
                rows={2}
                className="resize-none"
              />
            </div>
            <Button
              type="button"
              size="icon"
              onClick={handleSubmit}
              disabled={isPending || !newComment.trim()}
              className="rounded-full h-10 w-10 shrink-0"
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface CommentItemProps {
  comment: EventReview;
}

function CommentItem({ comment }: CommentItemProps) {
  const isAdmin = !!comment.admin_id;
  const isSelf = !isAdmin;
  const authorName =
    comment.admin?.name || comment.club?.club_name || "Unknown";

  return (
    <div
      className={`p-3 rounded-lg border ${
        isSelf
          ? "bg-blue-500/10 border-blue-500/30 ml-0 mr-8" // Self (Club) - Blue
          : "bg-muted/50 border-muted ml-8 mr-0" // Others (Admin) - Gray
      }`}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <div
          className={`p-1 rounded-full ${
            isSelf ? "bg-blue-500/20" : "bg-muted"
          }`}
        >
          {isAdmin ? (
            <Shield className="w-3 h-3 text-muted-foreground" />
          ) : (
            <User className="w-3 h-3 text-blue-600 dark:text-blue-400" />
          )}
        </div>
        <span className="text-sm font-medium">{authorName}</span>
        <Badge
          variant={isAdmin ? "default" : "outline"}
          className="text-xs px-1.5 py-0"
        >
          {isAdmin ? "Admin" : "Club"}
        </Badge>
      </div>

      {/* Comment content */}
      <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
        {comment.comment}
      </p>

      {/* Timestamp */}
      <div className="text-xs text-muted-foreground mt-2">
        {new Date(comment.created_at).toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })}
      </div>
    </div>
  );
}
