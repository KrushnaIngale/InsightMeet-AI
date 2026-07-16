# Must run before ANYTHING that might import chromadb (directly or via
# langchain-chroma/app.core.vector_store/app.core.rag_engine). Render's
# Python runtime image ships a system sqlite3 older than chromadb's
# minimum required version (3.35.0); chromadb raises a RuntimeError at
# import time in that case, which crashes the process before uvicorn
# ever binds $PORT ("No open ports detected"). See
# https://docs.trychroma.com/troubleshooting#sqlite
try:
    __import__("pysqlite3")
    import sys
    sys.modules["sqlite3"] = sys.modules.pop("pysqlite3")
except ImportError:
    pass  # local system sqlite3 is new enough (e.g. most dev machines)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.api import routes_health, routes_upload, routes_documents, routes_chat

app = FastAPI(
    title="InsightMeet AI API",
    description="REST API for video/audio/PDF transcription, summarization, and RAG chat.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(routes_health.router)
app.include_router(routes_upload.router)
app.include_router(routes_documents.router)
app.include_router(routes_chat.router)
