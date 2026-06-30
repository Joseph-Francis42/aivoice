"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  Mic, 
  MicOff, 
  PhoneOff, 
  Play, 
  Volume2, 
  Activity, 
  AlertCircle, 
  BookOpen, 
  Sparkles, 
  ArrowLeft,
  ChevronRight,
  ShieldCheck,
  VolumeX,
  Volume2 as VolumeIcon
} from "lucide-react";
import { getLocalSettings } from "@/lib/settings";

interface TranscriptMessage {
  role: "interviewer" | "candidate";
  content: string;
  timestamp: Date;
}

interface InterviewData {
  id: string;
  jobTitle: string;
  jobDescription: string;
  experienceLevel: string;
  interviewType: string;
  personaName: string;
  voiceId: string;
  feedbackJson: string | null;
  status: string;
}

export default function InterviewRoomPage() {
  const params = useParams();
  const router = useRouter();
  const interviewId = params.id as string;

  const [interview, setInterview] = useState<InterviewData | null>(null);
  const [questions, setQuestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Mode: "vapi" or "local" (Web Speech API)
  const [mode, setMode] = useState<"vapi" | "local">("local");

  // Call States
  const [callState, setCallState] = useState<"idle" | "connecting" | "active" | "ended">("idle");
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0);
  const [transcript, setTranscript] = useState<TranscriptMessage[]>([]);
  
  // Local voice mode states
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(-1); // -1 is greeting
  const [localUserSpeech, setLocalUserSpeech] = useState("");

  // Post-Interview Evaluation states
  const [generatingFeedback, setGeneratingFeedback] = useState(false);
  const [feedbackProgress, setFeedbackProgress] = useState("");

  const vapiRef = useRef<any>(null);
  const recognitionRef = useRef<any>(null);
  const transcriptEndRef = useRef<HTMLDivElement>(null);
  
  // Refs for tracking local speech state
  const currentIdxRef = useRef(-1);
  const questionsRef = useRef<string[]>([]);
  const transcriptRef = useRef<TranscriptMessage[]>([]);

  // Load interview metadata
  useEffect(() => {
    const fetchInterview = async () => {
      try {
        const response = await fetch(`/api/interview/${interviewId}`);
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || "Failed to load session metadata");
        }

        setInterview(data.interview);
        
        // Parse generated questions
        if (data.interview.feedbackJson) {
          const parsed = JSON.parse(data.interview.feedbackJson);
          if (parsed.generatedQuestions) {
            setQuestions(parsed.generatedQuestions);
            questionsRef.current = parsed.generatedQuestions;
          }
        }
      } catch (err: any) {
        setError(err.message || "An unexpected error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchInterview();
  }, [interviewId]);

  // Determine mode and initialize Vapi or Web Speech
  useEffect(() => {
    if (loading || !interview) return;

    const settings = getLocalSettings();
    const publicKey = settings.vapiPublicKey || process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY;
    const assistantId = process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID;

    console.log("Vapi Config Loaded in Client:");
    console.log("- Vapi Public Key:", publicKey ? `${publicKey.slice(0, 8)}...` : "Missing");
    console.log("- Vapi Assistant ID:", assistantId ? `${assistantId.slice(0, 8)}...` : "Missing");

    if (settings.useLocalVoice || !publicKey) {
      // Fall back to Web Speech API
      console.log("Local voice engine forced or key missing. Using Web Speech API.");
      setMode("local");
      return;
    }

    // Vapi Mode Initialization
    setMode("vapi");
    
    // Prevent double initialization
    if (vapiRef.current) return;

    try {
      const VapiModule = require("@vapi-ai/web");
      const VapiClass = VapiModule.default || VapiModule.Vapi || VapiModule;
      const vapiInstance = new VapiClass(publicKey);
      vapiRef.current = vapiInstance;

      // Bind event listeners
      vapiInstance.on("call-start", () => {
        setCallState("active");
      });

      vapiInstance.on("call-end", () => {
        setCallState("ended");
      });

      vapiInstance.on("volume-level", (level: number) => {
        setVolume(level);
      });

      vapiInstance.on("message", (message: any) => {
        if (message.type === "transcript" && message.transcriptType === "final") {
          const newMsg: TranscriptMessage = {
            role: message.role === "user" ? "candidate" : "interviewer",
            content: message.transcript,
            timestamp: new Date(),
          };
          setTranscript((prev) => [...prev, newMsg]);
          transcriptRef.current = [...transcriptRef.current, newMsg];
        }
      });

      vapiInstance.on("error", (err: any) => {
        console.warn("Vapi error:", err);
        let detail = "";
        try {
          detail = typeof err === "string" 
            ? err 
            : JSON.stringify(err, Object.getOwnPropertyNames(err));
        } catch {
          detail = String(err);
        }
        setError(`Voice Agent Error: ${detail || "Connection failed"}`);
        setCallState("idle");
      });

    } catch (err: any) {
      console.error("Vapi initialization error:", err);
      setMode("local"); // fallback to local on crash
    }

    return () => {
      if (vapiRef.current) {
        try {
          vapiRef.current.stop();
          // Clean up listeners
          vapiRef.current.removeAllListeners?.();
        } catch (e) {
          console.warn("Error cleaning up Vapi:", e);
        }
        vapiRef.current = null;
      }
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
      if (typeof window !== "undefined") {
        window.speechSynthesis.cancel();
      }
    };
  }, [loading, interview]);

  // Scroll transcript to bottom
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [transcript]);

  // LOCAL SPEECH API IMPLEMENTATION
  const speakLocalText = (text: string, onEnd: () => void) => {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      onEnd();
      return;
    }
    
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Choose appropriate voice
    const voices = window.speechSynthesis.getVoices();
    const isFemale = ["Sarah", "Elena"].includes(interview?.personaName || "");
    const matchedVoice = voices.find((v) => 
      isFemale 
        ? (v.name.includes("Female") || v.name.includes("Google US English") || v.name.includes("Zira") || v.name.includes("rachel")) 
        : (v.name.includes("Male") || v.name.includes("David") || v.name.includes("brian"))
    );
    if (matchedVoice) utterance.voice = matchedVoice;

    // Pulse visual waveform during speech synthesis
    const visualInterval = setInterval(() => {
      setVolume(Math.random() * 0.35 + 0.1);
    }, 100);

    utterance.onend = () => {
      clearInterval(visualInterval);
      setVolume(0);
      onEnd();
    };

    utterance.onerror = () => {
      clearInterval(visualInterval);
      setVolume(0);
      onEnd();
    };

    window.speechSynthesis.speak(utterance);
  };

  const listenLocalUser = () => {
    if (typeof window === "undefined") return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError("Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.");
      return;
    }

    const rec = new SpeechRecognition();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = "en-US";

    let finalTranscript = "";

    rec.onresult = (event: any) => {
      let interimTranscript = "";
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }
      
      const combined = finalTranscript || interimTranscript;
      setLocalUserSpeech(combined);
      
      // Update volume indicator based on mic activity
      setVolume(Math.min(0.9, Math.max(0.04, combined.length * 0.02)));
    };

    rec.onerror = (err: any) => {
      console.error("Speech Recognition error:", err);
      // Automatically restart on transient errors
      if (err.error === "no-speech") {
        setVolume(0.02);
      }
    };

    rec.onend = () => {
      // Keep listening until user manually hits "Next Question" or "End Call"
      if (callState === "active" && !isMuted) {
        try {
          rec.start();
        } catch {}
      }
    };

    recognitionRef.current = rec;
    rec.start();
  };

  const handleNextLocalStep = () => {
    // 1. Stop current listening
    if (recognitionRef.current) {
      recognitionRef.current.onend = null; // Prevent restart loop
      recognitionRef.current.stop();
    }

    // 2. Save candidate's spoken answer if there is one
    if (currentIdxRef.current >= 0 && localUserSpeech.trim()) {
      const candidateMsg: TranscriptMessage = {
        role: "candidate",
        content: localUserSpeech.trim(),
        timestamp: new Date(),
      };
      setTranscript((prev) => [...prev, candidateMsg]);
      transcriptRef.current = [...transcriptRef.current, candidateMsg];
    }
    
    setLocalUserSpeech("");
    const nextIdx = currentIdxRef.current + 1;
    currentIdxRef.current = nextIdx;
    setCurrentQuestionIdx(nextIdx);

    // 3. Check if all questions are completed
    if (nextIdx >= questionsRef.current.length) {
      // Finish interview
      const closeMsg = `Thank you, this concludes our interview. You can now click Compile Feedback to see your score and evaluation report. Have a great day!`;
      const interviewerMsg: TranscriptMessage = {
        role: "interviewer",
        content: closeMsg,
        timestamp: new Date(),
      };
      setTranscript((prev) => [...prev, interviewerMsg]);
      transcriptRef.current = [...transcriptRef.current, interviewerMsg];
      
      speakLocalText(closeMsg, () => {
        setCallState("ended");
      });
      return;
    }

    // 4. Speak next question
    const nextQuestion = questionsRef.current[nextIdx];
    const interviewerMsg: TranscriptMessage = {
      role: "interviewer",
      content: nextQuestion,
      timestamp: new Date(),
    };
    setTranscript((prev) => [...prev, interviewerMsg]);
    transcriptRef.current = [...transcriptRef.current, interviewerMsg];

    speakLocalText(nextQuestion, () => {
      // Start listening to user again
      listenLocalUser();
    });
  };

  // Start Call Handler
  const handleStartCall = () => {
    setError("");
    setCallState("connecting");

    if (mode === "vapi") {
      // Start Vapi Call
      const systemPrompt = `
        You are ${interview?.personaName}, a professional mock interviewer conducting a ${interview?.interviewType} interview for a candidate seeking a ${interview?.experienceLevel} ${interview?.jobTitle} position.
        
        Job requirements context:
        ${interview?.jobDescription || "No job description provided."}

        Conduct the interview by walking the candidate through the following tailored questions:
        ${questions.map((q, i) => `${i + 1}. ${q}`).join("\n")}

        Conducting Rules:
        1. Greet the candidate and read the first question.
        2. Keep replies natural. Provide verbal back-channeling ("mhm", "I see", "great") as they answer.
        3. Ask exactly one question at a time. Do not rush or read ahead.
        4. If the candidate gives a short answer, ask a follow-up probe before moving to the next question.
        5. Handle barge-ins: if they talk, you stop immediately.
        6. Once all questions are completed, say "Thank you, this concludes our interview. Have a great day!" and stop.
      `;

      const assistantConfig = {
        name: interview?.personaName,
        firstMessage: `Hi! I'm ${interview?.personaName}. Thank you for coming in today for the ${interview?.experienceLevel} ${interview?.jobTitle} mock interview. Whenever you are ready, let's begin. First, could you walk me through your background and interest in this role?`,
        model: {
          provider: "openai",
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: systemPrompt,
            }
          ],
          temperature: 0.7,
        },
        voice: {
          provider: "playht",
          voiceId: "josh",
        },
      };

      const assistantOverrides = {
        firstMessage: assistantConfig.firstMessage,
        model: assistantConfig.model,
      };

      const assistantId = process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID;

      try {
        if (assistantId) {
          vapiRef.current.start(assistantId, assistantOverrides);
        } else {
          vapiRef.current.start(assistantConfig);
        }
      } catch (err: any) {
        setError(err.message || "Failed to initiate Vapi call. Falling back to local Speech API.");
        setMode("local");
        setCallState("connecting");
        // Start local fallback
        startLocalInterviewFlow();
      }
    } else {
      // Start Local Web Speech flow
      startLocalInterviewFlow();
    }
  };

  const startLocalInterviewFlow = () => {
    setCallState("active");
    currentIdxRef.current = -1;
    setCurrentQuestionIdx(-1);

    const greetingText = `Hi! I'm ${interview?.personaName}. Thank you for coming in today for the ${interview?.experienceLevel} ${interview?.jobTitle} mock interview. Whenever you are ready, let's begin. First, could you walk me through your background and interest in this role?`;
    
    const interviewerMsg: TranscriptMessage = {
      role: "interviewer",
      content: greetingText,
      timestamp: new Date(),
    };
    setTranscript([interviewerMsg]);
    transcriptRef.current = [interviewerMsg];

    speakLocalText(greetingText, () => {
      listenLocalUser();
    });
  };

  const handleToggleMute = () => {
    const nextMute = !isMuted;
    setIsMuted(nextMute);

    if (mode === "vapi") {
      vapiRef.current?.setMuted(nextMute);
    } else {
      if (nextMute) {
        if (recognitionRef.current) {
          recognitionRef.current.onend = null;
          recognitionRef.current.stop();
        }
        setVolume(0);
      } else {
        listenLocalUser();
      }
    }
  };

  const handleEndCall = () => {
    if (mode === "vapi") {
      vapiRef.current?.stop();
    } else {
      if (recognitionRef.current) {
        recognitionRef.current.onend = null;
        recognitionRef.current.stop();
      }
      if (typeof window !== "undefined") {
        window.speechSynthesis.cancel();
      }
      
      // Save any pending user text
      if (localUserSpeech.trim() && currentIdxRef.current >= 0) {
        const candidateMsg: TranscriptMessage = {
          role: "candidate",
          content: localUserSpeech.trim(),
          timestamp: new Date(),
        };
        setTranscript((prev) => [...prev, candidateMsg]);
        transcriptRef.current = [...transcriptRef.current, candidateMsg];
      }
      setLocalUserSpeech("");
      setVolume(0);
    }
    setCallState("ended");
  };

  const handleCompileFeedback = async () => {
    setGeneratingFeedback(true);
    setFeedbackProgress("Transcribing conversational dialog...");
    
    setTimeout(() => setFeedbackProgress("Analyzing technical depth & communication scores..."), 1500);
    setTimeout(() => setFeedbackProgress("Generating model answers & tailored practice exercises..."), 3000);
    setTimeout(() => setFeedbackProgress("Saving interview report to database..."), 4500);

    const settings = getLocalSettings();

    try {
      const response = await fetch(`/api/interview/${interviewId}/feedback`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-gemini-api-key": settings.geminiApiKey || "",
        },
        body: JSON.stringify({ transcript: transcriptRef.current }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to compile feedback");
      }

      router.push(`/interview/${interviewId}/feedback`);
    } catch (err: any) {
      setError(err.message || "Could not generate feedback report");
      setGeneratingFeedback(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Activity className="h-8 w-8 text-purple-500 animate-spin" />
          <span className="text-gray-400 text-sm">Loading interview room...</span>
        </div>
      </div>
    );
  }

  if (generatingFeedback) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="flex flex-col items-center text-center gap-6 max-w-sm">
          <div className="relative">
            <div className="h-20 w-20 rounded-full border border-slate-700 flex items-center justify-center relative bg-slate-900/40">
              <Sparkles className="h-8 w-8 text-blue-400 animate-pulse" />
            </div>
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Evaluating Performance</h3>
            <p className="text-xs text-blue-400 mt-2 font-mono h-4">{feedbackProgress}</p>
          </div>
        </div>
      </div>
    );
  }

  const waveHeightScale = Math.max(0.1, volume * 1.8);

  return (
    <div className="min-h-screen flex flex-col justify-between p-6 md:p-12 bg-background relative overflow-hidden">

      {/* Header */}
      <header className="flex justify-between items-center max-w-5xl w-full mx-auto z-10 mb-8">
        <button
          onClick={() => {
            if (callState === "active") {
              if (confirm("Are you sure you want to exit? Your active call will end.")) {
                handleEndCall();
                router.push("/dashboard");
              }
            } else {
              router.push("/dashboard");
            }
          }}
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Exit Room</span>
        </button>
      </header>

      {/* Main Grid */}
      <main className="max-w-5xl w-full mx-auto flex-grow grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch mb-12 z-10">
        
        {/* Left Side: Waveform and Voice controls */}
        <div className="col-span-1 lg:col-span-7 flex flex-col justify-between p-8 rounded-3xl glass border-white/5 relative overflow-hidden min-h-[450px]">
          
          {/* Active status */}
          <div className="flex justify-between items-center z-10">
            <div className="flex items-center gap-2">
              <span className={`h-2.5 w-2.5 rounded-full ${
                callState === "active" ? "bg-emerald-500 animate-pulse" : 
                callState === "connecting" ? "bg-amber-500 animate-pulse" : "bg-gray-600"
              }`} />
              <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider">
                {callState === "active" ? "Live Call Connected" : 
                 callState === "connecting" ? "Initializing voice link" : 
                 callState === "ended" ? "Call Concluded" : "Interviewer Idle"}
              </span>
            </div>
            {interview && (
              <span className="text-[10px] px-2.5 py-0.5 rounded-full border border-white/5 bg-white/5 text-gray-400">
                {interview.interviewType} Interview
              </span>
            )}
          </div>

          {/* Central Pulsing Waveform or Avatar */}
          <div className="flex flex-col items-center justify-center gap-6 my-12 z-10">
            <div className="relative">
              <div className="h-32 w-32 rounded-full border border-slate-700 bg-slate-900 flex items-center justify-center relative overflow-hidden shadow-2xl">
                {isMuted ? (
                  <VolumeX className="h-12 w-12 text-rose-400" />
                ) : (
                  <VolumeIcon className={`h-12 w-12 text-blue-400 transition-transform duration-75 ${
                    callState === "active" ? "scale-105 animate-pulse" : "scale-100"
                  }`} />
                )}
              </div>
            </div>

            <div className="text-center">
              <h3 className="text-xl font-bold text-white">{interview?.personaName}</h3>
              <p className="text-xs text-blue-400 mt-1">
                {callState === "active" 
                  ? `${interview?.personaName} is active` 
                  : `Voice Call with ${interview?.personaName}`}
              </p>
            </div>

            {/* Custom Responsive Waveform Bars */}
            <div className="flex items-center justify-center gap-1.5 h-16 mt-4">
              {Array.from({ length: 12 }).map((_, i) => (
                <div
                  key={i}
                  style={{
                    transform: `scaleY(${callState === "active" ? waveHeightScale * (1 - Math.abs(i - 6) * 0.12) + 0.15 : 0.15})`,
                    transition: "transform 75ms linear",
                  }}
                  className="w-1 bg-gradient-to-t from-slate-600 to-blue-500 rounded-full h-12 origin-center"
                />
              ))}
            </div>
          </div>

          {/* Error display */}
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold flex items-center gap-2 mb-4 z-10">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Action triggers */}
          <div className="flex justify-center items-center gap-4 z-10">
            {callState === "idle" && (
              <button
                onClick={handleStartCall}
                className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-purple-600/25 flex items-center gap-2 active:scale-[0.98]"
              >
                <Mic className="h-4.5 w-4.5" />
                Start Voice Interview
              </button>
            )}

            {callState === "connecting" && (
              <div className="px-6 py-3 rounded-2xl bg-white/5 border border-white/5 flex items-center gap-2.5 text-xs text-gray-400">
                <Activity className="h-4 w-4 text-purple-500 animate-spin" />
                Opening audio gateway...
              </div>
            )}

            {callState === "active" && (
              <>
                <button
                  onClick={handleToggleMute}
                  className={`p-3.5 rounded-xl border transition-all ${
                    isMuted 
                      ? "bg-rose-500/20 border-rose-500/30 text-rose-400" 
                      : "bg-white/5 border-white/10 text-gray-400 hover:text-white"
                  }`}
                  title={isMuted ? "Unmute microphone" : "Mute microphone"}
                >
                  {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                </button>

                <button
                  onClick={handleEndCall}
                  className="px-6 py-3.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-sm flex items-center gap-2 shadow-lg shadow-rose-600/20 active:scale-[0.98] transition-colors"
                >
                  <PhoneOff className="h-4.5 w-4.5" />
                  End Call
                </button>

                {/* Next Question button for Web Speech Mode */}
                {mode === "local" && (
                  <button
                    onClick={handleNextLocalStep}
                    className="px-6 py-3.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-sm flex items-center gap-1.5 shadow-lg shadow-purple-600/20 active:scale-[0.98] transition-colors"
                  >
                    <span>Next Question</span>
                    <ChevronRight className="h-4.5 w-4.5" />
                  </button>
                )}
              </>
            )}

            {callState === "ended" && (
              <button
                onClick={handleCompileFeedback}
                className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm shadow-lg shadow-emerald-600/25 flex items-center gap-2 active:scale-[0.98]"
              >
                <Sparkles className="h-4.5 w-4.5 animate-pulse" />
                Compile Performance Feedback
              </button>
            )}
          </div>

        </div>

        {/* Right Side: Live transcript feed */}
        <div className="col-span-1 lg:col-span-5 flex flex-col justify-between p-6 rounded-3xl glass border-white/5 min-h-[450px]">
          <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4 border-b border-white/5 pb-3 flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-purple-400" />
            Live Dialogue Transcript
          </h4>

          {/* Transcript Feed Scroll area */}
          <div className="flex-grow overflow-y-auto max-h-[350px] pr-2 flex flex-col gap-4">
            {transcript.length === 0 ? (
              <div className="flex-grow flex flex-col items-center justify-center text-center text-gray-600 py-12 gap-2">
                <Activity className="h-6 w-6 text-gray-700" />
                <p className="text-xs">Your spoken conversation will appear here in real-time once you start the voice interview.</p>
              </div>
            ) : (
              <>
                {transcript.map((msg, idx) => (
                  <div 
                    key={idx}
                    className={`flex flex-col gap-1 max-w-[85%] ${
                      msg.role === "candidate" ? "self-end items-end" : "self-start items-start"
                    }`}
                  >
                    <span className="text-[9px] text-gray-500 font-semibold uppercase tracking-wider">
                      {msg.role === "candidate" ? "You" : interview?.personaName}
                    </span>
                    <div className={`p-3 rounded-2xl text-xs leading-relaxed ${
                      msg.role === "candidate" 
                        ? "bg-purple-600 text-white rounded-tr-none" 
                        : "bg-white/5 border border-white/5 text-gray-300 rounded-tl-none"
                    }`}>
                      {msg.content}
                    </div>
                  </div>
                ))}
                {localUserSpeech && (
                  <div className="flex flex-col gap-1 max-w-[85%] self-end items-end">
                    <span className="text-[9px] text-purple-400 font-semibold uppercase tracking-wider animate-pulse">
                      You (Speaking...)
                    </span>
                    <div className="p-3 rounded-2xl text-xs leading-relaxed bg-purple-600/40 border border-purple-500/20 text-white rounded-tr-none italic animate-pulse">
                      {localUserSpeech}
                    </div>
                  </div>
                )}
              </>
            )}
            <div ref={transcriptEndRef} />
          </div>

          {/* Guidance note */}
          <div className="mt-4 pt-3 border-t border-white/5 flex gap-2 items-start text-[10px] text-gray-500 leading-normal">
            <ShieldCheck className="h-3.5 w-3.5 text-purple-400/80 shrink-0 mt-0.5" />
            <span>
              {mode === "vapi" 
                ? "Speak naturally. Interrupt the AI (barge-in) at any time. When done, click End Call." 
                : "Speak into your microphone. When you finish answering each question, click Next Question to proceed."}
            </span>
          </div>

        </div>

      </main>

      {/* Footer */}
      <footer className="text-center text-gray-600 text-xs max-w-5xl w-full mx-auto mt-6 z-10">
        <p>&copy; {new Date().getFullYear()} Prepwise AI. All voice data is processed securely.</p>
      </footer>
    </div>
  );
}
