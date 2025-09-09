import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

const usernameSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(20, "Username must be at most 20 characters")
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      "Username can only contain letters, numbers, underscores, and hyphens"
    ),
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get("username");

    if (!username) {
      return new NextResponse(
        JSON.stringify({ message: "Username is required" }),
        { status: 400 }
      );
    }

    // Validate username format
    const result = usernameSchema.safeParse({ username });
    if (!result.success) {
      return new NextResponse(
        JSON.stringify({
          message: "Invalid username format",
          available: false,
        }),
        { status: 200 }
      );
    }

    // Check if username exists
    const existingUser = await prisma.user.findUnique({
      where: { username },
    });

    return new NextResponse(
      JSON.stringify({
        available: !existingUser,
        message: existingUser ? "Username is taken" : "Username is available",
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Error checking username:", error);
    return new NextResponse(
      JSON.stringify({ message: "Internal server error" }),
      { status: 500 }
    );
  }
}
