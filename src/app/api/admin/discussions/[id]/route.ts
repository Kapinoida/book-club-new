import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.isAdmin) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    const { question, breakpoint } = await request.json();
    
    if (!question || !breakpoint) {
      return NextResponse.json(
        { error: "Question and breakpoint are required" },
        { status: 400 }
      );
    }

    if (breakpoint < 1 || breakpoint > 100) {
      return NextResponse.json(
        { error: "Breakpoint must be between 1 and 100" },
        { status: 400 }
      );
    }

    const existingDiscussion = await prisma.discussionQuestion.findUnique({
      where: { id: params.id }
    });

    if (!existingDiscussion) {
      return NextResponse.json(
        { error: "Discussion question not found" },
        { status: 404 }
      );
    }

    const updatedDiscussion = await prisma.discussionQuestion.update({
      where: { id: params.id },
      data: {
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
      id: updatedDiscussion.id,
      bookId: updatedDiscussion.bookId,
      bookTitle: updatedDiscussion.book.title,
      question: updatedDiscussion.question,
      breakpoint: updatedDiscussion.breakpoint,
      responses: updatedDiscussion._count.comments,
      created_at: updatedDiscussion.created_at
    };

    return NextResponse.json(formattedDiscussion);
  } catch (error) {
    console.error("Error updating discussion:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.isAdmin) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    const existingDiscussion = await prisma.discussionQuestion.findUnique({
      where: { id: params.id }
    });

    if (!existingDiscussion) {
      return NextResponse.json(
        { error: "Discussion question not found" },
        { status: 404 }
      );
    }

    await prisma.discussionQuestion.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ message: "Discussion question deleted successfully" });
  } catch (error) {
    console.error("Error deleting discussion:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}