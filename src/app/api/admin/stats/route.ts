import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [totalBooks, totalUsers, totalComments, totalQuestions] = await Promise.all([
      prisma.book.count(),
      prisma.user.count(),
      prisma.comment.count(),
      prisma.discussionQuestion.count(),
    ]);

    return NextResponse.json({
      totalBooks,
      totalUsers,
      totalComments,
      totalQuestions,
    });
  } catch (error) {
    console.error("Error fetching admin stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}
