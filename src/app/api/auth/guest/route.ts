import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { signToken } from "@/lib/auth";

export async function POST() {
  try {
    // Generate a unique random username for guest
    const randomId = Math.random().toString(36).substring(2, 8);
    const guestUsername = `guest_${randomId}`;

    // Create guest user
    const user = await db.user.create({
      data: {
        username: guestUsername,
        isGuest: true,
      },
    });

    // Generate and set token cookie
    const token = signToken({ userId: user.id, username: user.username });
    const cookieStore = await cookies();
    cookieStore.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        isGuest: user.isGuest,
      },
    });
  } catch (error) {
    console.error("Guest login error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
