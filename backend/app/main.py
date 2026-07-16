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
