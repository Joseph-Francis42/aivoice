"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  Award, 
  CheckCircle, 
  HelpCircle, 
  AlertCircle, 
  BookOpen, 
  Activity, 
  ChevronDown, 
  ChevronUp, 
  Sparkles,
  TrendingUp,
  RotateCcw,
  MessageSquare
} from "lucide-react";

interface FeedbackData {
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

export default function FeedbackPage() {
  const params = useParams();
  const router = useRouter();
  const interviewId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [score, setScore] = useState<number>(0);
  const [feedback, setFeedback] = useState<FeedbackData | null>(null);

  // Accordion toggle states for question breakdown
  const [openQuestionIdx, setOpenQuestionIdx] = useState<number | null>(0);

  useEffect(() => {
    const fetchFeedback = async () => {
      try {
        const response = await fetch(`/api/interview/${interviewId}/feedback`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to load performance feedback");
        }

        setScore(data.score || 0);
        setFeedback(data.feedback);
      } catch (err: any) {
        setError(err.message || "An unexpected error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchFeedback();
  }, [interviewId]);

  const getScoreRating = (val: number) => {
    if (val >= 85) return { label: "Excellent Work", color: "text-emerald-400" };
    if (val >= 70) return { label: "Solid Performance", color: "text-blue-400" };
    if (val >= 50) return { label: "Needs Improvement", color: "text-amber-400" };
    return { label: "Critical Focus Needed", color: "text-rose-400" };
  };

  const getQuestionScoreColor = (val: number) => {
    if (val >= 85) return "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
    if (val >= 70) return "text-blue-400 bg-blue-500/10 border-blue-500/20";
    if (val >= 50) return "text-amber-400 bg-amber-500/10 border-amber-500/20";
    return "text-rose-400 bg-rose-500/10 border-rose-500/20";
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Activity className="h-8 w-8 text-purple-500 animate-spin" />
          <span className="text-gray-400 text-sm">Parsing your AI evaluation report...</span>
        </div>
      </div>
    );
  }

  if (error || !feedback) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6">
        <div className="w-full max-w-md p-8 rounded-2xl glass border-rose-500/20 text-center flex flex-col items-center gap-4">
          <AlertCircle className="h-12 w-12 text-rose-400" />
          <h3 className="text-lg font-bold text-white">Evaluation Failed</h3>
          <p className="text-xs text-gray-500 leading-relaxed">{error || "Could not retrieve feedback dataset."}</p>
          <button
            onClick={() => router.push("/dashboard")}
            className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-sm transition-all"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const rating = getScoreRating(score);

  return (
    <div className="min-h-screen flex flex-col justify-between p-6 md:p-12 bg-background relative overflow-hidden">

      {/* Header */}
      <header className="flex justify-between items-center max-w-5xl w-full mx-auto z-10 mb-8">
        <button
          onClick={() => router.push("/dashboard")}
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Dashboard</span>
        </button>

        <button
          onClick={() => router.push("/interview/new")}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold shadow-lg shadow-blue-600/20 transition-all active:scale-[0.98]"
        >
          <RotateCcw className="h-4 w-4" />
          <span>Practice Again</span>
        </button>
      </header>

      {/* Main Grid */}
      <main className="max-w-5xl w-full mx-auto flex-grow z-10 grid grid-cols-1 md:grid-cols-12 gap-8 items-start mb-12">
        
        {/* Left column: Score summary and general feedback */}
        <div className="col-span-1 md:col-span-4 flex flex-col gap-6">
          
          {/* Glowing Score Card */}
          <div className="p-6 rounded-3xl glass border-slate-800 flex flex-col items-center justify-center text-center gap-4 relative overflow-hidden">
            
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Overall Score</h3>

            <div className="relative flex items-center justify-center my-2">
              <svg className="w-32 h-32 transform -rotate-90">
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  className="stroke-white/5"
                  strokeWidth="8"
                  fill="transparent"
                />
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  className="stroke-blue-500"
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray={2 * Math.PI * 56}
                  strokeDashoffset={2 * Math.PI * 56 * (1 - score / 100)}
                  strokeLinecap="round"
                />
              </svg>
              <span className="absolute text-3xl font-extrabold text-white">{score}%</span>
            </div>

            <div>
              <p className={`text-sm font-bold ${rating.color}`}>{rating.label}</p>
              <p className="text-[10px] text-gray-500 mt-0.5">Calculated by Google Gemini evaluation criteria</p>
            </div>
          </div>

          {/* AI Summary card */}
          <div className="p-6 rounded-3xl glass flex flex-col gap-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider border-b border-white/5 pb-2 flex items-center gap-2">
              <Award className="h-4 w-4 text-blue-400" />
              AI Performance Summary
            </h4>
            <p className="text-xs text-gray-300 leading-relaxed font-light">{feedback.summary}</p>
          </div>

          {/* Strengths & Weaknesses */}
          <div className="p-6 rounded-3xl glass flex flex-col gap-4">
            
            {/* Strengths */}
            <div className="flex flex-col gap-2">
              <h5 className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle className="h-3.5 w-3.5 shrink-0" />
                Key Strengths
              </h5>
              <ul className="flex flex-col gap-2 pl-1.5">
                {feedback.strengths.map((s, i) => (
                  <li key={i} className="text-xs text-gray-300 leading-relaxed font-light flex items-start gap-2">
                    <span className="h-1 w-1 bg-emerald-500 rounded-full shrink-0 mt-1.5" />
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Weaknesses */}
            <div className="flex flex-col gap-2 border-t border-white/5 pt-4">
              <h5 className="text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <TrendingUp className="h-3.5 w-3.5 shrink-0" />
                Areas to Improve
              </h5>
              <ul className="flex flex-col gap-2 pl-1.5">
                {feedback.weaknesses.map((w, i) => (
                  <li key={i} className="text-xs text-gray-300 leading-relaxed font-light flex items-start gap-2">
                    <span className="h-1 w-1 bg-amber-500 rounded-full shrink-0 mt-1.5" />
                    <span>{w}</span>
                  </li>
                ))}
              </ul>
            </div>

          </div>

        </div>

        {/* Right column: Practice exercises and Question-by-question dialogue breakdown */}
        <div className="col-span-1 md:col-span-8 flex flex-col gap-6">
          
          {/* Suggested Practice Exercises */}
          <div className="p-6 rounded-3xl glass flex flex-col gap-4 relative overflow-hidden">
            
            <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="h-4.5 w-4.5 text-blue-400" />
              Tailored Practice Exercises
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
              {feedback.exercises.map((ex, i) => (
                <div 
                  key={i}
                  className="p-4 rounded-2xl bg-gradient-to-tr from-white/5 to-white/0 border border-white/5 hover:border-emerald-500/20 transition-all flex items-start gap-3"
                >
                  <div className="h-6 w-6 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-xs font-bold text-emerald-400 shrink-0 mt-0.5">
                    {i + 1}
                  </div>
                  <p className="text-xs text-gray-300 leading-normal font-light">{ex}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Question breakdown accordions */}
          <div className="flex flex-col gap-4">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <BookOpen className="h-4.5 w-4.5 text-purple-400" />
              Question-by-Question Dialogue Review
            </h4>

            {feedback.questionBreakdown.length === 0 ? (
              <div className="p-12 rounded-3xl glass border-dashed border-white/10 text-center flex flex-col items-center gap-3">
                <MessageSquare className="h-8 w-8 text-gray-700" />
                <p className="text-xs text-gray-500">No question breakdown logged. Check if dialogue occurred.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {feedback.questionBreakdown.map((item, index) => {
                  const isOpen = openQuestionIdx === index;
                  return (
                    <div 
                      key={index}
                      className="rounded-2xl glass border border-white/5 overflow-hidden transition-all"
                    >
                      {/* Accordion Trigger Header */}
                      <div 
                        onClick={() => setOpenQuestionIdx(isOpen ? null : index)}
                        className="p-5 flex justify-between items-center gap-4 cursor-pointer hover:bg-white/5 transition-all select-none"
                      >
                        <div className="flex gap-4 items-center">
                          <div className="h-7 w-7 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center text-xs font-bold text-gray-400">
                            {index + 1}
                          </div>
                          <h5 className="text-xs font-bold text-gray-200 line-clamp-1">{item.question}</h5>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${getQuestionScoreColor(item.score)}`}>
                            Score: {item.score}%
                          </span>
                          {isOpen ? <ChevronUp className="h-4 w-4 text-gray-500" /> : <ChevronDown className="h-4 w-4 text-gray-500" />}
                        </div>
                      </div>

                      {/* Accordion Content Panel */}
                      {isOpen && (
                        <div className="p-6 bg-black/35 border-t border-white/5 flex flex-col gap-5">
                          {/* Full Question */}
                          <div className="flex flex-col gap-1">
                            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">The Question</span>
                            <p className="text-xs text-white leading-relaxed">{item.question}</p>
                          </div>

                          {/* Candidate Answer */}
                          <div className="flex flex-col gap-1 border-l-2 border-purple-500 pl-4 py-0.5">
                            <span className="text-[10px] text-purple-400 font-bold uppercase tracking-wider">Your Answer</span>
                            <p className="text-xs text-gray-300 leading-relaxed font-light italic">
                              "{item.answer || "(No response captured)"}"
                            </p>
                          </div>

                          {/* Ideal answer */}
                          <div className="flex flex-col gap-1 border-l-2 border-emerald-500 pl-4 py-0.5 bg-emerald-500/5 p-3 rounded-r-xl border-y border-r border-white/5">
                            <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">Model Answer Criteria</span>
                            <p className="text-xs text-gray-300 leading-relaxed font-light">{item.modelAnswer}</p>
                          </div>

                          {/* AI feedback on answer */}
                          <div className="flex flex-col gap-1.5 mt-2 bg-purple-500/5 p-4 border border-purple-500/10 rounded-2xl">
                            <span className="text-[10px] text-purple-300 font-bold uppercase tracking-wider flex items-center gap-1">
                              <Sparkles className="h-3 w-3" />
                              AI Feedback & Tips
                            </span>
                            <p className="text-xs text-gray-300 leading-relaxed font-light">{item.feedback}</p>
                          </div>

                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

      </main>

      {/* Footer */}
      <footer className="text-center text-gray-600 text-xs max-w-5xl w-full mx-auto mt-6 z-10">
        <p>&copy; {new Date().getFullYear()} Prepwise AI. All analysis generated using Google Gemini 1.5 Flash.</p>
      </footer>
    </div>
  );
}
