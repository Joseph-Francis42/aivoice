import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

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
    });

    if (!interview || interview.userId !== user.id) {
      return NextResponse.json({ error: "Interview not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      interview,
    });
  } catch (error) {
    console.error("Error retrieving interview:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(
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
    const { questions, status } = body;

    const interview = await db.interview.findUnique({
      where: { id },
    });

    if (!interview || interview.userId !== user.id) {
      return NextResponse.json({ error: "Interview not found" }, { status: 404 });
    }

    const updateData: any = {};
    if (status) {
      updateData.status = status;
    }
    if (questions) {
      // Preserve or update generatedQuestions in feedbackJson
      const currentFeedback = interview.feedbackJson ? JSON.parse(interview.feedbackJson) : {};
      updateData.feedbackJson = JSON.stringify({
        ...currentFeedback,
        generatedQuestions: questions,
      });
    }

    const updated = await db.interview.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      interview: updated,
    });
  } catch (error) {
    console.error("Error updating interview:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
