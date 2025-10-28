"use client";

import { useSession } from "next-auth/react";
import { useActivePolls } from "@/hooks/use-polls";
import { PollsList } from "@/components/polls/polls-list";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function PollsPage() {
  const { data: session } = useSession();
  const { data: polls, isLoading } = useActivePolls();

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 space-y-8">
        <Card>
          <CardHeader>
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-6 w-full max-w-2xl" />
          </CardHeader>
        </Card>
        <div className="grid gap-6">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-96 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-4xl">Book Selection Polls</CardTitle>
          <CardDescription className="text-lg">
            Vote for the books you'd like to read next! The book with the most votes
            will be selected for the upcoming month.
          </CardDescription>
        </CardHeader>
      </Card>

      {!polls || polls.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <h3 className="text-xl font-semibold mb-2">No Polls Yet</h3>
            <p className="text-muted-foreground mb-4">
              Check back soon for upcoming book selection polls!
            </p>
          </CardContent>
        </Card>
      ) : (
        <PollsList polls={polls} isLoggedIn={!!session} />
      )}
    </div>
  );
}
