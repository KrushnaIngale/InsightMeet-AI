from fastapi import APIRouter, HTTPException

from app.services import chat_service
from app.models.schemas import ChatRequest, ChatResponse

router = APIRouter(prefix="/chat", tags=["chat"])


@router.post("", response_model=ChatResponse)
def chat(request: ChatRequest):
    """Ask a question about a previously processed document (video/audio/PDF)."""
    try:
        answer = chat_service.ask(request.document_id, request.question)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail=f"Document '{request.document_id}' not found")
    except ValueError as e:
        raise HTTPException(status_code=409, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chat failed: {e}")

    return ChatResponse(
        document_id=request.document_id,
        question=request.question,
        answer=answer,
    )
