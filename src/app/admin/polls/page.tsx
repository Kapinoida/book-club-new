"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { redirect, useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Calendar, Users, Trophy, Plus, Lock, X, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

interface Poll {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  forMonth: string;
  isActive: boolean;
  _count: {
    votes: number;
    candidates: number;
  };
  candidates: {
    book: {
      title: string;
    };
    voteCount: number;
  }[];
}

export default function AdminPollsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [polls, setPolls] = useState<Poll[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [closingPollId, setClosingPollId] = useState<string | null>(null);
  const [deletingPollId, setDeletingPollId] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated" || (session && !session.user.isAdmin)) {
      redirect("/");
    }
  }, [status, session]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchPolls();
    }
  }, [status]);

  const fetchPolls = async () => {
    try {
      const response = await fetch("/api/polls");
      if (response.ok) {
        const data = await response.json();
        setPolls(data);
      }
    } catch (error) {
      console.error("Error fetching polls:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClosePoll = async (pollId: string) => {
    if (!confirm("Are you sure you want to close this poll? This will finalize the results and schedule the winning book.")) {
      return;
    }

    setClosingPollId(pollId);
    toast.loading("Closing poll...", { id: `close-${pollId}` });

    try {
      const response = await fetch(`/api/polls/${pollId}/close`, {
        method: "POST",
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(`Poll closed! Winner: ${data.winner.book.title}`, { id: `close-${pollId}` });
        fetchPolls();
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to close poll", { id: `close-${pollId}` });
      }
    } catch (error) {
      console.error("Error closing poll:", error);
      toast.error("Failed to close poll", { id: `close-${pollId}` });
    } finally {
      setClosingPollId(null);
    }
  };

  const handleDeletePoll = async (pollId: string) => {
    if (!confirm("Are you sure you want to delete this poll? This action cannot be undone.")) {
      return;
    }

    setDeletingPollId(pollId);
    toast.loading("Deleting poll...", { id: `delete-${pollId}` });

    try {
      const response = await fetch(`/api/polls/${pollId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Poll deleted successfully", { id: `delete-${pollId}` });
        fetchPolls();
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to delete poll", { id: `delete-${pollId}` });
      }
    } catch (error) {
      console.error("Error deleting poll:", error);
      toast.error("Failed to delete poll", { id: `delete-${pollId}` });
    } finally {
      setDeletingPollId(null);
    }
  };

  const getPollStatus = (poll: Poll) => {
    const now = new Date();
    const startDate = new Date(poll.startDate);
    const endDate = new Date(poll.endDate);

    if (!poll.isActive) {
      return { label: "Closed", variant: "secondary" as const };
    }
    if (now < startDate) {
      return { label: "Upcoming", variant: "outline" as const };
    }
    if (now > endDate) {
      return { label: "Ended - Needs Close", variant: "destructive" as const };
    }
    return { label: "Active", variant: "default" as const };
  };

  if (isLoading || status === "loading") {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="py-8">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-gray-200 rounded w-1/3"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-4xl">Manage Polls</CardTitle>
              <CardDescription className="text-lg">
                Create and manage book selection polls
              </CardDescription>
            </div>
            <Button asChild>
              <Link href="/admin/polls/create">
                <Plus className="h-4 w-4 mr-2" />
                Create Poll
              </Link>
            </Button>
          </div>
        </CardHeader>
      </Card>

      {polls.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center space-y-4">
            <h3 className="text-xl font-semibold">No Polls Yet</h3>
            <p className="text-muted-foreground">
              Create your first poll to let members vote on upcoming books
            </p>
            <Button asChild>
              <Link href="/admin/polls/create">Create Your First Poll</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>All Polls</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>For Month</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Dates</TableHead>
                  <TableHead>Candidates</TableHead>
                  <TableHead>Votes</TableHead>
                  <TableHead>Leader</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {polls.map((poll) => {
                  const status = getPollStatus(poll);
                  const leader = poll.candidates.sort(
                    (a, b) => b.voteCount - a.voteCount
                  )[0];
                  const now = new Date();
                  const endDate = new Date(poll.endDate);
                  const canClose = poll.isActive && now > endDate;

                  return (
                    <TableRow key={poll.id}>
                      <TableCell className="font-medium">
                        {poll.title}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(poll.forMonth).toLocaleDateString("en-US", {
                            month: "short",
                            year: "numeric",
                          })}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={status.variant}>{status.label}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(poll.startDate).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}{" "}
                        -{" "}
                        {new Date(poll.endDate).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </TableCell>
                      <TableCell>{poll._count.candidates}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {poll._count.votes}
                        </div>
                      </TableCell>
                      <TableCell>
                        {leader ? (
                          <div className="flex items-center gap-1">
                            <Trophy className="h-3 w-3 text-yellow-500" />
                            <span className="text-sm">
                              {leader.book.title.length > 20
                                ? leader.book.title.substring(0, 20) + "..."
                                : leader.book.title}
                            </span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">
                            No votes yet
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          {poll.isActive ? (
                            <>
                              <Button
                                size="sm"
                                variant="ghost"
                                asChild
                              >
                                <Link href={`/admin/polls/${poll.id}/edit`}>
                                  <Pencil className="h-3 w-3 mr-1" />
                                  Edit
                                </Link>
                              </Button>
                              {canClose && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleClosePoll(poll.id)}
                                  disabled={closingPollId === poll.id}
                                >
                                  <Lock className="h-3 w-3 mr-1" />
                                  {closingPollId === poll.id
                                    ? "Closing..."
                                    : "Close Poll"}
                                </Button>
                              )}
                            </>
                          ) : (
                            <span className="text-sm text-muted-foreground mr-2">Closed</span>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeletePoll(poll.id)}
                            disabled={deletingPollId === poll.id}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-3 w-3 mr-1" />
                            {deletingPollId === poll.id ? "Deleting..." : "Delete"}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
