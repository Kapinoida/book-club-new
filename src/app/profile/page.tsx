"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StarRating } from "@/components/reviews/star-rating";
import Link from "next/link";
import Image from "next/image";
import {
  BookOpen,
  CheckCircle,
  Star,
  MessageCircle,
  Calendar,
} from "lucide-react";

interface Book {
  id: string;
  title: string;
  author: string;
  coverImage: string | null;
  readMonth: string;
}

interface ReadingProgress {
  id: string;
  progress: number;
  isFinished: boolean;
  book: Book;
}

interface Review {
  id: string;
  rating: number;
  review: string | null;
  created_at: string;
  book: Book;
}

interface Comment {
  id: string;
  content: string;
  created_at: string;
  book: {
    id: string;
    title: string;
  };
  question: {
    id: string;
    question: string;
  } | null;
}

interface ProfileData {
  user: {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
    username: string | null;
    created_at: string;
  };
  stats: {
    booksStarted: number;
    booksFinished: number;
    reviewsWritten: number;
    commentsPosted: number;
  };
  currentBooks: ReadingProgress[];
  finishedBooks: ReadingProgress[];
  reviews: Review[];
  recentComments: Comment[];
}

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      redirect("/signin");
    }
  }, [status]);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch("/api/profile");
        if (response.ok) {
          const data = await response.json();
          setProfileData(data);
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (status === "authenticated") {
      fetchProfile();
    }
  }, [status]);

  if (isLoading || status === "loading") {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="py-8">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-gray-200 rounded w-1/3"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">
              Failed to load profile data
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Profile Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={profileData.user.image || undefined} />
              <AvatarFallback className="text-2xl">
                {profileData.user.name?.[0]?.toUpperCase() || "?"}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-3xl">
                {profileData.user.name || "Anonymous"}
              </CardTitle>
              <CardDescription>
                {profileData.user.username && `@${profileData.user.username}`}
              </CardDescription>
              <p className="text-sm text-muted-foreground mt-2">
                Member since{" "}
                {new Date(profileData.user.created_at).toLocaleDateString(
                  "en-US",
                  {
                    month: "long",
                    year: "numeric",
                  }
                )}
              </p>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2 text-muted-foreground">
              <BookOpen className="h-4 w-4" />
              <CardDescription>Books Started</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {profileData.stats.booksStarted}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2 text-muted-foreground">
              <CheckCircle className="h-4 w-4" />
              <CardDescription>Books Finished</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {profileData.stats.booksFinished}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Star className="h-4 w-4" />
              <CardDescription>Reviews Written</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {profileData.stats.reviewsWritten}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2 text-muted-foreground">
              <MessageCircle className="h-4 w-4" />
              <CardDescription>Comments Posted</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {profileData.stats.commentsPosted}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Currently Reading */}
      {profileData.currentBooks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Currently Reading</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              {profileData.currentBooks.map((item) => (
                <Link
                  key={item.id}
                  href={`/books/${item.book.id}`}
                  className="block"
                >
                  <Card className="hover:shadow-md transition-shadow">
                    <div className="flex gap-4 p-4">
                      <div className="relative h-24 w-16 flex-shrink-0">
                        {item.book.coverImage ? (
                          <Image
                            src={item.book.coverImage}
                            alt={item.book.title}
                            fill
                            className="object-cover rounded"
                          />
                        ) : (
                          <div className="h-full w-full bg-muted flex items-center justify-center rounded">
                            <BookOpen className="h-6 w-6 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <div className="flex-grow space-y-2">
                        <h3 className="font-semibold">{item.book.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          by {item.book.author}
                        </p>
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">
                              Progress
                            </span>
                            <span className="font-medium">
                              {item.progress}%
                            </span>
                          </div>
                          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary transition-all"
                              style={{ width: `${item.progress}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Finished Books & Reviews */}
      {profileData.finishedBooks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Finished Books</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {profileData.finishedBooks.map((item) => {
                const review = profileData.reviews.find(
                  (r) => r.book.id === item.book.id
                );
                return (
                  <Link
                    key={item.id}
                    href={`/books/${item.book.id}`}
                    className="block"
                  >
                    <Card className="hover:shadow-md transition-shadow">
                      <div className="flex gap-4 p-4">
                        <div className="relative h-24 w-16 flex-shrink-0">
                          {item.book.coverImage ? (
                            <Image
                              src={item.book.coverImage}
                              alt={item.book.title}
                              fill
                              className="object-cover rounded"
                            />
                          ) : (
                            <div className="h-full w-full bg-muted flex items-center justify-center rounded">
                              <BookOpen className="h-6 w-6 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <div className="flex-grow space-y-2">
                          <h3 className="font-semibold line-clamp-2">
                            {item.book.title}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            by {item.book.author}
                          </p>
                          {review && (
                            <div className="flex items-center gap-2">
                              <StarRating
                                rating={review.rating}
                                readonly
                                size="sm"
                              />
                            </div>
                          )}
                          <Badge variant="outline" className="w-fit">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Completed
                          </Badge>
                        </div>
                      </div>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Activity */}
      {profileData.recentComments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Discussion Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {profileData.recentComments.map((comment) => (
                <div
                  key={comment.id}
                  className="border-l-2 border-primary pl-4 space-y-2"
                >
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    {new Date(comment.created_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                    <span>•</span>
                    <Link
                      href={`/books/${comment.book.id}`}
                      className="hover:underline"
                    >
                      {comment.book.title}
                    </Link>
                  </div>
                  {comment.question && (
                    <p className="text-sm font-medium">
                      {comment.question.question}
                    </p>
                  )}
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {comment.content}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {profileData.currentBooks.length === 0 &&
        profileData.finishedBooks.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center space-y-4">
              <BookOpen className="h-12 w-12 mx-auto text-muted-foreground" />
              <div>
                <h3 className="text-xl font-semibold mb-2">
                  Start Your Reading Journey
                </h3>
                <p className="text-muted-foreground mb-4">
                  You haven't started reading any books yet. Check out our
                  current selection!
                </p>
                <Button asChild>
                  <Link href="/">Browse Books</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
    </div>
  );
}
