"use client";

import { useState } from "react";
import { type DiscussionQuestion } from "@/types/prisma";
import { CommentSection } from "@/components/comments/comment-section";
import { ChevronDown, ChevronUp, Lock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DiscussionSectionProps {
  questions: DiscussionQuestion[];
  currentProgress: number;
  bookId: string;
}

export function DiscussionSection({
  questions,
  currentProgress,
  bookId,
}: DiscussionSectionProps) {
  const [openQuestionId, setOpenQuestionId] = useState<string | null>(null);

  const toggleQuestion = (questionId: string) => {
    setOpenQuestionId(openQuestionId === questionId ? null : questionId);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Discussion Questions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {questions.map((question) => {
          const isLocked = currentProgress < question.breakpoint;
          const isOpen = openQuestionId === question.id;

          return (
            <Card key={question.id} className={cn(isLocked && "opacity-60")}>
              <Button
                variant="ghost"
                onClick={() => !isLocked && toggleQuestion(question.id)}
                className="w-full justify-between h-auto py-4"
                disabled={isLocked}
              >
                <div className="flex items-center gap-3">
                  {isLocked ? (
                    <Lock className="h-5 w-5" />
                  ) : isOpen ? (
                    <ChevronUp className="h-5 w-5" />
                  ) : (
                    <ChevronDown className="h-5 w-5" />
                  )}
                  <div className="text-left">
                    <p className="font-medium">{question.question}</p>
                    <p className="text-sm text-muted-foreground">
                      Unlocks at {question.breakpoint}% progress
                    </p>
                  </div>
                </div>
              </Button>

              {isOpen && !isLocked && (
                <CardContent className="border-t">
                  <CommentSection bookId={bookId} questionId={question.id} />
                </CardContent>
              )}
            </Card>
          );
        })}

        {questions.length === 0 && (
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              No discussion questions available yet.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
