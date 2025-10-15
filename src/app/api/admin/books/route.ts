import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.isAdmin) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    const { title, author, description, readMonth, coverImage, googleBooksId, status } = await request.json();

    if (!title || !author) {
      return NextResponse.json(
        { error: "Title and author are required" },
        { status: 400 }
      );
    }

    const newBook = await prisma.book.create({
      data: {
        title: title.trim(),
        author: author.trim(),
        description: description?.trim() || "",
        readMonth: readMonth ? new Date(readMonth + '-01T12:00:00.000Z') : null,
        coverImage: coverImage?.trim() || "",
        googleBooksId: googleBooksId?.trim() || "",
        status: status || "DRAFT",
      },
    });

    return NextResponse.json(newBook, { status: 201 });
  } catch (error) {
    console.error("Error creating book:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.isAdmin) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get("status");

    const whereClause = statusFilter
      ? {
          status: {
            in: statusFilter.split(",") as any[],
          },
        }
      : {};

    const books = await prisma.book.findMany({
      where: whereClause,
      include: {
        _count: {
          select: {
            discussionQuestions: true,
            readingProgress: true,
          },
        },
      },
      orderBy: { created_at: "desc" },
    });

    return NextResponse.json({ books });
  } catch (error) {
    console.error("Error fetching books:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}