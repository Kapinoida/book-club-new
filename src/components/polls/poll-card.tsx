"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Calendar, Trophy, Users } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

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

interface PollCardProps {
  poll: Poll;
  isLoggedIn: boolean;
}

export function PollCard({ poll, isLoggedIn }: PollCardProps) {
  const router = useRouter();
  const [isVoting, setIsVoting] = useState(false);
  const userVote = poll.votes?.[0]?.bookId;

  const now = new Date();
  const startDate = new Date(poll.startDate);
  const endDate = new Date(poll.endDate);
  const isPollOpen = poll.isActive && now >= startDate && now <= endDate;
  const isPollClosed = !poll.isActive || now > endDate;

  const totalVotes = poll._count.votes;

  const handleVote = async (bookId: string) => {
    if (!isLoggedIn || !isPollOpen) return;

    setIsVoting(true);
    const voteId = `vote-${poll.id}-${bookId}`;
    toast.loading("Submitting your vote...", { id: voteId });

    try {
      const response = await fetch(`/api/polls/${poll.id}/vote`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ bookId }),
      });

      if (response.ok) {
        toast.success("Vote recorded successfully!", { id: voteId });
        router.refresh();
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to vote", { id: voteId });
      }
    } catch (error) {
      console.error("Error voting:", error);
      toast.error("Failed to vote", { id: voteId });
    } finally {
      setIsVoting(false);
    }
  };

  const getVotePercentage = (voteCount: number) => {
    if (totalVotes === 0) return 0;
    return Math.round((voteCount / totalVotes) * 100);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-2xl">{poll.title}</CardTitle>
            {poll.description && (
              <CardDescription>{poll.description}</CardDescription>
            )}
          </div>
          <Badge variant={isPollOpen ? "default" : "secondary"}>
            {isPollOpen ? "Open" : isPollClosed ? "Closed" : "Upcoming"}
          </Badge>
        </div>
        <div className="flex flex-col gap-2 text-sm text-muted-foreground pt-2">
          <div className="flex gap-4">
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>
                For {new Date(poll.forMonth).toLocaleDateString("en-US", {
                  month: "long",
                  year: "numeric",
                })}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span>{totalVotes} votes</span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            <span>
              Poll open: {startDate.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })} - {endDate.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {poll.candidates
          .sort((a, b) => {
            // If poll is closed, sort by rank
            if (isPollClosed && a.rank && b.rank) {
              return a.rank - b.rank;
            }
            // Otherwise sort by vote count
            return b.voteCount - a.voteCount;
          })
          .map((candidate, index) => {
            const percentage = getVotePercentage(candidate.voteCount);
            const hasVoted = userVote === candidate.bookId;
            const isWinner = isPollClosed && candidate.rank === 1;

            return (
              <Card
                key={candidate.id}
                className={`relative transition-all duration-200 ${
                  hasVoted ? "ring-2 ring-primary shadow-md" : "hover:shadow-sm"
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    {/* Book Cover */}
                    <div className="relative h-32 w-20 flex-shrink-0">
                      {candidate.book.coverImage ? (
                        <Image
                          src={candidate.book.coverImage}
                          alt={candidate.book.title}
                          fill
                          className="object-cover rounded"
                        />
                      ) : (
                        <div className="h-full w-full bg-muted flex items-center justify-center rounded">
                          <span className="text-xs text-muted-foreground">
                            No cover
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Book Info */}
                    <div className="flex-grow space-y-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold flex items-center gap-2">
                            {candidate.book.title}
                            {isWinner && (
                              <Trophy className="h-4 w-4 text-yellow-500" />
                            )}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            by {candidate.book.author}
                          </p>
                        </div>
                        {isPollClosed && candidate.rank && (
                          <Badge variant="outline">#{candidate.rank}</Badge>
                        )}
                      </div>

                      {candidate.book.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {candidate.book.description}
                        </p>
                      )}

                      {/* Vote Count / Progress */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">
                            {candidate.voteCount} votes ({percentage}%)
                          </span>
                          {isPollOpen && isLoggedIn && (
                            <Button
                              size="sm"
                              variant={hasVoted ? "secondary" : "outline"}
                              onClick={() => handleVote(candidate.bookId)}
                              disabled={isVoting}
                              className="transition-all"
                            >
                              {isVoting ? "Voting..." : hasVoted ? "Voted ✓" : "Vote"}
                            </Button>
                          )}
                        </div>
                        {totalVotes > 0 && (
                          <Progress value={percentage} className="h-2" />
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}

        {!isLoggedIn && isPollOpen && (
          <Card className="bg-muted">
            <CardContent className="py-6 text-center">
              <p className="text-sm text-muted-foreground">
                Sign in to vote for next month's book!
              </p>
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  );
}
