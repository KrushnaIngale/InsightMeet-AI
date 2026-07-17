from typing import Optional

from fastapi import APIRouter, UploadFile, File, Form, HTTPException

from app.models.schemas import UploadResponse

router = APIRouter(prefix="/upload", tags=["upload"])


@router.post("", response_model=UploadResponse)
async def upload_document(
    file: Optional[UploadFile] = File(None),
    youtube_url: Optional[str] = Form(None),
    language: str = Form("english"),
):
    """
    Upload a video, audio, or PDF file — OR provide a youtube_url instead
    of a file. Runs the full AI pipeline synchronously and returns the
    generated title, summary, action items, key decisions, and open
    questions. The document becomes chattable via POST /chat immediately
    after this returns.
    """
    # Imported here, not at module level: this is what pulls in the full
    # AI dependency tree (transcriber -> groq, vector_store -> chromadb,
    # summarizer/extractor/rag_engine -> langchain-mistralai, etc.). Doing
    # this inside the handler means it only happens on the first real
    # request, well after uvicorn has already bound $PORT — not during
    # `import app.main`.
    from app.services import document_service

    try:
        return document_service.handle_upload(
            file=file, youtube_url=youtube_url, language=language
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Processing failed: {e}")
