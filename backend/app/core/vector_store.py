"""
Vector store (Chroma) build/load/retrieve.

AI logic UNCHANGED: same embedding model (all-MiniLM-L6-v2 via
HuggingFace), same chunk_size/chunk_overlap, same similarity retriever.

ARCHITECTURE CHANGE (required for multi-document support, per the
refactor brief): the original module hardcoded a single global
"vector_db" directory and "meeting_transcript" collection name, so a
second uploaded document would overwrite the first. Here, every
function takes a document_id and stores/loads under that document's
own uploads/{document_id}/chroma directory with a per-document
collection name. Nothing about *how* embeddings/retrieval work changed.
"""

from langchain_chroma import Chroma
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.documents import Document

from app.config import settings

EMBEDDING_MODEL = settings.EMBEDDING_MODEL


def get_embeddings():
    return HuggingFaceEmbeddings(
        model_name=EMBEDDING_MODEL,
        model_kwargs={"device": "cpu"}
    )


def _persist_dir(document_id: str) -> str:
    return str(settings.UPLOADS_DIR / document_id / "chroma")


def _collection_name(document_id: str) -> str:
    return f"{settings.CHROMA_COLLECTION_PREFIX}_{document_id}"


def build_vector_store(transcript: str, document_id: str) -> Chroma:
    print(f"Building vector store for document {document_id}")

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=500,
        chunk_overlap=50
    )

    chunks = splitter.split_text(transcript)

    docs = [Document(page_content=chunk, metadata={"chunk_index": i}) for i, chunk in enumerate(chunks)]

    embeddings = get_embeddings()
    vector_store = Chroma.from_documents(
        documents=docs,
        embedding=embeddings,
        persist_directory=_persist_dir(document_id),
        collection_name=_collection_name(document_id),
    )

    return vector_store


def load_vector_store(document_id: str) -> Chroma:
    embeddings = get_embeddings()
    vector_store = Chroma(
        persist_directory=_persist_dir(document_id),
        embedding_function=embeddings,
        collection_name=_collection_name(document_id),
    )
    return vector_store


def get_retriever(vector_store: Chroma, k: int = 4):
    return vector_store.as_retriever(
        search_kwargs={"k": k},
        search_type="similarity",
    )
