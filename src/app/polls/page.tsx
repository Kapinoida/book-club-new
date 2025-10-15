import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PollsList } from "@/components/polls/polls-list";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

async function getPolls(userId?: string) {
  try {
    const polls = await prisma.poll.findMany({
      include: {
        candidates: {
          include: {
            book: {
              select: {
                id: true,
                title: true,
                author: true,
                coverImage: true,
                description: true,
              },
            },
          },
          orderBy: {
            voteCount: "desc",
          },
        },
        votes: userId
          ? {
              where: {
                userId: userId,
              },
              select: {
                bookId: true,
              },
            }
          : false,
        _count: {
          select: {
            votes: true,
          },
        },
      },
      orderBy: {
        startDate: "desc",
      },
    });

    return polls;
  } catch (error) {
    console.error("Error fetching polls:", error);
    return [];
  }
}

export default async function PollsPage() {
  const session = await getServerSession(authOptions);
  const polls = await getPolls(session?.user?.id);

  return (
    <div className="container mx-auto py-8 space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-4xl">Book Selection Polls</CardTitle>
          <CardDescription className="text-lg">
            Vote for the books you'd like to read next! The book with the most votes
            will be selected for the upcoming month.
          </CardDescription>
        </CardHeader>
      </Card>

      {polls.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <h3 className="text-xl font-semibold mb-2">No Polls Yet</h3>
            <p className="text-muted-foreground mb-4">
              Check back soon for upcoming book selection polls!
            </p>
          </CardContent>
        </Card>
      ) : (
        <PollsList polls={polls} isLoggedIn={!!session} />
      )}
    </div>
  );
}
