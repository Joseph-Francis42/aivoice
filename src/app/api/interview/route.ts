import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { generateQuestions } from "@/lib/gemini";

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch interviews
    const interviews = await db.interview.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });

    // Calculate stats
    const totalCount = interviews.length;
    const completedInterviews = interviews.filter((i: any) => i.status === "completed" && i.score !== null);
    const completedCount = completedInterviews.length;
    const averageScore = completedCount > 0 
      ? Math.round(completedInterviews.reduce((acc: number, curr: any) => acc + (curr.score || 0), 0) / completedCount)
      : null;

    return NextResponse.json({
      success: true,
      interviews,
      stats: {
        totalCount,
        completedCount,
        averageScore,
      },
    });
  } catch (error) {
    console.error("Error fetching interviews:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { 
      jobTitle, 
      jobDescription, 
      experienceLevel, 
      interviewType, 
      numberOfQuestions, 
      personaName, 
      voiceId 
    } = body;

    if (!jobTitle || !experienceLevel || !interviewType || !numberOfQuestions) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Extract user custom Gemini API key from headers if available
    const userApiKey = req.headers.get("x-gemini-api-key") || undefined;

    // Generate questions using Gemini
    const questions = await generateQuestions(
      jobTitle,
      jobDescription || "No specific job description provided.",
      experienceLevel,
      interviewType,
      numberOfQuestions,
      userApiKey
    );

    // Save interview in DB. Store questions inside feedbackJson as a temporary array
    const interview = await db.interview.create({
      data: {
        userId: user.id,
        jobTitle,
        jobDescription: jobDescription || "",
        experienceLevel,
        interviewType,
        numberOfQuestions,
        personaName,
        voiceId,
        status: "setup",
        feedbackJson: JSON.stringify({ generatedQuestions: questions }),
      },
    });

    return NextResponse.json({
      success: true,
      interviewId: interview.id,
      questions,
    });
  } catch (error: any) {
    console.error("Error creating interview:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
