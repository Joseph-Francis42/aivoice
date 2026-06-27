"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Key, 
  User, 
  Mic, 
  ArrowRight, 
  Lock, 
  Sparkles, 
  Settings as SettingsIcon, 
  Activity, 
  ShieldAlert, 
  CheckCircle,
  HelpCircle
} from "lucide-react";
import { getLocalSettings, saveLocalSettings, AppSettings } from "@/lib/settings";

export default function LandingPage() {
  const router = useRouter();
  
  // Auth states
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Settings states
  const [showSettings, setShowSettings] = useState(false);
  const [keys, setKeys] = useState<AppSettings>({ geminiApiKey: "", vapiPublicKey: "", useLocalVoice: false });
  const [settingsSaved, setSettingsSaved] = useState(false);
  const [serverConfig, setServerConfig] = useState({ hasGeminiKey: false, hasVapiKey: false });

  useEffect(() => {
    // Load keys on mount
    setKeys(getLocalSettings());

    // Check server key configuration
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.config) {
          setServerConfig(data.config);
        }
      })
      .catch((err) => console.error("Error loading server keys:", err));
  }, []);

  const hasGemini = !!(keys.geminiApiKey || serverConfig.hasGeminiKey);
  const hasVapi = !!(keys.vapiPublicKey || serverConfig.hasVapiKey);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const endpoint = isLogin ? "/api/auth/login" : "/api/auth/register";

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Authentication failed");
      }

      // Success, route to dashboard
      router.push("/dashboard");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleGuestMode = async () => {
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/guest", { method: "POST" });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to enter guest mode");
      }

      router.push("/dashboard");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveKeys = (e: React.FormEvent) => {
    e.preventDefault();
    saveLocalSettings(keys);
    setSettingsSaved(true);
    setTimeout(() => {
      setSettingsSaved(false);
      setShowSettings(false);
    }, 1000);
  };

  return (
    <div className="relative min-h-screen flex flex-col justify-between p-6 md:p-12 overflow-hidden bg-background">
      {/* Header */}
      <header className="flex justify-between items-center max-w-7xl w-full mx-auto z-10">
        <div className="flex items-center gap-2">
          <div className="h-10 w-10 rounded-xl bg-slate-700 flex items-center justify-center">
            <Mic className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight text-white">
            Prepwise AI
          </span>
        </div>
      </header>

      {/* Main Grid */}
      <main className="max-w-7xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center my-12 z-10">
        {/* Left Column - Product info & Authentication */}
        <div className="col-span-1 lg:col-span-6 flex flex-col gap-8">
          <div className="flex flex-col gap-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-purple-500/30 bg-purple-500/10 w-fit">
              <Sparkles className="h-3.5 w-3.5 text-purple-400" />
              <span className="text-xs font-semibold text-purple-300 uppercase tracking-wider">
                Next-Gen Mock Interviews
              </span>
            </div>
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight">
              Master Your Next Interview with{" "}
              <span className="bg-gradient-to-r from-purple-400 via-indigo-300 to-blue-400 bg-clip-text text-transparent">
                Conversational AI
              </span>
            </h1>
            <p className="text-gray-400 text-base md:text-lg leading-relaxed max-w-lg">
              Practice live, low-latency, voice-based interviews with specialized AI personas. Obtain detailed performance transcripts, scoring breakdown, strengths/weaknesses, and suggested practice exercises.
            </p>
          </div>

          {/* Warning if keys are not set */}
          {(!hasGemini || !hasVapi) && (
            <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 max-w-lg">
              <ShieldAlert className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-300 flex flex-col gap-1">
                <span className="font-bold">API Configuration Status:</span>
                {!hasGemini && <span>• Google Gemini API Key is missing. (AI feedback grading will run in mock mode).</span>}
                {!hasVapi && <span>• Vapi Public Key is missing. (Using local browser speech engine fallback).</span>}
              </div>
            </div>
          )}

          {/* Auth Card */}
          <div className="w-full max-w-md p-8 rounded-2xl glass shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-3 text-purple-500/10">
              <Lock className="h-24 w-24" />
            </div>

            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">
                {isLogin ? "Sign In to Continue" : "Create Your Account"}
              </h2>
              <button
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError("");
                }}
                className="text-xs text-purple-400 hover:text-purple-300 underline underline-offset-4"
              >
                {isLogin ? "Need an account?" : "Already have an account?"}
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-medium">
                {error}
              </div>
            )}

            <form onSubmit={handleAuth} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-gray-400">Username</label>
                <div className="relative">
                  <User className="absolute left-3 top-3.5 h-4 w-4 text-gray-500" />
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter your username"
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-black/40 border border-white/5 focus:border-purple-500/50 outline-none text-sm transition-colors"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-gray-400">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3.5 h-4 w-4 text-gray-500" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-black/40 border border-white/5 focus:border-purple-500/50 outline-none text-sm transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-sm shadow-lg shadow-purple-600/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50"
              >
                {loading ? "Please wait..." : isLogin ? "Login" : "Register"}
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>

            <div className="relative flex py-4 items-center">
              <div className="flex-grow border-t border-white/5"></div>
              <span className="flex-shrink mx-4 text-gray-500 text-xs">or</span>
              <div className="flex-grow border-t border-white/5"></div>
            </div>

            <button
              onClick={handleGuestMode}
              disabled={loading}
              className="w-full py-3 rounded-xl border border-white/10 hover:bg-white/5 text-gray-300 font-semibold text-sm transition-colors flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50"
            >
              Enter as Guest (Instant Access)
            </button>
          </div>
        </div>

        {/* Right Column - Beautiful Live Call Interactive Mockup */}
        <div className="col-span-1 lg:col-span-6 flex justify-center">
          <div className="relative w-full max-w-[420px] aspect-[4/5] rounded-[32px] glass p-6 shadow-2xl flex flex-col justify-between border-white/10 animate-float">
            
            {/* Simulation Header */}
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs text-gray-400 font-medium">Session in progress</span>
              </div>
              <div className="px-3 py-1 rounded-full bg-white/5 text-[10px] text-gray-400 border border-white/5">
                Technical Interview
              </div>
            </div>

            {/* Persona Call Info */}
            <div className="flex flex-col items-center gap-4 my-8">
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 blur-md opacity-40 pulsing-glow" />
                <div className="h-28 w-28 rounded-full border-2 border-purple-500 bg-gradient-to-tr from-purple-950 to-indigo-900 flex items-center justify-center relative overflow-hidden shadow-2xl">
                  <User className="h-14 w-14 text-purple-300" />
                </div>
              </div>
              <div className="text-center">
                <h3 className="text-lg font-bold text-white">Sarah</h3>
                <p className="text-xs text-purple-400">Warm & Encouraging AI Recruiter</p>
              </div>
            </div>

            {/* Pulsing Visual Waveform */}
            <div className="flex justify-center items-center gap-1.5 h-16">
              <span className="wave-bar wave-bar-active" />
              <span className="wave-bar wave-bar-active" />
              <span className="wave-bar wave-bar-active" />
              <span className="wave-bar wave-bar-active" />
              <span className="wave-bar wave-bar-active" />
              <span className="wave-bar wave-bar-active" />
              <span className="wave-bar wave-bar-active" />
              <span className="wave-bar wave-bar-active" />
              <span className="wave-bar wave-bar-active" />
              <span className="wave-bar wave-bar-active" />
            </div>

            {/* Live Subtitle box */}
            <div className="p-4 rounded-xl bg-black/40 border border-white/5 text-xs text-gray-300 leading-relaxed font-light">
              <span className="font-bold text-purple-400">Sarah (AI):</span> "That's a great implementation of React context! How would you optimize it if the state changes frequently?"
            </div>

            {/* Control buttons mockup */}
            <div className="flex justify-center gap-4 mt-4">
              <div className="h-10 w-10 rounded-full bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400">
                <Mic className="h-4 w-4" />
              </div>
              <div className="px-5 py-2 rounded-full bg-purple-600 text-white font-semibold text-xs flex items-center justify-center">
                End Call
              </div>
              <div className="h-10 w-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-400">
                <Activity className="h-4 w-4" />
              </div>
            </div>

          </div>
        </div>
      </main>

      {/* API Keys Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
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
                <CheckCircle className="h-4 w-4" />
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
                  <Key className="absolute left-3 top-3.5 h-4 w-4 text-gray-500" />
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
                  <Key className="absolute left-3 top-3.5 h-4 w-4 text-gray-500" />
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
      <footer className="text-center text-gray-600 text-xs max-w-7xl w-full mx-auto mt-6 z-10">
        <p>&copy; {new Date().getFullYear()} Prepwise AI. All rights reserved. Powered by Google Gemini & Vapi AI.</p>
      </footer>
    </div>
  );
}
