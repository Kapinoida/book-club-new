import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { invalidateCache } from "@/lib/cache";

const createBookSchema = z.object({
  title: z.string().min(1),
  author: z.string().min(1),
  coverImage: z.string().optional(),
  description: z.string().optional(),
  googleBooksId: z.string().optional(),
  status: z.enum(["DRAFT", "POLL_CANDIDATE", "SCHEDULED", "CURRENT", "ARCHIVED"]).optional(),
  readMonth: z.string().datetime().optional(),
});

// POST /api/books - Create a new book (admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createBookSchema.parse(body);

    // Check if book with same Google Books ID already exists
    if (validatedData.googleBooksId) {
      const existingBook = await prisma.book.findFirst({
        where: {
          googleBooksId: validatedData.googleBooksId,
        },
      });

      if (existingBook) {
        return NextResponse.json(existingBook);
      }
    }

    // Create the book
    const book = await prisma.book.create({
      data: {
        title: validatedData.title,
        author: validatedData.author,
        coverImage: validatedData.coverImage,
        description: validatedData.description,
        googleBooksId: validatedData.googleBooksId,
        status: validatedData.status || "DRAFT",
        readMonth: validatedData.readMonth ? new Date(validatedData.readMonth) : null,
      },
    });

    // Invalidate books cache
    invalidateCache(['books:.*']);

    return NextResponse.json(book);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error creating book:", error);
    return NextResponse.json(
      { error: "Failed to create book" },
      { status: 500 }
    );
  }
}
