"use client";

import { type Book } from "@/types/prisma";
import Image from "next/image";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface BookCardProps {
  book: Book;
  showReadingProgress?: boolean;
}

export function BookCard({ book, showReadingProgress = false }: BookCardProps) {
  const { data: session } = useSession();
  const [imageError, setImageError] = useState(false);

  console.log("Rendering book:", book);

  return (
    <Card className="overflow-hidden">
      <div
        className="relative aspect-[3/4] w-full"
        style={{ position: "relative" }}
      >
        {book.coverImage && !imageError ? (
          <Image
            src={book.coverImage}
            alt={book.title}
            fill
            className="object-cover"
            onError={() => {
              console.log("Image failed to load:", book.coverImage);
              setImageError(true);
            }}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            priority
          />
        ) : (
          <div className="absolute inset-0 bg-muted flex items-center justify-center">
            <span className="text-muted-foreground">
              {imageError ? "Failed to load cover" : "No cover available"}
            </span>
          </div>
        )}
      </div>
      <CardHeader>
        <CardTitle>{book.title}</CardTitle>
        <CardDescription>by {book.author}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {book.readMonth && (
          <p className="text-sm text-muted-foreground">
            Reading in{" "}
            {new Date(book.readMonth).toLocaleDateString("en-US", {
              month: "long",
              year: "numeric",
            })}
          </p>
        )}
        {book.description && (
          <p className="text-sm line-clamp-3">{book.description}</p>
        )}
      </CardContent>
      <CardFooter>
        {session ? (
          <Button asChild className="w-full">
            <Link href={`/books/${book.id}`}>View Details</Link>
          </Button>
        ) : (
          <Button asChild className="w-full">
            <Link href="/signin">Sign in to Join</Link>
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
