import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface ProfileData {
  user: {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
    username: string | null;
    bio: string | null;
    favoriteGenres: string | null;
    location: string | null;
    website: string | null;
    created_at: string;
  };
  stats: {
    booksStarted: number;
    booksFinished: number;
    reviewsWritten: number;
    commentsPosted: number;
    currentStreak: number;
    longestStreak: number;
  };
  currentBooks: any[];
  finishedBooks: any[];
  reviews: any[];
  recentComments: any[];
}

export function useProfile(enabled: boolean = true) {
  return useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const response = await fetch("/api/profile");
      if (!response.ok) {
        throw new Error("Failed to fetch profile");
      }
      return response.json() as Promise<ProfileData>;
    },
    staleTime: 10 * 60 * 1000, // Profile data stays fresh for 10 minutes
    gcTime: 15 * 60 * 1000, // Keep in cache for 15 minutes
    enabled, // Only fetch when enabled
  });
}

interface UpdateProfileData {
  name?: string;
  username?: string;
  bio?: string | null;
  favoriteGenres?: string | null;
  location?: string | null;
  website?: string | null;
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateProfileData) => {
      const response = await fetch("/api/profile/edit", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update profile");
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate and refetch profile data
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
  });
}
