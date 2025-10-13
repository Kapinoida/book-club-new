"use client";

import { useState, useEffect } from "react";
import { StarRating } from "./star-rating";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Edit } from "lucide-react";

interface Review {
  id: string;
  rating: number;
  review: string | null;
  created_at: string;
  user: {
    id: string;
    name: string | null;
    image: string | null;
  };
}

interface ReviewListProps {
  bookId: string;
  currentUserId?: string;
  refreshTrigger?: number;
  onEditReview?: (review: Review) => void;
}

export function ReviewList({ bookId, currentUserId, refreshTrigger, onEditReview }: ReviewListProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchReviews = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/books/${bookId}/reviews`);
        if (response.ok) {
          const data = await response.json();
          setReviews(data.reviews);
          setAverageRating(data.averageRating);
          setTotalReviews(data.totalReviews);
        }
      } catch (error) {
        console.error("Error fetching reviews:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReviews();
  }, [bookId, refreshTrigger]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {totalReviews > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Reviews</CardTitle>
              <div className="flex items-center gap-2">
                <StarRating rating={Math.round(averageRating)} readonly />
                <span className="text-sm text-muted-foreground">
                  {averageRating.toFixed(1)} ({totalReviews}{" "}
                  {totalReviews === 1 ? "review" : "reviews"})
                </span>
              </div>
            </div>
          </CardHeader>
        </Card>
      )}

      <div className="space-y-4">
        {reviews.length > 0 ? (
          reviews.map((review) => {
            const isOwnReview = currentUserId && review.user.id === currentUserId;
            return (
              <Card key={review.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={review.user.image || undefined} />
                        <AvatarFallback>
                          {review.user.name?.[0]?.toUpperCase() || "?"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold">
                          {review.user.name || "Anonymous"}
                          {isOwnReview && (
                            <span className="ml-2 text-xs text-muted-foreground">(You)</span>
                          )}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(review.created_at).toLocaleDateString(
                            "en-US",
                            {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            }
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <StarRating rating={review.rating} readonly size="sm" />
                      {isOwnReview && onEditReview && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onEditReview(review)}
                        >
                          <Edit className="h-3 w-3 mr-1" />
                          Edit
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                {review.review && (
                  <CardContent>
                    <p className="text-muted-foreground">{review.review}</p>
                  </CardContent>
                )}
              </Card>
            );
          })
        ) : (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">
                No reviews yet. Be the first to review this book!
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
