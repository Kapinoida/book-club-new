import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface Poll {
  id: string;
  title: string;
  description: string | null;
  startDate: string;
  endDate: string;
  forMonth: string;
  isActive: boolean;
  candidates: {
    id: string;
    bookId: string;
    voteCount: number;
    rank: number | null;
    book: {
      id: string;
      title: string;
      author: string;
      coverImage: string | null;
      description: string | null;
    };
  }[];
  votes?: {
    bookId: string;
  }[];
  _count: {
    votes: number;
  };
}

export function useActivePolls() {
  return useQuery({
    queryKey: ["polls", "active"],
    queryFn: async () => {
      const response = await fetch("/api/polls");
      if (!response.ok) {
        throw new Error("Failed to fetch polls");
      }
      return response.json() as Promise<Poll[]>;
    },
    staleTime: 2 * 60 * 1000, // Polls change occasionally
    gcTime: 5 * 60 * 1000,
  });
}

export function usePoll(pollId: string, enabled: boolean = true) {
  return useQuery({
    queryKey: ["poll", pollId],
    queryFn: async () => {
      const response = await fetch(`/api/polls/${pollId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch poll");
      }
      return response.json() as Promise<Poll>;
    },
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    enabled,
  });
}

export function useVote(pollId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (bookId: string) => {
      const response = await fetch(`/api/polls/${pollId}/vote`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ bookId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to submit vote");
      }

      return response.json();
    },
    onMutate: async (bookId) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["poll", pollId] });

      // Snapshot previous value
      const previousPoll = queryClient.getQueryData<Poll>(["poll", pollId]);

      // Optimistically update vote
      queryClient.setQueryData<Poll>(["poll", pollId], (old) => {
        if (!old) return old;
        const previousVote = old.votes?.[0]?.bookId;
        return {
          ...old,
          votes: [{ bookId }],
          candidates: old.candidates.map((candidate) => ({
            ...candidate,
            voteCount:
              candidate.bookId === bookId
                ? candidate.voteCount + 1
                : previousVote === candidate.bookId
                ? candidate.voteCount - 1
                : candidate.voteCount,
          })),
        };
      });

      return { previousPoll };
    },
    onError: (err, bookId, context) => {
      // Rollback on error
      if (context?.previousPoll) {
        queryClient.setQueryData(["poll", pollId], context.previousPoll);
      }
    },
    onSettled: () => {
      // Refetch to ensure sync
      queryClient.invalidateQueries({ queryKey: ["poll", pollId] });
      queryClient.invalidateQueries({ queryKey: ["polls", "active"] });
    },
  });
}
