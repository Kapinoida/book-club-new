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

    const [recentBooks, recentComments] = await Promise.all([
      prisma.book.findMany({
        orderBy: { created_at: "desc" },
        take: 5,
        select: {
          id: true,
          title: true,
          author: true,
          readMonth: true,
          status: true,
          created_at: true,
        },
      }),
      prisma.comment.findMany({
        orderBy: { created_at: "desc" },
        take: 5,
        include: {
          user: {
            select: {
              name: true,
              username: true,
            },
          },
          book: {
            select: {
              title: true,
            },
          },
        },
      }),
    ]);

    return NextResponse.json({
      recentBooks,
      recentComments,
    });
  } catch (error) {
    console.error("Error fetching admin activity:", error);
    return NextResponse.json(
      { error: "Failed to fetch activity" },
      { status: 500 }
    );
  }
}
