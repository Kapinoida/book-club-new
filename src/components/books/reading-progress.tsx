"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Lock, Unlock, Trophy } from "lucide-react";
import { toast } from "sonner";

interface ReadingProgressProps {
  bookId: string;
  onProgressUpdate?: (progress: number, unlockedDiscussions: string[]) => void;
}

interface ProgressData {
  progress: number;
  unlockedDiscussions: string[];
}

export function ReadingProgress({ bookId, onProgressUpdate }: ReadingProgressProps) {
  const { data: session } = useSession();
  const [progressData, setProgressData] = useState<ProgressData>({ progress: 0, unlockedDiscussions: [] });
  const [inputProgress, setInputProgress] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  // Discussion breakpoints
  const discussions = [
    { id: "1", title: "First impressions and main characters", lockedTitle: "Discussion #1", breakpoint: 25 },
    { id: "2", title: "Plot development and themes", lockedTitle: "Discussion #2", breakpoint: 50 },
    { id: "3", title: "Character arcs and conflicts", lockedTitle: "Discussion #3", breakpoint: 75 },
    { id: "4", title: "Conclusion and overall thoughts", lockedTitle: "Discussion #4", breakpoint: 90 }
  ];

  // Fetch current progress on mount
  useEffect(() => {
    const fetchProgress = async () => {
      if (!session) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/books/${bookId}/progress`);
        if (response.ok) {
          const data = await response.json();
          setProgressData({
            progress: data.progress,
            unlockedDiscussions: data.unlockedDiscussions
          });
          setInputProgress(data.progress.toString());
        }
      } catch (error) {
        console.error("Error fetching progress:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProgress();
  }, [bookId, session]);

  const handleUpdateProgress = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const newProgress = parseInt(inputProgress);
    if (isNaN(newProgress) || newProgress < 0 || newProgress > 100) {
      toast.error("Please enter a valid percentage between 0 and 100");
      return;
    }

    if (newProgress < progressData.progress) {
      toast.error("Progress can only move forward, not backward!");
      return;
    }

    setIsUpdating(true);
    try {
      const response = await fetch(`/api/books/${bookId}/progress`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ progress: newProgress }),
      });

      if (response.ok) {
        const data = await response.json();
        setProgressData({
          progress: data.progress,
          unlockedDiscussions: data.unlockedDiscussions
        });
        
        if (data.newlyUnlocked && data.newlyUnlocked.length > 0) {
          toast.success(data.message, {
            description: `You can now access ${data.newlyUnlocked.length} new discussion(s)!`,
            duration: 5000,
          });
        } else {
          toast.success("Reading progress updated!");
        }

        // Notify parent component of progress update
        onProgressUpdate?.(data.progress, data.unlockedDiscussions);
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to update progress");
      }
    } catch (error) {
      console.error("Error updating progress:", error);
      toast.error("Failed to update progress");
    } finally {
      setIsUpdating(false);
    }
  };

  if (!session) {
    return null;
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-6">
          <p className="text-center text-muted-foreground">Loading progress...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="h-5 w-5" />
          Reading Progress
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Progress Bar with Milestones */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Reading Progress</span>
            <span className="font-medium">{progressData.progress}%</span>
          </div>
          <div className="relative">
            <Progress value={progressData.progress} className="h-4" />
            
            {/* Milestone Markers */}
            <div className="absolute inset-0 flex items-center">
              {discussions.map((discussion) => {
                const isUnlocked = progressData.unlockedDiscussions.includes(discussion.id);
                const isPassed = progressData.progress >= discussion.breakpoint;
                const isNext = !isUnlocked && discussion.breakpoint > progressData.progress && 
                               discussion.breakpoint === Math.min(...discussions.filter(d => d.breakpoint > progressData.progress).map(d => d.breakpoint));
                
                return (
                  <div
                    key={discussion.id}
                    className="absolute group cursor-help"
                    style={{ left: `${discussion.breakpoint}%`, transform: 'translateX(-50%)' }}
                  >
                    {/* Milestone marker */}
                    <div 
                      className={`w-3 h-3 rounded-full border-2 border-white shadow-sm ${
                        isPassed 
                          ? 'bg-green-500' 
                          : isNext 
                            ? 'bg-blue-500 ring-2 ring-blue-200 animate-pulse' 
                            : 'bg-gray-300'
                      }`}
                    />
                    
                    {/* Tooltip */}
                    <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
                      <div className="bg-black text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap shadow-lg">
                        <div className="font-medium">
                          {isUnlocked ? discussion.title : discussion.lockedTitle}
                        </div>
                        <div className="text-gray-300">
                          {isPassed 
                            ? '✓ Unlocked' 
                            : `Unlock at ${discussion.breakpoint}%`
                          }
                        </div>
                        {/* Tooltip arrow */}
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-black"></div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
          {/* Next milestone info */}
          {(() => {
            const nextMilestone = discussions.find(d => d.breakpoint > progressData.progress);
            return nextMilestone ? (
              <p className="text-xs text-muted-foreground text-center">
                Next unlock: <span className="font-medium">{nextMilestone.lockedTitle}</span> at {nextMilestone.breakpoint}% 
                <span className="text-blue-600">({nextMilestone.breakpoint - progressData.progress}% to go)</span>
              </p>
            ) : progressData.progress === 100 ? (
              <p className="text-xs text-center text-green-600 font-medium">All discussions unlocked! 🎉</p>
            ) : null;
          })()}
        </div>

        {/* Update Progress Form */}
        <form onSubmit={handleUpdateProgress} className="flex gap-2">
          <Input
            type="number"
            min="0"
            max="100"
            value={inputProgress}
            onChange={(e) => setInputProgress(e.target.value)}
            placeholder="Enter % complete"
            className="flex-1"
            disabled={isUpdating}
          />
          <Button type="submit" disabled={isUpdating}>
            {isUpdating ? "Updating..." : "Update"}
          </Button>
        </form>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4 text-center">
          <div className="p-3 rounded-lg bg-green-50 border border-green-200">
            <div className="font-semibold text-green-700">
              {progressData.unlockedDiscussions.length}
            </div>
            <div className="text-xs text-green-600">Unlocked</div>
          </div>
          <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
            <div className="font-semibold text-blue-700">
              {discussions.length - progressData.unlockedDiscussions.length}
            </div>
            <div className="text-xs text-blue-600">Remaining</div>
          </div>
        </div>

        {/* Achievement Badge */}
        {progressData.progress === 100 && (
          <div className="flex items-center justify-center p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <Trophy className="h-5 w-5 text-yellow-600 mr-2" />
            <span className="font-medium text-yellow-800">Book Completed! 🎉</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
