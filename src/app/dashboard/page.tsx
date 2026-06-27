"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Plus, 
  LogOut, 
  Mic, 
  Calendar, 
  Briefcase, 
  TrendingUp, 
  Award, 
  Clock,
  Sparkles, 
  ChevronRight,
  Settings as SettingsIcon,
  MessageSquare,
  Volume2,
  Activity
} from "lucide-react";
import { getLocalSettings, saveLocalSettings, AppSettings } from "@/lib/settings";

interface InterviewItem {
  id: string;
  jobTitle: string;
  experienceLevel: string;
  interviewType: string;
  createdAt: string;
  status: string;
  score: number | null;
  personaName: string;
}

interface Stats {
  totalCount: number;
  completedCount: number;
  averageScore: number | null;
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [interviews, setInterviews] = useState<InterviewItem[]>([]);
  const [stats, setStats] = useState<Stats>({ totalCount: 0, completedCount: 0, averageScore: null });
  const [loading, setLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [keys, setKeys] = useState<AppSettings>({ geminiApiKey: "", vapiPublicKey: "", useLocalVoice: false });
  const [settingsSaved, setSettingsSaved] = useState(false);
  const [serverConfig, setServerConfig] = useState({ hasGeminiKey: false, hasVapiKey: false });

  useEffect(() => {
    // Load local settings keys
    setKeys(getLocalSettings());
    
    // Fetch user and interviews
    const fetchData = async () => {
      try {
        const userRes = await fetch("/api/auth/me");
        const userData = await userRes.json();
        
        if (!userData.authenticated) {
          router.push("/");
          return;
        }
        setUser(userData.user);
        if (userData.config) {
          setServerConfig(userData.config);
        }

        const listRes = await fetch("/api/interview");
        const listData = await listRes.json();
        if (listData.success) {
          setInterviews(listData.interviews);
          setStats(listData.stats);
        }
      } catch (err) {
        console.error("Error loading dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  const hasGemini = !!(keys.geminiApiKey || serverConfig.hasGeminiKey);
  const hasVapi = !!(keys.vapiPublicKey || serverConfig.hasVapiKey);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/");
      router.refresh();
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  const handleSaveKeys = (e: React.FormEvent) => {
    e.preventDefault();
    saveLocalSettings(keys);
    setSettingsSaved(true);
    setTimeout(() => {
      setSettingsSaved(false);
      setShowSettings(false);
      // Reload page to re-evaluate key status
      window.location.reload();
    }, 8000);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-emerald-400 border-emerald-500/30 bg-emerald-500/10";
    if (score >= 60) return "text-amber-400 border-amber-500/30 bg-amber-500/10";
    return "text-rose-400 border-rose-500/30 bg-rose-500/10";
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Activity className="h-8 w-8 text-purple-500 animate-spin" />
          <span className="text-gray-400 text-sm font-medium">Loading your dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col justify-between p-6 md:p-12 bg-background relative overflow-hidden">
      {/* Header */}
      <header className="flex justify-between items-center max-w-6xl w-full mx-auto z-10 mb-8">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => router.push("/dashboard")}>
          <div className="h-9 w-9 rounded-lg bg-slate-700 flex items-center justify-center">
            <Mic className="h-4.5 w-4.5 text-white" />
          </div>
          <span className="text-lg font-bold tracking-tight text-white">
            Prepwise AI
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden md:block">
            <p className="text-xs text-gray-400">Signed in as</p>
            <p className="text-sm font-semibold text-white">
              {user?.username} {user?.isGuest && <span className="text-[10px] text-blue-400 bg-blue-500/10 border border-blue-500/20 px-1.5 py-0.5 rounded-full ml-1">Guest</span>}
            </p>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/5 hover:bg-rose-500/10 hover:border-rose-500/20 hover:text-rose-400 transition-all text-sm font-medium text-gray-400"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl w-full mx-auto flex-grow z-10 grid grid-cols-1 md:grid-cols-12 gap-8 items-start mb-12">
        {/* Left Side: Main Stats & Call To Action */}
        <div className="col-span-1 md:col-span-8 flex flex-col gap-8">
          
          {/* Welcome banner */}
          <div className="flex flex-col gap-2">
            <h2 className="text-3xl font-extrabold tracking-tight">
              Welcome back, <span className="bg-gradient-to-r from-purple-400 to-indigo-300 bg-clip-text text-transparent">{user?.username?.split("_")[0]}</span>
            </h2>
            <p className="text-gray-400 text-sm">
              Practice role-specific mock interviews and sharpen your communication.
            </p>
          </div>

          {/* Warning if API Keys are not configured */}
          {(!hasGemini || !hasVapi) && (
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex gap-3 items-start">
                <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse mt-1.5 shrink-0" />
                <div className="text-xs text-amber-400/80 flex flex-col gap-1">
                  <p className="text-sm font-bold text-amber-300">API Configuration Status</p>
                  {!hasGemini && <span>• Google Gemini API Key is missing. (AI feedback report will run in mock mode).</span>}
                  {!hasVapi && <span>• Vapi Public Key is missing. (Using local browser speech engine fallback).</span>}
                </div>
              </div>
              <button
                onClick={() => setShowSettings(true)}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-semibold text-xs transition-colors shrink-0"
              >
                Configure Keys
              </button>
            </div>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl glass flex flex-col gap-3 relative overflow-hidden">
              <Briefcase className="h-5 w-5 text-purple-400" />
              <div>
                <p className="text-xs text-gray-500 font-medium">Interviews Started</p>
                <p className="text-2xl font-extrabold">{stats.totalCount}</p>
              </div>
            </div>

            <div className="p-5 rounded-2xl glass flex flex-col gap-3 relative overflow-hidden">
              <Award className="h-5 w-5 text-blue-400" />
              <div>
                <p className="text-xs text-gray-500 font-medium">Average Score</p>
                <p className="text-2xl font-extrabold">
                  {stats.averageScore ? `${stats.averageScore}%` : "—"}
                </p>
              </div>
            </div>

            <div className="p-5 rounded-2xl glass flex flex-col gap-3 relative overflow-hidden">
              <Clock className="h-5 w-5 text-emerald-400" />
              <div>
                <p className="text-xs text-gray-500 font-medium">Completed</p>
                <p className="text-2xl font-extrabold">{stats.completedCount}</p>
              </div>
            </div>

            <div className="p-5 rounded-2xl glass flex flex-col gap-3 relative overflow-hidden">
              <TrendingUp className="h-5 w-5 text-amber-400" />
              <div>
                <p className="text-xs text-gray-500 font-medium">Weakest Area</p>
                <p className="text-sm font-bold truncate mt-1">
                  {stats.completedCount > 0 ? "STAR structure" : "—"}
                </p>
              </div>
            </div>
          </div>

          {/* Recent History Table */}
          <div className="flex flex-col gap-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Calendar className="h-4.5 w-4.5 text-purple-400" />
              Recent Practice History
            </h3>

            {interviews.length === 0 ? (
              <div className="p-12 rounded-2xl glass border-dashed border-white/10 flex flex-col items-center justify-center text-center gap-4">
                <div className="h-12 w-12 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-400">
                  <MessageSquare className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-bold text-white">No interviews logged yet</p>
                  <p className="text-xs text-gray-500 max-w-xs mt-1">Configure your first mock session and get analytical grading.</p>
                </div>
                <button
                  onClick={() => router.push("/interview/new")}
                  className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-sm transition-all"
                >
                  Start First Session
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {interviews.map((item) => (
                  <div
                    key={item.id}
                    className="p-5 rounded-2xl glass-interactive flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
                  >
                    <div className="flex gap-4 items-center">
                      <div className="h-10 w-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-gray-400">
                        <Briefcase className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-white">{item.jobTitle}</h4>
                        <div className="flex gap-2 items-center text-xs text-gray-500 mt-0.5">
                          <span>{item.experienceLevel}</span>
                          <span>•</span>
                          <span>{item.interviewType}</span>
                          <span>•</span>
                          <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end border-t border-white/5 sm:border-0 pt-3 sm:pt-0">
                      {item.status === "completed" && item.score !== null ? (
                        <>
                          <div className={`px-2.5 py-1 rounded-full border text-xs font-bold ${getScoreColor(item.score)}`}>
                            Score: {item.score}%
                          </div>
                          <button
                            onClick={() => router.push(`/interview/${item.id}/feedback`)}
                            className="flex items-center gap-1 text-xs text-purple-400 hover:text-purple-300 font-semibold transition-colors"
                          >
                            Feedback <ChevronRight className="h-3 w-3" />
                          </button>
                        </>
                      ) : (
                        <>
                          <span className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
                            Incomplete
                          </span>
                          <button
                            onClick={() => router.push(`/interview/${item.id}`)}
                            className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 font-semibold transition-colors"
                          >
                            Resume Session <ChevronRight className="h-3 w-3" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Right Side: Start Interview CTA Card & Interview Personas */}
        <div className="col-span-1 md:col-span-4 flex flex-col gap-6">
          <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800 flex flex-col gap-6 shadow-xl relative overflow-hidden">
            <div>
              <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 mb-4 border border-blue-500/25">
                <Sparkles className="h-5 w-5 animate-pulse" />
              </div>
              <h3 className="text-lg font-bold text-white">Start Practicing</h3>
              <p className="text-xs text-gray-400 leading-relaxed mt-1">
                Configure a custom job, target experience, and experience dynamic question lists generated in real time.
              </p>
            </div>
            
            <button
              onClick={() => router.push("/interview/new")}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-sm shadow-lg shadow-purple-600/25 flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.99]"
            >
              <Plus className="h-4.5 w-4.5" />
              Create Interview
            </button>
          </div>

          {/* AI Personas info card */}
          <div className="p-6 rounded-2xl glass flex flex-col gap-4">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Volume2 className="h-4 w-4 text-purple-400" />
              Available Interviewers
            </h4>
            
            <div className="flex flex-col gap-3">
              <div className="p-3 rounded-xl bg-white/5 border border-white/5 flex gap-3 items-center">
                <div className="h-8 w-8 rounded-full bg-purple-500/20 text-purple-300 flex items-center justify-center font-bold text-xs">S</div>
                <div>
                  <h5 className="text-xs font-bold text-white">Sarah</h5>
                  <p className="text-[10px] text-gray-400">Warm, encouraging, behavioral focused</p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-white/5 border border-white/5 flex gap-3 items-center">
                <div className="h-8 w-8 rounded-full bg-blue-500/20 text-blue-300 flex items-center justify-center font-bold text-xs">D</div>
                <div>
                  <h5 className="text-xs font-bold text-white">Dave</h5>
                  <p className="text-[10px] text-gray-400">Direct, technical, strict evaluation</p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-white/5 border border-white/5 flex gap-3 items-center">
                <div className="h-8 w-8 rounded-full bg-rose-500/20 text-rose-300 flex items-center justify-center font-bold text-xs">E</div>
                <div>
                  <h5 className="text-xs font-bold text-white">Elena</h5>
                  <p className="text-[10px] text-gray-400">Systematic, HR, core competency mapping</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl glass p-8 border border-white/10 shadow-2xl flex flex-col gap-6 relative">
            <div>
              <h3 className="text-xl font-bold flex items-center gap-2">
                <SettingsIcon className="h-5 w-5 text-purple-400" />
                Configure API Keys
              </h3>
              <p className="text-xs text-gray-400 mt-1">
                Keys are stored locally in your browser's Local Storage for security.
              </p>
            </div>

            {settingsSaved && (
              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold flex items-center gap-2">
                <Award className="h-4 w-4 animate-bounce" />
                Keys saved successfully!
              </div>
            )}

            <form onSubmit={handleSaveKeys} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-semibold text-gray-400">Google Gemini API Key</label>
                  <a
                    href="https://aistudio.google.com/"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[10px] text-purple-400 hover:underline"
                  >
                    Get Free Key
                  </a>
                </div>
                <div className="relative">
                  <Mic className="absolute left-3 top-3.5 h-4 w-4 text-gray-500 rotate-90" />
                  <input
                    type="password"
                    value={keys.geminiApiKey}
                    onChange={(e) => setKeys({ ...keys, geminiApiKey: e.target.value })}
                    placeholder="AIzaSy..."
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-black/40 border border-white/5 focus:border-purple-500/50 outline-none text-sm transition-colors"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-semibold text-gray-400">Vapi Public Key</label>
                  <a
                    href="https://dashboard.vapi.ai/"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[10px] text-purple-400 hover:underline"
                  >
                    Get Vapi Key
                  </a>
                </div>
                <div className="relative">
                  <Mic className="absolute left-3 top-3.5 h-4 w-4 text-gray-500" />
                  <input
                    type="password"
                    value={keys.vapiPublicKey}
                    onChange={(e) => setKeys({ ...keys, vapiPublicKey: e.target.value })}
                    placeholder="vapi-public-..."
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-black/40 border border-white/5 focus:border-purple-500/50 outline-none text-sm transition-colors"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2.5 mt-1 p-2.5 rounded-xl bg-white/5 border border-white/5">
                <input
                  type="checkbox"
                  id="useLocalVoice"
                  checked={keys.useLocalVoice || false}
                  onChange={(e) => setKeys({ ...keys, useLocalVoice: e.target.checked })}
                  className="rounded border-white/10 text-purple-600 focus:ring-purple-500 h-4 w-4 bg-black/40"
                />
                <label htmlFor="useLocalVoice" className="text-xs font-semibold text-gray-300 cursor-pointer select-none">
                  Force Local Voice Engine (Bypass Vapi/Daily.co blocks)
                </label>
              </div>

              <div className="flex gap-3 mt-2">
                <button
                  type="button"
                  onClick={() => setShowSettings(false)}
                  className="flex-1 py-3 rounded-xl border border-white/10 text-gray-300 font-semibold text-sm hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-sm transition-colors shadow-lg shadow-purple-600/20"
                >
                  Save Keys
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="text-center text-gray-600 text-xs max-w-6xl w-full mx-auto mt-6 z-10">
        <p>&copy; {new Date().getFullYear()} Prepwise AI. All rights reserved. Powered by Google Gemini & Vapi AI.</p>
      </footer>
    </div>
  );
}
