"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";

interface ReadingProgressProps {
  bookId: string;
  initialProgress: number;
  isFinished: boolean;
}

export function ReadingProgress({
  bookId,
  initialProgress,
  isFinished: initialIsFinished,
}: ReadingProgressProps) {
  const router = useRouter();
  const [progress, setProgress] = useState(initialProgress);
  const [isFinished, setIsFinished] = useState(initialIsFinished);
  const [isUpdating, setIsUpdating] = useState(false);

  const updateProgress = async (newProgress: number[]) => {
    setIsUpdating(true);
    try {
      const response = await fetch("/api/reading-progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookId,
          progress: newProgress[0],
          isFinished,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update progress");
      }

      setProgress(newProgress[0]);
      router.refresh();
    } catch (error) {
      console.error("Error updating progress:", error);
      // Reset to previous value on error
      setProgress(initialProgress);
    } finally {
      setIsUpdating(false);
    }
  };

  const updateIsFinished = async (finished: boolean) => {
    setIsUpdating(true);
    try {
      const response = await fetch("/api/reading-progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookId,
          progress,
          isFinished: finished,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update progress");
      }

      setIsFinished(finished);
      router.refresh();
    } catch (error) {
      console.error("Error updating progress:", error);
      // Reset to previous value on error
      setIsFinished(initialIsFinished);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="progress">Reading Progress</Label>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground min-w-[3rem]">
              {progress}%
            </span>
            {isUpdating && (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            )}
          </div>
        </div>
        <Slider
          id="progress"
          min={0}
          max={100}
          step={1}
          value={[progress]}
          onValueChange={updateProgress}
          disabled={isUpdating || isFinished}
          className="w-full"
        />
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="finished"
          checked={isFinished}
          onCheckedChange={(checked) => updateIsFinished(checked as boolean)}
          disabled={isUpdating}
        />
        <Label htmlFor="finished" className="text-sm font-normal">
          I&apos;ve finished this book
        </Label>
      </div>
    </div>
  );
}
