import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

const progressSchema = z.object({
  bookId: z.string(),
  progress: z.number().min(0).max(100),
  isFinished: z.boolean(),
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
    const body = progressSchema.parse(json);

    // Upsert reading progress
    const progress = await prisma.readingProgress.upsert({
      where: {
        userId_bookId: {
          userId: session.user.id,
          bookId: body.bookId,
        },
      },
      update: {
        progress: body.progress,
        isFinished: body.isFinished,
      },
      create: {
        userId: session.user.id,
        bookId: body.bookId,
        progress: body.progress,
        isFinished: body.isFinished,
      },
    });

    return new NextResponse(JSON.stringify(progress));
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse(
        JSON.stringify({ message: error.errors[0].message }),
        { status: 400 }
      );
    }

    console.error("Error updating reading progress:", error);
    return new NextResponse(
      JSON.stringify({ message: "Internal server error" }),
      { status: 500 }
    );
  }
}
