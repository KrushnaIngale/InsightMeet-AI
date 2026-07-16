from fastapi import APIRouter, HTTPException

from app.services import document_service
from app.models.schemas import DocumentListResponse, DocumentDetailResponse

router = APIRouter(prefix="/documents", tags=["documents"])


@router.get("", response_model=DocumentListResponse)
def list_documents():
    """List all uploaded documents (metadata only), newest first."""
    return DocumentListResponse(documents=document_service.list_documents())


@router.get("/{document_id}", response_model=DocumentDetailResponse)
def get_document(document_id: str):
    """Get metadata, summary, and full transcript for one document."""
    try:
        return document_service.get_document(document_id)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail=f"Document '{document_id}' not found")


@router.delete("/{document_id}")
def delete_document(document_id: str):
    """Delete a document and all of its stored data (source file, transcript, summary, vectors)."""
    try:
        document_service.delete_document(document_id)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail=f"Document '{document_id}' not found")
    return {"document_id": document_id, "deleted": True}
