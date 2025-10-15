import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST /api/polls/[id]/close - Close poll and calculate rankings (admin only)
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const poll = await prisma.poll.findUnique({
      where: { id: params.id },
      include: {
        candidates: {
          include: {
            book: true,
          },
          orderBy: {
            voteCount: "desc",
          },
        },
      },
    });

    if (!poll) {
      return NextResponse.json({ error: "Poll not found" }, { status: 404 });
    }

    if (!poll.isActive) {
      return NextResponse.json(
        { error: "Poll is already closed" },
        { status: 400 }
      );
    }

    // Calculate rankings based on vote count
    const rankedCandidates = poll.candidates.map((candidate, index) => ({
      id: candidate.id,
      rank: index + 1,
    }));

    // Update poll and candidates in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update poll to inactive
      const updatedPoll = await tx.poll.update({
        where: { id: params.id },
        data: { isActive: false },
      });

      // Update candidate rankings
      for (const candidate of rankedCandidates) {
        await tx.pollCandidate.update({
          where: { id: candidate.id },
          data: { rank: candidate.rank },
        });
      }

      // Get the winner (rank 1)
      const winner = poll.candidates[0];

      // Update winner book status to SCHEDULED and set readMonth
      if (winner) {
        await tx.book.update({
          where: { id: winner.bookId },
          data: {
            status: "SCHEDULED",
            readMonth: poll.forMonth,
          },
        });

        // Update other candidates back to DRAFT
        const loserIds = poll.candidates.slice(1).map((c) => c.bookId);
        if (loserIds.length > 0) {
          await tx.book.updateMany({
            where: {
              id: {
                in: loserIds,
              },
            },
            data: {
              status: "DRAFT",
            },
          });
        }
      }

      return updatedPoll;
    });

    return NextResponse.json({
      success: true,
      poll: result,
      winner: poll.candidates[0],
    });
  } catch (error) {
    console.error("Error closing poll:", error);
    return NextResponse.json(
      { error: "Failed to close poll" },
      { status: 500 }
    );
  }
}
