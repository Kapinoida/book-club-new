import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateUserStreak } from "@/lib/streak-service";
import { checkAndAwardBadges } from "@/lib/badge-service";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !session.user.email) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { commentId, reviewId, type } = await request.json();

    if (!type || !["LIKE", "INSIGHTFUL", "HELPFUL", "THOUGHTFUL"].includes(type)) {
      return NextResponse.json(
        { error: "Invalid reaction type" },
        { status: 400 }
      );
    }

    if (!commentId && !reviewId) {
      return NextResponse.json(
        { error: "Either commentId or reviewId is required" },
        { status: 400 }
      );
    }

    if (commentId && reviewId) {
      return NextResponse.json(
        { error: "Cannot react to both comment and review" },
        { status: 400 }
      );
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Check if reaction already exists
    const existingReaction = await prisma.reaction.findFirst({
      where: {
        userId: user.id,
        commentId: commentId || null,
        reviewId: reviewId || null,
        type: type
      }
    });

    if (existingReaction) {
      // Remove reaction (toggle off)
      await prisma.reaction.delete({
        where: { id: existingReaction.id }
      });

      return NextResponse.json({ removed: true });
    } else {
      // Add reaction
      const newReaction = await prisma.reaction.create({
        data: {
          userId: user.id,
          commentId: commentId || null,
          reviewId: reviewId || null,
          type: type
        }
      });

      // Update user's streak (only when adding, not removing)
      // Note: We don't check badges here to avoid connection pool issues with frequent reactions
      await updateUserStreak(user.id);

      return NextResponse.json({ added: true, reaction: newReaction }, { status: 201 });
    }
  } catch (error) {
    console.error("Error handling reaction:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const commentId = searchParams.get("commentId");
    const reviewId = searchParams.get("reviewId");

    if (!commentId && !reviewId) {
      return NextResponse.json(
        { error: "Either commentId or reviewId is required" },
        { status: 400 }
      );
    }

    const whereClause: any = {};
    if (commentId) whereClause.commentId = commentId;
    if (reviewId) whereClause.reviewId = reviewId;

    const reactions = await prisma.reaction.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });

    // Group reactions by type and count them
    const reactionCounts: Record<string, { count: number; users: string[] }> = {
      LIKE: { count: 0, users: [] },
      INSIGHTFUL: { count: 0, users: [] },
      HELPFUL: { count: 0, users: [] },
      THOUGHTFUL: { count: 0, users: [] }
    };

    reactions.forEach(reaction => {
      reactionCounts[reaction.type].count++;
      reactionCounts[reaction.type].users.push(reaction.user.email || "");
    });

    return NextResponse.json(reactionCounts);
  } catch (error) {
    console.error("Error fetching reactions:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
