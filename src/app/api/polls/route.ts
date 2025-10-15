import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createPollSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  forMonth: z.string().datetime(),
  bookIds: z.array(z.string()).min(2), // At least 2 books to vote on
});

// GET /api/polls - Get all polls
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get("active") === "true";

    const where = activeOnly ? { isActive: true } : {};

    const polls = await prisma.poll.findMany({
      where,
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
      orderBy: {
        startDate: "desc",
      },
    });

    return NextResponse.json(polls);
  } catch (error) {
    console.error("Error fetching polls:", error);
    return NextResponse.json(
      { error: "Failed to fetch polls" },
      { status: 500 }
    );
  }
}

// POST /api/polls - Create a new poll (admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createPollSchema.parse(body);

    // Create poll with candidates
    const poll = await prisma.poll.create({
      data: {
        title: validatedData.title,
        description: validatedData.description,
        startDate: new Date(validatedData.startDate),
        endDate: new Date(validatedData.endDate),
        forMonth: new Date(validatedData.forMonth),
        isActive: true, // Polls are active by default until manually closed
        candidates: {
          create: validatedData.bookIds.map((bookId) => ({
            bookId,
          })),
        },
      },
      include: {
        candidates: {
          include: {
            book: true,
          },
        },
      },
    });

    // Update books to POLL_CANDIDATE status
    await prisma.book.updateMany({
      where: {
        id: {
          in: validatedData.bookIds,
        },
      },
      data: {
        status: "POLL_CANDIDATE",
      },
    });

    return NextResponse.json(poll);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error creating poll:", error);
    return NextResponse.json(
      { error: "Failed to create poll" },
      { status: 500 }
    );
  }
}
