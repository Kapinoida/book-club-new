import { useQuery } from "@tanstack/react-query";

interface AdminStats {
  totalBooks: number;
  totalUsers: number;
  totalComments: number;
  totalQuestions: number;
}

interface RecentBook {
  id: string;
  title: string;
  author: string;
  readMonth: string | null;
  status: string;
  created_at: string;
}

interface RecentComment {
  id: string;
  content: string;
  created_at: string;
  user: {
    name: string | null;
    username: string | null;
  };
  book: {
    title: string;
  };
}

interface AdminActivity {
  recentBooks: RecentBook[];
  recentComments: RecentComment[];
}

export function useAdminStats() {
  return useQuery({
    queryKey: ["admin", "stats"],
    queryFn: async () => {
      const response = await fetch("/api/admin/stats");
      if (!response.ok) {
        throw new Error("Failed to fetch admin stats");
      }
      return response.json() as Promise<AdminStats>;
    },
    staleTime: 2 * 60 * 1000, // Stats can be cached for 2 minutes
    gcTime: 5 * 60 * 1000,
  });
}

export function useAdminActivity() {
  return useQuery({
    queryKey: ["admin", "activity"],
    queryFn: async () => {
      const response = await fetch("/api/admin/activity");
      if (!response.ok) {
        throw new Error("Failed to fetch admin activity");
      }
      return response.json() as Promise<AdminActivity>;
    },
    staleTime: 1 * 60 * 1000, // Activity updates frequently
    gcTime: 3 * 60 * 1000,
  });
}
