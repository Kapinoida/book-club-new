"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Plus, Check } from "lucide-react";
import Image from "next/image";

interface GoogleBook {
  id: string;
  volumeInfo: {
    title: string;
    authors?: string[];
    description?: string;
    imageLinks?: {
      thumbnail?: string;
      smallThumbnail?: string;
    };
  };
}

interface BookSearchProps {
  onSelectBook: (book: {
    title: string;
    author: string;
    coverImage?: string;
    description?: string;
    googleBooksId: string;
  }) => void;
  selectedBookIds?: string[];
}

export function BookSearch({ onSelectBook, selectedBookIds = [] }: BookSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GoogleBook[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsSearching(true);
    try {
      const response = await fetch(`/api/books/search?q=${encodeURIComponent(query)}`);
      if (response.ok) {
        const data = await response.json();
        setResults(data.items || []);
      }
    } catch (error) {
      console.error("Error searching books:", error);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSearch} className="flex gap-2">
        <Input
          placeholder="Search for books..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-grow"
        />
        <Button type="submit" disabled={isSearching}>
          <Search className="h-4 w-4 mr-2" />
          {isSearching ? "Searching..." : "Search"}
        </Button>
      </form>

      {results.length > 0 && (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {results.map((book) => {
            const isSelected = selectedBookIds.includes(book.id);
            return (
              <Card key={book.id} className={isSelected ? "ring-2 ring-primary" : ""}>
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    <div className="relative h-20 w-14 flex-shrink-0">
                      {book.volumeInfo.imageLinks?.thumbnail ? (
                        <Image
                          src={book.volumeInfo.imageLinks.thumbnail}
                          alt={book.volumeInfo.title}
                          fill
                          className="object-cover rounded"
                        />
                      ) : (
                        <div className="h-full w-full bg-muted flex items-center justify-center rounded">
                          <span className="text-xs text-muted-foreground">No cover</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-grow">
                      <h4 className="font-semibold">{book.volumeInfo.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        by {book.volumeInfo.authors?.join(", ") || "Unknown"}
                      </p>
                      {book.volumeInfo.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                          {book.volumeInfo.description}
                        </p>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant={isSelected ? "secondary" : "outline"}
                      onClick={() =>
                        onSelectBook({
                          title: book.volumeInfo.title,
                          author: book.volumeInfo.authors?.join(", ") || "Unknown",
                          coverImage: book.volumeInfo.imageLinks?.thumbnail,
                          description: book.volumeInfo.description,
                          googleBooksId: book.id,
                        })
                      }
                      disabled={isSelected}
                    >
                      {isSelected ? (
                        <>
                          <Check className="h-4 w-4 mr-1" />
                          Added
                        </>
                      ) : (
                        <>
                          <Plus className="h-4 w-4 mr-1" />
                          Add
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
