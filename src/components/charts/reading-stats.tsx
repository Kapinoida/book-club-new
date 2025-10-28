"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Trophy, Target, TrendingUp } from "lucide-react";

interface ReadingStatsProps {
  totalBooks: number;
  booksFinished: number;
  currentStreak?: number;
  averageProgress?: number;
}

export function ReadingStats({
  totalBooks,
  booksFinished,
  currentStreak = 0,
  averageProgress = 0
}: ReadingStatsProps) {
  const stats = [
    {
      title: "Books Started",
      value: totalBooks,
      icon: BookOpen,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10"
    },
    {
      title: "Books Finished",
      value: booksFinished,
      icon: Trophy,
      color: "text-yellow-500",
      bgColor: "bg-yellow-500/10"
    },
    {
      title: "Current Streak",
      value: `${currentStreak} ${currentStreak === 1 ? 'week' : 'weeks'}`,
      icon: TrendingUp,
      color: "text-green-500",
      bgColor: "bg-green-500/10"
    },
    {
      title: "Avg. Progress",
      value: `${Math.round(averageProgress)}%`,
      icon: Target,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
