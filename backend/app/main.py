from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from backend.app.api import conversations
from backend.app.core.database import init_db

app = FastAPI(title="NaoMedical AI Portal")

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize DB
init_db()

# Mount static for audio (Local Dev Only)
IS_VERCEL = "VERCEL" in os.environ
if not IS_VERCEL:
    if not os.path.exists("static/audio"):
        os.makedirs("static/audio", exist_ok=True)
    app.mount("/static", StaticFiles(directory="static"), name="static")

# Include Modular Routers
app.include_router(conversations.router)

@app.get("/")
def read_root():
    return {"message": "NaoMedical Backend API is running"}

@app.get("/health")
def health_check():
    return {"status": "healthy", "mode": "serverless" if IS_VERCEL else "local"}
