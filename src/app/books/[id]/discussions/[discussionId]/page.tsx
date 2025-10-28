"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MemberGuard } from "@/components/auth/member-guard";
import { CommentThread } from "@/components/discussions/comment-thread";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { ArrowLeft, MessageCircle, User, Clock, Lock } from "lucide-react";
import { useState, useEffect } from "react";

interface DiscussionPageProps {
  params: {
    id: string;
    discussionId: string;
  };
}

// We'll fetch discussion data from the database

export default function DiscussionPage({ params }: DiscussionPageProps) {
  const { data: session } = useSession();
  const [responses, setResponses] = useState<any[]>([]);
  const [newResponse, setNewResponse] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [discussion, setDiscussion] = useState<any>(null);
  const [isLoadingDiscussion, setIsLoadingDiscussion] = useState(true);
  const [bookDiscussions, setBookDiscussions] = useState<any[]>([]);
  const [unlockedDiscussions, setUnlockedDiscussions] = useState<string[]>([]);

  // Fetch discussion data
  useEffect(() => {
    const fetchDiscussion = async () => {
      try {
        const response = await fetch(`/api/discussions/${params.discussionId}`);
        if (response.ok) {
          const discussionData = await response.json();
          setDiscussion(discussionData);
        }
      } catch (error) {
        console.error("Error fetching discussion:", error);
      } finally {
        setIsLoadingDiscussion(false);
      }
    };

    fetchDiscussion();
  }, [params.discussionId]);

  // Fetch book discussions and user progress
  useEffect(() => {
    const fetchBookData = async () => {
      if (!session) return;

      try {
        const [bookResponse, progressResponse] = await Promise.all([
          fetch(`/api/books/${params.id}`),
          fetch(`/api/books/${params.id}/progress`)
        ]);

        if (bookResponse.ok) {
          const bookData = await bookResponse.json();
          setBookDiscussions(bookData.discussions || []);
        }

        if (progressResponse.ok) {
          const progressData = await progressResponse.json();
          setUnlockedDiscussions(progressData.unlockedDiscussions || []);
        }
      } catch (error) {
        console.error("Error fetching book data:", error);
      }
    };

    fetchBookData();
  }, [params.id, session]);
  
  // Check if discussion is unlocked
  useEffect(() => {
    const checkUnlockStatus = async () => {
      if (!session) return;
      
      try {
        const response = await fetch(`/api/books/${params.id}/progress`);
        if (response.ok) {
          const data = await response.json();
          if (!data.unlockedDiscussions.includes(params.discussionId)) {
            // Discussion is locked, redirect to book page
            window.location.href = `/books/${params.id}`;
            return;
          }
        }
      } catch (error) {
        console.error("Error checking unlock status:", error);
      }
    };
    
    checkUnlockStatus();
  }, [session, params.id, params.discussionId]);
  
  // Fetch responses on component mount
  useEffect(() => {
    const fetchResponses = async () => {
      try {
        const response = await fetch(`/api/discussions/${params.discussionId}/responses`);
        if (response.ok) {
          const data = await response.json();
          setResponses(data);
        }
      } catch (error) {
        console.error("Error fetching responses:", error);
      } finally {
        setLoading(false);
      }
    };
    
    if (params.discussionId) {
      fetchResponses();
    }
  }, [params.discussionId]);
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newResponse.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/discussions/${params.discussionId}/responses`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content: newResponse }),
      });

      if (response.ok) {
        const newResponseData = await response.json();
        setResponses(prev => [...prev, newResponseData]);
        setNewResponse("");
      } else {
        console.error("Failed to submit response");
      }
    } catch (error) {
      console.error("Error submitting response:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle reply to a comment
  const handleReply = async (parentId: string, content: string) => {
    try {
      const response = await fetch(`/api/discussions/${params.discussionId}/responses`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content, parentId }),
      });

      if (response.ok) {
        // Refetch all responses to get updated tree structure
        const refreshResponse = await fetch(`/api/discussions/${params.discussionId}/responses`);
        if (refreshResponse.ok) {
          const data = await refreshResponse.json();
          setResponses(data);
        }
      } else {
        console.error("Failed to submit reply");
      }
    } catch (error) {
      console.error("Error submitting reply:", error);
      throw error;
    }
  };

  if (isLoadingDiscussion) {
    return (
      <MemberGuard>
        <div className="container mx-auto py-8">
          <Card>
            <CardContent className="py-8">
              <div className="animate-pulse space-y-4">
                <div className="h-8 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </div>
            </CardContent>
          </Card>
        </div>
      </MemberGuard>
    );
  }

  if (!discussion) {
    return (
      <MemberGuard>
        <div className="container mx-auto py-8">
          <Card>
            <CardContent className="py-8 text-center">
              <h1 className="text-2xl font-bold mb-2">Discussion Not Found</h1>
              <p className="text-muted-foreground mb-4">
                The discussion you're looking for doesn't exist.
              </p>
              <Button asChild>
                <Link href={`/books/${params.id}`}>Back to Book</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </MemberGuard>
    );
  }

  return (
    <MemberGuard>
      <div className="container mx-auto py-8 space-y-8 max-w-4xl">
        {/* Navigation */}
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/books/${params.id}`}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to {discussion.bookTitle}
          </Link>
        </Button>

        {/* Discussion Question */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Badge variant="outline">
                    {discussion.breakpoint}% mark
                  </Badge>
                  <Badge variant="secondary">
                    <MessageCircle className="h-3 w-3 mr-1" />
                    {responses.length} responses
                  </Badge>
                </div>
                <CardTitle className="text-2xl leading-7">
                  {discussion.question}
                </CardTitle>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Add Response Form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Share Your Thoughts</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <Textarea
                placeholder="What are your thoughts on this question? Share your insights, personal experiences, or analysis..."
                rows={4}
                className="min-h-[120px]"
                value={newResponse}
                onChange={(e) => setNewResponse(e.target.value)}
                disabled={isSubmitting}
              />
              <div className="flex gap-2">
                <Button 
                  type="submit" 
                  className="flex-1" 
                  disabled={!newResponse.trim() || isSubmitting}
                >
                  {isSubmitting ? "Posting..." : "Post Response"}
                </Button>
                <Button type="button" variant="outline" disabled={isSubmitting}>
                  Save Draft
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Responses */}
        <div className="space-y-6">
          <h2 className="text-xl font-semibold">
            Discussion ({responses.length} responses)
          </h2>

          {loading ? (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-muted-foreground">Loading responses...</p>
              </CardContent>
            </Card>
          ) : responses.length > 0 ? (
            <div className="space-y-6">
              {responses.map((response) => (
                <CommentThread
                  key={response.id}
                  comment={response}
                  currentUserEmail={session?.user?.email ?? undefined}
                  onReply={handleReply}
                />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-8 text-center">
                <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Be the first to respond!</h3>
                <p className="text-muted-foreground">
                  Share your thoughts and get the discussion started.
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Navigation to other discussions */}
        {bookDiscussions.length > 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Other Discussion Questions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2">
                {bookDiscussions
                  .filter(d => d.id !== discussion.id)
                  .map((otherDiscussion) => {
                    const isUnlocked = unlockedDiscussions.includes(otherDiscussion.id);

                    return (
                      <Button
                        key={otherDiscussion.id}
                        variant="ghost"
                        className="justify-start h-auto p-3"
                        asChild={isUnlocked}
                        disabled={!isUnlocked}
                      >
                        {isUnlocked ? (
                          <Link href={`/books/${params.id}/discussions/${otherDiscussion.id}`}>
                            <div className="flex items-center space-x-3 w-full">
                              <Badge variant="outline" className="flex-shrink-0">
                                {otherDiscussion.breakpoint}%
                              </Badge>
                              <span className="text-left flex-1 line-clamp-1">
                                {otherDiscussion.question}
                              </span>
                              {otherDiscussion.responseCount > 0 && (
                                <Badge variant="secondary" className="flex-shrink-0">
                                  <MessageCircle className="h-3 w-3 mr-1" />
                                  {otherDiscussion.responseCount}
                                </Badge>
                              )}
                            </div>
                          </Link>
                        ) : (
                          <div className="flex items-center space-x-3 w-full opacity-60">
                            <Badge variant="outline" className="flex-shrink-0">
                              {otherDiscussion.breakpoint}%
                            </Badge>
                            <span className="text-left flex-1">
                              Locked - Reach {otherDiscussion.breakpoint}% to unlock
                            </span>
                            <Lock className="h-4 w-4 flex-shrink-0" />
                          </div>
                        )}
                      </Button>
                    );
                  })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </MemberGuard>
  );
}