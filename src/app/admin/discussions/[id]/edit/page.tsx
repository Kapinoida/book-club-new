"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminGuard } from "@/components/admin/admin-guard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface EditDiscussionProps {
  params: {
    id: string;
  };
}

export default function EditDiscussion({ params }: EditDiscussionProps) {
  const [books, setBooks] = useState<any[]>([]);
  const [discussion, setDiscussion] = useState<any>(null);
  const [selectedBookId, setSelectedBookId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingBooks, setIsLoadingBooks] = useState(true);
  const [isLoadingDiscussion, setIsLoadingDiscussion] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const router = useRouter();

  const validateForm = (formData: FormData, bookId: string): Record<string, string> => {
    const errors: Record<string, string> = {};

    const question = formData.get('question') as string;
    const breakpoint = formData.get('breakpoint') as string;

    if (!bookId) {
      errors.book = 'Please select a book';
    }

    if (!question?.trim()) {
      errors.question = 'Discussion question is required';
    } else if (question.trim().length < 10) {
      errors.question = 'Question must be at least 10 characters';
    } else if (question.trim().length > 1000) {
      errors.question = 'Question must be less than 1000 characters';
    }

    if (!breakpoint) {
      errors.breakpoint = 'Breakpoint percentage is required';
    } else {
      const breakpointNum = parseInt(breakpoint);
      if (isNaN(breakpointNum) || breakpointNum < 1 || breakpointNum > 100) {
        errors.breakpoint = 'Breakpoint must be between 1 and 100';
      }
    }

    return errors;
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch books
        const booksResponse = await fetch('/api/admin/books');
        if (booksResponse.ok) {
          const booksData = await booksResponse.json();
          setBooks(booksData);
        } else {
          toast.error('Failed to fetch books');
        }
        setIsLoadingBooks(false);

        // Fetch discussion
        const discussionResponse = await fetch(`/api/admin/discussions/${params.id}`);
        if (discussionResponse.ok) {
          const discussionData = await discussionResponse.json();
          setDiscussion(discussionData);
          setSelectedBookId(discussionData.bookId);
        } else {
          toast.error('Failed to fetch discussion');
          router.push('/admin/discussions');
        }
      } catch (error) {
        toast.error('Failed to load data');
        console.error('Error fetching data:', error);
      } finally {
        setIsLoadingDiscussion(false);
      }
    };

    fetchData();
  }, [params.id, router]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrors({});

    const formData = new FormData(e.currentTarget);

    // Validate form
    const validationErrors = validateForm(formData, selectedBookId);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      toast.error('Please fix the errors below');
      return;
    }

    setIsSubmitting(true);

    const discussionData = {
      bookId: selectedBookId,
      question: (formData.get('question') as string).trim(),
      breakpoint: parseInt(formData.get('breakpoint') as string),
    };

    try {
      const response = await fetch(`/api/admin/discussions/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(discussionData),
      });

      if (response.ok) {
        toast.success('Discussion question updated successfully!');
        router.push('/admin/discussions');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to update discussion question');
      }
    } catch (error) {
      toast.error('Network error. Please check your connection and try again.');
      console.error('Error updating discussion:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingDiscussion || isLoadingBooks) {
    return (
      <AdminGuard>
        <div className="container mx-auto py-8 max-w-2xl">
          <Card>
            <CardContent className="py-8">
              <div className="animate-pulse space-y-4">
                <div className="h-8 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        </div>
      </AdminGuard>
    );
  }

  if (!discussion) {
    return (
      <AdminGuard>
        <div className="container mx-auto py-8 max-w-2xl">
          <Card>
            <CardContent className="py-8 text-center">
              <h1 className="text-2xl font-bold mb-2">Discussion Not Found</h1>
              <p className="text-muted-foreground mb-4">
                The discussion question you're looking for doesn't exist.
              </p>
              <Button asChild>
                <Link href="/admin/discussions">Back to Discussions</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </AdminGuard>
    );
  }

  return (
    <AdminGuard>
      <div className="container mx-auto py-8 max-w-2xl">
        {/* Header */}
        <div className="flex items-center space-x-4 mb-8">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin/discussions">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Discussions
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Edit Discussion Question</h1>
            <p className="text-muted-foreground">
              Update this discussion question for your book club
            </p>
          </div>
        </div>

        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle>Question Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="book">Book *</Label>
                <Select
                  value={selectedBookId}
                  onValueChange={setSelectedBookId}
                >
                  <SelectTrigger className={errors.book ? "border-red-500" : ""}>
                    <SelectValue placeholder="Select a book" />
                  </SelectTrigger>
                  <SelectContent>
                    {books.map((book) => (
                      <SelectItem key={book.id} value={book.id}>
                        {book.title} - {new Date(book.readMonth).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long'
                        })}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.book && (
                  <p className="text-sm text-red-600">{errors.book}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="question">Discussion Question *</Label>
                <Textarea
                  id="question"
                  name="question"
                  placeholder="Enter a thought-provoking question for readers to discuss"
                  rows={4}
                  className={errors.question ? "border-red-500" : ""}
                  defaultValue={discussion.question}
                  required
                />
                {errors.question && (
                  <p className="text-sm text-red-600">{errors.question}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Create engaging questions that spark meaningful conversations
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="breakpoint">Reading Progress Breakpoint * (%)</Label>
                <Input
                  id="breakpoint"
                  name="breakpoint"
                  type="number"
                  min="1"
                  max="100"
                  placeholder="e.g., 50"
                  className={errors.breakpoint ? "border-red-500" : ""}
                  defaultValue={discussion.breakpoint}
                  required
                />
                {errors.breakpoint && (
                  <p className="text-sm text-red-600">{errors.breakpoint}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  When should this question be revealed? (1-100%)
                </p>
              </div>

              <div className="flex gap-4 pt-4">
                <Button type="submit" className="flex-1" disabled={isSubmitting}>
                  {isSubmitting ? "Updating..." : "Update Question"}
                </Button>
                <Button type="button" variant="outline" className="flex-1" disabled={isSubmitting} asChild>
                  <Link href="/admin/discussions">Cancel</Link>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </AdminGuard>
  );
}
