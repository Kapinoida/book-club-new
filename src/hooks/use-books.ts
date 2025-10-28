import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface Book {
  id: string;
  title: string;
  author: string;
  coverImage: string | null;
  description: string | null;
  readMonth: string | null;
  status: string;
}

interface BookWithDiscussions extends Book {
  discussions: {
    id: string;
    question: string;
    breakpoint: number;
    responseCount: number;
  }[];
}

export function useBook(bookId: string, enabled: boolean = true) {
  return useQuery({
    queryKey: ["book", bookId],
    queryFn: async () => {
      const response = await fetch(`/api/books/${bookId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch book");
      }
      return response.json() as Promise<BookWithDiscussions>;
    },
    staleTime: 5 * 60 * 1000, // Books don't change often
    gcTime: 10 * 60 * 1000,
    enabled,
  });
}

export function useCurrentBook() {
  return useQuery({
    queryKey: ["book", "current"],
    queryFn: async () => {
      const response = await fetch("/api/books/current");
      if (!response.ok) {
        throw new Error("Failed to fetch current book");
      }
      return response.json() as Promise<Book>;
    },
    staleTime: 2 * 60 * 1000, // Current book might change
    gcTime: 5 * 60 * 1000,
  });
}

interface ReadingProgress {
  progress: number;
  isFinished: boolean;
  unlockedDiscussions: string[];
}

export function useReadingProgress(bookId: string, enabled: boolean = true) {
  return useQuery({
    queryKey: ["reading-progress", bookId],
    queryFn: async () => {
      const response = await fetch(`/api/books/${bookId}/progress`);
      if (!response.ok) {
        throw new Error("Failed to fetch reading progress");
      }
      return response.json() as Promise<ReadingProgress>;
    },
    staleTime: 1 * 60 * 1000, // Progress changes frequently
    gcTime: 5 * 60 * 1000,
    enabled,
  });
}

export function useUpdateReadingProgress(bookId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (progress: number) => {
      const response = await fetch(`/api/books/${bookId}/progress`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ progress }),
      });

      if (!response.ok) {
        throw new Error("Failed to update reading progress");
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate reading progress and profile (for stats update)
      queryClient.invalidateQueries({ queryKey: ["reading-progress", bookId] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
  });
}

interface Review {
  id: string;
  rating: number;
  review: string | null;
  created_at: string;
  user: {
    id: string;
    name: string | null;
    image: string | null;
  };
}

interface ReviewsResponse {
  reviews: Review[];
  averageRating: number;
  totalReviews: number;
}

export function useBookReviews(bookId: string) {
  return useQuery({
    queryKey: ["book-reviews", bookId],
    queryFn: async () => {
      const response = await fetch(`/api/books/${bookId}/reviews`);
      if (!response.ok) {
        throw new Error("Failed to fetch reviews");
      }
      return response.json() as Promise<ReviewsResponse>;
    },
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
}

export function useSubmitReview(bookId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { rating: number; review?: string }) => {
      const response = await fetch(`/api/books/${bookId}/reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to submit review");
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate reviews and profile stats
      queryClient.invalidateQueries({ queryKey: ["book-reviews", bookId] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
  });
}
