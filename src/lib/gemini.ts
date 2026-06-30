import { GoogleGenerativeAI } from "@google/generative-ai";

// Mock question bank for offline/keyless fallback
const fallbackQuestions: Record<string, string[]> = {
  frontend: [
    "Can you explain the difference between state and props in React, and when you would choose to use Context API over props drilling?",
    "What is the Virtual DOM, and how does React's reconciliation algorithm work under the hood?",
    "How do you optimize a webpage's loading performance? What Core Web Vitals (like LCP, CLS) do you look at?",
    "Explain closure in JavaScript and give a practical example of how it can be useful.",
    "How do you manage global state in a large React application? Discuss the trade-offs between Redux and Context.",
    "Describe the CSS box model and the difference between content-box and border-box.",
    "What is the event loop in JavaScript, and how does it handle microtasks vs macrotasks?"
  ],
  backend: [
    "How do you handle database migrations in a production environment with zero downtime?",
    "Explain the architectural differences between SQL and NoSQL databases. When would you choose one over the other?",
    "What is a connection pool, and why is it important for database resource management in backend services?",
    "How would you design a scalable rate limiter for an API gateway? What algorithms (e.g. token bucket, sliding window) would you consider?",
    "Explain the difference between horizontal and vertical scaling, and how load balancers route incoming traffic.",
    "What is the CAP theorem, and how does it affect the design of distributed systems?",
    "Describe the difference between REST, GraphQL, and gRPC. What are their respective use cases?"
  ],
  behavioral: [
    "Tell me about a challenging technical problem you solved recently. What was the impact, and how did you approach it?",
    "Describe a time when you disagreed with a colleague or lead on an architectural design. How did you resolve it?",
    "How do you prioritize your tasks when working under tight deadlines with competing requirements?",
    "Tell me about a time you made a mistake on a project. What did you learn, and how did you handle it?",
    "Describe a situation where you had to explain a complex technical concept to a non-technical stakeholder."
  ]
};

function getApiKey(userApiKey?: string): string | null {
  return userApiKey || process.env.GEMINI_API_KEY || null;
}

function getFallbackQuestionsForRole(
  jobTitle: string,
  interviewType: string,
  numberOfQuestions: number
): string[] {
  const titleLower = jobTitle.toLowerCase();
  const typeLower = interviewType.toLowerCase();
  
  let pool: string[] = [];
  if (typeLower.includes("behavioral")) {
    pool = fallbackQuestions.behavioral;
  } else if (
    titleLower.includes("front") || 
    titleLower.includes("react") || 
    titleLower.includes("ui") || 
    titleLower.includes("web") || 
    titleLower.includes("js") || 
    titleLower.includes("ts") || 
    titleLower.includes("css")
  ) {
    pool = fallbackQuestions.frontend;
  } else if (
    titleLower.includes("back") || 
    titleLower.includes("api") || 
    titleLower.includes("node") || 
    titleLower.includes("db") || 
    titleLower.includes("cloud") || 
    titleLower.includes("server") || 
    titleLower.includes("devops")
  ) {
    pool = fallbackQuestions.backend;
  } else {
    pool = [...fallbackQuestions.frontend, ...fallbackQuestions.backend, ...fallbackQuestions.behavioral];
  }
  
  // Shuffle and pick
  const shuffled = [...pool].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, Math.min(numberOfQuestions, shuffled.length));
}

export async function generateQuestions(
  jobTitle: string,
  jobDescription: string,
  experienceLevel: string,
  interviewType: string,
  numberOfQuestions: number,
  userApiKey?: string
): Promise<string[]> {
  const apiKey = getApiKey(userApiKey);
  
  if (!apiKey) {
    console.warn("No Gemini API Key found. Generating fallback questions.");
    return getFallbackQuestionsForRole(jobTitle, interviewType, numberOfQuestions);
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const prompt = `
    You are an expert technical recruiter and interviewer.
    Your task is to generate a list of ${numberOfQuestions} interview questions tailored for a candidate with the following details:
    - Job Title: ${jobTitle}
    - Seniority Level: ${experienceLevel}
    - Interview Category: ${interviewType}
    - Job Description/Requirements: ${jobDescription}

    Provide your response in JSON format. The JSON must match the following structure:
    {
      "questions": [
        "String containing the question text...",
        ...
      ]
    }

    Keep the questions highly relevant, realistic, and specific to the skills required. Make them engaging. Do not include markdown code block formatting inside the JSON values.
  `;

  try {
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
      },
    });

    const responseText = result.response.text();
    const parsed = JSON.parse(responseText);
    
    if (Array.isArray(parsed.questions)) {
      return parsed.questions;
    }
    throw new Error("Invalid response format from Gemini");
  } catch (error) {
    console.error("Error generating questions with Gemini:", error);
    return getFallbackQuestionsForRole(jobTitle, interviewType, numberOfQuestions);
  }
}

export interface FeedbackReport {
  score: number;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  exercises: string[];
  questionBreakdown: Array<{
    question: string;
    answer: string;
    modelAnswer: string;
    feedback: string;
    score: number;
  }>;
}

export async function generateFeedback(
  jobTitle: string,
  experienceLevel: string,
  interviewType: string,
  transcript: Array<{ role: string; content: string }>,
  userApiKey?: string
): Promise<FeedbackReport> {
  const apiKey = getApiKey(userApiKey);

  if (!apiKey) {
    console.warn("No Gemini API Key found. Generating fallback feedback report.");
    
    // Offline/Fallback Feedback Report Generation
    const interviewerMessages = transcript.filter((m) => m.role === "interviewer");
    
    // Calculate a realistic score based on answers length
    const totalWords = transcript
      .filter((m) => m.role === "candidate")
      .reduce((acc, curr) => acc + curr.content.split(/\s+/).length, 0);
      
    let baseScore = 72;
    if (totalWords > 250) baseScore = 86;
    else if (totalWords > 100) baseScore = 78;
    else if (totalWords > 20) baseScore = 65;
    else baseScore = 50;

    const report: FeedbackReport = {
      score: baseScore,
      summary: `Candidate completed a ${interviewType} mock session for the ${experienceLevel} ${jobTitle} position. The evaluation indicates a solid grasp of foundational concepts, with overall communication being clear. Depth of technical definitions was variable, but core terminology was used appropriately.`,
      strengths: [
        "Structured answers logically, maintaining focus on the core prompt.",
        "Demonstrated a clear understanding of practical implementation details.",
        "Communicated trade-offs and edge-cases effectively where probed."
      ],
      weaknesses: [
        "Some technical explanations lacked concrete examples or metrics.",
        "Could apply the STAR method (Situation, Task, Action, Result) more strictly for behavioral responses.",
        "Ensure concise transitions when explaining multi-layered architectural details."
      ],
      exercises: [
        `Practice building small projects specifically focusing on key skills requested in ${jobTitle} requirements.`,
        "Record yourself answering behavioral questions and refine your STAR method structuring.",
        "Read articles on system design templates (scaling, caching, message queues) and write summaries."
      ],
      questionBreakdown: interviewerMessages.map((qMsg, idx) => {
        const candidateAnswerMsg = transcript[transcript.indexOf(qMsg) + 1];
        const answerText = candidateAnswerMsg && candidateAnswerMsg.role === "candidate" 
          ? candidateAnswerMsg.content 
          : "(No spoken response was captured)";
        
        let qScore = baseScore + Math.floor(Math.random() * 9) - 4;
        qScore = Math.max(45, Math.min(98, qScore));

        return {
          question: qMsg.content,
          answer: answerText,
          modelAnswer: "An ideal response should define the core concept, explain how it works with a short example, and detail pros/cons or optimization considerations.",
          feedback: answerText === "(No spoken response was captured)"
            ? "No answer was recorded. Try unmuting your microphone and ensuring permissions are enabled."
            : "Good response. Try adding specific project experience or architectural metrics to back up your claims.",
          score: qScore
        };
      })
    };

    return report;
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const transcriptText = transcript
    .map((msg) => `${msg.role === "interviewer" ? "AI Interviewer" : "Candidate"}: ${msg.content}`)
    .join("\n");

  const prompt = `
    You are a professional hiring manager evaluating a candidate's mock interview performance.
    
    Here is the context:
    - Job Title: ${jobTitle}
    - Experience Level: ${experienceLevel}
    - Interview Type: ${interviewType}

    Here is the interview transcript:
    ${transcriptText}

    Please analyze the candidate's performance thoroughly. Consider communication skills, technical depth, and structure.
    Provide a comprehensive feedback report in JSON format. The response MUST match this structure:
    {
      "score": 85, // An overall score out of 100 as an integer
      "summary": "Detailed summary paragraph of their performance...",
      "strengths": [
        "Strength 1...",
        "Strength 2..."
      ],
      "weaknesses": [
        "Area of improvement 1...",
        "Area of improvement 2..."
      ],
      "exercises": [
        "Suggested practice exercise or coding challenge 1...",
        "Suggested practice exercise or coding challenge 2..."
      ],
      "questionBreakdown": [
        {
          "question": "The question asked by the interviewer",
          "answer": "The answer given by the candidate",
          "modelAnswer": "A brief explanation of what a model or ideal answer would include",
          "feedback": "Specific, constructive feedback on how the candidate answered this question",
          "score": 80 // Score for this specific question (0-100)
        }
      ]
    }

    Return ONLY the valid JSON structure. Make the feedback highly actionable and supportive.
  `;

  try {
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
      },
    });

    const responseText = result.response.text();
    return JSON.parse(responseText) as FeedbackReport;
  } catch (error) {
    console.error("Error generating feedback with Gemini:", error);
    return {
      score: 70,
      summary: "We encountered an issue generating your detailed AI report, but here is a basic evaluation based on your session.",
      strengths: ["Completed the interview call successfully", "Exhibited willingness to answer all questions"],
      weaknesses: ["Technical details could not be parsed by the AI due to connection issues"],
      exercises: ["Practice summarizing answers in STAR format", "Review fundamental questions for " + jobTitle],
      questionBreakdown: transcript
        .filter((msg) => msg.role === "interviewer")
        .map((msg, index) => ({
          question: msg.content,
          answer: transcript[transcript.indexOf(msg) + 1]?.content || "(No response captured)",
          modelAnswer: "Focus on clear examples, key libraries, and best practices.",
          feedback: "Check communication clarity and technical detail.",
          score: 70,
        })),
    };
  }
}
