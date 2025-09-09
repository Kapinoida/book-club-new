import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ReadingProgress } from "@/components/books/reading-progress";
import { DiscussionSection } from "@/components/books/discussion-section";
import Image from "next/image";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

async function getCurrentBook() {
  const currentDate = new Date();
  const book = await prisma.book.findFirst({
    where: {
      readMonth: {
        gte: new Date(currentDate.getFullYear(), currentDate.getMonth(), 1),
      },
    },
    include: {
      discussionQuestions: {
        orderBy: {
          breakpoint: "asc",
        },
      },
    },
    orderBy: {
      readMonth: "asc",
    },
  });

  return book;
}

async function getUserProgress(bookId: string, userId: string) {
  return prisma.readingProgress.findUnique({
    where: {
      userId_bookId: {
        userId,
        bookId,
      },
    },
  });
}

export default async function CurrentBook() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/signin");
  }

  const book = await getCurrentBook();

  if (!book) {
    return (
      <Card className="max-w-lg mx-auto">
        <CardHeader>
          <CardTitle>No Current Book</CardTitle>
          <CardDescription>
            Check back later for the next book selection.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const progress = await getUserProgress(book.id, session.user.id);

  return (
    <div className="container space-y-8">
      <Card>
        <div className="md:flex">
          <div className="md:flex-shrink-0">
            <div className="h-64 w-full md:w-48 relative">
              {book.coverImage ? (
                <Image
                  src={book.coverImage}
                  alt={book.title}
                  fill
                  className="object-cover rounded-l-lg"
                />
              ) : (
                <div className="w-full h-full bg-muted flex items-center justify-center rounded-l-lg">
                  <span className="text-muted-foreground">
                    No cover available
                  </span>
                </div>
              )}
            </div>
          </div>
          <div className="flex-grow">
            <CardHeader>
              <CardDescription className="text-primary">
                Current Book
              </CardDescription>
              <CardTitle className="text-3xl">{book.title}</CardTitle>
              <p className="text-xl text-muted-foreground">by {book.author}</p>
            </CardHeader>
            <CardContent className="space-y-6">
              {book.description && (
                <p className="text-muted-foreground">{book.description}</p>
              )}
              <ReadingProgress
                bookId={book.id}
                initialProgress={progress?.progress ?? 0}
                isFinished={progress?.isFinished ?? false}
              />
            </CardContent>
          </div>
        </div>
      </Card>

      <DiscussionSection
        questions={book.discussionQuestions}
        currentProgress={progress?.progress ?? 0}
        bookId={book.id}
      />
    </div>
  );
}
