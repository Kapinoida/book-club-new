import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const book = await prisma.book.findUnique({
      where: { id: params.id },
      include: {
        discussionQuestions: {
          orderBy: { breakpoint: 'asc' },
          include: {
            _count: {
              select: { comments: true }
            }
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

    // Format the response to match frontend expectations
    const formattedBook = {
      id: book.id,
      title: book.title,
      author: book.author,
      description: book.description,
      readMonth: book.readMonth,
      coverImage: book.coverImage,
      discussions: book.discussionQuestions.map(question => ({
        id: question.id,
        question: question.question,
        breakpoint: question.breakpoint,
        responses: [] // We'll populate this from the count
      }))
    };

    // Add response counts
    formattedBook.discussions.forEach((discussion, index) => {
      discussion.responses = new Array(book.discussionQuestions[index]._count.comments).fill({});
    });

    return NextResponse.json(formattedBook);
  } catch (error) {
    console.error("Error fetching book:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}