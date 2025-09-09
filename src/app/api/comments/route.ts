import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

const commentSchema = z.object({
  content: z.string().min(1, "Comment cannot be empty"),
  bookId: z.string(),
  questionId: z.string(),
  parentId: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return new NextResponse(JSON.stringify({ message: "Unauthorized" }), {
        status: 401,
      });
    }

    const json = await request.json();
    const body = commentSchema.parse(json);

    const comment = await prisma.comment.create({
      data: {
        content: body.content,
        userId: session.user.id,
        bookId: body.bookId,
        questionId: body.questionId,
        parentId: body.parentId,
      },
      include: {
        user: {
          select: {
            name: true,
            image: true,
          },
        },
      },
    });

    return new NextResponse(JSON.stringify(comment));
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse(
        JSON.stringify({ message: error.errors[0].message }),
        { status: 400 }
      );
    }

    console.error("Error creating comment:", error);
    return new NextResponse(
      JSON.stringify({ message: "Internal server error" }),
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const bookId = searchParams.get("bookId");
    const questionId = searchParams.get("questionId");

    if (!bookId || !questionId) {
      return new NextResponse(
        JSON.stringify({ message: "Missing required parameters" }),
        { status: 400 }
      );
    }

    const comments = await prisma.comment.findMany({
      where: {
        bookId,
        questionId,
        parentId: null, // Only fetch top-level comments
      },
      include: {
        user: {
          select: {
            name: true,
            image: true,
          },
        },
        replies: {
          include: {
            user: {
              select: {
                name: true,
                image: true,
              },
            },
          },
        },
      },
      orderBy: {
        created_at: "desc",
      },
    });

    return new NextResponse(JSON.stringify(comments));
  } catch (error) {
    console.error("Error fetching comments:", error);
    return new NextResponse(
      JSON.stringify({ message: "Internal server error" }),
      { status: 500 }
    );
  }
}
