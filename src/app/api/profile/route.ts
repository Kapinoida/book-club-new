import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/profile - Get user profile data with stats
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch user with related data
    const user = await prisma.user.findUnique({
      where: {
        id: session.user.id,
      },
      include: {
        readingProgress: {
          include: {
            book: {
              select: {
                id: true,
                title: true,
                author: true,
                coverImage: true,
                readMonth: true,
              },
            },
          },
          orderBy: {
            updated_at: "desc",
          },
        },
        reviews: {
          include: {
            book: {
              select: {
                id: true,
                title: true,
                author: true,
                coverImage: true,
                readMonth: true,
              },
            },
          },
          orderBy: {
            created_at: "desc",
          },
        },
        comments: {
          include: {
            book: {
              select: {
                id: true,
                title: true,
              },
            },
            question: {
              select: {
                id: true,
                question: true,
              },
            },
          },
          orderBy: {
            created_at: "desc",
          },
          take: 10,
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Calculate stats
    const stats = {
      booksStarted: user.readingProgress.length,
      booksFinished: user.readingProgress.filter((p) => p.isFinished).length,
      reviewsWritten: user.reviews.length,
      commentsPosted: user.comments.length,
      currentStreak: user.currentStreak,
      longestStreak: user.longestStreak,
    };

    // Organize books by status
    const currentBooks = user.readingProgress.filter(
      (p) => !p.isFinished && p.progress > 0
    );
    const finishedBooks = user.readingProgress.filter((p) => p.isFinished);

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        username: user.username,
        bio: user.bio,
        favoriteGenres: user.favoriteGenres,
        location: user.location,
        website: user.website,
        created_at: user.created_at,
      },
      stats,
      currentBooks,
      finishedBooks,
      reviews: user.reviews,
      recentComments: user.comments,
    });
  } catch (error) {
    console.error("Error fetching profile:", error);
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 }
    );
  }
}
