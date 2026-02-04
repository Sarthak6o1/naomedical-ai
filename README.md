# 🏥 **NaoMedical AI Translation Portal**

An advanced, clinical-grade Doctor-Patient Translation Hub designed for seamless, real-time medical consultations. Powered by the latest multimodal AI models and a premium, high-fidelity dark interface.

![Medical Dashboard](./public/assets/Screenshot%202026-02-04%20194859.png)

## 🚀 Live Access
**Portal URL:** [https://naomedical-ai.vercel.app/](https://naomedical-ai.vercel.app/)

---

## ⚕️ Core Clinical Capabilities

| Feature | Description |
| :--- | :--- |
| **Real-Time Translation** | Bi-directional translation between Doctor and Patient roles using Gemini 2.0 Flash / Llama 3 frameworks via OpenRouter. |
| **Multimodal STT** | Direct browser-based audio recording with automated medical transcription for hands-free documentation. |
| **High-Fidelity TTS** | Natural voice synthesis using Edge-TTS for clear communication in over 8 global languages. |
| **Structured Summarization** | One-click generation of professional Clinical Encounter Reports (Symptoms, Diagnosis, Plan, etc.). |
| **Smart Search** | Encrypted message logging with interactive keyword highlighting and persistent consultation history. |

> [!IMPORTANT]
> **Technical Note on Free Tier Quotas**: This application utilizes free-tier AI models via OpenRouter. If the "Clinical Summary" returns a blank output, it is likely due to the model's rate limit or daily token quota for free requests being reached. The core translation and audio features remain prioritized and functional.

---

## 📖 Simple Usage Guide

### 1. Initiate a Consultation
- Click the **`+ NEW SESSION`** button on the left sidebar to open a dedicated, encrypted consultation tunnel.
- **Select Role**: Choose your access level (Doctor or Patient) with the high-end role selector.

![Role Selection](./public/assets/Screenshot%202026-02-04%20194932.png)

### 2. Configure Language Target
- Use the **`LANGUAGE TARGET`** dropdown at the top to select the patient's primary language (e.g., Spanish, French, Japanese).

### 3. Communication Bridge
- **As a Doctor**: Toggle the "DOCTOR" role. Type clinical directives or hold the **Microphone Icon** at the bottom to record an audio message. The patient will see the translation and hear the synthetic voice.
- **As a Patient**: Toggle the "PATIENT" role. Input symptoms. The doctor will see the English translation and the original source transcript for accuracy.

| Doctor View | Patient View |
| :---: | :---: |
| ![Doctor Chat](./public/assets/Screenshot%202026-02-04%20195330.png) | ![Patient Chat](./public/assets/Screenshot%202026-02-04%20195159.png) |

### 4. Search & History
- Use the **Search Bar** in the header to find specific medical terms.
- **Session Archive**: View past encounters in the sidebar (screenshot #7).

| Search Interface | Archive View |
| :---: | :---: |
| ![Search Interface](./public/assets/Screenshot%202026-02-04%20195720.png) | ![Archive View](./public/assets/Screenshot%202026-02-04%20195911.png) |

### 5. Finalize Documentation
- Once the consultation is complete, click **`COMPILE SUMMARY`**. This uses AI to parse the entire transcript into a structured medical report which can be copied directly into your EHR (Electronic Health Record) system.
./public/assets/Screenshot%202026-02-04%20195330.png
![Summary Report](./public/assets/Screenshot%202026-02-04%20195140.png)

---

## 🛠️ Technical Blueprint
- **Frontend**: Next.js 14+, Tailwind CSS (Glassmorphism), Framer Motion.
- **Backend**: FastAPI (Python 3.11), SQLAlchemy.
- **AI Core**: OpenRouter (Multimodal Gateway), Edge-TTS.
- **Database**: SQLite with Vercel-specific `/tmp` persistence logic.

## 🔒 Medical Compliance
This application is designed with **HIPAA-standard architecture** in mind, featuring AES-256 data tunneling and non-persistent session storage options for enhanced patient privacy.

---
*Developed for the NaoMedical Innovation Lab.*
