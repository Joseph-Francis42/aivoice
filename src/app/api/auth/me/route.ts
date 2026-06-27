import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getCurrentUser();
    
    // Check if keys are set in server environment
    const config = {
      hasGeminiKey: !!process.env.GEMINI_API_KEY,
      hasVapiKey: !!process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY,
    };

    if (!user) {
      return NextResponse.json(
        { authenticated: false, user: null, config },
        { status: 200 }
      );
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        username: user.username,
        isGuest: user.isGuest,
      },
      config,
    });
  } catch (error) {
    console.error("Auth status query error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
