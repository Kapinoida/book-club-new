import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const voteSchema = z.object({
  bookId: z.string(),
});

// POST /api/polls/[id]/vote - Cast or change vote
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { bookId } = voteSchema.parse(body);

    // Check if poll exists and is active
    const poll = await prisma.poll.findUnique({
      where: { id: params.id },
      include: {
        candidates: {
          select: {
            bookId: true,
          },
        },
      },
    });

    if (!poll) {
      return NextResponse.json({ error: "Poll not found" }, { status: 404 });
    }

    // Check if poll is still open
    const now = new Date();
    if (now < poll.startDate || now > poll.endDate) {
      return NextResponse.json(
        { error: "Poll is not currently open for voting" },
        { status: 400 }
      );
    }

    // Check if book is a candidate in this poll
    const isValidCandidate = poll.candidates.some((c) => c.bookId === bookId);
    if (!isValidCandidate) {
      return NextResponse.json(
        { error: "Book is not a candidate in this poll" },
        { status: 400 }
      );
    }

    // Get existing vote to update counts
    const existingVote = await prisma.vote.findUnique({
      where: {
        userId_pollId: {
          userId: session.user.id,
          pollId: params.id,
        },
      },
    });

    // Use transaction to ensure vote counts stay accurate
    const result = await prisma.$transaction(async (tx) => {
      // If changing vote, decrement old candidate's count
      if (existingVote && existingVote.bookId !== bookId) {
        await tx.pollCandidate.updateMany({
          where: {
            pollId: params.id,
            bookId: existingVote.bookId,
          },
          data: {
            voteCount: {
              decrement: 1,
            },
          },
        });
      }

      // Upsert the vote
      const vote = await tx.vote.upsert({
        where: {
          userId_pollId: {
            userId: session.user.id,
            pollId: params.id,
          },
        },
        update: {
          bookId,
        },
        create: {
          userId: session.user.id,
          pollId: params.id,
          bookId,
        },
      });

      // Increment new candidate's count (or maintain if same book)
      if (!existingVote || existingVote.bookId !== bookId) {
        await tx.pollCandidate.updateMany({
          where: {
            pollId: params.id,
            bookId,
          },
          data: {
            voteCount: {
              increment: 1,
            },
          },
        });
      }

      return vote;
    });

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error casting vote:", error);
    return NextResponse.json(
      { error: "Failed to cast vote" },
      { status: 500 }
    );
  }
}

// DELETE /api/polls/[id]/vote - Remove vote
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const existingVote = await prisma.vote.findUnique({
      where: {
        userId_pollId: {
          userId: session.user.id,
          pollId: params.id,
        },
      },
    });

    if (!existingVote) {
      return NextResponse.json({ error: "No vote to remove" }, { status: 404 });
    }

    // Use transaction to keep counts accurate
    await prisma.$transaction(async (tx) => {
      // Delete the vote
      await tx.vote.delete({
        where: {
          userId_pollId: {
            userId: session.user.id,
            pollId: params.id,
          },
        },
      });

      // Decrement candidate's count
      await tx.pollCandidate.updateMany({
        where: {
          pollId: params.id,
          bookId: existingVote.bookId,
        },
        data: {
          voteCount: {
            decrement: 1,
          },
        },
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing vote:", error);
    return NextResponse.json(
      { error: "Failed to remove vote" },
      { status: 500 }
    );
  }
}
