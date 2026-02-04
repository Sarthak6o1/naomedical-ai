from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class MessageBase(BaseModel):
    role: str
    original_text: str
    translated_text: str
    language: str
    audio_url: Optional[str] = None

class MessageCreate(BaseModel):
    role: str
    text: Optional[str] = None
    target_lang: str = "English"

class MessageRead(MessageBase):
    id: int
    timestamp: datetime

    class Config:
        from_attributes = True

class ConversationRead(BaseModel):
    id: int
    title: str
    created_at: datetime
    summary: Optional[str] = None

    class Config:
        from_attributes = True
