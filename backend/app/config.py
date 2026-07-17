"""
Centralized application configuration.

This does not change any AI logic — it only gathers the environment
variables that were previously read ad-hoc (os.getenv) inside
core/transcriber.py, core/summarizer.py, core/extractor.py,
core/rag_engine.py, core/vector_store.py into one place so every
module can import a single, consistent settings object.
"""

import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent  # backend/
UPLOADS_DIR = BASE_DIR / "app" / "uploads"
# NOTE: directory creation is intentionally NOT done here. This module is
# imported unconditionally by app.main (for ALLOWED_ORIGINS), so any
# filesystem I/O here runs during `import app.main` - before uvicorn binds
# $PORT. On Render, UPLOADS_DIR sits on a mounted persistent disk; if that
# mount is still attaching when the container boots, mkdir() can block on
# the syscall for a long time. The directory is created lazily on first
# actual use instead - see app/utils/file_utils.py:ensure_uploads_dir().


class Settings:
    # --- Groq (Whisper transcription) ---
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
    GROQ_WHISPER_MODEL: str = os.getenv("GROQ_WHISPER_MODEL", "whisper-large-v3-turbo")

    # --- Sarvam (Hinglish STT-translate) ---
    SARVAM_API_KEY: str = os.getenv("SARVAM_API_KEY", "")
    SARVAM_STT_MODEL: str = os.getenv("SARVAM_STT_MODEL", "saaras:v2.5")
    SARVAM_STT_TRANSLATE_URL: str = "https://api.sarvam.ai/speech-to-text-translate"
    SARVAM_PIECE_SECONDS: int = 25

    # --- Mistral (summary / extraction / RAG chat LLM) ---
    MISTRAL_API_KEY: str = os.getenv("MISTRAL_API_KEY", "")
    MISTRAL_MODEL: str = os.getenv("MISTRAL_MODEL", "mistral-small-latest")

    # --- Embeddings / Vector store ---
    EMBEDDING_MODEL: str = os.getenv("EMBEDDING_MODEL", "all-MiniLM-L6-v2")
    CHROMA_COLLECTION_PREFIX: str = "meeting_transcript"

    # --- Storage ---
    UPLOADS_DIR: Path = UPLOADS_DIR

    # --- CORS ---
    # Comma-separated list, e.g. "https://your-app.vercel.app,http://localhost:5173"
    ALLOWED_ORIGINS: list = [
        origin.strip()
        for origin in os.getenv("ALLOWED_ORIGINS", "http://localhost:5173").split(",")
        if origin.strip()
    ]


settings = Settings()
