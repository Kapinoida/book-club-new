import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// Endpoint to trigger a session refresh
export async function POST() {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Return the current session - this will trigger JWT and session callbacks
    return NextResponse.json({
      message: "Session refreshed",
      session: {
        email: session.user?.email,
        isAdmin: session.user?.isAdmin,
      },
      note: "Sign out and back in if isAdmin is still false"
    });
  } catch (error) {
    console.error("Error refreshing session:", error);
    return NextResponse.json({
      error: "Failed to refresh session",
      details: String(error)
    }, { status: 500 });
  }
}
