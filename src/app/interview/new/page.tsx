"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  Sparkles, 
  Activity, 
  HelpCircle, 
  Play, 
  ChevronRight, 
  Edit3, 
  Plus, 
  Trash, 
  User, 
  Sliders, 
  CheckCircle,
  FileText
} from "lucide-react";
import { getLocalSettings } from "@/lib/settings";

interface Persona {
  id: string;
  name: string;
  role: string;
  description: string;
  voiceProvider: string;
  voiceId: string;
}

const personas: Persona[] = [
  {
    id: "sarah",
    name: "Sarah",
    role: "Warm Motivator",
    description: "Highly encouraging, friendly, and structural. Great for behavioral prep and building confidence.",
    voiceProvider: "11labs",
    voiceId: "21m00Tcm4TlvDq8ikWAM", // Rachel (Warm)
  },
  {
    id: "dave",
    name: "Dave",
    role: "Strict Tech Lead",
    description: "Direct, technical, and analytical. Focuses heavily on edge cases, depth, and precise definitions.",
    voiceProvider: "11labs",
    voiceId: "pNInz6obpgfrhhF2Ewqi", // Dom (Deep/Direct)
  },
  {
    id: "elena",
    name: "Elena",
    role: "Systematic HR Partner",
    description: "Methodical and standard-based. Walks through classic competency criteria and corporate alignment.",
    voiceProvider: "11labs",
    voiceId: "AZnzlk1XhkKWjngj3mqL", // Nicole (Clear/HR)
  },
];

export default function NewInterviewPage() {
  const router = useRouter();
  
  // Wizard steps: 'form' | 'generating' | 'review'
  const [step, setStep] = useState<"form" | "generating" | "review">("form");

  // Form states
  const [jobTitle, setJobTitle] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [experienceLevel, setExperienceLevel] = useState("Mid");
  const [interviewType, setInterviewType] = useState("Technical");
  const [numberOfQuestions, setNumberOfQuestions] = useState(5);
  const [selectedPersona, setSelectedPersona] = useState<Persona>(personas[0]);

  // Question review states
  const [questions, setQuestions] = useState<string[]>([]);
  const [interviewId, setInterviewId] = useState<string>("");
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingText, setEditingText] = useState("");

  const [keysConfigured, setKeysConfigured] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    // Check if keys are configured in local storage or env
    const settings = getLocalSettings();
    // In our backend, we will check process.env.GEMINI_API_KEY.
    // So if it's set in backend, we are good. Let's warning them if they have absolutely no keys set.
    // But we let them attempt it since they might have set it in the .env file!
  }, []);

  const handleCreateQuestions = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobTitle) {
      setError("Job Title is required");
      return;
    }

    setError("");
    setStep("generating");

    const settings = getLocalSettings();

    try {
      const response = await fetch("/api/interview", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-gemini-api-key": settings.geminiApiKey || "",
        },
        body: JSON.stringify({
          jobTitle,
          jobDescription,
          experienceLevel,
          interviewType,
          numberOfQuestions,
          personaName: selectedPersona.name,
          voiceId: selectedPersona.voiceId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create interview session");
      }

      setQuestions(data.questions);
      setInterviewId(data.interviewId);
      setStep("review");
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred during question generation");
      setStep("form");
    }
  };

  const handleEditQuestion = (index: number) => {
    setEditingIndex(index);
    setEditingText(questions[index]);
  };

  const handleSaveEdit = () => {
    if (editingIndex !== null && editingText.trim()) {
      const updated = [...questions];
      updated[editingIndex] = editingText;
      setQuestions(updated);
      setEditingIndex(null);
    }
  };

  const handleAddQuestion = () => {
    setQuestions([...questions, "New custom question..."]);
    setEditingIndex(questions.length);
    setEditingText("New custom question...");
  };

  const handleDeleteQuestion = (index: number) => {
    if (questions.length <= 1) {
      setError("An interview must have at least one question.");
      return;
    }
    const updated = questions.filter((_, i) => i !== index);
    setQuestions(updated);
  };

  const handleStartInterview = async () => {
    // When starting the interview, save the finalized edited questions back to the DB
    try {
      const response = await fetch(`/api/interview/${interviewId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questions,
          status: "in_progress", // set status to in progress
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save finalized questions");
      }

      // Route to active call page
      router.push(`/interview/${interviewId}`);
    } catch (err: any) {
      setError(err.message || "Could not start the interview call");
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between p-6 md:p-12 bg-background relative overflow-hidden">

      {/* Header */}
      <header className="flex items-center max-w-4xl w-full mx-auto z-10 mb-8">
        <button
          onClick={() => {
            if (step === "review") setStep("form");
            else router.push("/dashboard");
          }}
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Dashboard</span>
        </button>
      </header>

      {/* Main Container */}
      <main className="max-w-4xl w-full mx-auto flex-grow z-10 flex flex-col justify-center items-center">
        
        {/* STEP 1: CONFIGURATION FORM */}
        {step === "form" && (
          <div className="w-full flex flex-col gap-8">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-purple-500/30 bg-purple-500/10 w-fit mb-3">
                <Sliders className="h-3.5 w-3.5 text-purple-400" />
                <span className="text-xs font-semibold text-purple-300 uppercase tracking-wider">
                  Setup Interview
                </span>
              </div>
              <h2 className="text-3xl font-extrabold text-white">Configure Your Session</h2>
              <p className="text-xs text-gray-400 mt-1">Specify target job requirements, choose an interviewer persona, and let the AI generate questions.</p>
            </div>

            {error && (
              <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-medium">
                {error}
              </div>
            )}

            <form onSubmit={handleCreateQuestions} className="grid grid-cols-1 md:grid-cols-12 gap-8">
              {/* Form Input fields */}
              <div className="col-span-1 md:col-span-7 flex flex-col gap-5">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold text-gray-400">Target Job Title</label>
                  <input
                    type="text"
                    required
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    placeholder="e.g. Frontend Engineer, Product Manager"
                    className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/5 focus:border-purple-500/50 outline-none text-sm transition-colors"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-semibold text-gray-400">Experience Level</label>
                    <select
                      value={experienceLevel}
                      onChange={(e) => setExperienceLevel(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/5 focus:border-purple-500/50 outline-none text-sm transition-colors text-gray-300"
                    >
                      <option value="Junior">Junior (0-2 years)</option>
                      <option value="Mid">Mid Level (2-5 years)</option>
                      <option value="Senior">Senior (5+ years)</option>
                      <option value="Lead">Lead / Architect</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-semibold text-gray-400">Interview Type</label>
                    <select
                      value={interviewType}
                      onChange={(e) => setInterviewType(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/5 focus:border-purple-500/50 outline-none text-sm transition-colors text-gray-300"
                    >
                      <option value="Technical">Technical</option>
                      <option value="Behavioral">Behavioral</option>
                      <option value="General">General / HR</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-semibold text-gray-400">Job Description / Tech Stack (Optional)</label>
                    <span className="text-[10px] text-gray-600">Helps tailor exact questions</span>
                  </div>
                  <textarea
                    rows={4}
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    placeholder="Paste job description details, required skills (React, Go, System Design, etc.), or specific focus areas..."
                    className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/5 focus:border-purple-500/50 outline-none text-sm transition-colors resize-none"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-semibold text-gray-400">Number of Questions: {numberOfQuestions}</label>
                  </div>
                  <input
                    type="range"
                    min={3}
                    max={10}
                    value={numberOfQuestions}
                    onChange={(e) => setNumberOfQuestions(Number(e.target.value))}
                    className="w-full accent-purple-500 h-1.5 bg-white/5 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-gray-600 px-1">
                    <span>3 (Short)</span>
                    <span>5</span>
                    <span>8</span>
                    <span>10 (Full)</span>
                  </div>
                </div>
              </div>

              {/* Persona Selector column */}
              <div className="col-span-1 md:col-span-5 flex flex-col gap-5">
                <label className="text-xs font-semibold text-gray-400">Select Interviewer Persona</label>
                
                <div className="flex flex-col gap-3">
                  {personas.map((persona) => {
                    const isSelected = selectedPersona.id === persona.id;
                    return (
                      <div
                        key={persona.id}
                        onClick={() => setSelectedPersona(persona)}
                        className={`p-4 rounded-2xl cursor-pointer border transition-all flex items-start gap-4 ${
                          isSelected 
                            ? "bg-purple-950/20 border-purple-500 shadow-lg shadow-purple-500/5" 
                            : "bg-black/30 border-white/5 hover:border-white/10"
                        }`}
                      >
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                          isSelected ? "bg-purple-600 text-white" : "bg-white/5 text-gray-400"
                        }`}>
                          {persona.name.charAt(0)}
                        </div>
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-white">{persona.name}</span>
                            <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${
                              isSelected ? "bg-purple-500/20 text-purple-300" : "bg-white/5 text-gray-500"
                            }`}>
                              {persona.role}
                            </span>
                          </div>
                          <p className="text-[10px] text-gray-500 mt-1 leading-relaxed">{persona.description}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <button
                  type="submit"
                  className="w-full mt-2 py-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-sm shadow-lg shadow-purple-600/20 flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.99]"
                >
                  <Sparkles className="h-4.5 w-4.5" />
                  Generate Tailored Questions
                </button>
              </div>
            </form>
          </div>
        )}

        {/* STEP 2: GENERATING SCREEN */}
        {step === "generating" && (
          <div className="flex flex-col items-center justify-center text-center gap-6 py-20">
             <div className="relative">
              <div className="h-20 w-20 rounded-full border border-slate-700 flex items-center justify-center relative bg-slate-900/40">
                <Activity className="h-8 w-8 text-blue-400 animate-spin" />
              </div>
            </div>
            <div className="flex flex-col gap-2 max-w-sm">
              <h3 className="text-xl font-bold text-white">Structuring Your Interview</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Gemini is generating {numberOfQuestions} targeted questions based on the requirements for a {experienceLevel} {jobTitle} role...
              </p>
            </div>
          </div>
        )}

        {/* STEP 3: QUESTION REVIEW & EDITOR */}
        {step === "review" && (
          <div className="w-full flex flex-col gap-8">
            <div className="flex justify-between items-start flex-col sm:flex-row gap-4">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 w-fit mb-3">
                  <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />
                  <span className="text-xs font-semibold text-emerald-300 uppercase tracking-wider">
                    Questions Generated
                  </span>
                </div>
                <h2 className="text-3xl font-extrabold text-white">Review Interview Agenda</h2>
                <p className="text-xs text-gray-400 mt-1">These questions will guide your session. You can edit, add, delete, or rearrange them.</p>
              </div>

              <button
                onClick={handleStartInterview}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold text-sm shadow-lg shadow-purple-600/20 flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.99] shrink-0"
              >
                <Play className="h-4 w-4 fill-white" />
                Start Voice Call
              </button>
            </div>

            {error && (
              <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-medium">
                {error}
              </div>
            )}

            {/* Questions List */}
            <div className="flex flex-col gap-4">
              {questions.map((q, index) => (
                <div 
                  key={index}
                  className="p-5 rounded-2xl glass flex flex-col sm:flex-row justify-between items-start gap-4 hover:border-white/10 transition-colors"
                >
                  <div className="flex gap-4 items-start w-full">
                    <div className="h-6 w-6 rounded-md bg-white/5 border border-white/5 flex items-center justify-center text-xs font-bold text-purple-400 shrink-0">
                      {index + 1}
                    </div>

                    {editingIndex === index ? (
                      <div className="flex-grow flex flex-col gap-2">
                        <textarea
                          rows={2}
                          value={editingText}
                          onChange={(e) => setEditingText(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg bg-black/50 border border-purple-500/40 focus:border-purple-500 outline-none text-sm transition-colors resize-none"
                        />
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => setEditingIndex(null)}
                            className="px-3 py-1.5 rounded-lg border border-white/5 text-[10px] font-semibold text-gray-400 hover:bg-white/5"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleSaveEdit}
                            className="px-3 py-1.5 rounded-lg bg-purple-600 text-white text-[10px] font-semibold hover:bg-purple-500"
                          >
                            Save Change
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-200 mt-0.5 leading-relaxed">{q}</p>
                    )}
                  </div>

                  {editingIndex !== index && (
                    <div className="flex items-center gap-1.5 w-full sm:w-auto justify-end border-t border-white/5 sm:border-0 pt-3 sm:pt-0 shrink-0">
                      <button
                        onClick={() => handleEditQuestion(index)}
                        className="p-2 rounded-lg bg-white/5 border border-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-all"
                        title="Edit question"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteQuestion(index)}
                        className="p-2 rounded-lg bg-white/5 border border-white/5 text-gray-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
                        title="Delete question"
                      >
                        <Trash className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              ))}

              <button
                onClick={handleAddQuestion}
                className="p-4 rounded-2xl border border-dashed border-white/10 hover:border-white/20 hover:bg-white/5 text-gray-500 hover:text-gray-300 transition-all text-xs font-semibold flex items-center justify-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Custom Question
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="text-center text-gray-600 text-xs max-w-4xl w-full mx-auto mt-6 z-10">
        <p>&copy; {new Date().getFullYear()} Prepwise AI. Powered by Google Gemini.</p>
      </footer>
    </div>
  );
}
