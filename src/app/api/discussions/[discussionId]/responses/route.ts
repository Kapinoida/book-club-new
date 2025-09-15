import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: { discussionId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user || !session.user.email) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { content } = await request.json();
    
    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { error: "Response content is required" },
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

    // Find the discussion question to get bookId
    const discussionQuestion = await prisma.discussionQuestion.findUnique({
      where: { id: params.discussionId }
    });

    if (!discussionQuestion) {
      return NextResponse.json(
        { error: "Discussion question not found" },
        { status: 404 }
      );
    }

    // Create new comment/response
    const newComment = await prisma.comment.create({
      data: {
        content: content.trim(),
        userId: user.id,
        bookId: discussionQuestion.bookId,
        questionId: params.discussionId,
      },
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });

    // Format response to match frontend expectations
    const response = {
      id: newComment.id,
      content: newComment.content,
      author: {
        name: newComment.user.name || "Anonymous",
        email: newComment.user.email || ""
      },
      created_at: newComment.created_at.toISOString()
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error("Error creating response:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { discussionId: string } }
) {
  try {
    // Get comments for this discussion question
    const comments = await prisma.comment.findMany({
      where: { questionId: params.discussionId },
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        }
      },
      orderBy: { created_at: 'asc' }
    });

    // Format responses to match frontend expectations
    const responses = comments.map(comment => ({
      id: comment.id,
      content: comment.content,
      author: {
        name: comment.user.name || "Anonymous",
        email: comment.user.email || ""
      },
      created_at: comment.created_at.toISOString()
    }));

    return NextResponse.json(responses);
  } catch (error) {
    console.error("Error fetching responses:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}