# 🎙️ Prepwise AI

> Next-Generation AI-Powered Voice Mock Interviews.

Prepwise AI is a premium mock interview simulator designed to help professionals practice and ace their career interviews. Combining WebRTC conversational protocols with local browser speech engines and Google Gemini intelligence, it provides real-time voice feedback, evaluation scores, and targeted improvement plans.

🔗 **Live Demo**: [https://aivoice-production-6b21.up.railway.app](https://aivoice-production-6b21.up.railway.app)

---

## ✨ Features
- **Realistic Voice Conversationalists**: Multiple custom AI personas tailored to distinct interview styles.
- **Dual Voice Engine**: WebRTC support via Vapi AI alongside a zero-setup local Web Speech API fallback for firewall-restricted systems.
- **Real-Time Transcripts**: Dynamic speech-to-text visualization during active calls.
- **Gemini Performance Analysis**: Comprehensive score rating cards, key strength breakdowns, and suggestion checklists.

---

## 🛠️ Technology Stack
- **Framework**: Next.js 16 (App Router, Turbopack)
- **Database & ORM**: SQLite + Prisma ORM
- **Voice APIs**: Vapi Web SDK + Browser Web Speech API
- **AI Intelligence**: Google Gemini API

---

## 🚀 Local Setup
1. Clone this repository.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure environment variables in `.env`:
   ```env
   DATABASE_URL="file:./dev.db"
   GEMINI_API_KEY="your_gemini_api_key"
   NEXT_PUBLIC_VAPI_PUBLIC_KEY="your_vapi_public_key"
   NEXT_PUBLIC_VAPI_ASSISTANT_ID="your_vapi_assistant_id"
   JWT_SECRET="your_jwt_secret"
   ```
4. Build client assets & start local server:
   ```bash
   npm run build
   npm run dev
   ```
