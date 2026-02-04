import os
import json
import base64
import httpx
from dotenv import load_dotenv

# Load .env from root
load_dotenv(os.path.join(os.getcwd(), ".env"))

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
OPENROUTER_MODEL = os.getenv("OPENROUTER_MODEL", "openrouter/free")

print(f"--- AGENT SERVICE INIT ---")
print(f"DEBUG: OPENROUTER_API_KEY: {'[SET]' if OPENROUTER_API_KEY else '[MISSING]'}")
print(f"DEBUG: OPENROUTER_MODEL: {OPENROUTER_MODEL}")

async def call_openrouter(messages: list, response_format: dict = None) -> str:
    """Core logic for calling OpenRouter using raw HTTP requests as requested."""
    if not OPENROUTER_API_KEY:
        return "ERROR: API Key Missing"

    url = "https://openrouter.ai/api/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "HTTP-Referer": "https://naomedical.com",
        "X-Title": "NaoMedical Portal",
        "Content-Type": "application/json"
    }
    
    payload = {
        "model": OPENROUTER_MODEL,
        "messages": messages
    }
    if response_format:
        payload["response_format"] = response_format

    async with httpx.AsyncClient(timeout=60.0) as client:
        try:
            response = await client.post(url, headers=headers, json=payload)
            response.raise_for_status()
            data = response.json()
            return data["choices"][0]["message"]["content"]
        except Exception as e:
            print(f"OpenRouter Error: {e}")
            return f"Error: {str(e)}"

async def transcribe_audio(audio_bytes: bytes) -> str:
    """Uses OpenRouter multimodal capability to transcribe audio."""
    audio_b64 = base64.b64encode(audio_bytes).decode("utf-8")
    
    messages = [
        {
            "role": "user",
            "content": [
                {"type": "text", "text": "Transcribe exactly what is said in this medical audio clip. Return only the transcription text."},
                {
                    "type": "image_url", # Provider dependent multimodal format
                    "image_url": {"url": f"data:audio/webm;base64,{audio_b64}"}
                }
            ]
        }
    ]
    return await call_openrouter(messages)

async def translate_text(text: str, target_lang: str) -> dict:
    """Uses OpenRouter to translate text and detect language."""
    messages = [
        {
            "role": "user", 
            "content": f"Translate to {target_lang}. Detect source lang. Return ONLY JSON: {{'translated_text': '...', 'detected_language': '...'}}. Text: {text}"
        }
    ]
    
    res_text = await call_openrouter(messages)
    
    print(f"DEBUG: Translation Raw Response: {res_text}")
    
    try:
        # Clean up JSON
        clean_text = res_text
        if "```json" in clean_text:
            clean_text = clean_text.split("```json")[1].split("```")[0]
        elif "```" in clean_text:
            clean_text = clean_text.split("```")[1].split("```")[0]
            
        if "{" in clean_text:
            clean_text = clean_text[clean_text.find("{"):clean_text.rfind("}")+1]
            
        return json.loads(clean_text)
    except Exception as e:
        print(f"ERROR: Translation JSON Parse Failed: {e}. Raw: {res_text}")
        # Fallback: if we can't parse JSON, assume the whole response might be the translation if it's short
        if len(res_text) < len(text) * 3 and "{" not in res_text:
             return {"translated_text": res_text.strip(), "detected_language": "Unknown"}
        return {"translated_text": text, "detected_language": "Unknown"}

async def generate_summary(history: list) -> str:
    """Generates a medical summary using OpenRouter."""
    transcript = "\n".join([f"{m['role'].capitalize()}: {m['text']}" for m in history])
    messages = [
        {
            "role": "system",
            "content": "You are a professional medical scribe."
        },
        {
            "role": "user",
            "content": f"Summarize this encounter with headings: Symptoms, Observations, Diagnosis, Treatment, Follow-up.\n\nTranscript:\n{transcript}"
        }
    ]
    return await call_openrouter(messages)
