"""
Document lifecycle orchestration for uploads.

Route (routes_upload.py) -> this service -> pipeline_service (AI) -> file_utils (storage)

Keeps the API route free of AI logic and free of filesystem details,
per the required layering: API Route -> Service Layer -> Core AI Modules -> Utilities.
"""

import os
import shutil
from datetime import datetime, timezone

from fastapi import UploadFile

from app.services import pipeline_service
from app.utils import file_utils
from app.models.schemas import (
    UploadResponse, DocumentMetadata, DocumentSummary, DocumentDetailResponse,
)


def _save_upload(document_id: str, file: UploadFile) -> str:
    """Save an uploaded file into uploads/{document_id}/source.<ext>."""
    doc_dir = file_utils.document_dir(document_id)
    ext = os.path.splitext(file.filename)[1].lower()
    dest_path = os.path.join(doc_dir, f"source{ext}")
    with open(dest_path, "wb") as out:
        shutil.copyfileobj(file.file, out)
    return dest_path


def handle_upload(
    file: UploadFile = None,
    youtube_url: str = None,
    language: str = "english",
) -> UploadResponse:
    if not file and not youtube_url:
        raise ValueError("Provide either a file upload or a youtube_url.")
    if file and youtube_url:
        raise ValueError("Provide only one of file upload or youtube_url, not both.")

    document_id = file_utils.next_document_id()
    doc_dir = file_utils.document_dir(document_id)
    created_at = datetime.now(timezone.utc).isoformat()

    try:
        if youtube_url:
            file_type = "video"
            original_filename = youtube_url
            source = youtube_url
        else:
            file_type = file_utils.detect_file_type(file.filename)
            original_filename = file.filename
            source = _save_upload(document_id, file)

        file_utils.write_metadata(
            document_id,
            file_type=file_type,
            original_filename=original_filename,
            language=language if file_type != "pdf" else None,
            status="processing",
            created_at=created_at,
        )

        if file_type in ("video", "audio"):
            result = pipeline_service.process_media(source, document_id, doc_dir, language)
        elif file_type == "pdf":
            result = pipeline_service.process_pdf(source, document_id)
        else:
            raise ValueError(f"Unsupported file type: {file_type}")

        file_utils.write_transcript(document_id, result["transcript"])
        summary_bundle = {
            "title": result["title"],
            "summary": result["summary"],
            "action_items": result["action_items"],
            "key_decisions": result["key_decisions"],
            "open_questions": result["open_questions"],
        }
        file_utils.write_summary_bundle(document_id, summary_bundle)

        file_utils.write_metadata(document_id, status="ready")
        metadata = file_utils.read_metadata(document_id)

        return UploadResponse(
            document_id=document_id,
            metadata=DocumentMetadata(**metadata),
            summary=DocumentSummary(**summary_bundle),
            transcript_preview=result["transcript"][:500],
        )

    except Exception as e:
        file_utils.write_metadata(document_id, status="failed", error=str(e))
        raise


def list_documents() -> list:
    """Return metadata for every uploaded document, newest first."""
    documents = []
    for document_id in file_utils.list_document_ids():
        try:
            metadata = file_utils.read_metadata(document_id)
            documents.append(DocumentMetadata(**metadata))
        except FileNotFoundError:
            # A folder exists without metadata.json (e.g. partial/corrupt write) - skip it
            continue
    documents.sort(key=lambda d: d.created_at, reverse=True)
    return documents


def get_document(document_id: str) -> DocumentDetailResponse:
    """Return metadata + summary + full transcript for one document."""
    metadata = file_utils.read_metadata(document_id)  # raises FileNotFoundError if missing

    summary = None
    transcript = None
    if metadata.get("status") == "ready":
        try:
            summary = DocumentSummary(**file_utils.read_summary_bundle(document_id))
        except FileNotFoundError:
            summary = None
        try:
            transcript = file_utils.read_transcript(document_id)
        except FileNotFoundError:
            transcript = None

    return DocumentDetailResponse(
        document_id=document_id,
        metadata=DocumentMetadata(**metadata),
        summary=summary,
        transcript=transcript,
    )


def delete_document(document_id: str) -> None:
    """Delete a document's folder (source file, transcript, summary, chroma vectors)."""
    if not file_utils.document_exists(document_id):
        raise FileNotFoundError(f"Document {document_id} not found")
    shutil.rmtree(file_utils._document_path(document_id))
