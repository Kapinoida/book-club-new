import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.isAdmin) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    const discussions = await prisma.discussionQuestion.findMany({
      include: {
        book: {
          select: {
            id: true,
            title: true
          }
        },
        _count: {
          select: {
            comments: true
          }
        }
      },
      orderBy: [
        { book: { readMonth: 'desc' } },
        { breakpoint: 'asc' }
      ]
    });

    const formattedDiscussions = discussions.map(discussion => ({
      id: discussion.id,
      bookId: discussion.bookId,
      bookTitle: discussion.book.title,
      question: discussion.question,
      breakpoint: discussion.breakpoint,
      responses: discussion._count.comments,
      created_at: discussion.created_at
    }));

    return NextResponse.json(formattedDiscussions);
  } catch (error) {
    console.error("Error fetching discussions:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.isAdmin) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    const { bookId, question, breakpoint } = await request.json();
    
    if (!bookId || !question || !breakpoint) {
      return NextResponse.json(
        { error: "Book ID, question, and breakpoint are required" },
        { status: 400 }
      );
    }

    if (breakpoint < 1 || breakpoint > 100) {
      return NextResponse.json(
        { error: "Breakpoint must be between 1 and 100" },
        { status: 400 }
      );
    }

    // Check if book exists
    const book = await prisma.book.findUnique({
      where: { id: bookId }
    });

    if (!book) {
      return NextResponse.json(
        { error: "Book not found" },
        { status: 404 }
      );
    }

    const newDiscussion = await prisma.discussionQuestion.create({
      data: {
        bookId,
        question: question.trim(),
        breakpoint: parseInt(breakpoint.toString()),
      },
      include: {
        book: {
          select: {
            id: true,
            title: true
          }
        },
        _count: {
          select: {
            comments: true
          }
        }
      }
    });

    const formattedDiscussion = {
      id: newDiscussion.id,
      bookId: newDiscussion.bookId,
      bookTitle: newDiscussion.book.title,
      question: newDiscussion.question,
      breakpoint: newDiscussion.breakpoint,
      responses: newDiscussion._count.comments,
      created_at: newDiscussion.created_at
    };

    return NextResponse.json(formattedDiscussion, { status: 201 });
  } catch (error) {
    console.error("Error creating discussion:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}