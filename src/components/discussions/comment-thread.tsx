"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Reactions } from "@/components/reactions/reactions";
import { User, Clock, MessageCircle } from "lucide-react";
import { useState } from "react";

interface Author {
  name: string;
  email: string;
}

interface Comment {
  id: string;
  content: string;
  parentId: string | null;
  author: Author;
  created_at: string;
  replies: Comment[];
}

interface CommentThreadProps {
  comment: Comment;
  currentUserEmail?: string;
  onReply: (parentId: string, content: string) => Promise<void>;
  depth?: number;
}

export function CommentThread({
  comment,
  currentUserEmail,
  onReply,
  depth = 0
}: CommentThreadProps) {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const maxDepth = 3; // Maximum nesting level
  const canReply = depth < maxDepth;

  const handleReplySubmit = async () => {
    if (!replyContent.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onReply(comment.id, replyContent);
      setReplyContent("");
      setShowReplyForm(false);
    } catch (error) {
      console.error("Error submitting reply:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={depth > 0 ? "ml-8 mt-4" : ""}>
      <Card className={depth > 0 ? "border-l-2 border-l-primary/30" : ""}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                <User className="h-4 w-4" />
              </div>
              <div>
                <p className="font-medium">{comment.author.name}</p>
                <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>
                    {new Date(comment.created_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {currentUserEmail === comment.author.email && (
                <Button variant="ghost" size="sm">
                  Edit
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="leading-relaxed mb-4">{comment.content}</p>

          {/* Reactions */}
          <div className="mb-3">
            <Reactions commentId={comment.id} />
          </div>

          {canReply && (
            <div className="flex items-center gap-2">
              {!showReplyForm && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowReplyForm(true)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <MessageCircle className="h-3 w-3 mr-1" />
                  Reply
                </Button>
              )}
              {comment.replies.length > 0 && (
                <span className="text-sm text-muted-foreground">
                  {comment.replies.length} {comment.replies.length === 1 ? 'reply' : 'replies'}
                </span>
              )}
            </div>
          )}

          {showReplyForm && (
            <div className="mt-4 space-y-3 p-4 bg-muted/30 rounded-lg">
              <Textarea
                placeholder="Write your reply..."
                rows={3}
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                disabled={isSubmitting}
                className="bg-background"
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleReplySubmit}
                  disabled={!replyContent.trim() || isSubmitting}
                >
                  {isSubmitting ? "Posting..." : "Post Reply"}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setShowReplyForm(false);
                    setReplyContent("");
                  }}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Render nested replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="space-y-0">
          {comment.replies.map((reply) => (
            <CommentThread
              key={reply.id}
              comment={reply}
              currentUserEmail={currentUserEmail}
              onReply={onReply}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}
