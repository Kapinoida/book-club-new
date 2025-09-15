"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminGuard } from "@/components/admin/admin-guard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function NewBook() {
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
    } else {
      const selectedDate = new Date(readMonth);
      const currentDate = new Date();
      currentDate.setDate(1); // Set to first day of current month
      
      if (selectedDate < currentDate) {
        errors.readMonth = 'Reading month cannot be in the past';
      }
    }

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
      const response = await fetch('/api/admin/books', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bookData),
      });

      if (response.ok) {
        toast.success('Book added successfully!');
        router.push('/admin/books');
      } else {
        const error = await response.json();
        if (error.error?.includes('validation')) {
          toast.error('Please check your input and try again');
        } else {
          toast.error(error.error || 'Failed to add book');
        }
      }
    } catch (error) {
      toast.error('Network error. Please check your connection and try again.');
      console.error('Error adding book:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

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
            <h1 className="text-3xl font-bold">Add New Book</h1>
            <p className="text-muted-foreground">
              Add a new book to your club's reading list
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
                  placeholder="For automatic book data import"
                />
              </div>

              <div className="flex gap-4 pt-4">
                <Button type="submit" className="flex-1" disabled={isSubmitting}>
                  {isSubmitting ? "Adding..." : "Add Book"}
                </Button>
                <Button type="button" variant="outline" className="flex-1" disabled={isSubmitting} asChild>
                  <Link href="/admin/books">Cancel</Link>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </AdminGuard>
  );
}