"use client";

import { PollCard } from "./poll-card";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface PollCandidate {
  id: string;
  bookId: string;
  voteCount: number;
  rank: number | null;
  book: {
    id: string;
    title: string;
    author: string;
    coverImage: string | null;
    description: string | null;
  };
}

interface Poll {
  id: string;
  title: string;
  description: string | null;
  startDate: string;
  endDate: string;
  forMonth: string;
  isActive: boolean;
  candidates: PollCandidate[];
  votes?: { bookId: string }[];
  _count: {
    votes: number;
  };
}

interface PollsListProps {
  polls: Poll[];
  isLoggedIn: boolean;
}

export function PollsList({ polls, isLoggedIn }: PollsListProps) {
  const now = new Date();

  const activePolls = polls.filter((poll) => {
    const endDate = new Date(poll.endDate);
    return poll.isActive && now <= endDate;
  });

  const pastPolls = polls.filter((poll) => {
    const endDate = new Date(poll.endDate);
    return !poll.isActive || now > endDate;
  });

  return (
    <Tabs defaultValue="active" className="space-y-6">
      <TabsList>
        <TabsTrigger value="active">
          Active Polls ({activePolls.length})
        </TabsTrigger>
        <TabsTrigger value="past">
          Past Results ({pastPolls.length})
        </TabsTrigger>
      </TabsList>

      <TabsContent value="active" className="space-y-6">
        {activePolls.length > 0 ? (
          activePolls.map((poll) => (
            <PollCard key={poll.id} poll={poll} isLoggedIn={isLoggedIn} />
          ))
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <h3 className="text-xl font-semibold mb-2">No Active Polls</h3>
              <p className="text-muted-foreground">
                There are no polls currently open for voting. Check back soon!
              </p>
            </CardContent>
          </Card>
        )}
      </TabsContent>

      <TabsContent value="past" className="space-y-6">
        {pastPolls.length > 0 ? (
          pastPolls.map((poll) => (
            <PollCard key={poll.id} poll={poll} isLoggedIn={isLoggedIn} />
          ))
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <h3 className="text-xl font-semibold mb-2">No Past Polls</h3>
              <p className="text-muted-foreground">
                Poll results will appear here after voting closes.
              </p>
            </CardContent>
          </Card>
        )}
      </TabsContent>
    </Tabs>
  );
}
