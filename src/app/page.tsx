import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { BookCard } from "@/components/books/book-card";
import { type Book } from "@/types/prisma";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

async function getBooks(): Promise<Book[]> {
  try {
    const books = await prisma.book.findMany({
      orderBy: { readMonth: 'asc' }
    });
    return books;
  } catch (error) {
    console.error("Error fetching books:", error);
    return [];
  }
}

export default async function Home() {
  const session = await getServerSession(authOptions);
  const books = await getBooks();

  return (
    <div className="container mx-auto py-8 space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-4xl">Welcome to Book Club</CardTitle>
          <CardDescription className="text-lg">
            Join us in reading and discussing thought-provoking books each
            month.
          </CardDescription>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Current & Upcoming Books</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-8">
            {books.length > 0 ? (
              books.map((book) => <BookCard key={book.id} book={book} />)
            ) : (
              <p className="text-muted-foreground">
                No books found for the current month.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {!session && (
        <Card>
          <CardHeader>
            <CardTitle>Join Our Book Club</CardTitle>
            <CardDescription>
              Sign in to track your reading progress, participate in
              discussions, and connect with other readers.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/signin">
              <Button className="w-full">Sign in to Join</Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
