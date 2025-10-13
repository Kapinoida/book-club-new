"use client";

import { useState } from "react";
import { StarRating } from "./star-rating";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { useRouter } from "next/navigation";

interface ReviewFormProps {
  bookId: string;
  existingReview?: {
    rating: number;
    review: string | null;
  };
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function ReviewForm({
  bookId,
  existingReview,
  onSuccess,
  onCancel,
}: ReviewFormProps) {
  const router = useRouter();
  const [rating, setRating] = useState(existingReview?.rating || 0);
  const [reviewText, setReviewText] = useState(existingReview?.review || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (rating === 0) {
      setError("Please select a rating");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/books/${bookId}/reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          rating,
          review: reviewText || undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to submit review");
      }

      router.refresh();
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit review");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {existingReview ? "Update Your Review" : "Write a Review"}
        </CardTitle>
        <CardDescription>
          Share your thoughts about this book with other readers
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Your Rating</label>
            <StarRating rating={rating} onRatingChange={setRating} size="lg" />
          </div>

          <div className="space-y-2">
            <label htmlFor="review" className="text-sm font-medium">
              Your Review (Optional)
            </label>
            <Textarea
              id="review"
              placeholder="What did you think about this book?"
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              rows={4}
              className="resize-none"
            />
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <div className="flex gap-2">
            <Button type="submit" disabled={isSubmitting || rating === 0}>
              {isSubmitting
                ? "Submitting..."
                : existingReview
                ? "Update Review"
                : "Submit Review"}
            </Button>
            {existingReview && onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
