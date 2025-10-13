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

async function getPastBooks(): Promise<Book[]> {
  try {
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const books = await prisma.book.findMany({
      where: {
        readMonth: {
          lt: currentMonthStart
        }
      },
      orderBy: { readMonth: 'desc' } // Most recent first
    });
    return books;
  } catch (error) {
    console.error("Error fetching past books:", error);
    return [];
  }
}

export default async function ArchivePage() {
  const session = await getServerSession(authOptions);
  const books = await getPastBooks();

  return (
    <div className="container mx-auto py-8 space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-4xl">Book Archive</CardTitle>
          <CardDescription className="text-lg">
            Browse our past book selections and revisit discussions.
            {session && " Track your reading progress and participate in discussions anytime!"}
          </CardDescription>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Past Books</CardTitle>
        </CardHeader>
        <CardContent>
          {books.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {books.map((book: Book) => (
                <BookCard key={book.id} book={book} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <div className="text-6xl">📖</div>
              <h3 className="text-2xl font-semibold">No Past Books Yet</h3>
              <p className="text-muted-foreground text-center max-w-md">
                We're just getting started! Check back after we've completed our first book.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
