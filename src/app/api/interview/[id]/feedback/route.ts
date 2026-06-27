import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { generateFeedback } from "@/lib/gemini";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const interview = await db.interview.findUnique({
      where: { id },
      include: { messages: { orderBy: { timestamp: "asc" } } },
    });

    if (!interview || interview.userId !== user.id) {
      return NextResponse.json({ error: "Interview not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      score: interview.score,
      feedback: interview.feedbackJson ? JSON.parse(interview.feedbackJson) : null,
      messages: interview.messages,
    });
  } catch (error) {
    console.error("Error retrieving feedback:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { transcript } = body; // Array of { role: 'interviewer' | 'candidate', content: string }

    if (!transcript || !Array.isArray(transcript)) {
      return NextResponse.json({ error: "Transcript is required" }, { status: 400 });
    }

    // Fetch the interview details
    const interview = await db.interview.findUnique({
      where: { id },
    });

    if (!interview || interview.userId !== user.id) {
      return NextResponse.json({ error: "Interview not found" }, { status: 404 });
    }

    // Save transcript messages in the database
    if (transcript.length > 0) {
      // Clean previous messages if any (to avoid duplicates)
      await db.message.deleteMany({
        where: { interviewId: id },
      });

      // Create new messages
      await db.message.createMany({
        data: transcript.map((msg) => ({
          interviewId: id,
          role: msg.role,
          content: msg.content,
        })),
      });
    }

    // Extract user custom Gemini API key from headers if available
    const userApiKey = req.headers.get("x-gemini-api-key") || undefined;

    // Call Gemini to generate feedback report
    // If the transcript is empty, return fallback
    let feedbackReport;
    if (transcript.length === 0) {
      feedbackReport = {
        score: 0,
        summary: "No voice conversation was recorded during this interview.",
        strengths: ["None logged"],
        weaknesses: ["Interview was terminated before speaking"],
        exercises: ["Try starting a new interview and speaking into the microphone"],
        questionBreakdown: [],
      };
    } else {
      feedbackReport = await generateFeedback(
        interview.jobTitle,
        interview.experienceLevel,
        interview.interviewType,
        transcript,
        userApiKey
      );
    }

    // Save the feedback report in the database
    const updated = await db.interview.update({
      where: { id },
      data: {
        score: feedbackReport.score,
        status: "completed",
        feedbackJson: JSON.stringify(feedbackReport),
      },
    });

    return NextResponse.json({
      success: true,
      score: feedbackReport.score,
      feedback: feedbackReport,
    });
  } catch (error: any) {
    console.error("Error generating feedback:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
