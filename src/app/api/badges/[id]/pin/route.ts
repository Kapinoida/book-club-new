import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !session.user.email) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Verify the user owns this badge
    const userBadge = await prisma.userBadge.findUnique({
      where: {
        id: params.id
      }
    });

    if (!userBadge || userBadge.userId !== user.id) {
      return NextResponse.json(
        { error: "Badge not found or does not belong to user" },
        { status: 404 }
      );
    }

    // Unpin all other badges for this user
    await prisma.userBadge.updateMany({
      where: {
        userId: user.id,
        isPinned: true
      },
      data: {
        isPinned: false
      }
    });

    // Pin this badge
    const pinnedBadge = await prisma.userBadge.update({
      where: {
        id: params.id
      },
      data: {
        isPinned: true
      },
      include: {
        badge: true
      }
    });

    return NextResponse.json(pinnedBadge);
  } catch (error) {
    console.error("Error pinning badge:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !session.user.email) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Verify the user owns this badge
    const userBadge = await prisma.userBadge.findUnique({
      where: {
        id: params.id
      }
    });

    if (!userBadge || userBadge.userId !== user.id) {
      return NextResponse.json(
        { error: "Badge not found or does not belong to user" },
        { status: 404 }
      );
    }

    // Unpin this badge
    const unpinnedBadge = await prisma.userBadge.update({
      where: {
        id: params.id
      },
      data: {
        isPinned: false
      },
      include: {
        badge: true
      }
    });

    return NextResponse.json(unpinnedBadge);
  } catch (error) {
    console.error("Error unpinning badge:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
