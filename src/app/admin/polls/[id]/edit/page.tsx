"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { redirect, useRouter, useParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, X, Check, Plus } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

interface AvailableBook {
  id: string;
  title: string;
  author: string;
  coverImage: string | null;
  description: string | null;
  status: string;
}

interface PollData {
  id: string;
  title: string;
  description: string | null;
  startDate: string;
  endDate: string;
  forMonth: string;
  isActive: boolean;
  candidates: {
    book: {
      id: string;
      title: string;
      author: string;
      coverImage: string | null;
    };
  }[];
}

export default function EditPollPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const pollId = params.id as string;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [forMonth, setForMonth] = useState("");
  const [selectedBookIds, setSelectedBookIds] = useState<string[]>([]);
  const [availableBooks, setAvailableBooks] = useState<AvailableBook[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (status === "unauthenticated" || (session && !session.user.isAdmin)) {
      redirect("/");
    }
  }, [status, session]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchPollData();
      fetchAvailableBooks();
    }
  }, [status, pollId]);

  const fetchPollData = async () => {
    try {
      const response = await fetch(`/api/polls/${pollId}`);
      if (response.ok) {
        const poll: PollData = await response.json();

        if (!poll.isActive) {
          setError("Cannot edit a closed poll");
          setIsLoading(false);
          return;
        }

        setTitle(poll.title);
        setDescription(poll.description || "");
        setStartDate(new Date(poll.startDate).toISOString().split("T")[0]);
        setEndDate(new Date(poll.endDate).toISOString().split("T")[0]);
        setForMonth(new Date(poll.forMonth).toISOString().split("T")[0]);
        setSelectedBookIds(poll.candidates.map((c) => c.book.id));
      } else {
        setError("Failed to load poll data");
      }
    } catch (error) {
      console.error("Error fetching poll:", error);
      setError("Failed to load poll data");
    }
  };

  const fetchAvailableBooks = async () => {
    try {
      const response = await fetch("/api/admin/books?status=DRAFT,POLL_CANDIDATE");
      if (response.ok) {
        const data = await response.json();
        setAvailableBooks(data.books || []);
      }
    } catch (error) {
      console.error("Error fetching books:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleBook = (bookId: string) => {
    if (selectedBookIds.includes(bookId)) {
      setSelectedBookIds(selectedBookIds.filter((id) => id !== bookId));
    } else {
      setSelectedBookIds([...selectedBookIds, bookId]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (selectedBookIds.length < 2) {
      setError("Please select at least 2 books for the poll");
      return;
    }

    if (!title || !startDate || !endDate || !forMonth) {
      setError("Please fill in all required fields");
      return;
    }

    setIsUpdating(true);

    try {
      const response = await fetch(`/api/polls/${pollId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          description: description || undefined,
          startDate: new Date(startDate).toISOString(),
          endDate: new Date(endDate).toISOString(),
          forMonth: new Date(forMonth).toISOString(),
          bookIds: selectedBookIds,
        }),
      });

      if (response.ok) {
        router.push("/admin/polls");
      } else {
        const data = await response.json();
        setError(data.error || "Failed to update poll");
      }
    } catch (error) {
      console.error("Error updating poll:", error);
      setError("Failed to update poll");
    } finally {
      setIsUpdating(false);
    }
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="py-8">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-gray-200 rounded w-1/3"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error && !title) {
    return (
      <div className="container mx-auto py-8">
        <Card className="border-destructive">
          <CardContent className="py-8">
            <p className="text-destructive text-center">{error}</p>
            <div className="flex justify-center mt-4">
              <Button asChild>
                <Link href="/admin/polls">Back to Polls</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const selectedBooks = availableBooks.filter((book) =>
    selectedBookIds.includes(book.id)
  );

  return (
    <div className="container mx-auto py-8 space-y-8 max-w-4xl">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/admin/polls">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Link>
            </Button>
            <div>
              <CardTitle className="text-3xl">Edit Poll</CardTitle>
              <CardDescription>
                Update poll details and candidates
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Poll Details */}
        <Card>
          <CardHeader>
            <CardTitle>Poll Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Poll Title *</Label>
              <Input
                id="title"
                placeholder="e.g., March 2025 Book Selection"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                placeholder="Add any context or theme for this poll..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date *</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endDate">End Date *</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="forMonth">Reading Month *</Label>
                <Input
                  id="forMonth"
                  type="date"
                  value={forMonth}
                  onChange={(e) => setForMonth(e.target.value)}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  When will the winning book be read?
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Selected Books Summary */}
        {selectedBooks.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>
                Selected Candidates ({selectedBooks.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {selectedBooks.map((book) => (
                <div
                  key={book.id}
                  className="flex gap-4 p-3 border rounded-lg items-center"
                >
                  <div className="relative h-16 w-12 flex-shrink-0">
                    {book.coverImage ? (
                      <Image
                        src={book.coverImage}
                        alt={book.title}
                        fill
                        className="object-cover rounded"
                      />
                    ) : (
                      <div className="h-full w-full bg-muted flex items-center justify-center rounded text-xs">
                        No cover
                      </div>
                    )}
                  </div>
                  <div className="flex-grow">
                    <h4 className="font-semibold">{book.title}</h4>
                    <p className="text-sm text-muted-foreground">by {book.author}</p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleBook(book.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Available Books */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Select Book Candidates</CardTitle>
                <CardDescription>
                  Choose books to include in this poll (minimum 2 required)
                  <Link href="/admin/books/new" className="block text-primary hover:underline mt-1">
                    Don't see a book? Add it first →
                  </Link>
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {availableBooks.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">
                  No books available for polls yet.
                </p>
                <Button asChild>
                  <Link href="/admin/books/new">Add a Book</Link>
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {availableBooks.map((book) => {
                  const isSelected = selectedBookIds.includes(book.id);
                  return (
                    <button
                      key={book.id}
                      type="button"
                      onClick={() => toggleBook(book.id)}
                      className={`flex gap-3 p-3 border rounded-lg text-left transition-colors ${
                        isSelected
                          ? "ring-2 ring-primary bg-primary/5"
                          : "hover:bg-accent"
                      }`}
                    >
                      <div className="relative h-20 w-14 flex-shrink-0">
                        {book.coverImage ? (
                          <Image
                            src={book.coverImage}
                            alt={book.title}
                            fill
                            className="object-cover rounded"
                          />
                        ) : (
                          <div className="h-full w-full bg-muted flex items-center justify-center rounded text-xs">
                            No cover
                          </div>
                        )}
                      </div>
                      <div className="flex-grow min-w-0">
                        <h4 className="font-semibold line-clamp-2">{book.title}</h4>
                        <p className="text-sm text-muted-foreground">
                          by {book.author}
                        </p>
                      </div>
                      <div className="flex-shrink-0 flex items-start">
                        {isSelected ? (
                          <Check className="h-5 w-5 text-primary" />
                        ) : (
                          <Plus className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {error && (
          <Card className="border-destructive">
            <CardContent className="pt-6">
              <p className="text-sm text-destructive">{error}</p>
            </CardContent>
          </Card>
        )}

        <div className="flex gap-2 justify-end">
          <Button type="button" variant="outline" asChild>
            <Link href="/admin/polls">Cancel</Link>
          </Button>
          <Button type="submit" disabled={isUpdating || selectedBookIds.length < 2}>
            {isUpdating ? "Updating..." : "Update Poll"}
          </Button>
        </div>
      </form>
    </div>
  );
}
