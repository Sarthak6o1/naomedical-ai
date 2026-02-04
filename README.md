# NaoMedical | AI Doctor–Patient Translation Web Application

A full-stack translation bridge designed to facilitate seamless communication between healthcare providers and patients across language barriers.

## 🚀 Deployment Instructions (Vercel)
1. Push this repository to GitHub.
2. Link the repository to a new project on [Vercel](https://vercel.com).
3. Set the following environment variable in Vercel project settings:
   - `GEMINI_API_KEY`: Your Google Gemini API Key.
4. Deployment will automatically detect Next.js (Frontend) and the `api/` directory (FastAPI Backend).

## ✨ Features
- **Session Management**: Full lifecycle management for medical consultations (Create, Switch, Delete).
- **Dual-Perspective Bridge**: Toggle between **Doctor View** and **Patient View** to simulate real-time interaction.
- **Dynamic Translation & TTS**: 
  - Messages are automatically translated into the recipient's language.
  - Listen to any message with integrated high-quality voice synthesis.
- **Per-Message Audio Control**: Change the translation language or voice for any specific message on the fly.
- **OpenRouter Integration**:
  - **STT**: Clinical-grade audio transcription via Gemini 2.0 Flash (Free).
  - **LLM/Translation**: Context-aware linguistic bridge.
  - **Summarization**: Professional clinical summaries.
- **Edge-TTS**: Ultra-fast, 100% free speech synthesis with no API costs.

## 🧰 Tech Stack
- **Frontend**: Next.js 14, Tailwind CSS, Framer Motion.
- **Backend**: FastAPI, SQLAlchemy (SQLite).
- **AI Engine**: OpenRouter (Unified API for Top-tier Free Models).
- **TTS Engine**: Edge-TTS (Microsoft Natural Voices).

---
*Developed for Nao Medical Pre-Interview Assignment.*
