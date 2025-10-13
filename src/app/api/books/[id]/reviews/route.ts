import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const reviewSchema = z.object({
  rating: z.number().min(1).max(5),
  review: z.string().optional(),
});

// GET /api/books/[id]/reviews - Get all reviews for a book
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const reviews = await prisma.review.findMany({
      where: {
        bookId: params.id,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
      orderBy: {
        created_at: "desc",
      },
    });

    // Calculate average rating
    const averageRating = reviews.length > 0
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
      : 0;

    return NextResponse.json({
      reviews,
      averageRating,
      totalReviews: reviews.length,
    });
  } catch (error) {
    console.error("Error fetching reviews:", error);
    return NextResponse.json(
      { error: "Failed to fetch reviews" },
      { status: 500 }
    );
  }
}

// POST /api/books/[id]/reviews - Create or update a review
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
    const validatedData = reviewSchema.parse(body);

    // Check if user has finished reading the book
    const readingProgress = await prisma.readingProgress.findUnique({
      where: {
        userId_bookId: {
          userId: session.user.id,
          bookId: params.id,
        },
      },
    });

    if (!readingProgress || !readingProgress.isFinished) {
      return NextResponse.json(
        { error: "You must finish reading the book before leaving a review" },
        { status: 403 }
      );
    }

    // Upsert the review (create or update if exists)
    const review = await prisma.review.upsert({
      where: {
        userId_bookId: {
          userId: session.user.id,
          bookId: params.id,
        },
      },
      update: {
        rating: validatedData.rating,
        review: validatedData.review,
      },
      create: {
        userId: session.user.id,
        bookId: params.id,
        rating: validatedData.rating,
        review: validatedData.review,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    });

    return NextResponse.json(review);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error creating review:", error);
    return NextResponse.json(
      { error: "Failed to create review" },
      { status: 500 }
    );
  }
}

// DELETE /api/books/[id]/reviews - Delete user's review
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await prisma.review.delete({
      where: {
        userId_bookId: {
          userId: session.user.id,
          bookId: params.id,
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting review:", error);
    return NextResponse.json(
      { error: "Failed to delete review" },
      { status: 500 }
    );
  }
}
