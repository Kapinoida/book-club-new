import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
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

    const { content } = await request.json();

    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { error: "Content is required" },
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

    // Find the comment
    const comment = await prisma.comment.findUnique({
      where: { id: params.id }
    });

    if (!comment) {
      return NextResponse.json(
        { error: "Comment not found" },
        { status: 404 }
      );
    }

    // Check if user owns this comment
    if (comment.userId !== user.id) {
      return NextResponse.json(
        { error: "You can only edit your own comments" },
        { status: 403 }
      );
    }

    // Update the comment
    const updatedComment = await prisma.comment.update({
      where: { id: params.id },
      data: {
        content: content.trim()
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

    return NextResponse.json({
      id: updatedComment.id,
      content: updatedComment.content,
      updated_at: updatedComment.updated_at.toISOString()
    });
  } catch (error) {
    console.error("Error updating comment:", error);
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

    // Find the comment
    const comment = await prisma.comment.findUnique({
      where: { id: params.id }
    });

    if (!comment) {
      return NextResponse.json(
        { error: "Comment not found" },
        { status: 404 }
      );
    }

    // Check if user owns this comment or is admin
    if (comment.userId !== user.id && !user.isAdmin) {
      return NextResponse.json(
        { error: "You can only delete your own comments" },
        { status: 403 }
      );
    }

    // Delete the comment
    await prisma.comment.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting comment:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
