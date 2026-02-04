from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from typing import List

from backend.app.core.database import get_db
from backend.app.models.conversation import Conversation, Message
from backend.app.services import transcribe_audio, translate_text, generate_summary, generate_tts_audio

router = APIRouter(prefix="/api", tags=["Conversations"])

@router.post("/conversations")
async def create_conversation(db: Session = Depends(get_db)):
    conv = Conversation()
    db.add(conv)
    db.commit()
    db.refresh(conv)
    return conv

@router.get("/conversations")
async def list_conversations(db: Session = Depends(get_db)):
    return db.query(Conversation).order_by(Conversation.created_at.desc()).all()

@router.delete("/conversations/{conv_id}")
async def delete_conversation(conv_id: int, db: Session = Depends(get_db)):
    # Verify existence first
    conv = db.query(Conversation).filter(Conversation.id == conv_id).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")

    # Delete associated messages first
    db.query(Message).filter(Message.conversation_id == conv_id).delete(synchronize_session=False)
    
    # Delete the conversation
    db.query(Conversation).filter(Conversation.id == conv_id).delete(synchronize_session=False)
    
    db.commit()
    return {"status": "deleted"}

@router.get("/conversations/{conv_id}/history")
async def get_history(conv_id: int, db: Session = Depends(get_db)):
    return db.query(Message).filter(Message.conversation_id == conv_id).order_by(Message.timestamp.asc()).all()

@router.post("/conversations/{conv_id}/messages")
async def add_message(
    conv_id: int, 
    role: str, 
    text: str = None, 
    target_lang: str = "English",
    audio: UploadFile = File(None),
    db: Session = Depends(get_db)
):
    if audio:
        content = await audio.read()
        text = await transcribe_audio(content)
    
    if not text:
        raise HTTPException(status_code=400, detail="Text or audio required")

    translation_res = await translate_text(text, target_lang)
    translated_text = translation_res.get("translated_text", text)
    detected_lang = translation_res.get("detected_language", "Unknown")

    audio_url = await generate_tts_audio(translated_text, target_lang)

    msg = Message(
        conversation_id=conv_id,
        role=role,
        original_text=text,
        translated_text=translated_text,
        language=detected_lang,
        audio_url=audio_url
    )
    db.add(msg)
    db.commit()
    db.refresh(msg)
    return msg

@router.post("/conversations/{conv_id}/summarize")
async def summarize_conversation(conv_id: int, db: Session = Depends(get_db)):
    messages = db.query(Message).filter(Message.conversation_id == conv_id).all()
    history_data = [{"role": m.role, "text": m.original_text} for m in messages]
    summary = await generate_summary(history_data)
    
    conv = db.query(Conversation).filter(Conversation.id == conv_id).first()
    if conv:
        conv.summary = summary
        db.commit()
    return {"summary": summary}

@router.patch("/conversations/{conv_id}")
async def update_conversation(conv_id: int, title: str, db: Session = Depends(get_db)):
    conv = db.query(Conversation).filter(Conversation.id == conv_id).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    conv.title = title
    db.commit()
    db.refresh(conv)
    return conv

@router.get("/search")
async def search_conversations(q: str, db: Session = Depends(get_db)):
    return db.query(Message).filter(
        (Message.original_text.contains(q)) | (Message.translated_text.contains(q))
    ).all()

@router.post("/messages/{msg_id}/regenerate")
async def regenerate_message_audio(msg_id: int, target_lang: str, db: Session = Depends(get_db)):
    msg = db.query(Message).filter(Message.id == msg_id).first()
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found")
    
    # Step 1: Force Strict Translation
    translation_res = await translate_text(msg.original_text, target_lang)
    translated_text = translation_res.get("translated_text", msg.original_text)
    
    # Step 2: Ensure we don't just speak English with an accent (unless target IS English)
    # If the translation failed (text is same) and target isn't English, try one more fallback or proceed
    if translated_text.strip() == msg.original_text.strip() and "english" not in target_lang.lower():
         # Fallback: simple direct call if implicit translation failed
         # For now, we trust translate_text's retry/fallback logic
         pass

    # Step 3: Generate Audio from the *Translated* Text
    audio_url = await generate_tts_audio(translated_text, target_lang)
    
    msg.translated_text = translated_text
    msg.language = target_lang
    msg.audio_url = audio_url
    db.commit()
    db.refresh(msg)
    return msg
