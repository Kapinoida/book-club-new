"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminGuard } from "@/components/admin/admin-guard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { ArrowLeft, Plus, Edit, Trash2, Sparkles, MessageCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";

export default function ManageBooks() {
  const [books, setBooks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [generatingFor, setGeneratingFor] = useState<string | null>(null);

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
        setIsLoading(false);
      }
    };

    fetchBooks();
  }, []);

  const handleGenerateQuestions = async (bookId: string) => {
    if (!confirm('Generate discussion questions for this book? This will create spoiler-free questions at 25%, 50%, 75%, and 90% breakpoints.')) {
      return;
    }

    setGeneratingFor(bookId);
    try {
      const response = await fetch(`/api/admin/books/${bookId}/generate-questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          breakpoints: [25, 50, 75, 90],
          questionsPerBreakpoint: 3
        })
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(data.message);
        // Refresh books to update question count
        const booksResponse = await fetch('/api/admin/books');
        if (booksResponse.ok) {
          const booksData = await booksResponse.json();
          setBooks(booksData);
        }
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to generate questions');
      }
    } catch (error) {
      toast.error('Failed to generate questions');
      console.error('Error generating questions:', error);
    } finally {
      setGeneratingFor(null);
    }
  };

  const handleDelete = async (bookId: string) => {
    if (!confirm('Are you sure you want to delete this book? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/books/${bookId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setBooks(books.filter(book => book.id !== bookId));
        toast.success('Book deleted successfully!');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to delete book');
      }
    } catch (error) {
      toast.error('Failed to delete book');
      console.error('Error deleting book:', error);
    }
  };

  if (isLoading) {
    return (
      <AdminGuard>
        <div className="container mx-auto py-8">
          <Card>
            <CardContent className="py-8">
              <div className="animate-pulse space-y-4">
                <div className="h-8 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="bg-gray-200 rounded-lg h-96"></div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </AdminGuard>
    );
  }

  return (
    <AdminGuard>
      <div className="container mx-auto py-8 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/admin">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Manage Books</h1>
              <p className="text-muted-foreground">
                Add, edit, and organize your book club selections
              </p>
            </div>
          </div>
          <Button asChild>
            <Link href="/admin/books/new">
              <Plus className="h-4 w-4 mr-2" />
              Add New Book
            </Link>
          </Button>
        </div>

        {/* Books Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {books.map((book) => (
            <Card key={book.id} className="overflow-hidden">
              <div className="aspect-[3/4] bg-gray-100 flex items-center justify-center">
                {book.coverImage ? (
                  <img
                    src={book.coverImage}
                    alt={book.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-gray-400">No Cover</div>
                )}
              </div>
              <CardHeader>
                <CardTitle className="text-lg">{book.title}</CardTitle>
                <p className="text-sm text-muted-foreground">by {book.author}</p>
                <p className="text-xs text-muted-foreground">
                  Reading: {new Date(book.readMonth).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long' 
                  })}
                </p>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                  {book.description}
                </p>

                {/* Question Count Badge */}
                <div className="mb-3">
                  <Badge variant={book._count?.discussionQuestions > 0 ? "default" : "secondary"}>
                    <MessageCircle className="h-3 w-3 mr-1" />
                    {book._count?.discussionQuestions || 0} questions
                  </Badge>
                </div>

                <div className="space-y-2">
                  {/* Generate Questions Button */}
                  {(!book._count?.discussionQuestions || book._count.discussionQuestions === 0) && (
                    <Button
                      variant="default"
                      size="sm"
                      className="w-full"
                      onClick={() => handleGenerateQuestions(book.id)}
                      disabled={generatingFor === book.id}
                    >
                      <Sparkles className="h-3 w-3 mr-1" />
                      {generatingFor === book.id ? 'Generating...' : 'Generate Questions'}
                    </Button>
                  )}

                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1" asChild>
                      <Link href={`/admin/books/${book.id}/edit`}>
                        <Edit className="h-3 w-3 mr-1" />
                        Edit
                      </Link>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 text-destructive hover:text-destructive"
                      onClick={() => handleDelete(book.id)}
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {books.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <h3 className="text-lg font-semibold mb-2">No books yet</h3>
              <p className="text-muted-foreground mb-4">
                Get started by adding your first book to the club
              </p>
              <Button asChild>
                <Link href="/admin/books/new">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Book
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminGuard>
  );
}