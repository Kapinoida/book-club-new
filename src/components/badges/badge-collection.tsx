"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BadgeDisplay } from "./badge-display";
import { Trophy } from "lucide-react";
import { toast } from "sonner";

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

export function BadgeCollection() {
  const [badges, setBadges] = useState<UserBadge[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchBadges();
  }, []);

  const fetchBadges = async () => {
    try {
      const response = await fetch("/api/badges");
      if (response.ok) {
        const data = await response.json();
        setBadges(data);
      }
    } catch (error) {
      console.error("Error fetching badges:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePinBadge = async (userBadgeId: string) => {
    try {
      const response = await fetch(`/api/badges/${userBadgeId}/pin`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to pin badge");
      }

      // Update local state
      setBadges((prev) =>
        prev.map((ub) => ({
          ...ub,
          isPinned: ub.id === userBadgeId,
        }))
      );

      toast.success("Badge pinned! It will appear on your comments and discussions.");
    } catch (error) {
      console.error("Error pinning badge:", error);
      toast.error("Failed to pin badge");
    }
  };

  const handleUnpinBadge = async (userBadgeId: string) => {
    try {
      const response = await fetch(`/api/badges/${userBadgeId}/pin`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to unpin badge");
      }

      // Update local state
      setBadges((prev) =>
        prev.map((ub) => ({
          ...ub,
          isPinned: false,
        }))
      );

      toast.success("Badge unpinned");
    } catch (error) {
      console.error("Error unpinning badge:", error);
      toast.error("Failed to unpin badge");
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Achievements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-muted rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (badges.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Achievements
          </CardTitle>
          <CardDescription>
            Earn badges by participating in the book club
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Trophy className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              Start reading, reviewing, and discussing to earn your first badge!
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5" />
          Achievements
        </CardTitle>
        <CardDescription>
          {badges.length} {badges.length === 1 ? 'badge' : 'badges'} earned
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4 text-sm text-muted-foreground">
          Click a badge to pin it to your profile and comments
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {badges.map((userBadge) => (
            <BadgeDisplay
              key={userBadge.id}
              userBadge={userBadge}
              size="md"
              onPin={handlePinBadge}
              onUnpin={handleUnpinBadge}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
