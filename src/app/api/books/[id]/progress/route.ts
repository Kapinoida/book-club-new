import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user || !session.user.email) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
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

    const bookId = params.id;
    
    // Get reading progress from database
    const readingProgress = await prisma.readingProgress.findUnique({
      where: {
        userId_bookId: {
          userId: user.id,
          bookId: bookId
        }
      }
    });
    
    const progress = readingProgress?.progress || 0;
    
    return NextResponse.json({ 
      bookId,
      userId: user.id,
      progress,
      unlockedDiscussions: getUnlockedDiscussions(progress)
    });
  } catch (error) {
    console.error("Error fetching progress:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user || !session.user.email) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { progress } = await request.json();
    
    if (typeof progress !== "number" || progress < 0 || progress > 100) {
      return NextResponse.json(
        { error: "Progress must be a number between 0 and 100" },
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

    const bookId = params.id;
    
    // Get current progress
    const currentProgress = await prisma.readingProgress.findUnique({
      where: {
        userId_bookId: {
          userId: user.id,
          bookId: bookId
        }
      }
    });
    
    const oldProgress = currentProgress?.progress || 0;
    const newProgress = Math.max(oldProgress, progress); // Only allow progress to increase
    
    // Upsert reading progress
    const updatedProgress = await prisma.readingProgress.upsert({
      where: {
        userId_bookId: {
          userId: user.id,
          bookId: bookId
        }
      },
      update: {
        progress: newProgress,
        isFinished: newProgress >= 100
      },
      create: {
        userId: user.id,
        bookId: bookId,
        progress: newProgress,
        isFinished: newProgress >= 100
      }
    });
    
    const unlockedDiscussions = getUnlockedDiscussions(newProgress);
    const previouslyUnlocked = getUnlockedDiscussions(oldProgress);
    const newlyUnlocked = unlockedDiscussions.filter(d => !previouslyUnlocked.includes(d));

    return NextResponse.json({ 
      bookId,
      userId: user.id,
      progress: newProgress,
      unlockedDiscussions,
      newlyUnlocked,
      message: newlyUnlocked.length > 0 ? `Unlocked ${newlyUnlocked.length} new discussion(s)!` : "Progress updated"
    });
  } catch (error) {
    console.error("Error updating progress:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Helper function to determine which discussions are unlocked based on progress
function getUnlockedDiscussions(progress: number): string[] {
  const discussions = [
    { id: "1", unlockAt: 25 },
    { id: "2", unlockAt: 50 }, 
    { id: "3", unlockAt: 75 },
    { id: "4", unlockAt: 90 }
  ];
  
  return discussions
    .filter(discussion => progress >= discussion.unlockAt)
    .map(discussion => discussion.id);
}