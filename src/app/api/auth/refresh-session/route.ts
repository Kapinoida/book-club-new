import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

/**
 * API endpoint to trigger a session refresh
 * This will cause the JWT callback to run with trigger="update"
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    // Return success - the client should call update() on the session
    return NextResponse.json({
      message: "Please call update() on your session client-side",
      currentSession: session
    });
  } catch (error) {
    console.error("Error in refresh-session:", error);
    return NextResponse.json(
      { error: "Failed to refresh session" },
      { status: 500 }
    );
  }
}
