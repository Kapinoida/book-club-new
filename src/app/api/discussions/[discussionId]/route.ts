import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: { discussionId: string } }
) {
  try {
    const discussion = await prisma.discussionQuestion.findUnique({
      where: { id: params.discussionId },
      include: {
        book: {
          select: {
            id: true,
            title: true
          }
        }
      }
    });

    if (!discussion) {
      return NextResponse.json(
        { error: "Discussion question not found" },
        { status: 404 }
      );
    }

    // Format the response to match frontend expectations
    const formattedDiscussion = {
      id: discussion.id,
      bookId: discussion.bookId,
      bookTitle: discussion.book.title,
      question: discussion.question,
      breakpoint: discussion.breakpoint
    };

    return NextResponse.json(formattedDiscussion);
  } catch (error) {
    console.error("Error fetching discussion:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}