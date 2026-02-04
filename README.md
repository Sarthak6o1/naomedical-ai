# 🏥 NaoMedical AI Translation Portal

An advanced, clinical-grade Doctor-Patient Translation Hub designed for seamless, real-time medical consultations. Powered by the latest multimodal AI models and a premium, high-fidelity dark interface.

## 🚀 Live Access
**Portal URL:** [https://naomedical-ai.vercel.app/](https://naomedical-ai.vercel.app/)

---

## 🛠️ Core Clinical Capabilities

| Feature | Description |
| :--- | :--- |
| **Real-Time Translation** | Bi-directional translation between Doctor and Patient roles using Gemini 2.0 Flash / Llama 3 frameworks via OpenRouter. |
| **Multimodal STT** | Direct browser-based audio recording with automated medical transcription for hands-free documentation. |
| **High-Fidelity TTS** | Natural voice synthesis using Edge-TTS for clear communication in over 8 global languages. |
| **Structured Summarization** | One-click generation of professional Clinical Encounter Reports (Symptoms, Diagnosis, Plan, etc.). |
| **Smart Search** | Encrypted message logging with interactive keyword highlighting and persistent consultation history. |

---

## 📖 Simple Usage Guide

### 1. Initiate a Consultation
- Click the **`+ NEW SESSION`** button on the left sidebar to open a dedicated, encrypted consultation tunnel.

### 2. Configure Language Target
- Use the **`LANGUAGE TARGET`** dropdown at the top to select the patient's primary language (e.g., Spanish, French, Japanese).

### 3. Communication Bridge
- **As a Doctor**: Toggle the "DOCTOR" role. Type clinical directives or hold the **Microphone Icon** at the bottom to record an audio message. The patient will see the translation and hear the synthetic voice.
- **As a Patient**: Toggle the "PATIENT" role. Input symptoms. The doctor will see the English translation and the original source transcript for accuracy.

### 4. Search & Retrieve
- Use the **Search Bar** in the header to find specific medical terms. Results will be highlighted in vibrant teal for quick clinical reference.

### 5. Finalize Documentation
- Once the consultation is complete, click **`COMPILE SUMMARY`**. This uses AI to parse the entire transcript into a structured medical report which can be copied directly into your EHR (Electronic Health Record) system.

---

## ⚙️ Technical Blueprint
- **Frontend**: Next.js 14+, Tailwind CSS (Glassmorphism), Framer Motion.
- **Backend**: FastAPI (Python 3.11), SQLAlchemy.
- **AI Core**: OpenRouter (Multimodal Gateway), Edge-TTS.
- **Database**: SQLite with Vercel-specific `/tmp` persistence logic.

## 🔒 Medical Compliance
This application is designed with **HIPAA-standard architecture** in mind, featuring AES-256 data tunneling and non-persistent session storage options for enhanced patient privacy.

---
*Developed for the NaoMedical Innovation Lab.*
