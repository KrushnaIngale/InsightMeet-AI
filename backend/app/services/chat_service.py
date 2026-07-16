"""
Chat orchestration.

Route (routes_chat.py) -> this service -> core.rag_engine (AI, unchanged) -> file_utils (status check)

We deliberately do NOT keep rag_chains cached in memory across requests
(per the "never store everything in memory" requirement) — each call
reloads the document's persisted Chroma collection via
core.rag_engine.load_rag_chain(document_id) and rebuilds the LCEL
chain, which is cheap (no re-embedding, just opening the existing
persist_directory). The prompt, retrieval, and LLM call are byte-for-byte
the same as your original core/rag_engine.py.
"""

from app.core import rag_engine
from app.utils import file_utils


def ask(document_id: str, question: str) -> str:
    if not file_utils.document_exists(document_id):
        raise FileNotFoundError(f"Document {document_id} not found")

    metadata = file_utils.read_metadata(document_id)
    if metadata.get("status") != "ready":
        raise ValueError(
            f"Document {document_id} is not ready for chat (status: {metadata.get('status')})"
        )

    rag_chain = rag_engine.load_rag_chain(document_id)
    return rag_engine.ask_question(rag_chain, question)
