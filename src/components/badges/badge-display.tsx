"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge as BadgeUI } from "@/components/ui/badge";

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
  badge: Badge;
}

interface BadgeDisplayProps {
  userBadge: UserBadge;
  size?: "sm" | "md" | "lg";
}

export function BadgeDisplay({ userBadge, size = "md" }: BadgeDisplayProps) {
  const { badge } = userBadge;

  const sizeClasses = {
    sm: {
      container: "p-2",
      icon: "text-2xl",
      name: "text-xs",
      description: "text-[10px]"
    },
    md: {
      container: "p-4",
      icon: "text-4xl",
      name: "text-sm",
      description: "text-xs"
    },
    lg: {
      container: "p-6",
      icon: "text-6xl",
      name: "text-base",
      description: "text-sm"
    }
  };

  const tierColors = {
    1: "from-slate-400 to-slate-600", // Bronze
    2: "from-gray-300 to-gray-500",   // Silver
    3: "from-yellow-400 to-yellow-600", // Gold
    4: "from-purple-400 to-purple-600"  // Platinum
  };

  return (
    <Card
      className={`relative overflow-hidden ${sizeClasses[size].container}`}
      style={{ borderColor: badge.color }}
    >
      <div
        className={`absolute inset-0 bg-gradient-to-br ${tierColors[badge.tier as keyof typeof tierColors]} opacity-10`}
      />
      <CardContent className="p-0 relative z-10">
        <div className="flex flex-col items-center text-center space-y-2">
          <div className={sizeClasses[size].icon}>{badge.icon}</div>
          <div>
            <h3
              className={`font-bold ${sizeClasses[size].name}`}
              style={{ color: badge.color }}
            >
              {badge.name}
            </h3>
            <p className={`text-muted-foreground ${sizeClasses[size].description}`}>
              {badge.description}
            </p>
          </div>
          <BadgeUI variant="outline" className="text-[10px]">
            {new Date(userBadge.awarded_at).toLocaleDateString('en-US', {
              month: 'short',
              year: 'numeric'
            })}
          </BadgeUI>
        </div>
      </CardContent>
    </Card>
  );
}
