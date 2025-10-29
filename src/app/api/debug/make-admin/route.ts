import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// TEMPORARY DEBUG ENDPOINT - DELETE AFTER USE
export async function POST() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Update the current user to be an admin
    const updatedUser = await prisma.user.update({
      where: { email: session.user.email },
      data: { isAdmin: true },
      select: {
        email: true,
        isAdmin: true,
        name: true
      }
    });

    return NextResponse.json({
      message: "User updated successfully",
      user: updatedUser,
      note: "Please sign out and sign back in for changes to take effect"
    });
  } catch (error) {
    console.error("Error making user admin:", error);
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}

// Also add a GET to check current status
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({
        error: "Not authenticated",
        session: session
      }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        email: true,
        isAdmin: true,
        name: true,
        id: true
      }
    });

    return NextResponse.json({
      session: {
        email: session.user.email,
        isAdmin: session.user.isAdmin,
        id: session.user.id,
        fullSession: session
      },
      database: user,
      note: "If session.isAdmin is false but database.isAdmin is true, you need to sign out and back in"
    });
  } catch (error) {
    console.error("Error checking user status:", error);
    return NextResponse.json({ error: "Failed to check user", details: String(error) }, { status: 500 });
  }
}
