export interface AppSettings {
  geminiApiKey: string;
  vapiPublicKey: string;
  useLocalVoice: boolean;
}

export function getLocalSettings(): AppSettings {
  if (typeof window === "undefined") {
    return { geminiApiKey: "", vapiPublicKey: "", useLocalVoice: false };
  }
  return {
    geminiApiKey: localStorage.getItem("gemini_api_key") || "",
    vapiPublicKey: localStorage.getItem("vapi_public_key") || "",
    useLocalVoice: localStorage.getItem("use_local_voice") === "true",
  };
}

export function saveLocalSettings(settings: AppSettings) {
  if (typeof window === "undefined") return;
  localStorage.setItem("gemini_api_key", settings.geminiApiKey);
  localStorage.setItem("vapi_public_key", settings.vapiPublicKey);
  localStorage.setItem("use_local_voice", settings.useLocalVoice ? "true" : "false");
}
