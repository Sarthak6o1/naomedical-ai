from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import os
from backend.app.models.base import Base

IS_VERCEL = "VERCEL" in os.environ
if IS_VERCEL:
    DATABASE_URL = "sqlite:////tmp/naomedical.db"
else:
    DATABASE_URL = "sqlite:///./naomedical.db"

engine = create_engine(
    DATABASE_URL, 
    connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def init_db():
    # Import all models here so they are registered with Base
    from backend.app.models.conversation import Conversation, Message
    Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
