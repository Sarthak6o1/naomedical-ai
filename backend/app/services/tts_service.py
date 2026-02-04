import edge_tts
import uuid
import os
import base64

# Mapping of common languages to Edge-TTS voices
VOICE_MAP = {
    "English": "en-US-GuyNeural",
    "Spanish": "es-ES-AlvaroNeural",
    "French": "fr-FR-HenriNeural",
    "German": "de-DE-ConradNeural",
    "Hindi": "hi-IN-MadhurNeural",
    "Chinese": "zh-CN-YunxiNeural",
    "Arabic": "ar-SA-HamedNeural",
    "Japanese": "ja-JP-KeitaNeural"
}

async def generate_tts_audio(text: str, language: str) -> str:
    """Generates audio for text using Edge-TTS and returns base64 or file path."""
    if not text:
        return ""
    
    # Fuzzy match logic
    voice = VOICE_MAP.get(language, "en-US-GuyNeural")
    if language not in VOICE_MAP:
        for k, v in VOICE_MAP.items():
            if k.lower() in language.lower() or language.lower() in k.lower():
                voice = v
                break
    communicate = edge_tts.Communicate(text, voice)
    
    IS_VERCEL = "VERCEL" in os.environ
    
    try:
        if IS_VERCEL:
            # Memory-only for Vercel
            audio_data = b""
            async for chunk in communicate.stream():
                if chunk["type"] == "audio":
                    audio_data += chunk["data"]
            
            b64 = base64.b64encode(audio_data).decode("utf-8")
            return f"data:audio/mp3;base64,{b64}"
        else:
            # Save to disk for local development persistence
            filename = f"{uuid.uuid4()}.mp3"
            filepath = os.path.join("static", "audio", filename)
            
            # Ensure static/audio exists relative to the app root
            # In local dev, we assume we are running from 'backend' dir
            os.makedirs(os.path.dirname(filepath), exist_ok=True)
            
            await communicate.save(filepath)
            return f"/static/audio/{filename}"
    except Exception as e:
        print(f"TTS Error: {e}")
        return ""
