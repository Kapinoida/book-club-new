"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminGuard } from "@/components/admin/admin-guard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import Link from "next/link";
import { ArrowLeft, Search, Loader2 } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface GoogleBook {
  id: string;
  title: string;
  authors: string[];
  description: string;
  coverImage: string;
  publishedDate: string;
  pageCount: number;
  categories: string[];
}

export default function NewBook() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<GoogleBook[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [coverImageUrl, setCoverImageUrl] = useState("");
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

    // Reading month is now optional
    if (readMonth) {
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

  const handleGoogleBooksSearch = async () => {
    if (!searchQuery.trim()) {
      toast.error('Please enter a search query');
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(`/api/books/search?q=${encodeURIComponent(searchQuery)}`);

      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.books || []);
        if (data.books?.length === 0) {
          toast.info('No books found. Try a different search.');
        }
      } else if (response.status === 429) {
        // Handle rate limiting
        const error = await response.json();
        const retryAfter = error.retryAfter || '60';
        toast.error(`Rate limit exceeded. Please wait ${retryAfter} seconds and try again.`);
      } else if (response.status === 504) {
        toast.error('Request timed out. Please try again.');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to search books');
      }
    } catch (error) {
      toast.error('Network error. Please check your connection.');
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectBook = (book: GoogleBook) => {
    // Auto-fill form with selected book data
    const titleInput = document.getElementById('title') as HTMLInputElement;
    const authorInput = document.getElementById('author') as HTMLInputElement;
    const descriptionInput = document.getElementById('description') as HTMLTextAreaElement;
    const coverImageInput = document.getElementById('coverImage') as HTMLInputElement;
    const googleBooksIdInput = document.getElementById('googleBooksId') as HTMLInputElement;

    if (titleInput) titleInput.value = book.title;
    if (authorInput) authorInput.value = book.authors.join(', ');
    if (descriptionInput) descriptionInput.value = book.description;
    if (coverImageInput) coverImageInput.value = book.coverImage;
    if (googleBooksIdInput) googleBooksIdInput.value = book.id;

    setCoverImageUrl(book.coverImage);
    setShowSearch(false);
    setSearchResults([]);
    setSearchQuery('');
    toast.success('Book details filled in!');
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

    const readMonth = formData.get('readMonth') as string;
    const status = formData.get('status') as string;

    const bookData = {
      title: (formData.get('title') as string).trim(),
      author: (formData.get('author') as string).trim(),
      description: (formData.get('description') as string || '').trim(),
      readMonth: readMonth || undefined,
      coverImage: (formData.get('coverImage') as string || '').trim(),
      googleBooksId: (formData.get('googleBooksId') as string || '').trim(),
      status: status || 'DRAFT',
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

        {/* Google Books Search */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Search Google Books</CardTitle>
            <p className="text-sm text-muted-foreground">
              Find a book to auto-fill details
            </p>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                placeholder="Search by title, author, or ISBN..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleGoogleBooksSearch())}
              />
              <Button
                type="button"
                onClick={handleGoogleBooksSearch}
                disabled={isSearching}
              >
                {isSearching ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Searching...
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4 mr-2" />
                    Search
                  </>
                )}
              </Button>
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="mt-4 space-y-2 max-h-96 overflow-y-auto">
                {searchResults.map((book) => (
                  <button
                    key={book.id}
                    type="button"
                    onClick={() => handleSelectBook(book)}
                    className="w-full text-left p-3 border rounded-lg hover:bg-accent transition-colors"
                  >
                    <div className="flex gap-3">
                      {book.coverImage && (
                        <img
                          src={book.coverImage}
                          alt={book.title}
                          className="w-12 h-16 object-cover rounded"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{book.title}</p>
                        <p className="text-sm text-muted-foreground truncate">
                          {book.authors.join(', ')}
                        </p>
                        {book.publishedDate && (
                          <p className="text-xs text-muted-foreground">
                            {book.publishedDate}
                          </p>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

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
                  <Label htmlFor="status">Book Status</Label>
                  <select
                    id="status"
                    name="status"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="DRAFT">Draft (Not scheduled)</option>
                    <option value="POLL_CANDIDATE">Available for Polls</option>
                    <option value="SCHEDULED">Scheduled</option>
                    <option value="CURRENT">Current</option>
                  </select>
                  <p className="text-xs text-muted-foreground">
                    Mark as "Available for Polls" to include in voting
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="readMonth">Reading Month (Optional)</Label>
                  <Input
                    id="readMonth"
                    name="readMonth"
                    type="month"
                    className={errors.readMonth ? "border-red-500" : ""}
                  />
                  {errors.readMonth && (
                    <p className="text-sm text-red-600">{errors.readMonth}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Leave blank for poll candidates
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="coverImage">Cover Image URL</Label>
                <Input
                  id="coverImage"
                  name="coverImage"
                  type="url"
                  placeholder="https://example.com/cover.jpg"
                  className={errors.coverImage ? "border-red-500" : ""}
                  value={coverImageUrl}
                  onChange={(e) => setCoverImageUrl(e.target.value)}
                />
                {errors.coverImage && (
                  <p className="text-sm text-red-600">{errors.coverImage}</p>
                )}
              </div>

              {/* Cover Image Preview */}
              {coverImageUrl && (
                <div className="space-y-2">
                  <Label>Cover Preview</Label>
                  <div className="border rounded-lg p-4 bg-muted/30">
                    <img
                      src={coverImageUrl}
                      alt="Book cover preview"
                      className="h-48 w-auto mx-auto object-cover rounded"
                      onError={() => setCoverImageUrl('')}
                    />
                  </div>
                </div>
              )}

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