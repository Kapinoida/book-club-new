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
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

async function getCurrentAndUpcomingBooks(): Promise<Book[]> {
  try {
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const books = await prisma.book.findMany({
      where: {
        readMonth: {
          gte: currentMonthStart
        }
      },
      orderBy: { readMonth: 'asc' },
      take: 3 // Show up to 3 upcoming books
    });
    return books;
  } catch (error) {
    console.error("Error fetching books:", error);
    return [];
  }
}

export default async function Home() {
  const session = await getServerSession(authOptions);
  const books = await getCurrentAndUpcomingBooks();

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
          {books.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-8">
              {books.map((book: Book) => <BookCard key={book.id} book={book} />)}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <div className="text-6xl">📚</div>
              <h3 className="text-2xl font-semibold">Coming Soon</h3>
              <p className="text-muted-foreground text-center max-w-md">
                We're currently selecting our next book. Check back soon for the announcement!
              </p>
              <Link href="/archive">
                <Button variant="outline">Browse Past Books</Button>
              </Link>
            </div>
          )}
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
