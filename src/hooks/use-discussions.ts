import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface Comment {
  id: string;
  content: string;
  parentId: string | null;
  author: {
    name: string;
    email: string;
    pinnedBadge?: {
      icon: string;
      name: string;
      color: string;
    } | null;
  };
  created_at: string;
  replies: Comment[];
}

export function useDiscussionResponses(discussionId: string, enabled: boolean = true) {
  return useQuery({
    queryKey: ["discussion-responses", discussionId],
    queryFn: async () => {
      const response = await fetch(`/api/discussions/${discussionId}/responses`);
      if (!response.ok) {
        throw new Error("Failed to fetch responses");
      }
      return response.json() as Promise<Comment[]>;
    },
    staleTime: 1 * 60 * 1000, // Comments change frequently
    gcTime: 3 * 60 * 1000,
    enabled,
  });
}

export function usePostComment(discussionId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { content: string; parentId?: string }) => {
      const response = await fetch(`/api/discussions/${discussionId}/responses`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to post comment");
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate discussion responses and profile stats
      queryClient.invalidateQueries({ queryKey: ["discussion-responses", discussionId] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      queryClient.invalidateQueries({ queryKey: ["badges"] }); // Comments can earn badges
    },
  });
}

export function useUpdateComment(commentId: string, discussionId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (content: string) => {
      const response = await fetch(`/api/comments/${commentId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content }),
      });

      if (!response.ok) {
        throw new Error("Failed to update comment");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["discussion-responses", discussionId] });
    },
  });
}
