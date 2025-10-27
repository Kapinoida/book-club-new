"use client";

import { Button } from "@/components/ui/button";
import { ThumbsUp, Lightbulb, HelpCircle, Heart } from "lucide-react";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

interface ReactionCounts {
  LIKE: { count: number; users: string[] };
  INSIGHTFUL: { count: number; users: string[] };
  HELPFUL: { count: number; users: string[] };
  THOUGHTFUL: { count: number; users: string[] };
}

interface ReactionsProps {
  commentId?: string;
  reviewId?: string;
}

const reactionConfig = {
  LIKE: {
    icon: ThumbsUp,
    label: "Like",
    color: "text-blue-500"
  },
  INSIGHTFUL: {
    icon: Lightbulb,
    label: "Insightful",
    color: "text-yellow-500"
  },
  HELPFUL: {
    icon: HelpCircle,
    label: "Helpful",
    color: "text-green-500"
  },
  THOUGHTFUL: {
    icon: Heart,
    label: "Thoughtful",
    color: "text-pink-500"
  }
};

export function Reactions({ commentId, reviewId }: ReactionsProps) {
  const { data: session } = useSession();
  const [reactions, setReactions] = useState<ReactionCounts>({
    LIKE: { count: 0, users: [] },
    INSIGHTFUL: { count: 0, users: [] },
    HELPFUL: { count: 0, users: [] },
    THOUGHTFUL: { count: 0, users: [] }
  });
  const [isLoading, setIsLoading] = useState(true);
  const [submitting, setSubmitting] = useState<string | null>(null);

  useEffect(() => {
    fetchReactions();
  }, [commentId, reviewId]);

  const fetchReactions = async () => {
    try {
      const params = new URLSearchParams();
      if (commentId) params.append("commentId", commentId);
      if (reviewId) params.append("reviewId", reviewId);

      const response = await fetch(`/api/reactions?${params}`);
      if (response.ok) {
        const data = await response.json();
        setReactions(data);
      }
    } catch (error) {
      console.error("Error fetching reactions:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReaction = async (type: keyof ReactionCounts) => {
    if (!session) {
      toast.error("Please sign in to react");
      return;
    }

    setSubmitting(type);
    try {
      const response = await fetch("/api/reactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          commentId,
          reviewId,
          type
        })
      });

      if (response.ok) {
        const data = await response.json();
        // Refetch reactions to update counts
        await fetchReactions();

        if (data.removed) {
          toast.success("Reaction removed");
        } else {
          toast.success("Reaction added!");
        }
      } else {
        toast.error("Failed to react");
      }
    } catch (error) {
      console.error("Error reacting:", error);
      toast.error("Failed to react");
    } finally {
      setSubmitting(null);
    }
  };

  const hasUserReacted = (type: keyof ReactionCounts) => {
    return reactions[type].users.includes(session?.user?.email || "");
  };

  if (isLoading) {
    return (
      <div className="flex gap-2">
        {Object.keys(reactionConfig).map((key) => (
          <div key={key} className="h-8 w-16 bg-muted animate-pulse rounded" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex gap-2 flex-wrap">
      {(Object.keys(reactionConfig) as Array<keyof ReactionCounts>).map((type) => {
        const config = reactionConfig[type];
        const Icon = config.icon;
        const count = reactions[type].count;
        const hasReacted = hasUserReacted(type);

        return (
          <Button
            key={type}
            variant={hasReacted ? "default" : "outline"}
            size="sm"
            onClick={() => handleReaction(type)}
            disabled={submitting === type}
            className={`gap-1 ${hasReacted ? config.color : ""}`}
          >
            <Icon className="h-3 w-3" />
            <span className="text-xs">{config.label}</span>
            {count > 0 && (
              <span className="text-xs font-semibold ml-1">
                {count}
              </span>
            )}
          </Button>
        );
      })}
    </div>
  );
}
