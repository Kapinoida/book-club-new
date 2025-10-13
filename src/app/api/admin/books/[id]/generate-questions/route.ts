import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateAllQuestions } from "@/lib/question-templates";

export async function POST(
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

    const bookId = params.id;

    // Fetch the book
    const book = await prisma.book.findUnique({
      where: { id: bookId },
      include: {
        discussionQuestions: true
      }
    });

    if (!book) {
      return NextResponse.json(
        { error: "Book not found" },
        { status: 404 }
      );
    }

    // Check if questions already exist
    if (book.discussionQuestions.length > 0) {
      return NextResponse.json(
        {
          error: "This book already has discussion questions. Delete existing questions first or edit them manually.",
          existingCount: book.discussionQuestions.length
        },
        { status: 400 }
      );
    }

    // Get request options
    const body = await request.json().catch(() => ({}));
    const breakpoints = body.breakpoints || [25, 50, 75, 90];
    const questionsPerBreakpoint = body.questionsPerBreakpoint || 3;

    // Generate questions using templates
    const generatedQuestions = generateAllQuestions(
      {
        title: book.title,
        author: book.author,
        description: book.description || undefined
      },
      breakpoints,
      questionsPerBreakpoint
    );

    // Save questions to database
    const createdQuestions = [];
    for (const set of generatedQuestions) {
      for (const questionText of set.questions) {
        const created = await prisma.discussionQuestion.create({
          data: {
            bookId: book.id,
            question: questionText,
            breakpoint: set.breakpoint
          }
        });
        createdQuestions.push(created);
      }
    }

    return NextResponse.json({
      message: `Successfully generated ${createdQuestions.length} discussion questions`,
      questions: createdQuestions,
      breakpoints: breakpoints
    }, { status: 201 });

  } catch (error) {
    console.error("Error generating questions:", error);
    return NextResponse.json(
      { error: "Failed to generate questions" },
      { status: 500 }
    );
  }
}

// Optional: Add a DELETE endpoint to clear questions if needed
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

    const bookId = params.id;

    // Delete all discussion questions for this book
    const result = await prisma.discussionQuestion.deleteMany({
      where: { bookId: bookId }
    });

    return NextResponse.json({
      message: `Deleted ${result.count} discussion questions`,
      count: result.count
    });

  } catch (error) {
    console.error("Error deleting questions:", error);
    return NextResponse.json(
      { error: "Failed to delete questions" },
      { status: 500 }
    );
  }
}
