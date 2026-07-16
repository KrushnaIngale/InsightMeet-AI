from typing import List, Optional
from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    status: str = "ok"


class DocumentSummary(BaseModel):
    title: str
    summary: str
    action_items: str
    key_decisions: str
    open_questions: str


class DocumentMetadata(BaseModel):
    document_id: str
    file_type: str  # "video" | "audio" | "pdf"
    original_filename: str
    language: Optional[str] = None
    status: str  # "processing" | "ready" | "failed"
    created_at: str
    updated_at: Optional[str] = None


class UploadResponse(BaseModel):
    document_id: str
    metadata: DocumentMetadata
    summary: Optional[DocumentSummary] = None
    transcript_preview: Optional[str] = None


class DocumentDetailResponse(BaseModel):
    document_id: str
    metadata: DocumentMetadata
    summary: Optional[DocumentSummary] = None
    transcript: Optional[str] = None


class DocumentListResponse(BaseModel):
    documents: List[DocumentMetadata]


class ChatRequest(BaseModel):
    document_id: str
    question: str = Field(..., min_length=1)


class ChatResponse(BaseModel):
    document_id: str
    question: str
    answer: str
