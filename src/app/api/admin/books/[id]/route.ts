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
    
    if (!session || !session.user?.isAdmin) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    const book = await prisma.book.findUnique({
      where: { id: params.id },
      include: {
        discussionQuestions: {
          orderBy: { breakpoint: 'asc' }
        },
        _count: {
          select: { 
            readingProgress: true,
            discussionQuestions: true
          }
        }
      }
    });

    if (!book) {
      return NextResponse.json(
        { error: "Book not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(book);
  } catch (error) {
    console.error("Error fetching book:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

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

    const { title, author, description, readMonth, coverImage, googleBooksId } = await request.json();
    
    if (!title || !author) {
      return NextResponse.json(
        { error: "Title and author are required" },
        { status: 400 }
      );
    }

    const existingBook = await prisma.book.findUnique({
      where: { id: params.id }
    });

    if (!existingBook) {
      return NextResponse.json(
        { error: "Book not found" },
        { status: 404 }
      );
    }

    const updatedBook = await prisma.book.update({
      where: { id: params.id },
      data: {
        title: title.trim(),
        author: author.trim(),
        description: description?.trim() || "",
        readMonth: readMonth ? new Date(readMonth + '-01T12:00:00.000Z') : existingBook.readMonth,
        coverImage: coverImage?.trim() || "",
        googleBooksId: googleBooksId?.trim() || "",
      },
    });

    return NextResponse.json(updatedBook);
  } catch (error) {
    console.error("Error updating book:", error);
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

    const existingBook = await prisma.book.findUnique({
      where: { id: params.id }
    });

    if (!existingBook) {
      return NextResponse.json(
        { error: "Book not found" },
        { status: 404 }
      );
    }

    await prisma.book.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ message: "Book deleted successfully" });
  } catch (error) {
    console.error("Error deleting book:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}