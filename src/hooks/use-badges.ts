import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  tier: number;
}

interface UserBadge {
  id: string;
  awarded_at: string;
  isPinned: boolean;
  badge: Badge;
}

export function useBadges() {
  return useQuery({
    queryKey: ["badges"],
    queryFn: async () => {
      const response = await fetch("/api/badges");
      if (!response.ok) {
        throw new Error("Failed to fetch badges");
      }
      return response.json() as Promise<UserBadge[]>;
    },
    staleTime: 10 * 60 * 1000, // Badges stay fresh for 10 minutes
    gcTime: 15 * 60 * 1000, // Keep in cache for 15 minutes
  });
}

export function usePinBadge() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userBadgeId: string) => {
      const response = await fetch(`/api/badges/${userBadgeId}/pin`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to pin badge");
      }

      return response.json();
    },
    onMutate: async (userBadgeId) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["badges"] });

      // Snapshot the previous value
      const previousBadges = queryClient.getQueryData<UserBadge[]>(["badges"]);

      // Optimistically update
      queryClient.setQueryData<UserBadge[]>(["badges"], (old) =>
        old
          ? old.map((badge) => ({
              ...badge,
              isPinned: badge.id === userBadgeId,
            }))
          : []
      );

      return { previousBadges };
    },
    onError: (err, userBadgeId, context) => {
      // Rollback on error
      if (context?.previousBadges) {
        queryClient.setQueryData(["badges"], context.previousBadges);
      }
    },
    onSettled: () => {
      // Refetch to ensure sync
      queryClient.invalidateQueries({ queryKey: ["badges"] });
    },
  });
}

export function useUnpinBadge() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userBadgeId: string) => {
      const response = await fetch(`/api/badges/${userBadgeId}/pin`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to unpin badge");
      }

      return response.json();
    },
    onMutate: async (userBadgeId) => {
      await queryClient.cancelQueries({ queryKey: ["badges"] });

      const previousBadges = queryClient.getQueryData<UserBadge[]>(["badges"]);

      queryClient.setQueryData<UserBadge[]>(["badges"], (old) =>
        old
          ? old.map((badge) => ({
              ...badge,
              isPinned: false,
            }))
          : []
      );

      return { previousBadges };
    },
    onError: (err, userBadgeId, context) => {
      if (context?.previousBadges) {
        queryClient.setQueryData(["badges"], context.previousBadges);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["badges"] });
    },
  });
}
