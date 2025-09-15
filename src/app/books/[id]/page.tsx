"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MemberGuard } from "@/components/auth/member-guard";
import { ReadingProgress } from "@/components/books/reading-progress";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { ArrowLeft, Calendar, User, MessageCircle, Lock } from "lucide-react";

interface BookPageProps {
  params: {
    id: string;
  };
}

// We'll fetch book data from the database in useEffect

export default function BookPage({ params }: BookPageProps) {
  const { data: session } = useSession();
  const [unlockedDiscussions, setUnlockedDiscussions] = useState<string[]>([]);
  const [isLoadingProgress, setIsLoadingProgress] = useState(true);
  const [book, setBook] = useState<any>(null);
  const [isLoadingBook, setIsLoadingBook] = useState(true);

  // Fetch book data
  useEffect(() => {
    const fetchBook = async () => {
      try {
        const response = await fetch(`/api/books/${params.id}`);
        if (response.ok) {
          const bookData = await response.json();
          setBook(bookData);
        }
      } catch (error) {
        console.error("Error fetching book:", error);
      } finally {
        setIsLoadingBook(false);
      }
    };

    fetchBook();
  }, [params.id]);

  // Fetch initial progress data
  useEffect(() => {
    const fetchInitialProgress = async () => {
      if (!session) {
        setIsLoadingProgress(false);
        return;
      }

      try {
        const response = await fetch(`/api/books/${params.id}/progress`);
        if (response.ok) {
          const data = await response.json();
          setUnlockedDiscussions(data.unlockedDiscussions);
        }
      } catch (error) {
        console.error("Error fetching initial progress:", error);
      } finally {
        setIsLoadingProgress(false);
      }
    };

    fetchInitialProgress();
  }, [params.id, session]);

  const handleProgressUpdate = (progress: number, unlocked: string[]) => {
    setUnlockedDiscussions(unlocked);
  };

  if (isLoadingBook) {
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

  if (!book) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="py-8 text-center">
            <h1 className="text-2xl font-bold mb-2">Book Not Found</h1>
            <p className="text-muted-foreground mb-4">
              The book you're looking for doesn't exist.
            </p>
            <Button asChild>
              <Link href="/">Back to Home</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <MemberGuard>
      <div className="container mx-auto py-8 space-y-8">
        {/* Navigation */}
        <Button variant="ghost" size="sm" asChild>
          <Link href="/">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Books
          </Link>
        </Button>

        {/* Book Header */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-1">
            <div className="aspect-[3/4] bg-gray-100 rounded-lg overflow-hidden">
              <img
                src={book.coverImage}
                alt={book.title}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
          
          <div className="md:col-span-2 space-y-6">
            <div>
              <h1 className="text-4xl font-bold mb-2">{book.title}</h1>
              <div className="flex items-center space-x-2 text-muted-foreground mb-4">
                <User className="h-4 w-4" />
                <span>by {book.author}</span>
              </div>
              <div className="flex items-center space-x-2 text-muted-foreground mb-6">
                <Calendar className="h-4 w-4" />
                <span>Reading in {new Date(book.readMonth).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long' 
                })}</span>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-3">About This Book</h2>
              <p className="text-muted-foreground leading-relaxed">
                {book.description}
              </p>
            </div>

            {session?.user?.isAdmin && (
              <div className="flex gap-2">
                <Button variant="outline" asChild>
                  <Link href={`/admin/books/${book.id}/edit`}>
                    Edit Book
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Reading Progress */}
        <ReadingProgress 
          bookId={params.id} 
          onProgressUpdate={handleProgressUpdate}
        />

        {/* Discussion Questions */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Discussion Questions</h2>
            <Badge variant="secondary">
              <MessageCircle className="h-3 w-3 mr-1" />
              {book.discussions.length} questions
            </Badge>
          </div>

          {isLoadingProgress ? (
            <div className="space-y-4">
              {book.discussions.map((discussion) => (
                <Card key={discussion.id} className="opacity-75">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline">
                            {discussion.breakpoint}% mark
                          </Badge>
                          <div className="h-5 w-16 bg-gray-200 rounded animate-pulse" />
                        </div>
                        <div className="h-6 w-3/4 bg-gray-200 rounded animate-pulse" />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
                      <div className="h-8 w-24 bg-gray-200 rounded animate-pulse" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : book.discussions.length > 0 ? (
            <div className="space-y-4">
              {book.discussions.map((discussion) => {
                const isUnlocked = unlockedDiscussions.includes(discussion.id);
                
                return (
                  <Card key={discussion.id} className={!isUnlocked ? "opacity-75" : ""}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline">
                              {discussion.breakpoint}% mark
                            </Badge>
                            {!isUnlocked && (
                              <Badge variant="secondary" className="flex items-center gap-1">
                                <Lock className="h-3 w-3" />
                                Locked
                              </Badge>
                            )}
                          </div>
                          <CardTitle className="text-lg leading-6">
                            {isUnlocked ? discussion.question : "Discussion question will be revealed when unlocked"}
                          </CardTitle>
                          {!isUnlocked && (
                            <p className="text-sm text-muted-foreground">
                              Keep reading to discover what we'll discuss at the {discussion.breakpoint}% mark!
                            </p>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">
                          {discussion.responses.length} responses
                        </p>
                        {isUnlocked ? (
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/books/${book.id}/discussions/${discussion.id}`}>
                              Join Discussion
                            </Link>
                          </Button>
                        ) : (
                          <Button variant="outline" size="sm" disabled>
                            <Lock className="h-3 w-3 mr-1" />
                            Reach {discussion.breakpoint}% to unlock
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card>
              <CardContent className="py-8 text-center">
                <h3 className="text-lg font-semibold mb-2">No discussions yet</h3>
                <p className="text-muted-foreground">
                  Discussion questions will appear here when they're added.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </MemberGuard>
  );
}