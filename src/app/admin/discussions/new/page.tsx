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

export default function NewDiscussion() {
  const [books, setBooks] = useState<any[]>([]);
  const [selectedBookId, setSelectedBookId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingBooks, setIsLoadingBooks] = useState(true);
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
    const fetchBooks = async () => {
      try {
        const response = await fetch('/api/admin/books');
        if (response.ok) {
          const booksData = await response.json();
          setBooks(booksData);
        } else {
          toast.error('Failed to fetch books');
        }
      } catch (error) {
        toast.error('Failed to fetch books');
        console.error('Error fetching books:', error);
      } finally {
        setIsLoadingBooks(false);
      }
    };

    fetchBooks();
  }, []);

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
      const response = await fetch('/api/admin/discussions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(discussionData),
      });

      if (response.ok) {
        toast.success('Discussion question added successfully!');
        router.push('/admin/discussions');
      } else {
        const error = await response.json();
        if (error.error?.includes('validation')) {
          toast.error('Please check your input and try again');
        } else {
          toast.error(error.error || 'Failed to add discussion question');
        }
      }
    } catch (error) {
      toast.error('Network error. Please check your connection and try again.');
      console.error('Error adding discussion:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingBooks) {
    return (
      <AdminGuard>
        <div className="container mx-auto py-8 max-w-2xl">
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
            <h1 className="text-3xl font-bold">Add Discussion Question</h1>
            <p className="text-muted-foreground">
              Create a new discussion question for your book club
            </p>
          </div>
        </div>

        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle>Discussion Question Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="book">Book *</Label>
                <Select value={selectedBookId} onValueChange={setSelectedBookId} required>
                  <SelectTrigger className={errors.book ? "border-red-500" : ""}>
                    <SelectValue placeholder="Select a book" />
                  </SelectTrigger>
                  <SelectContent>
                    {books.map((book) => (
                      <SelectItem key={book.id} value={book.id}>
                        {book.title}
                        {book.readMonth && ` - ${new Date(book.readMonth).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long'
                        })}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.book && (
                  <p className="text-sm text-red-600">{errors.book}</p>
                )}
                {books.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    No books available. Please add a book first.
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="question">Discussion Question *</Label>
                <Textarea
                  id="question"
                  name="question"
                  placeholder="Enter an engaging discussion question that will spark conversation..."
                  rows={4}
                  className={`min-h-[120px] ${errors.question ? "border-red-500" : ""}`}
                  required
                />
                {errors.question && (
                  <p className="text-sm text-red-600">{errors.question}</p>
                )}
                <p className="text-sm text-muted-foreground">
                  Tip: Ask open-ended questions that encourage personal reflection and analysis.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="breakpoint">Reading Progress Breakpoint (%) *</Label>
                <Input
                  id="breakpoint"
                  name="breakpoint"
                  type="number"
                  min="1"
                  max="100"
                  placeholder="e.g., 25"
                  className={errors.breakpoint ? "border-red-500" : ""}
                  required
                />
                {errors.breakpoint && (
                  <p className="text-sm text-red-600">{errors.breakpoint}</p>
                )}
                <p className="text-sm text-muted-foreground">
                  The percentage of the book readers need to complete to unlock this discussion.
                </p>
              </div>

              <div className="flex gap-4 pt-4">
                <Button type="submit" className="flex-1" disabled={isSubmitting || books.length === 0}>
                  {isSubmitting ? "Adding..." : "Add Discussion Question"}
                </Button>
                <Button type="button" variant="outline" className="flex-1" disabled={isSubmitting} asChild>
                  <Link href="/admin/discussions">Cancel</Link>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {books.length === 0 && (
          <Card className="mt-8">
            <CardContent className="py-8 text-center">
              <h3 className="text-lg font-semibold mb-2">No books available</h3>
              <p className="text-muted-foreground mb-4">
                You need to add books before creating discussion questions.
              </p>
              <Button asChild>
                <Link href="/admin/books/new">Add Your First Book</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminGuard>
  );
}