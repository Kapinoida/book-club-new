"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminGuard } from "@/components/admin/admin-guard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface EditBookProps {
  params: {
    id: string;
  };
}

export default function EditBook({ params }: EditBookProps) {
  const [book, setBook] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const router = useRouter();

  const validateForm = (formData: FormData): Record<string, string> => {
    const errors: Record<string, string> = {};
    
    const title = formData.get('title') as string;
    const author = formData.get('author') as string;
    const readMonth = formData.get('readMonth') as string;
    const coverImage = formData.get('coverImage') as string;

    if (!title?.trim()) {
      errors.title = 'Title is required';
    } else if (title.trim().length < 2) {
      errors.title = 'Title must be at least 2 characters';
    } else if (title.trim().length > 200) {
      errors.title = 'Title must be less than 200 characters';
    }

    if (!author?.trim()) {
      errors.author = 'Author is required';
    } else if (author.trim().length < 2) {
      errors.author = 'Author name must be at least 2 characters';
    } else if (author.trim().length > 100) {
      errors.author = 'Author name must be less than 100 characters';
    }

    if (!readMonth) {
      errors.readMonth = 'Reading month is required';
    }
    // Note: For edit form, we allow past dates since users might be editing historical data

    if (coverImage && !isValidUrl(coverImage)) {
      errors.coverImage = 'Please enter a valid URL';
    }

    return errors;
  };

  const isValidUrl = (string: string): boolean => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  useEffect(() => {
    const fetchBook = async () => {
      try {
        const response = await fetch(`/api/admin/books/${params.id}`);
        if (response.ok) {
          const bookData = await response.json();
          setBook({
            ...bookData,
            readMonth: bookData.readMonth ? bookData.readMonth.split('T')[0].substring(0, 7) : ''
          });
        } else {
          toast.error('Book not found');
          router.push('/admin/books');
        }
      } catch (error) {
        toast.error('Failed to fetch book');
        console.error('Error fetching book:', error);
        router.push('/admin/books');
      } finally {
        setIsLoading(false);
      }
    };

    fetchBook();
  }, [params.id, router]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrors({});
    
    const formData = new FormData(e.currentTarget);
    
    // Validate form
    const validationErrors = validateForm(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      toast.error('Please fix the errors below');
      return;
    }

    setIsSubmitting(true);

    const bookData = {
      title: (formData.get('title') as string).trim(),
      author: (formData.get('author') as string).trim(),
      description: (formData.get('description') as string || '').trim(),
      readMonth: formData.get('readMonth') as string,
      coverImage: (formData.get('coverImage') as string || '').trim(),
      googleBooksId: (formData.get('googleBooksId') as string || '').trim(),
    };

    try {
      const response = await fetch(`/api/admin/books/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bookData),
      });

      if (response.ok) {
        toast.success('Book updated successfully!');
        router.push('/admin/books');
      } else {
        const error = await response.json();
        if (error.error?.includes('validation')) {
          toast.error('Please check your input and try again');
        } else {
          toast.error(error.error || 'Failed to update book');
        }
      }
    } catch (error) {
      toast.error('Network error. Please check your connection and try again.');
      console.error('Error updating book:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
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

  if (!book) {
    return (
      <AdminGuard>
        <div className="container mx-auto py-8 max-w-2xl">
          <Card>
            <CardContent className="py-8 text-center">
              <h1 className="text-2xl font-bold mb-2">Book Not Found</h1>
              <p className="text-muted-foreground mb-4">
                The book you're trying to edit doesn't exist.
              </p>
              <Button asChild>
                <Link href="/admin/books">Back to Books</Link>
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
            <Link href="/admin/books">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Books
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Edit Book</h1>
            <p className="text-muted-foreground">
              Update the details for "{book.title}"
            </p>
          </div>
        </div>

        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle>Book Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    name="title"
                    defaultValue={book.title}
                    placeholder="Enter book title"
                    className={errors.title ? "border-red-500" : ""}
                    required
                  />
                  {errors.title && (
                    <p className="text-sm text-red-600">{errors.title}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="author">Author *</Label>
                  <Input
                    id="author"
                    name="author"
                    defaultValue={book.author}
                    placeholder="Enter author name"
                    className={errors.author ? "border-red-500" : ""}
                    required
                  />
                  {errors.author && (
                    <p className="text-sm text-red-600">{errors.author}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  defaultValue={book.description}
                  placeholder="Enter book description"
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="readMonth">Reading Month *</Label>
                  <Input
                    id="readMonth"
                    name="readMonth"
                    type="month"
                    defaultValue={book.readMonth}
                    className={errors.readMonth ? "border-red-500" : ""}
                    required
                  />
                  {errors.readMonth && (
                    <p className="text-sm text-red-600">{errors.readMonth}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="coverImage">Cover Image URL</Label>
                  <Input
                    id="coverImage"
                    name="coverImage"
                    type="url"
                    defaultValue={book.coverImage}
                    placeholder="https://example.com/cover.jpg"
                    className={errors.coverImage ? "border-red-500" : ""}
                  />
                  {errors.coverImage && (
                    <p className="text-sm text-red-600">{errors.coverImage}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="googleBooksId">Google Books ID (Optional)</Label>
                <Input
                  id="googleBooksId"
                  name="googleBooksId"
                  defaultValue={book.googleBooksId}
                  placeholder="For automatic book data import"
                />
              </div>

              <div className="flex gap-4 pt-4">
                <Button type="submit" className="flex-1" disabled={isSubmitting}>
                  {isSubmitting ? "Updating..." : "Update Book"}
                </Button>
                <Button type="button" variant="outline" className="flex-1" disabled={isSubmitting} asChild>
                  <Link href="/admin/books">Cancel</Link>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Preview */}
        {book.coverImage && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Current Cover Image</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="w-32 h-48 bg-gray-100 rounded-lg overflow-hidden">
                <img
                  src={book.coverImage}
                  alt={book.title}
                  className="w-full h-full object-cover"
                />
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminGuard>
  );
}