import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updatePollSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  forMonth: z.string().datetime().optional(),
  bookIds: z.array(z.string()).min(2).optional(), // At least 2 books to vote on
});

// GET /api/polls/[id] - Get a specific poll
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    const poll = await prisma.poll.findUnique({
      where: { id: params.id },
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
        votes: session
          ? {
              where: {
                userId: session.user.id,
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
    });

    if (!poll) {
      return NextResponse.json({ error: "Poll not found" }, { status: 404 });
    }

    return NextResponse.json(poll);
  } catch (error) {
    console.error("Error fetching poll:", error);
    return NextResponse.json(
      { error: "Failed to fetch poll" },
      { status: 500 }
    );
  }
}

// PUT /api/polls/[id] - Update a poll (admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = updatePollSchema.parse(body);

    // Check if poll exists and hasn't been closed
    const existingPoll = await prisma.poll.findUnique({
      where: { id: params.id },
      include: {
        candidates: {
          select: {
            bookId: true,
          },
        },
      },
    });

    if (!existingPoll) {
      return NextResponse.json({ error: "Poll not found" }, { status: 404 });
    }

    if (!existingPoll.isActive) {
      return NextResponse.json(
        { error: "Cannot edit a closed poll" },
        { status: 400 }
      );
    }

    // If bookIds are being updated, handle candidate changes
    if (validatedData.bookIds) {
      const oldBookIds = existingPoll.candidates.map((c) => c.bookId);
      const newBookIds = validatedData.bookIds;

      // Delete candidates that are no longer selected
      const toRemove = oldBookIds.filter((id) => !newBookIds.includes(id));
      if (toRemove.length > 0) {
        await prisma.pollCandidate.deleteMany({
          where: {
            pollId: params.id,
            bookId: {
              in: toRemove,
            },
          },
        });

        // Reset removed books' status to DRAFT if they're not in other active polls
        for (const bookId of toRemove) {
          const otherPolls = await prisma.pollCandidate.count({
            where: {
              bookId,
              poll: {
                isActive: true,
              },
            },
          });

          if (otherPolls === 0) {
            await prisma.book.update({
              where: { id: bookId },
              data: { status: "DRAFT" },
            });
          }
        }
      }

      // Add new candidates
      const toAdd = newBookIds.filter((id) => !oldBookIds.includes(id));
      if (toAdd.length > 0) {
        await prisma.pollCandidate.createMany({
          data: toAdd.map((bookId) => ({
            pollId: params.id,
            bookId,
          })),
        });

        // Update new books to POLL_CANDIDATE status
        await prisma.book.updateMany({
          where: {
            id: {
              in: toAdd,
            },
          },
          data: {
            status: "POLL_CANDIDATE",
          },
        });
      }
    }

    // Update poll data
    const updateData: any = {};
    if (validatedData.title !== undefined) updateData.title = validatedData.title;
    if (validatedData.description !== undefined)
      updateData.description = validatedData.description;
    if (validatedData.startDate !== undefined)
      updateData.startDate = new Date(validatedData.startDate);
    if (validatedData.endDate !== undefined)
      updateData.endDate = new Date(validatedData.endDate);
    if (validatedData.forMonth !== undefined)
      updateData.forMonth = new Date(validatedData.forMonth);

    const updatedPoll = await prisma.poll.update({
      where: { id: params.id },
      data: updateData,
      include: {
        candidates: {
          include: {
            book: true,
          },
        },
      },
    });

    return NextResponse.json(updatedPoll);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error updating poll:", error);
    return NextResponse.json(
      { error: "Failed to update poll" },
      { status: 500 }
    );
  }
}

// DELETE /api/polls/[id] - Delete a poll (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if poll exists
    const existingPoll = await prisma.poll.findUnique({
      where: { id: params.id },
      include: {
        candidates: {
          select: {
            bookId: true,
          },
        },
      },
    });

    if (!existingPoll) {
      return NextResponse.json({ error: "Poll not found" }, { status: 404 });
    }

    const bookIds = existingPoll.candidates.map((c) => c.bookId);

    // Delete the poll (candidates and votes will be cascade deleted)
    await prisma.poll.delete({
      where: { id: params.id },
    });

    // Reset book statuses to DRAFT if they're not in other active polls
    for (const bookId of bookIds) {
      const otherPolls = await prisma.pollCandidate.count({
        where: {
          bookId,
          poll: {
            isActive: true,
          },
        },
      });

      if (otherPolls === 0) {
        await prisma.book.update({
          where: { id: bookId },
          data: { status: "DRAFT" },
        });
      }
    }

    return NextResponse.json({ success: true, message: "Poll deleted successfully" });
  } catch (error) {
    console.error("Error deleting poll:", error);
    return NextResponse.json(
      { error: "Failed to delete poll" },
      { status: 500 }
    );
  }
}
