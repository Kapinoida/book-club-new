import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateUserStreak } from "@/lib/streak-service";
import { checkAndAwardBadges } from "@/lib/badge-service";

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

    const { content, parentId } = await request.json();

    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { error: "Response content is required" },
        { status: 400 }
      );
    }

    // If parentId is provided, verify the parent comment exists
    if (parentId) {
      const parentComment = await prisma.comment.findUnique({
        where: { id: parentId }
      });

      if (!parentComment) {
        return NextResponse.json(
          { error: "Parent comment not found" },
          { status: 404 }
        );
      }
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
        parentId: parentId || null,
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

    // Update user's streak and check for new badges
    await updateUserStreak(user.id);
    await checkAndAwardBadges(user.id);

    // Format response to match frontend expectations
    const response = {
      id: newComment.id,
      content: newComment.content,
      parentId: newComment.parentId,
      author: {
        name: newComment.user.name || "Anonymous",
        email: newComment.user.email || ""
      },
      created_at: newComment.created_at.toISOString(),
      replies: []
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
    // Get all comments for this discussion question with nested replies
    const comments = await prisma.comment.findMany({
      where: {
        questionId: params.discussionId,
        parentId: null // Only get top-level comments
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            badges: {
              where: { isPinned: true },
              include: {
                badge: true
              },
              take: 1
            }
          }
        },
        replies: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
                badges: {
                  where: { isPinned: true },
                  include: {
                    badge: true
                  },
                  take: 1
                }
              }
            },
            replies: {
              include: {
                user: {
                  select: {
                    name: true,
                    email: true,
                    badges: {
                      where: { isPinned: true },
                      include: {
                        badge: true
                      },
                      take: 1
                    }
                  }
                },
                replies: {
                  include: {
                    user: {
                      select: {
                        name: true,
                        email: true,
                        badges: {
                          where: { isPinned: true },
                          include: {
                            badge: true
                          },
                          take: 1
                        }
                      }
                    }
                  },
                  orderBy: { created_at: 'asc' }
                }
              },
              orderBy: { created_at: 'asc' }
            }
          },
          orderBy: { created_at: 'asc' }
        }
      },
      orderBy: { created_at: 'asc' }
    });

    // Recursive function to format comments and their replies
    const formatComment = (comment: any): any => ({
      id: comment.id,
      content: comment.content,
      parentId: comment.parentId,
      author: {
        name: comment.user.name || "Anonymous",
        email: comment.user.email || "",
        pinnedBadge: comment.user.badges?.[0]?.badge || null
      },
      created_at: comment.created_at.toISOString(),
      replies: comment.replies ? comment.replies.map(formatComment) : []
    });

    // Format responses to match frontend expectations
    const responses = comments.map(formatComment);

    return NextResponse.json(responses);
  } catch (error) {
    console.error("Error fetching responses:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}